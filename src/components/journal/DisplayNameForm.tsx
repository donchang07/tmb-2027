"use client";

import { useActionState } from "react";
import { setDisplayNameAction, type DisplayNameState } from "@/app/journal/actions";
import { DISPLAY_NAME_MAX } from "@/lib/journal-rules";

const initial: DisplayNameState = { status: "idle", message: null };

export function DisplayNameForm({ dayId, current }: { dayId: string; current: string | null }) {
  const [state, action, pending] = useActionState(setDisplayNameAction, initial);
  return (
    <form action={action} className="card space-y-3 p-4" aria-labelledby="display-name-heading">
      <h2 id="display-name-heading" className="font-bold">
        표시명 설정
      </h2>
      <p className="text-sm text-rock">기록에는 이메일 대신 표시명만 공개됩니다.</p>
      <input type="hidden" name="dayId" value={dayId} />
      <label className="block text-sm">
        <span className="font-medium">표시명 (1~{DISPLAY_NAME_MAX}자)</span>
        <input
          name="displayName"
          required
          maxLength={DISPLAY_NAME_MAX}
          defaultValue={current ?? ""}
          className="tap mt-1 w-full rounded-lg border border-rock/40 px-3 text-base"
          placeholder="동인"
        />
      </label>
      <button type="submit" disabled={pending} className="tap rounded-lg bg-alpine px-4 font-semibold text-white disabled:opacity-60">
        {pending ? "저장 중…" : "표시명 저장"}
      </button>
      {state.status === "saved" ? (
        <p role="status" className="text-sm text-emerald-800">
          {state.message}
        </p>
      ) : null}
      {state.status === "error" ? (
        <p role="alert" className="text-sm text-safety">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
