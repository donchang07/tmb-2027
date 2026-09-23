import { randomUUID } from "node:crypto";
import { logEvent } from "@/lib/log";
import { createSupabaseAnonClient, createSupabaseServerClient } from "@/lib/supabase/server";
import {
  DUPLICATE_MESSAGE,
  extFor,
  JOURNAL_REJECT_MESSAGE,
  JournalInputSchema,
  sniffImageMime,
  validateDisplayName,
  validatePhoto,
} from "@/lib/journal-rules";

const BUCKET = "journal-photos";

export type TeamState = "unconfigured" | "anonymous" | "forbidden" | "member";
export type TeamSession = { state: TeamState; email: string | null; userId: string | null };

export async function getTeamSession(): Promise<TeamSession> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { state: "unconfigured", email: null, userId: null };
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email?.toLowerCase() ?? null;
  const userId = data.user?.id ?? null;
  if (!email || !userId) {
    logEvent("admin_auth_required", "info", { scope: "journal" });
    return { state: "anonymous", email: null, userId: null };
  }
  const { data: member } = await supabase.from("team_members").select("email").eq("email", email).eq("enabled", true).maybeSingle();
  if (!member) {
    logEvent("admin_forbidden", "security", { scope: "journal" });
    return { state: "forbidden", email, userId };
  }
  return { state: "member", email, userId };
}

export type MemberProfileState = "unconfigured" | "anon" | "guest" | "member";
export type MemberProfile = { state: MemberProfileState; displayName: string | null };

export async function getMemberProfile(knownSession?: TeamSession): Promise<MemberProfile> {
  const session = knownSession ?? (await getTeamSession());
  if (session.state === "unconfigured") return { state: "unconfigured", displayName: null };
  if (session.state === "anonymous") return { state: "anon", displayName: null };
  if (session.state === "forbidden") return { state: "guest", displayName: null };
  const supabase = await createSupabaseServerClient();
  if (!supabase || !session.email) return { state: "unconfigured", displayName: null };
  const { data } = await supabase.from("team_members").select("display_name").eq("email", session.email).maybeSingle();
  const displayName = (data as { display_name: string | null } | null)?.display_name ?? null;
  return { state: "member", displayName };
}

export type JournalEntry = { id: string; dayId: string; authorLabel: string; text: string; imageUrl: string | null; createdAt: string };

type Row = { id: string; day_id: string; author_label: string; text: string; image_path: string | null; created_at: string };

export async function listEntries(dayId: string): Promise<JournalEntry[]> {
  const supabase = createSupabaseAnonClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("journal_entries")
    .select("id,day_id,author_label,text,image_path,created_at")
    .eq("day_id", dayId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Row[]).map((r) => ({
    id: r.id,
    dayId: r.day_id,
    authorLabel: r.author_label,
    text: r.text,
    imageUrl: r.image_path ? supabase.storage.from(BUCKET).getPublicUrl(r.image_path).data.publicUrl : null,
    createdAt: r.created_at,
  }));
}

export async function countEntriesByDay(): Promise<Map<string, number> | null> {
  const supabase = createSupabaseAnonClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("journal_entries").select("day_id");
  if (error || !data) return null;
  const counts = new Map<string, number>();
  for (const row of data as { day_id: string }[]) counts.set(row.day_id, (counts.get(row.day_id) ?? 0) + 1);
  return counts;
}

export async function hasEntry(dayId: string, userId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return false;
  const { data } = await supabase.from("journal_entries").select("id").eq("day_id", dayId).eq("author_id", userId).maybeSingle();
  return !!data;
}

export type SetDisplayNameResult = { ok: true; value: string } | { ok: false; message: string };

export async function setDisplayName(session: TeamSession, name: unknown): Promise<SetDisplayNameResult> {
  if (session.state !== "member" || !session.email) return { ok: false, message: "팀원 로그인이 필요합니다." };
  const parsed = validateDisplayName(name);
  if (!parsed.ok) return parsed;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "기록 기능 비활성 — Supabase 설정이 필요합니다." };
  const { error } = await supabase.from("team_members").update({ display_name: parsed.value }).eq("email", session.email);
  if (error) return { ok: false, message: `표시명 저장 실패: ${error.message}` };
  return { ok: true, value: parsed.value };
}

export type CreateEntryResult =
  | { ok: true }
  | { ok: false; reason: "unconfigured" | "unauthorized" | "forbidden" | "needs_display_name" | "duplicate" | "invalid" | "upload_failed" | "error"; message: string };

export async function createEntry(input: { dayId: unknown; text: unknown; photo: File | null }): Promise<CreateEntryResult> {
  const session = await getTeamSession();
  if (session.state === "unconfigured") return { ok: false, reason: "unconfigured", message: "기록 기능 비활성 — Supabase 설정이 필요합니다." };
  if (session.state === "anonymous") return { ok: false, reason: "unauthorized", message: "팀원 로그인이 필요합니다." };
  if (session.state === "forbidden") return { ok: false, reason: "forbidden", message: "이 정보에 접근할 수 없습니다." };

  const profile = await getMemberProfile(session);
  if (!profile.displayName) return { ok: false, reason: "needs_display_name", message: "표시명을 먼저 설정하세요." };

  const parsed = JournalInputSchema.safeParse({ dayId: input.dayId, text: input.text });
  if (!parsed.success) {
    logEvent("journal_upload_rejected", "warn", { reason: "text_invalid" });
    return { ok: false, reason: "invalid", message: "기록은 1~200자여야 합니다." };
  }
  const photoCheck = validatePhoto(input.photo ? { type: input.photo.type, size: input.photo.size } : null);
  if (!photoCheck.ok) {
    logEvent("journal_upload_rejected", "warn", { reason: "photo_invalid", type: input.photo?.type, size: input.photo?.size });
    return { ok: false, reason: "invalid", message: photoCheck.message };
  }
  if (input.photo) {
    const head = new Uint8Array(await input.photo.slice(0, 12).arrayBuffer());
    if (sniffImageMime(head) !== input.photo.type) {
      logEvent("journal_upload_rejected", "warn", { reason: "photo_magic_mismatch", declared: input.photo.type });
      return { ok: false, reason: "invalid", message: JOURNAL_REJECT_MESSAGE };
    }
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase || !session.userId || !session.email) return { ok: false, reason: "unconfigured", message: "기록 기능 비활성." };

  let imagePath: string | null = null;
  if (input.photo) {
    imagePath = `${session.userId}/${randomUUID()}.${extFor(input.photo.type)}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(imagePath, input.photo, { contentType: input.photo.type, upsert: false });
    if (upErr) {
      logEvent("journal_upload_rejected", "warn", { reason: "storage", message: upErr.message });
      return { ok: false, reason: "upload_failed", message: `사진 업로드 실패: ${upErr.message}` };
    }
  }

  const { error } = await supabase.from("journal_entries").insert({
    day_id: parsed.data.dayId,
    author_id: session.userId,
    author_label: profile.displayName,
    text: parsed.data.text,
    image_path: imagePath,
  });
  if (error) {
    if (imagePath) await supabase.storage.from(BUCKET).remove([imagePath]);
    if (error.code === "23505") {
      logEvent("journal_upload_rejected", "warn", { reason: "duplicate_day_entry" });
      return { ok: false, reason: "duplicate", message: DUPLICATE_MESSAGE };
    }
    return { ok: false, reason: "error", message: `저장 실패: ${error.message}` };
  }
  return { ok: true };
}
