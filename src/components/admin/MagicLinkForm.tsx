"use client";

import { useActionState } from "react";
import { sendMagicLinkAction, type MagicLinkState } from "@/app/admin/actions";

const initial: MagicLinkState = { message: null, error: null };

export function MagicLinkForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(sendMagicLinkAction, initial);
  return (
    <form action={action} className="card flex flex-col gap-3 p-[18px] sm:gap-3.5 sm:p-6">
      <input type="hidden" name="next" value={next} />
      <div className="flex flex-col gap-1.5">
        <label className="block text-sm font-semibold" htmlFor="admin-email">
          리더 이메일
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="field"
          placeholder="leader@example.com"
        />
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary w-full py-3.5 text-base font-bold">
        {pending ? "보내는 중…" : "로그인 링크 보내기"}
      </button>
      {state.message ? (
        <p role="status" className="text-[13px] leading-normal text-forest-700 sm:text-sm">
          {state.message}
        </p>
      ) : null}
      {state.error ? (
        <p role="alert" className="text-sm font-semibold text-danger-ink">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
