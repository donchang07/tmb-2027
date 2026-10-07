import type { BrowserContext } from "@playwright/test";
import type { Session } from "@supabase/supabase-js";
import { supabaseUrl } from "./supabase";

// @supabase/ssr 0.12.x: 쿠키명 sb-<project-ref>-auth-token, 값 "base64-" + base64url(JSON(session)),
// encodeURIComponent 길이가 3180을 넘으면 ".0", ".1" 청크로 분할(utils/chunker.js).
const MAX_CHUNK_SIZE = 3180;

export function authCookieName(): string {
  const ref = new URL(supabaseUrl()).hostname.split(".")[0];
  return `sb-${ref}-auth-token`;
}

export function sessionCookies(session: Session): { name: string; value: string }[] {
  const key = authCookieName();
  const value = `base64-${Buffer.from(JSON.stringify(session), "utf8").toString("base64url")}`;
  if (encodeURIComponent(value).length <= MAX_CHUNK_SIZE) return [{ name: key, value }];
  const out: { name: string; value: string }[] = [];
  for (let i = 0, n = 0; i < value.length; i += MAX_CHUNK_SIZE, n += 1) {
    out.push({ name: `${key}.${n}`, value: value.slice(i, i + MAX_CHUNK_SIZE) });
  }
  return out;
}

export async function injectSession(context: BrowserContext, baseURL: string, session: Session): Promise<void> {
  await context.clearCookies();
  const secure = baseURL.startsWith("https:");
  const host = new URL(baseURL).hostname;
  await context.addCookies(
    sessionCookies(session).map((c) => ({
      name: c.name,
      value: c.value,
      domain: host,
      path: "/",
      httpOnly: false,
      secure,
      sameSite: "Lax" as const,
      expires: Math.floor(Date.now() / 1000) + 400 * 24 * 60 * 60,
    })),
  );
}
