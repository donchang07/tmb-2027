import { existsSync } from "node:fs";

let loaded = false;

export function loadQaEnv(): void {
  if (loaded) return;
  loaded = true;
  for (const f of [".env.test.local", ".env.local"]) {
    if (existsSync(f)) {
      try {
        process.loadEnvFile(f);
      } catch {
        // 이미 설정된 값은 그대로 둔다
      }
    }
  }
}

export function need(name: string): string {
  loadQaEnv();
  const v = process.env[name];
  if (!v) throw new Error(`환경변수 ${name} 없음`);
  return v;
}

export function opt(name: string): string | undefined {
  loadQaEnv();
  return process.env[name] || undefined;
}

export function serviceKey(): string {
  loadQaEnv();
  const v = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!v) throw new Error("SUPABASE_SERVICE_ROLE_KEY 또는 SUPABASE_SECRET_KEY 없음");
  return v;
}

export const accounts = {
  userA: () => ({ email: need("E2E_USER_A_EMAIL"), password: need("E2E_USER_A_PASSWORD") }),
  userB: () => ({ email: need("E2E_USER_B_EMAIL"), password: need("E2E_USER_B_PASSWORD") }),
  member: (n: 1 | 2 | 3) => ({ email: need(`E2E_MEMBER_${n}_EMAIL`), password: need(`E2E_MEMBER_${n}_PASSWORD`) }),
  emailDomain: () => opt("E2E_EMAIL_DOMAIN") ?? "tmb2027.test",
  adminEmail: () => need("ADMIN_EMAIL").trim().toLowerCase(),
};
