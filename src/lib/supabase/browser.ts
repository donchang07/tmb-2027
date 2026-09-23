import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

/** NEXT_PUBLIC_* 가 없으면 null — 미설정 환경에서는 Realtime 없이 폴링만 동작한다. */
export function createBrowserClient() {
  const env = getSupabasePublicEnv();
  if (!env) return null;
  return createSupabaseBrowserClient(env.url, env.anonKey);
}
