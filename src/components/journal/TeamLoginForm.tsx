"use client";

import Link from "next/link";
import { useActionState } from "react";
import { sendTeamMagicLinkAction, type TeamLoginState } from "@/app/journal/actions";

const initial: TeamLoginState = { message: null, error: null };

export function TeamLoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(sendTeamMagicLinkAction, initial);
  return (
    <form action={action} className="card space-y-3 p-4">
      <input type="hidden" name="next" value={next} />
      <label className="block text-sm font-medium" htmlFor="team-email">
        팀원 이메일
      </label>
      <input id="team-email" name="email" type="email" required autoComplete="email" className="tap w-full rounded-lg border border-rock/40 px-3 text-base" placeholder="member@example.com" />
      <button type="submit" disabled={pending} className="tap w-full rounded-lg bg-alpine px-4 font-semibold text-white disabled:opacity-60 sm:w-auto">
        {pending ? "보내는 중…" : "로그인 링크 보내기"}
      </button>
      <p className="text-xs text-rock">리더가 초대한 팀원 이메일만 로그인할 수 있습니다.</p>
      <p className="text-sm">
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="tap inline-flex items-center text-alpine underline">
          메일이 오지 않나요? 이메일·비밀번호로 로그인
        </Link>
      </p>
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
