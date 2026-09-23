import { describe, expect, it } from "vitest";
import {
  AUTH_MESSAGES,
  accountLabel,
  callbackFailurePath,
  classifySignInError,
  classifySignUpError,
  detectAuthTransition,
  fieldErrorsFrom,
  LoginSchema,
  originFromHeaders,
  SIGNIN_MESSAGES,
  SIGNUP_MESSAGES,
  SignupSchema,
} from "@/lib/auth-rules";
import { isSafeNext, safeNext } from "@/lib/safe-next";

const ALLOWED = ["/admin/bookings", "/packing", "/journal/d2027-08-05?x=1"];

const REJECTED_DECODED = [
  "//evil.com",
  "//evil",
  "/\\evil.com",
  "/\tevil.com",
  "/\t/evil.com",
  "/\n/evil",
  "/\r/evil",
  "https://evil",
  "http://localhost.evil.com",
  "javascript:alert(1)",
];

const REJECTED_RAW = ["/%5Cevil", "/%5cevil", "/%09/evil.com", "/%0A/evil", "/%0D/evil", "/%2F/evil.com"];

describe("safeNext hardening (FR-021, SC-020, Design §4.3)", () => {
  it("keeps same-origin relative paths", () => {
    for (const p of ALLOWED) expect(safeNext(p, "/fallback")).toBe(p);
  });

  it("rejects protocol-relative, backslash, control characters and absolute URLs", () => {
    for (const p of REJECTED_DECODED) expect(safeNext(p, "/fallback"), p).toBe("/fallback");
  });

  it("rejects encoded variants that decode to unsafe shapes", () => {
    for (const p of REJECTED_RAW) expect(safeNext(p, "/fallback"), p).toBe("/fallback");
  });

  it("rejects the query-decoded form of each encoded vector", () => {
    for (const p of REJECTED_RAW) {
      const decoded = new URLSearchParams(`next=${p}`).get("next");
      expect(safeNext(decoded, "/fallback"), String(decoded)).toBe("/fallback");
    }
  });

  it("falls back for non-strings, empty and overlong input", () => {
    expect(safeNext(undefined, "/x")).toBe("/x");
    expect(safeNext("", "/x")).toBe("/x");
    expect(safeNext(123, "/x")).toBe("/x");
    expect(safeNext(`/${"a".repeat(2048)}`, "/x")).toBe("/x");
  });

  it("keeps the v3.1 default fallback and accepts an explicit origin", () => {
    expect(safeNext("//evil.com")).toBe("/admin");
    expect(safeNext("/packing", "/", "https://utmb2027.vercel.app")).toBe("/packing");
    expect(isSafeNext("/day/d2027-08-04", "http://localhost:3100")).toBe(true);
    expect(isSafeNext("//evil.com", "http://localhost:3100")).toBe(false);
  });
});

