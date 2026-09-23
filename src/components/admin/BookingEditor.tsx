"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import type { BookingRow } from "@/lib/bookings/admin";
import { BOOKING_STATUSES, BOOKING_STATUS_LABEL, type BookingStatus } from "@/lib/booking-status";
import { saveBookingAction, type SaveState } from "@/app/admin/bookings/actions";
import { formatKoDateTime } from "@/lib/dates";
import { logEvent } from "@/lib/log";

export type EditorLodging = { id: string; nameOriginal: string; dayLabel: string };

const initial: SaveState = { status: "idle", message: null, row: null };

export function BookingEditor({ lodging, row, lodgings = [] }: { lodging: EditorLodging; row: BookingRow | null; lodgings?: EditorLodging[] }) {
  const [state, action, pending] = useActionState(saveBookingAction, initial);
  const current = state.row ?? row;
  const [dirty, setDirty] = useState(false);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (state.status === "saved" || state.status === "conflict") {
      setDirty(false);
      setFormKey((k) => k + 1);
    }
  }, [state]);

  useEffect(() => {
    if (!dirty) return;
    logEvent("unsaved_changes", "info", { lodgingId: lodging.id });
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, lodging.id]);

  const status: BookingStatus = current?.status ?? "unbooked";
  const version = current?.version ?? 1;

  return (
    <form key={formKey} action={action} onChange={() => setDirty(true)} className="card space-y-3 p-4" aria-labelledby={`edit-${lodging.id}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id={`edit-${lodging.id}`} className="font-bold">
          {lodging.dayLabel} · {lodging.nameOriginal}
        </h3>
        <span className="text-xs text-rock">
          v{version}
          {current?.updated_at ? ` · 갱신 ${formatKoDateTime(current.updated_at)}` : ""}
        </span>
      </div>
      <input type="hidden" name="lodgingId" value={lodging.id} />
      <input type="hidden" name="version" value={version} />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium">공개 상태</span>
          <select name="status" defaultValue={status} className="tap mt-1 w-full rounded-lg border border-rock/40 bg-white px-3">
            {BOOKING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {BOOKING_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium">예약번호 (비공개)</span>
          <input name="confirmationRef" maxLength={100} defaultValue={current?.confirmation_ref ?? ""} className="tap mt-1 w-full rounded-lg border border-rock/40 px-3" />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium">대안 숙소 (등록된 숙박 중 선택 — 공개)</span>
          <select
            name="alternativeLodgingId"
            defaultValue={current?.alternative_lodging_id ?? ""}
            className="tap mt-1 w-full rounded-lg border border-rock/40 bg-white px-3"
          >
            <option value="">선택 안 함</option>
            {lodgings
              .filter((l) => l.id !== lodging.id)
              .map((l) => (
                <option key={l.id} value={l.id}>
                  {l.dayLabel} · {l.nameOriginal}
                </option>
              ))}
          </select>
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium">대안 숙소 메모 (공개 — 상태가 ‘대안 확정’이면 방문자에게 표시)</span>
          <input name="alternativeLodging" maxLength={200} defaultValue={current?.alternative_lodging ?? ""} className="tap mt-1 w-full rounded-lg border border-rock/40 px-3" />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium">비공개 메모</span>
          <textarea name="privateMemo" maxLength={1000} rows={3} defaultValue={current?.private_memo ?? ""} className="mt-1 w-full rounded-lg border border-rock/40 px-3 py-2" />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="tap rounded-lg bg-alpine px-4 font-semibold text-white disabled:opacity-60">
          {pending ? "저장 중…" : state.status === "error" ? "저장 재시도" : "저장"}
        </button>
        {dirty ? <span className="text-sm text-amber-800">저장되지 않은 변경이 있습니다</span> : null}
        {state.status === "saved" && !dirty ? (
          <span role="status" className="text-sm text-emerald-800">
            저장됨 · {current?.updated_at ? formatKoDateTime(current.updated_at) : ""}
          </span>
        ) : null}
        {state.status === "conflict" ? (
          <span role="alert" className="text-sm text-amber-800">
            {state.message}
            {!state.row ? " 최신 값을 가져올 수 없습니다 — 페이지를 새로고침하세요." : ""}
          </span>
        ) : null}
        {state.status === "error" || state.status === "invalid" || state.status === "unconfigured" ? (
          <span role="alert" className="text-sm text-safety">
            {state.message}
          </span>
        ) : null}
        {state.status === "forbidden" || state.status === "unauthorized" ? (
          <span role="alert" className="text-sm text-safety">
            {state.message}{" "}
            <Link href="/admin" className="underline">
              로그인
            </Link>
          </span>
        ) : null}
      </div>
    </form>
  );
}
