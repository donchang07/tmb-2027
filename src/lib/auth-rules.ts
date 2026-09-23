import { z } from "zod";

export const EmailField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "이메일을 입력해 주세요.")
  .max(254, "이메일 형식이 올바르지 않습니다.")
  .email("이메일 형식이 올바르지 않습니다.");

export const LoginSchema = z.object({
  email: EmailField,
  password: z.string().min(1, "비밀번호를 입력해 주세요.").max(72, "이메일 또는 비밀번호가 올바르지 않습니다."),
});

export const SignupSchema = z
  .object({
    email: EmailField,
    password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다.").max(72, "비밀번호는 72자 이하여야 합니다."),
    passwordConfirm: z.string(),
  })
  .refine((v) => v.password === v.passwordConfirm, { path: ["passwordConfirm"], message: "비밀번호가 서로 다릅니다." });

export type AuthField = "email" | "password" | "passwordConfirm";
export type FieldErrors = Partial<Record<AuthField, string>>;
export type AuthFormState =
  | { status: "idle"; email: string }
  | { status: "invalid"; email: string; fieldErrors: FieldErrors }
  | { status: "error"; email: string; error: string }
  | { status: "success"; email: string; redirectTo: string };

export type SignInFailure = "invalid_credentials" | "rate_limited" | "unconfigured" | "error";
export type SignUpFailure = "duplicate" | "hook_rejected" | "rate_limited" | "signup_disabled" | "unconfigured" | "no_session" | "error";
export type AuthErrorLike = { status?: number; code?: string; message?: string } | null;

const AUTH_FIELDS: readonly AuthField[] = ["email", "password", "passwordConfirm"];

export function fieldErrorsFrom(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    const field = AUTH_FIELDS.find((f) => f === key);
    if (field && !out[field]) out[field] = issue.message;
  }
  return out;
}

const RATE_CODES = new Set(["over_request_rate_limit", "over_email_send_rate_limit"]);

function isRateLimited(e: { status?: number; code?: string }): boolean {
  return e.status === 429 || (e.code !== undefined && RATE_CODES.has(e.code));
}

export function classifySignInError(e: AuthErrorLike): SignInFailure {
  if (!e) return "error";
  if (isRateLimited(e)) return "rate_limited";
  if (e.code === "invalid_credentials" || e.status === 400) return "invalid_credentials";
  return "error";
}

export function classifySignUpError(e: AuthErrorLike): SignUpFailure {
  if (!e) return "error";
  if (isRateLimited(e)) return "rate_limited";
  if (e.code === "user_already_exists" || e.code === "email_exists") return "duplicate";
  if (e.code === "signup_disabled") return "signup_disabled";
  if (e.status === 403 || (e.message ?? "").includes("signup_not_allowed") || (e.code ?? "").startsWith("hook_")) return "hook_rejected";
  return "error";
}

const SIGNUP_BLOCKED = "이 이메일로 가입할 수 없습니다. 이미 계정이 있으면 로그인해 주세요.";

export const AUTH_MESSAGES = {
  invalid_credentials: "이메일 또는 비밀번호가 올바르지 않습니다.",
  rate_limited: "요청이 많습니다. 잠시 후 다시 시도해 주세요.",
  unconfigured: "로그인 기능이 비활성입니다 — Supabase 설정이 필요합니다.",
  error: "로그인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
  duplicate: SIGNUP_BLOCKED,
  hook_rejected: SIGNUP_BLOCKED,
  signup_disabled: "현재 회원가입을 받지 않습니다. 리더에게 문의해 주세요.",
  no_session: "가입하지 못했습니다. 잠시 후 다시 시도해 주세요.",
} as const satisfies Record<SignInFailure | SignUpFailure, string>;

export const SIGNUP_MESSAGES: Record<SignUpFailure, string> = {
  duplicate: SIGNUP_BLOCKED,
  hook_rejected: SIGNUP_BLOCKED,
  rate_limited: AUTH_MESSAGES.rate_limited,
  signup_disabled: AUTH_MESSAGES.signup_disabled,
  unconfigured: "회원가입 기능이 비활성입니다 — Supabase 설정이 필요합니다.",
  no_session: "가입하지 못했습니다. 잠시 후 다시 시도해 주세요.",
  error: "가입하지 못했습니다. 잠시 후 다시 시도해 주세요.",
};

export const SIGNIN_MESSAGES: Record<SignInFailure, string> = {
  invalid_credentials: AUTH_MESSAGES.invalid_credentials,
  rate_limited: AUTH_MESSAGES.rate_limited,
  unconfigured: AUTH_MESSAGES.unconfigured,
  error: AUTH_MESSAGES.error,
};

const HOST_PATTERN = /^[a-z0-9.-]+(:\d+)?$/i;

export function originFromHeaders(host: string | null, proto: string | null, fallback: string): string {
  if (!host || !HOST_PATTERN.test(host)) return fallback;
  const hostname = host.replace(/:\d+$/, "").toLowerCase();
  const local = hostname === "localhost" || hostname === "127.0.0.1";
  const scheme = proto === "http" || proto === "https" ? proto : local ? "http" : "https";
  return `${scheme}://${host.toLowerCase()}`;
}

export function callbackFailurePath(next: string): string {
  if (next.startsWith("/journal")) return "/journal/login?error=auth";
  if (next.startsWith("/admin")) return "/admin?error=auth";
  return `/login?error=auth&next=${encodeURIComponent(next)}`;
}

export type AuthTransition = "login" | "logout-or-expired" | "switch" | "none";

export function detectAuthTransition(prevUid: string | null, nextUid: string | null): AuthTransition {
  if (prevUid === nextUid) return "none";
  if (!prevUid) return "login";
  if (!nextUid) return "logout-or-expired";
  return "switch";
}

export function accountLabel(email: string): string {
  return email.length > 12 ? `${email.slice(0, 12)}…` : email;
}
