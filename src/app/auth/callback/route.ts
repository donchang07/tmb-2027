import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSafeNext, safeNext } from "@/lib/safe-next";
import { callbackFailurePath } from "@/lib/auth-rules";
import { logEvent } from "@/lib/log";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const rawNext = url.searchParams.get("next");
  if (rawNext !== null && rawNext !== "" && !isSafeNext(rawNext, url.origin)) logEvent("auth_next_rejected", "security", { reason: "callback" });
  const next = safeNext(rawNext, "/admin", url.origin);
  const fail = (reason: "unconfigured" | "missing_code" | "exchange_failed") => {
    logEvent("auth_callback_failed", "warn", { reason });
    return NextResponse.redirect(new URL(callbackFailurePath(next), url.origin));
  };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return fail("unconfigured");
  if (!code) return fail("missing_code");

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return fail("exchange_failed");
  return NextResponse.redirect(new URL(next, url.origin));
}
