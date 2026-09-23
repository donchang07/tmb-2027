// TMB 2027 — 합성 테스트 데이터 seed (multiuser-cloud-deployment Design §8.5, 로컬 전용)
// 실행: node --env-file=.env.local scripts/seed-synthetic.mjs
// 멱등: 계정은 이메일로 존재 확인 후 생성/건너뜀, 모든 테이블 쓰기는 upsert. 비밀번호·키는 출력하지 않는다.
// 생성된 테스트 계정 비밀번호는 .env.test.local(.gitignore 대상)에만 기록한다.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(new URL(".", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"), "..");
const ENV_LOCAL = path.join(root, ".env.local");
const ENV_TEST = path.join(root, ".env.test.local");

if (process.env.VERCEL || process.env.CI) {
  console.error("seed-synthetic: VERCEL/CI 환경에서는 실행하지 않습니다.");
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL && existsSync(ENV_LOCAL)) process.loadEnvFile(ENV_LOCAL);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const missing = [
  ["NEXT_PUBLIC_SUPABASE_URL", url],
  ["SUPABASE_SERVICE_ROLE_KEY", serviceKey],
  ["ADMIN_EMAIL", adminEmail],
]
  .filter(([, v]) => !v)
  .map(([k]) => k);
if (missing.length > 0) {
  console.error(`seed-synthetic: 필수 환경변수 없음 — ${missing.join(", ")}`);
  process.exit(1);
}

function readEnvFile(file) {
  const out = new Map();
  if (!existsSync(file)) return out;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out.set(m[1], m[2].replace(/^["']|["']$/g, ""));
  }
  return out;
}

function writeEnvFile(file, values) {
  const lines = existsSync(file) ? readFileSync(file, "utf8").split(/\r?\n/) : [];
  const seen = new Set();
  const updated = lines.map((line) => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=/);
    if (!m || !values.has(m[1])) return line;
    seen.add(m[1]);
    return `${m[1]}=${values.get(m[1])}`;
  });
  for (const [k, v] of values) if (!seen.has(k)) updated.push(`${k}=${v}`);
  writeFileSync(file, updated.join("\n").replace(/\n*$/, "\n"), "utf8");
}

const testEnv = readEnvFile(ENV_TEST);
const domain = (process.env.E2E_EMAIL_DOMAIN || testEnv.get("E2E_EMAIL_DOMAIN") || "tmb2027.test").toLowerCase();
const newPassword = () => randomBytes(18).toString("base64url");

const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

async function listAllUsers() {
  const byEmail = new Map();
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`listUsers 실패: ${error.message}`);
    for (const u of data.users) if (u.email) byEmail.set(u.email.toLowerCase(), u);
    if (data.users.length < 200) break;
  }
  return byEmail;
}

const stats = { created: 0, skipped: 0, passwordReset: 0 };

async function ensureUser(existing, email, passwordKey) {
  const known = passwordKey ? testEnv.get(passwordKey) : undefined;
  const user = existing.get(email);
  if (!user) {
    const password = passwordKey ? known || newPassword() : undefined;
    const { data, error } = await supabase.auth.admin.createUser({ email, email_confirm: true, ...(password ? { password } : {}) });
    if (error) throw new Error(`createUser 실패(${email.replace(/^[^@]+/, "***")}): ${error.message}`);
    stats.created += 1;
    if (passwordKey) testEnv.set(passwordKey, password);
    return data.user;
  }
  stats.skipped += 1;
  if (passwordKey && !known) {
    const password = newPassword();
    const { error } = await supabase.auth.admin.updateUserById(user.id, { password });
    if (error) throw new Error(`updateUserById 실패: ${error.message}`);
    testEnv.set(passwordKey, password);
    stats.passwordReset += 1;
  }
  return user;
}

async function upsert(table, rows, onConflict) {
  const { error } = await supabase.from(table).upsert(rows, { onConflict });
  if (error) throw new Error(`${table} upsert 실패: ${error.message}`);
}

async function main() {
  const existing = await listAllUsers();

  await ensureUser(existing, adminEmail, null);
  await upsert("team_members", [{ email: adminEmail, role: "leader", enabled: true, display_name: "리더" }], "email");

  const members = [];
  for (const n of [1, 2, 3]) {
    const email = `member${n}@${domain}`;
    testEnv.set(`E2E_MEMBER_${n}_EMAIL`, email);
    const user = await ensureUser(existing, email, `E2E_MEMBER_${n}_PASSWORD`);
    await upsert("team_members", [{ email, role: "member", enabled: true, display_name: `팀원${n}` }], "email");
    members.push(user);
  }

  for (const key of ["A", "B"]) {
    const email = `e2e-${key.toLowerCase()}@${domain}`;
    testEnv.set(`E2E_USER_${key}_EMAIL`, email);
    await ensureUser(existing, email, `E2E_USER_${key}_PASSWORD`);
  }
  testEnv.set("E2E_EMAIL_DOMAIN", domain);

  const now = new Date().toISOString();
  const checks = (user, ids) => ids.map((item_id) => ({ user_id: user.id, item_id, checked: true, updated_at: now }));
  await upsert("packing_checks", checks(members[0], ["docs-passport", "docs-tickets", "docs-insurance"]), "user_id,item_id");
  await upsert(
    "packing_checks",
    checks(members[1], ["docs-passport", "pack-backpack", "pack-liner", "gear-poles", "gear-boots"]),
    "user_id,item_id",
  );

  await upsert(
    "journal_entries",
    [
      { day_id: "d2027-08-04", author_id: members[0].id, author_label: "팀원1", text: "합성 기록 — 첫날 레주슈 도착" },
      { day_id: "d2027-08-05", author_id: members[0].id, author_label: "팀원1", text: "합성 기록 — 둘째 날 산장" },
      { day_id: "d2027-08-05", author_id: members[1].id, author_label: "팀원2", text: "합성 기록 — 날씨 맑음" },
    ],
    "day_id,author_id",
  );

  writeEnvFile(ENV_TEST, testEnv);
  console.log(`seed-synthetic: 계정 생성 ${stats.created} · 건너뜀 ${stats.skipped} · 비밀번호 재설정 ${stats.passwordReset} · .env.test.local 갱신`);
}

main().catch((e) => {
  console.error(`seed-synthetic: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
