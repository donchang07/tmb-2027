"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { signUpAction } from "@/app/login/actions";
import { fieldErrorsFrom, SignupSchema, type AuthField, type AuthFormState, type FieldErrors } from "@/lib/auth-rules";
import { clearSwPageCache } from "@/lib/auth-client";

const INPUT_CLASS = "tap w-full rounded-lg border border-rock/40 px-3 text-base aria-[invalid=true]:border-safety";
const ORDER: readonly AuthField[] = ["email", "password", "passwordConfirm"];

export function SignupForm({ next }: { next: string | null }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(signUpAction, { status: "idle", email: "" });
  const [localErrors, setLocalErrors] = useState<FieldErrors | null>(null);
  const [offline, setOffline] = useState(false);
  const refs = {
    email: useRef<HTMLInputElement>(null),
    password: useRef<HTMLInputElement>(null),
    passwordConfirm: useRef<HTMLInputElement>(null),
  };
  const alertRef = useRef<HTMLParagraphElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const fieldErrors: FieldErrors = localErrors ?? (state.status === "invalid" ? state.fieldErrors : {});
  const serverError = !localErrors && !offline && state.status === "error" ? state.error : null;

  const focusFirst = (errors: FieldErrors) => {
    const first = ORDER.find((f) => errors[f]);
    if (first) refs[first].current?.focus();
  };

  useEffect(() => {
    if (state.status === "success") {
      successRef.current?.focus();
      const target = state.redirectTo;
      const timer = window.setTimeout(() => {
        void clearSwPageCache().then(() => window.location.assign(target));
      }, 1000);
      return () => window.clearTimeout(timer);
    }
    if (state.status === "error") alertRef.current?.focus();
    if (state.status === "invalid") focusFirst(state.fieldErrors);
  }, [state]);

  if (state.status === "success") {
    const target = state.redirectTo;
    return (
      <div ref={successRef} tabIndex={-1} role="status" className="card border border-alpine/30 bg-alpine/5 p-4 text-alpine-dark">
        <p className="font-semibold">가입이 완료되어 로그인되었습니다. 잠시 후 보던 화면으로 이동합니다.</p>
        <a
          href={target}
          onClick={(e) => {
            e.preventDefault();
            void clearSwPageCache().then(() => window.location.assign(target));
          }}
          className="tap mt-3 inline-flex items-center rounded-lg bg-alpine px-4 text-sm font-semibold text-white"
        >
          바로 이동
        </a>
      </div>
    );
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const fd = new FormData(e.currentTarget);
    const parsed = SignupSchema.safeParse({
      email: fd.get("email") ?? "",
      password: fd.get("password") ?? "",
      passwordConfirm: fd.get("passwordConfirm") ?? "",
    });
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

  const describedBy = (field: AuthField, extra?: string) => {
    const ids = [extra, fieldErrors[field] ? `signup-${field}-error` : undefined].filter(Boolean);
    return ids.length > 0 ? ids.join(" ") : undefined;
  };

  return (
    <form action={action} onSubmit={onSubmit} noValidate aria-busy={pending} className="card space-y-3 p-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <div className="space-y-1">
        <label className="block text-sm font-medium" htmlFor="signup-email">
          이메일
        </label>
        <input
          ref={refs.email}
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue={state.email}
          aria-invalid={fieldErrors.email ? true : undefined}
          aria-describedby={describedBy("email")}
          className={INPUT_CLASS}
        />
        {fieldErrors.email ? (
          <p id="signup-email-error" className="text-sm text-safety">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium" htmlFor="signup-password">
          비밀번호
        </label>
        <input
          ref={refs.password}
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={fieldErrors.password ? true : undefined}
          aria-describedby={describedBy("password", "signup-password-help")}
          className={INPUT_CLASS}
        />
        <p id="signup-password-help" className="text-xs text-rock">
          8자 이상
        </p>
        {fieldErrors.password ? (
          <p id="signup-password-error" className="text-sm text-safety">
            {fieldErrors.password}
          </p>
        ) : null}
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium" htmlFor="signup-passwordConfirm">
          비밀번호 확인
        </label>
        <input
          ref={refs.passwordConfirm}
          id="signup-passwordConfirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          aria-invalid={fieldErrors.passwordConfirm ? true : undefined}
          aria-describedby={describedBy("passwordConfirm")}
          className={INPUT_CLASS}
        />
        {fieldErrors.passwordConfirm ? (
          <p id="signup-passwordConfirm-error" className="text-sm text-safety">
            {fieldErrors.passwordConfirm}
          </p>
        ) : null}
      </div>
      <button type="submit" disabled={pending} aria-busy={pending} className="tap w-full rounded-lg bg-alpine px-4 font-semibold text-white disabled:opacity-60">
        {pending ? "가입 중…" : "가입하기"}
      </button>
      {serverError ? (
        <p ref={alertRef} role="alert" tabIndex={-1} className="text-sm text-safety">
          {serverError}
        </p>
      ) : null}
      {offline ? (
        <p role="alert" className="text-sm text-safety">
          오프라인 상태입니다. 연결 후 다시 시도해 주세요.
        </p>
      ) : null}
    </form>
  );
}
