"use client";

import { useActionState, useEffect, useState } from "react";
import { createEntryAction, type EntryState } from "@/app/journal/actions";
import { JOURNAL_MAX_TEXT, validatePhoto } from "@/lib/journal-rules";

const initial: EntryState = { status: "idle", message: null };

export function JournalForm({ dayId }: { dayId: string }) {
  const [state, action, pending] = useActionState(createEntryAction, initial);
  const [count, setCount] = useState(0);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (state.status === "saved") {
      setFormKey((k) => k + 1);
      setCount(0);
      setPhotoError(null);
    }
  }, [state]);

  return (
    <form key={formKey} action={action} className="card flex flex-col gap-3 p-4 sm:gap-3.5 sm:p-5" aria-labelledby="journal-form-heading">
      <h2 id="journal-form-heading" className="font-bold">
        기록 추가
      </h2>
      <input type="hidden" name="dayId" value={dayId} />
      <label className="block text-sm">
        <span className="font-semibold">한 줄 기록</span>
        <textarea
          name="text"
          required
          maxLength={JOURNAL_MAX_TEXT}
          rows={3}
          onChange={(e) => setCount(e.target.value.length)}
          className="field mt-1.5 min-h-[90px] sm:min-h-[110px]"
          placeholder="오늘 13km · 고개 하나"
        />
        <span className="mt-1 block whitespace-nowrap text-right text-xs font-medium text-ink-3">
          {count}/{JOURNAL_MAX_TEXT}
        </span>
      </label>
      <label className="block text-sm">
        <span className="font-semibold">사진 1장 (선택 · JPG·PNG·WebP 10MB 이하)</span>
        <input
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const f = e.target.files?.[0];
            const check = validatePhoto(f && f.size > 0 ? { type: f.type, size: f.size } : null);
            setPhotoError(check.ok ? null : check.message);
          }}
          className="tap mt-1.5 block w-full cursor-pointer rounded-[12px] border-[1.5px] border-dashed border-line-strong px-3 py-2.5 text-sm text-ink-2 file:mr-3 file:cursor-pointer file:rounded-[9px] file:border-0 file:bg-bone file:px-3 file:py-2 file:text-sm file:font-semibold file:text-forest-900"
        />
      </label>
      {photoError ? (
        <p role="alert" className="text-sm text-danger-ink">
          {photoError} — 파일을 다시 선택해 주세요.
        </p>
      ) : null}
      <button type="submit" disabled={pending || !!photoError} className="btn btn-accent w-full py-3.5 text-base">
        {pending ? "저장 중…" : "저장"}
      </button>
      {state.status === "saved" ? (
        <p role="status" className="text-sm font-semibold text-forest-700">
          {state.message}
        </p>
      ) : null}
      {state.status !== "idle" && state.status !== "saved" ? (
        <p role="alert" className="text-sm text-danger-ink">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
