"use client";

import Link from "next/link";
import { useActionState } from "react";
import { sendTeamMagicLinkAction, type TeamLoginState } from "@/app/journal/actions";

const initial: TeamLoginState = { message: null, error: null };

export function TeamLoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(sendTeamMagicLinkAction, initial);
  return (
    <div className="flex flex-col gap-3.5 sm:gap-[18px]">
      <form action={action} data-enter="3" className="card flex flex-col gap-3 p-[18px] sm:gap-3.5 sm:p-6">
        <input type="hidden" name="next" value={next} />
        <div className="flex flex-col gap-1.5">
          <label className="block text-sm font-semibold" htmlFor="team-email">
            팀원 이메일
          </label>
          <input id="team-email" name="email" type="email" required autoComplete="email" className="field" placeholder="member@example.com" />
          <p className="text-[13px] text-ink-3">리더가 초대한 팀원 이메일만 로그인할 수 있습니다.</p>
        </div>
        <button type="submit" disabled={pending} className="btn btn-primary w-full py-3.5 text-base font-bold">
          {pending ? "보내는 중…" : "로그인 링크 보내기"}
        </button>
        {state.message ? (
          <p role="status" className="text-sm leading-normal text-forest-700">
            {state.message}
          </p>
        ) : null}
        {state.error ? (
          <p role="alert" className="text-sm font-semibold text-danger-ink">
            {state.error}
          </p>
        ) : null}
      </form>
      <p className="text-sm sm:text-[15px]">
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="tap ix-link inline-flex items-center font-semibold text-forest-700">
          메일이 오지 않나요? 이메일·비밀번호로 로그인
        </Link>
      </p>
    </div>
  );
}
