"use server";

import { createHash } from "node:crypto";
import {
  classifySignInError,
  classifySignUpError,
  fieldErrorsFrom,
  LoginSchema,
  SIGNIN_MESSAGES,
  SIGNUP_MESSAGES,
  SignupSchema,
  type AuthFormState,
} from "@/lib/auth-rules";
import { logEvent } from "@/lib/log";
import { isSafeNext, safeNext } from "@/lib/safe-next";
import { createSupabaseServerClient, requestOrigin } from "@/lib/supabase/server";

function hashEmail(email: string): string {
  return createHash("sha256").update(email).digest("hex").slice(0, 12);
}

function rawEmail(formData: FormData): string {
  return String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
}

async function resolveNext(formData: FormData): Promise<string> {
  const raw = formData.get("next");
  const origin = await requestOrigin();
  if (raw !== null && raw !== "" && !isSafeNext(raw, origin)) logEvent("auth_next_rejected", "security", { reason: "unsafe_next" });
  return safeNext(raw, "/", origin);
}

export async function signInAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = LoginSchema.safeParse({ email: formData.get("email") ?? "", password: formData.get("password") ?? "" });
  if (!parsed.success) return { status: "invalid", email: rawEmail(formData), fieldErrors: fieldErrorsFrom(parsed.error) };
  const { email, password } = parsed.data;
  const next = await resolveNext(formData);

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    logEvent("supabase_unconfigured", "warn", { reason: "login" });
    return { status: "error", email, error: SIGNIN_MESSAGES.unconfigured };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const reason = classifySignInError({ status: error.status, code: error.code, message: error.message });
    logEvent("auth_login_failed", "warn", { emailHash: hashEmail(email), reason });
    return { status: "error", email, error: SIGNIN_MESSAGES[reason] };
  }
  logEvent("auth_login_succeeded", "info", { emailHash: hashEmail(email) });
  return { status: "success", email, redirectTo: next };
}

export async function signUpAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = SignupSchema.safeParse({
    email: formData.get("email") ?? "",
    password: formData.get("password") ?? "",
    passwordConfirm: formData.get("passwordConfirm") ?? "",
  });
  if (!parsed.success) return { status: "invalid", email: rawEmail(formData), fieldErrors: fieldErrorsFrom(parsed.error) };
  const { email, password } = parsed.data;
  const next = await resolveNext(formData);

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    logEvent("supabase_unconfigured", "warn", { reason: "signup" });
    return { status: "error", email, error: SIGNUP_MESSAGES.unconfigured };
  }

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    if (error.code === "email_address_invalid") return { status: "invalid", email, fieldErrors: { email: "이메일 형식이 올바르지 않습니다." } };
    const reason = classifySignUpError({ status: error.status, code: error.code, message: error.message });
    logEvent("auth_signup_failed", "warn", { emailHash: hashEmail(email), reason });
    return { status: "error", email, error: SIGNUP_MESSAGES[reason] };
  }
  if (!data.session) {
    logEvent("auth_signup_failed", "warn", { emailHash: hashEmail(email), reason: "no_session" });
    return { status: "error", email, error: SIGNUP_MESSAGES.no_session };
  }
  logEvent("auth_signup_requested", "info", { emailHash: hashEmail(email) });
  return { status: "success", email, redirectTo: next };
}
