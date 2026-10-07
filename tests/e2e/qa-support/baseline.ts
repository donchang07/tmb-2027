import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { accounts } from "./env";
import { serviceClient, userIdByEmail } from "./supabase";

type Row = Record<string, unknown>;

export type Baseline = {
  capturedAt: string;
  packing: { userA: Row[]; userB: Row[] };
  bookings: Row[];
  lodgings: Row[];
  journalIds: string[];
  teamMembers: Row[];
};

const FILE = path.resolve("qa", "baseline-snapshot.json");
const TRIGGER_COLS = new Set(["updated_at", "updated_by", "version"]);

async function packingRows(userEmail: string): Promise<Row[]> {
  const id = await userIdByEmail(userEmail);
  if (!id) return [];
  const { data, error } = await serviceClient().from("packing_checks").select("*").eq("user_id", id);
  if (error) throw new Error(`packing_checks 조회 실패: ${error.message}`);
  return (data ?? []) as Row[];
}

export async function captureBaseline(): Promise<Baseline> {
  if (existsSync(FILE)) return JSON.parse(readFileSync(FILE, "utf8")) as Baseline;
  if (process.env.QA_PUBLIC_ONLY) return { capturedAt: "", packing: { userA: [], userB: [] }, bookings: [], lodgings: [], journalIds: [], teamMembers: [] };
  const svc = serviceClient();
  const bookings = await svc.from("bookings").select("*").order("lodging_id");
  const lodgings = await svc.from("lodgings").select("*").order("id");
  const journal = await svc.from("journal_entries").select("id");
  const team = await svc.from("team_members").select("email,role,enabled,display_name");
  const snap: Baseline = {
    capturedAt: new Date().toISOString(),
    packing: { userA: await packingRows(accounts.userA().email), userB: await packingRows(accounts.userB().email) },
    bookings: (bookings.data ?? []) as Row[],
    lodgings: (lodgings.data ?? []) as Row[],
    journalIds: (journal.data ?? []).map((r) => String(r.id)),
    teamMembers: ((team.data ?? []) as Row[]).map((r) => (String(r.email).toLowerCase() === accounts.adminEmail() ? { ...r, email: "__ADMIN__" } : r)),
  };
  mkdirSync(path.dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(snap, null, 2));
  return snap;
}

export type RestoreReport = { actions: string[]; leftovers: string[] };

