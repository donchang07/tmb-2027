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
    <form key={formKey} action={action} className="card space-y-3 p-4" aria-labelledby="journal-form-heading">
      <h2 id="journal-form-heading" className="font-bold">
        기록 추가
      </h2>
      <input type="hidden" name="dayId" value={dayId} />
      <label className="block text-sm">
        <span className="font-medium">한 줄 기록</span>
        <textarea
          name="text"
          required
          maxLength={JOURNAL_MAX_TEXT}
          rows={3}
          onChange={(e) => setCount(e.target.value.length)}
          className="mt-1 w-full rounded-lg border border-rock/40 px-3 py-2"
          placeholder="오늘 13km · 고개 하나"
        />
        <span className="mt-1 block text-right text-xs text-rock">
          {count}/{JOURNAL_MAX_TEXT}
        </span>
      </label>
      <label className="block text-sm">
        <span className="font-medium">사진 1장 (선택 · JPG·PNG·WebP 10MB 이하)</span>
        <input
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const f = e.target.files?.[0];
            const check = validatePhoto(f && f.size > 0 ? { type: f.type, size: f.size } : null);
            setPhotoError(check.ok ? null : check.message);
          }}
          className="tap mt-1 w-full rounded-lg border border-rock/40 px-3 py-2 text-sm"
        />
      </label>
      {photoError ? (
        <p role="alert" className="text-sm text-safety">
          {photoError} — 파일을 다시 선택해 주세요.
        </p>
      ) : null}
      <button type="submit" disabled={pending || !!photoError} className="tap rounded-lg bg-alpine px-4 font-semibold text-white disabled:opacity-60">
        {pending ? "저장 중…" : "저장"}
      </button>
      {state.status === "saved" ? (
        <p role="status" className="text-sm text-emerald-800">
          {state.message}
        </p>
      ) : null}
      {state.status !== "idle" && state.status !== "saved" ? (
        <p role="alert" className="text-sm text-safety">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
