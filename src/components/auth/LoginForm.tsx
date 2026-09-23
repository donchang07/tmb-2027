"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { signInAction } from "@/app/login/actions";
import { fieldErrorsFrom, LoginSchema, type AuthField, type AuthFormState, type FieldErrors } from "@/lib/auth-rules";
import { clearSwPageCache } from "@/lib/auth-client";

const INPUT_CLASS = "tap w-full rounded-lg border border-rock/40 px-3 text-base aria-[invalid=true]:border-safety";
const ORDER: readonly AuthField[] = ["email", "password"];

export function LoginForm({ next }: { next: string | null }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(signInAction, { status: "idle", email: "" });
  const [localErrors, setLocalErrors] = useState<FieldErrors | null>(null);
  const [offline, setOffline] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const refs = { email: useRef<HTMLInputElement>(null), password: useRef<HTMLInputElement>(null) };
  const alertRef = useRef<HTMLParagraphElement>(null);

  const fieldErrors: FieldErrors = localErrors ?? (state.status === "invalid" ? state.fieldErrors : {});
  const serverError = !localErrors && !offline && state.status === "error" ? state.error : null;

  const focusFirst = (errors: FieldErrors) => {
    const first = ORDER.find((f) => errors[f]);
    if (first === "email") refs.email.current?.focus();
    else if (first === "password") refs.password.current?.focus();
  };

  useEffect(() => {
    if (state.status === "success") {
      void clearSwPageCache().then(() => window.location.assign(state.redirectTo));
      return;
    }
    if (state.status === "error") alertRef.current?.focus();
    if (state.status === "invalid") focusFirst(state.fieldErrors);
  }, [state]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const fd = new FormData(e.currentTarget);
    const parsed = LoginSchema.safeParse({ email: fd.get("email") ?? "", password: fd.get("password") ?? "" });
    if (!parsed.success) {
      e.preventDefault();
      const errors = fieldErrorsFrom(parsed.error);
      setLocalErrors(errors);
      setOffline(false);
      focusFirst(errors);
      return;
    }
    if (!navigator.onLine) {
      e.preventDefault();
      setLocalErrors(null);
      setOffline(true);
      return;
    }
    setLocalErrors(null);
    setOffline(false);
  };

  return (
    <form action={action} onSubmit={onSubmit} noValidate aria-busy={pending} className="card space-y-3 p-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <div className="space-y-1">
        <label className="block text-sm font-medium" htmlFor="login-email">
          이메일
        </label>
        <input
          ref={refs.email}
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue={state.email}
          aria-invalid={fieldErrors.email ? true : undefined}
          aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
          className={INPUT_CLASS}
        />
        {fieldErrors.email ? (
          <p id="login-email-error" className="text-sm text-safety">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium" htmlFor="login-password">
          비밀번호
        </label>
        <div className="flex gap-2">
          <input
            ref={refs.password}
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            aria-invalid={fieldErrors.password ? true : undefined}
            aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
            className={INPUT_CLASS}
          />
          <button
            type="button"
            aria-pressed={showPassword}
            aria-label="비밀번호 표시"
            onClick={() => setShowPassword((v) => !v)}
            className="tap shrink-0 rounded-lg border border-rock/40 px-3 text-sm text-rock"
          >
            표시
          </button>
        </div>
        {fieldErrors.password ? (
          <p id="login-password-error" className="text-sm text-safety">
            {fieldErrors.password}
          </p>
        ) : null}
      </div>
      <button type="submit" disabled={pending} aria-busy={pending} className="tap w-full rounded-lg bg-alpine px-4 font-semibold text-white disabled:opacity-60">
        {pending ? "로그인 중…" : "로그인"}
      </button>
      {serverError ? (
        <p ref={alertRef} role="alert" tabIndex={-1} className="text-sm text-safety">
          {serverError}
        </p>
      ) : null}
      {offline ? (
        <p role="alert" className="text-sm text-safety">
          오프라인 상태입니다. 연결 후 다시 로그인해 주세요.
        </p>
      ) : null}
    </form>
  );
}