/** 베이스라인과 다른 값을 되돌리고 되돌린 내역을 반환한다. 트리거 관리 컬럼(updated_at·version·updated_by)은 복원할 수 없다. */
export async function restoreBaseline(): Promise<RestoreReport> {
  if (process.env.QA_PUBLIC_ONLY) return { actions: [], leftovers: [] };
  const base = await captureBaseline();
  const svc = serviceClient();
  const actions: string[] = [];
  const leftovers: string[] = [];

  for (const [key, email] of [["userA", accounts.userA().email], ["userB", accounts.userB().email]] as const) {
    const id = await userIdByEmail(email);
    if (!id) continue;
    const want = base.packing[key];
    const now = await packingRows(email);
    const norm = (rows: Row[]) => rows.map((r) => `${r.item_id}:${r.checked}`).sort().join(",");
    if (norm(now) !== norm(want)) {
      await svc.from("packing_checks").delete().eq("user_id", id);
      if (want.length > 0) {
        const { error } = await svc.from("packing_checks").insert(want);
        if (error) leftovers.push(`packing_checks ${key} 복원 실패: ${error.message}`);
      }
      actions.push(`packing_checks ${key} 복원 (${now.length}행 → ${want.length}행)`);
    }
  }

  const nowBookings = await svc.from("bookings").select("*");
  for (const want of base.bookings) {
    const cur = (nowBookings.data ?? []).find((r) => r.lodging_id === want.lodging_id) as Row | undefined;
    if (!cur) {
      leftovers.push(`bookings ${String(want.lodging_id)} 행 없음`);
      continue;
    }
    const patch: Row = {};
    for (const [k, v] of Object.entries(want)) {
      if (TRIGGER_COLS.has(k) || k === "lodging_id") continue;
      if (JSON.stringify(cur[k] ?? null) !== JSON.stringify(v ?? null)) patch[k] = v;
    }
    if (Object.keys(patch).length > 0) {
      const { error } = await svc.from("bookings").update(patch).eq("lodging_id", want.lodging_id as string);
      if (error) leftovers.push(`bookings ${String(want.lodging_id)} 복원 실패: ${error.message}`);
      else actions.push(`bookings ${String(want.lodging_id)} 복원 (${Object.keys(patch).join(",")})`);
    }
  }

  const nowLodgings = await svc.from("lodgings").select("*");
  for (const want of base.lodgings) {
    const cur = (nowLodgings.data ?? []).find((r) => r.id === want.id) as Row | undefined;
    if (!cur) continue;
    const patch: Row = {};
    for (const [k, v] of Object.entries(want)) {
      if (TRIGGER_COLS.has(k) || k === "id") continue;
      if (JSON.stringify(cur[k] ?? null) !== JSON.stringify(v ?? null)) patch[k] = v;
    }
    if (Object.keys(patch).length > 0) {
      const { error } = await svc.from("lodgings").update(patch).eq("id", want.id as string);
      if (error) leftovers.push(`lodgings ${String(want.id)} 복원 실패: ${error.message}`);
      else actions.push(`lodgings ${String(want.id)} 복원 (${Object.keys(patch).join(",")})`);
    }
  }

  const journal = await svc.from("journal_entries").select("id");
  const extra = (journal.data ?? []).map((r) => String(r.id)).filter((id) => !base.journalIds.includes(id));
  if (extra.length > 0) {
    const { error } = await svc.from("journal_entries").delete().in("id", extra);
    if (error) leftovers.push(`journal_entries 삭제 실패: ${error.message}`);
    else actions.push(`journal_entries ${extra.length}건 삭제`);
  }

  const team = await svc.from("team_members").select("email,role,enabled,display_name");
  for (const w of base.teamMembers) {
    const real = w.email === "__ADMIN__" ? accounts.adminEmail() : (w.email as string);
    const want = { ...w, email: real };
    const cur = (team.data ?? []).find((r) => String(r.email).toLowerCase() === real.toLowerCase()) as Row | undefined;
    if (cur && JSON.stringify(cur) !== JSON.stringify(want)) {
      const { error } = await svc.from("team_members").update(want).eq("email", cur.email as string);
      if (error) leftovers.push(`team_members ${String(want.email)} 복원 실패: ${error.message}`);
      else actions.push(`team_members ${String(want.email)} 복원`);
    }
  }

  const { removed } = await deleteQaUsers();
  if (removed > 0) actions.push(`qa- 가입 계정 ${removed}개 삭제`);
  return { actions, leftovers };
}

/** 테스트가 E2E 도메인으로 만든 가입 계정(qa- 접두)을 삭제한다. */
export async function deleteQaUsers(): Promise<{ removed: number }> {
  const svc = serviceClient();
  const domain = accounts.emailDomain().toLowerCase();
  let removed = 0;
  for (let page = 1; page < 20; page += 1) {
    const { data, error } = await svc.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`listUsers 실패: ${error.message}`);
    for (const u of data.users) {
      const email = (u.email ?? "").toLowerCase();
      if (email.startsWith("qa-") && email.endsWith(`@${domain}`)) {
        const del = await svc.auth.admin.deleteUser(u.id);
        if (!del.error) removed += 1;
      }
    }
    if (data.users.length < 200) break;
  }
  return { removed };
}

export async function leftoverQaUsers(): Promise<string[]> {
  const svc = serviceClient();
  const domain = accounts.emailDomain().toLowerCase();
  const out: string[] = [];
  for (let page = 1; page < 20; page += 1) {
    const { data } = await svc.auth.admin.listUsers({ page, perPage: 200 });
    if (!data) break;
    for (const u of data.users) {
      const email = (u.email ?? "").toLowerCase();
      if (email.startsWith("qa-") && email.endsWith(`@${domain}`)) out.push(u.id);
    }
    if (data.users.length < 200) break;
  }
  return out;
}
