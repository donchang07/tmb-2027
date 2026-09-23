"use client";

import { useState } from "react";
import { prepareSignOut } from "@/lib/auth-client";

const DEFAULT_CLASS = "tap inline-flex items-center rounded-lg border border-rock/40 px-4 text-sm font-semibold text-rock";

export function SignOutButton({ className = DEFAULT_CLASS, menuItem = false }: { className?: string; menuItem?: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setPending(true);
    setError(null);
    try {
      if (!(await prepareSignOut())) {
        setPending(false);
        setError("연결 후 로그아웃할 수 있습니다.");
        return;
      }
      form.submit();
    } catch {
      setPending(false);
      setError("로그아웃하지 못했습니다. 다시 시도해 주세요.");
    }
  };

  return (
    <form action="/auth/signout" method="post" onSubmit={onSubmit} role={menuItem ? "none" : undefined}>
      <button type="submit" disabled={pending} className={className} role={menuItem ? "menuitem" : undefined}>
        {pending ? "로그아웃 중…" : "로그아웃"}
      </button>
      {error ? (
        <p role="alert" className="mt-1 text-xs text-safety">
          {error}
        </p>
      ) : null}
    </form>
  );
}
