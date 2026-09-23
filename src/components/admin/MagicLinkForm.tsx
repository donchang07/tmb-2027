"use client";

import { useActionState } from "react";
import { sendMagicLinkAction, type MagicLinkState } from "@/app/admin/actions";

const initial: MagicLinkState = { message: null, error: null };

export function MagicLinkForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(sendMagicLinkAction, initial);
  return (
    <form action={action} className="card space-y-3 p-4">
      <input type="hidden" name="next" value={next} />
      <label className="block text-sm font-medium" htmlFor="admin-email">
        리더 이메일
      </label>
      <input
        id="admin-email"
        name="email"
        type="email"
        required
        autoComplete="email"
        className="tap w-full rounded-lg border border-rock/40 px-3 text-base"
        placeholder="leader@example.com"
      />
      <button type="submit" disabled={pending} className="tap w-full rounded-lg bg-alpine px-4 font-semibold text-white disabled:opacity-60 sm:w-auto">
        {pending ? "보내는 중…" : "로그인 링크 보내기"}
      </button>
      {state.message ? (
        <p role="status" className="text-sm text-alpine-dark">
          {state.message}
        </p>
      ) : null}
      {state.error ? (
        <p role="alert" className="text-sm text-safety">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
