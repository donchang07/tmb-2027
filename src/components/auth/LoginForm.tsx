"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { signInAction } from "@/app/login/actions";
import { fieldErrorsFrom, LoginSchema, type AuthField, type AuthFormState, type FieldErrors } from "@/lib/auth-rules";
import { clearSwPageCache } from "@/lib/auth-client";

const INPUT_CLASS = "field min-h-[50px]";
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
    <form action={action} onSubmit={onSubmit} noValidate aria-busy={pending} className="flex flex-col gap-3 sm:gap-3.5">
      <input type="hidden" name="next" value={next ?? ""} />
      <div className="flex flex-col gap-1.5">
        <label className="block text-sm font-semibold" htmlFor="login-email">
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
          className={`${INPUT_CLASS}${serverError ? " field-error" : ""}`}
        />
        {fieldErrors.email ? (
          <p id="login-email-error" className="text-sm font-semibold text-danger-ink">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="block text-sm font-semibold" htmlFor="login-password">
          비밀번호
        </label>
        <div className="relative">
          <input
            ref={refs.password}
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            aria-invalid={fieldErrors.password ? true : undefined}
            aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
            className={`${INPUT_CLASS} pr-[68px]${serverError ? " field-error" : ""}`}
          />
          <button
            type="button"
            aria-pressed={showPassword}
            aria-label="비밀번호 표시"
            onClick={() => setShowPassword((v) => !v)}
            className="btn absolute inset-y-[3px] right-[3px] rounded-[9px] px-3 text-sm text-forest-700"
          >
            표시
          </button>
        </div>
        {fieldErrors.password ? (
          <p id="login-password-error" className="text-sm font-semibold text-danger-ink">
            {fieldErrors.password}
          </p>
        ) : null}
      </div>
      <button type="submit" disabled={pending} aria-busy={pending} className="btn btn-primary mt-1 w-full py-[15px] text-base font-bold">
        {pending ? "로그인 중…" : "로그인"}
      </button>
      {serverError ? (
        <p ref={alertRef} role="alert" tabIndex={-1} className="text-sm font-semibold text-danger-ink">
          {serverError}
        </p>
      ) : null}
      {offline ? (
        <p role="alert" className="text-sm font-semibold text-danger-ink">
          오프라인 상태입니다. 연결 후 다시 로그인해 주세요.
        </p>
      ) : null}
    </form>
  );
}
