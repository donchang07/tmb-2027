import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { logEvent } from "@/lib/log";
import { isSafeNext } from "@/lib/safe-next";
import { createSupabaseServerClient, requestOrigin } from "@/lib/supabase/server";

export async function resolvePageNext(raw: string | undefined): Promise<string | null> {
  if (raw === undefined || raw === "") return null;
  if (isSafeNext(raw, await requestOrigin())) return raw;
  logEvent("auth_next_rejected", "security", { reason: "unsafe_next" });
  return null;
}

export async function redirectIfSignedIn(next: string | null): Promise<void> {
  if ((await headers()).has("next-action")) return;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect(next ?? "/");
}