describe("login/signup schemas (FR-019, FR-020)", () => {
  it("requires email and password with exact messages", () => {
    const r = LoginSchema.safeParse({ email: "", password: "" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const errors = fieldErrorsFrom(r.error);
      expect(errors.email).toBe("이메일을 입력해 주세요.");
      expect(errors.password).toBe("비밀번호를 입력해 주세요.");
    }
  });

  it("rejects malformed email and lowercases valid email", () => {
    const bad = LoginSchema.safeParse({ email: "not-an-email", password: "x" });
    expect(bad.success).toBe(false);
    if (!bad.success) expect(fieldErrorsFrom(bad.error).email).toBe("이메일 형식이 올바르지 않습니다.");
    const ok = LoginSchema.safeParse({ email: "  User@Example.COM ", password: "x" });
    expect(ok.success && ok.data.email).toBe("user@example.com");
  });

  it("enforces 8~72 characters and matching confirmation on signup", () => {
    const short = SignupSchema.safeParse({ email: "a@b.co", password: "1234567", passwordConfirm: "1234567" });
    expect(short.success).toBe(false);
    if (!short.success) expect(fieldErrorsFrom(short.error).password).toBe("비밀번호는 8자 이상이어야 합니다.");

    const long = SignupSchema.safeParse({ email: "a@b.co", password: "a".repeat(73), passwordConfirm: "a".repeat(73) });
    expect(long.success).toBe(false);
    if (!long.success) expect(fieldErrorsFrom(long.error).password).toBe("비밀번호는 72자 이하여야 합니다.");

    const mismatch = SignupSchema.safeParse({ email: "a@b.co", password: "12345678", passwordConfirm: "12345679" });
    expect(mismatch.success).toBe(false);
    if (!mismatch.success) expect(fieldErrorsFrom(mismatch.error).passwordConfirm).toBe("비밀번호가 서로 다릅니다.");

    expect(SignupSchema.safeParse({ email: "a@b.co", password: "12345678", passwordConfirm: "12345678" }).success).toBe(true);
  });
});

describe("auth error classification (§4.2 table, I-029)", () => {
  it("classifies sign-in errors", () => {
    expect(classifySignInError({ code: "invalid_credentials", status: 400 })).toBe("invalid_credentials");
    expect(classifySignInError({ status: 400 })).toBe("invalid_credentials");
    expect(classifySignInError({ status: 429 })).toBe("rate_limited");
    expect(classifySignInError({ code: "over_request_rate_limit" })).toBe("rate_limited");
    expect(classifySignInError({ status: 500 })).toBe("error");
    expect(classifySignInError(null)).toBe("error");
  });

  it("classifies sign-up errors", () => {
    expect(classifySignUpError({ code: "user_already_exists", status: 422 })).toBe("duplicate");
    expect(classifySignUpError({ code: "email_exists" })).toBe("duplicate");
    expect(classifySignUpError({ status: 403 })).toBe("hook_rejected");
    expect(classifySignUpError({ message: "signup_not_allowed" })).toBe("hook_rejected");
    expect(classifySignUpError({ code: "hook_timeout" })).toBe("hook_rejected");
    expect(classifySignUpError({ code: "signup_disabled" })).toBe("signup_disabled");
    expect(classifySignUpError({ code: "over_email_send_rate_limit" })).toBe("rate_limited");
    expect(classifySignUpError({ status: 429 })).toBe("rate_limited");
    expect(classifySignUpError({ status: 500 })).toBe("error");
  });

  it("uses the same message for duplicate and hook rejection", () => {
    expect(SIGNUP_MESSAGES.duplicate).toBe("이 이메일로 가입할 수 없습니다. 이미 계정이 있으면 로그인해 주세요.");
    expect(SIGNUP_MESSAGES.hook_rejected).toBe(SIGNUP_MESSAGES.duplicate);
    expect(SIGNUP_MESSAGES.signup_disabled).toBe("현재 회원가입을 받지 않습니다. 리더에게 문의해 주세요.");
    expect(SIGNUP_MESSAGES.unconfigured).toBe("회원가입 기능이 비활성입니다 — Supabase 설정이 필요합니다.");
    expect(SIGNUP_MESSAGES.error).toBe("가입하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    expect(SIGNIN_MESSAGES.invalid_credentials).toBe("이메일 또는 비밀번호가 올바르지 않습니다.");
    expect(SIGNIN_MESSAGES.rate_limited).toBe("요청이 많습니다. 잠시 후 다시 시도해 주세요.");
    expect(SIGNIN_MESSAGES.unconfigured).toBe("로그인 기능이 비활성입니다 — Supabase 설정이 필요합니다.");
    expect(AUTH_MESSAGES.error).toBe("로그인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  });
});

describe("origin, callback fallback and auth transitions (FR-021, I-015)", () => {
  it("derives origin from forwarded headers only when host is well-formed", () => {
    expect(originFromHeaders("utmb2027.vercel.app", "https", "http://fb")).toBe("https://utmb2027.vercel.app");
    expect(originFromHeaders("localhost:3000", null, "http://fb")).toBe("http://localhost:3000");
    expect(originFromHeaders("127.0.0.1:3100", null, "http://fb")).toBe("http://127.0.0.1:3100");
    expect(originFromHeaders("preview.vercel.app", null, "http://fb")).toBe("https://preview.vercel.app");
    expect(originFromHeaders("evil.com/x", "https", "http://fb")).toBe("http://fb");
    expect(originFromHeaders("a.com", "javascript", "http://fb")).toBe("https://a.com");
    expect(originFromHeaders(null, "https", "http://fb")).toBe("http://fb");
  });

  it("routes callback failures to the matching login screen", () => {
    expect(callbackFailurePath("/journal/d2027-08-05")).toBe("/journal/login?error=auth");
    expect(callbackFailurePath("/admin/bookings")).toBe("/admin?error=auth");
    expect(callbackFailurePath("/packing")).toBe("/login?error=auth&next=%2Fpacking");
  });

  it("detects login, logout/expiry, account switch and no change", () => {
    expect(detectAuthTransition(null, "u1")).toBe("login");
    expect(detectAuthTransition("u1", null)).toBe("logout-or-expired");
    expect(detectAuthTransition("u1", "u2")).toBe("switch");
    expect(detectAuthTransition("u1", "u1")).toBe("none");
    expect(detectAuthTransition(null, null)).toBe("none");
  });

  it("truncates the account label to 12 characters", () => {
    expect(accountLabel("abcdefghijklmnop@x.com")).toBe("abcdefghijkl…");
    expect(accountLabel("a@b.co")).toBe("a@b.co");
  });
});
