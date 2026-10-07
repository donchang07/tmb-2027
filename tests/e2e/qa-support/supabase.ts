import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import { accounts, need, serviceKey } from "./env";

const opts = { auth: { persistSession: false, autoRefreshToken: false } } as const;

export function supabaseUrl(): string {
  return need("NEXT_PUBLIC_SUPABASE_URL");
}

export function serviceClient(): SupabaseClient {
  return createClient(supabaseUrl(), serviceKey(), opts);
}

export function anonClient(): SupabaseClient {
  return createClient(supabaseUrl(), need("NEXT_PUBLIC_SUPABASE_ANON_KEY"), opts);
}

const sessionCache = new Map<string, Session>();

/** 비밀번호 로그인으로 세션을 얻는다(Node 측, 레이트 리밋 절약을 위해 캐시). */
export async function passwordSession(user: { email: string; password: string }): Promise<Session> {
  const hit = sessionCache.get(user.email);
  // 로그아웃은 전역(global) 세션 폐기일 수 있으므로 캐시된 세션이 서버에서 아직 유효한지 확인한다
  if (hit && (hit.expires_at ?? 0) * 1000 > Date.now() + 5 * 60_000 && !(await anonClient().auth.getUser(hit.access_token)).error) return hit;
  const client = anonClient();
  const { data, error } = await client.auth.signInWithPassword(user);
  if (error || !data.session) throw new Error(`password sign-in 실패: ${error?.message ?? "no session"}`);
  sessionCache.set(user.email, data.session);
  return data.session;
}

/**
 * 관리자(리더) 세션 — 이메일을 보내지 않는다(owner 결정 "validation 생략").
 * service client의 admin.generateLink(magiclink)로 hashed_token만 얻고, anon client의 verifyOtp로 세션을 교환한다.
 */
export async function adminSession(): Promise<Session> {
  const email = accounts.adminEmail();
  const hit = sessionCache.get(`admin:${email}`);
  if (hit && (hit.expires_at ?? 0) * 1000 > Date.now() + 5 * 60_000) return hit;
  const svc = serviceClient();
  const link = await svc.auth.admin.generateLink({ type: "magiclink", email });
  const hashed = link.data?.properties?.hashed_token;
  if (link.error || !hashed) throw new Error(`generateLink 실패: ${link.error?.message ?? "no hashed_token"}`);
  const { data, error } = await anonClient().auth.verifyOtp({ token_hash: hashed, type: "magiclink" });
  if (error || !data.session) throw new Error(`verifyOtp 실패: ${error?.message ?? "no session"}`);
  sessionCache.set(`admin:${email}`, data.session);
  return data.session;
}

export async function userIdByEmail(email: string): Promise<string | null> {
  const svc = serviceClient();
  for (let page = 1; page < 20; page += 1) {
    const { data, error } = await svc.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`listUsers 실패: ${error.message}`);
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit.id;
    if (data.users.length < 200) return null;
  }
  return null;
}
