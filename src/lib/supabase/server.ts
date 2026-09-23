import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { originFromHeaders } from "@/lib/auth-rules";

export async function requestOrigin(): Promise<string> {
  const h = await headers();
  return originFromHeaders(
    h.get("x-forwarded-host") ?? h.get("host"),
    h.get("x-forwarded-proto"),
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  );
}

export async function createSupabaseServerClient() {
  const env = getSupabasePublicEnv();
  if (!env) return null;
  const cookieStore = await cookies();
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Server Component에서는 쿠키 쓰기가 불가 — middleware/Server Action에서만 갱신
        }
      },
    },
  });
}

export function createSupabaseAnonClient() {
  const env = getSupabasePublicEnv();
  if (!env) return null;
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {},
    },
  });
}
