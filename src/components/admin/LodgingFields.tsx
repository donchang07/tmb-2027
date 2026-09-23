"use client";

import { useActionState } from "react";
import { saveLodgingAction, type SaveLodgingState } from "@/app/admin/bookings/actions";
import { LodgingKind, type Lodging } from "@/lib/schema";

const KIND_LABEL: Record<Lodging["kind"], string> = { refuge: "산장", village: "마을 숙소", hotel: "호텔", undecided: "미정" };

const initial: SaveLodgingState = { status: "idle", message: null };

const field = "tap mt-1 w-full rounded-lg border border-rock/40 bg-white px-3";

export function LodgingFields({ lodging }: { lodging: Lodging }) {
  const [state, action, pending] = useActionState(saveLodgingAction, initial);

  return (
    <form action={action} className="space-y-3" aria-labelledby={`lodging-fields-${lodging.id}`}>
      <h4 id={`lodging-fields-${lodging.id}`} className="text-sm font-bold">
        숙박 정보 <span className="text-xs font-normal text-rock">v{lodging.version}</span>
      </h4>
      <input type="hidden" name="id" value={lodging.id} />
      <input type="hidden" name="version" value={lodging.version} />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium">유형</span>
          <select name="kind" defaultValue={lodging.kind} className={field}>
            {LodgingKind.options.map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium">객실 유형</span>
          <input name="roomType" maxLength={100} defaultValue={lodging.roomType ?? ""} className={field} />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium">주소</span>
          <input name="address" maxLength={200} defaultValue={lodging.address ?? ""} className={field} />
        </label>
        <label className="block text-sm">
          <span className="font-medium">검증된 전화</span>
          <input name="verifiedPhone" maxLength={30} defaultValue={lodging.verifiedPhone ?? ""} className={field} />
        </label>
        <label className="block text-sm">
          <span className="font-medium">전화 검증일</span>
          <input type="date" name="phoneVerifiedAt" defaultValue={lodging.phoneVerifiedAt ?? ""} className={field} />
        </label>
        <label className="block text-sm">
          <span className="font-medium">예약 링크</span>
          <input name="bookingUrl" type="url" defaultValue={lodging.bookingUrl ?? ""} className={field} />
        </label>
        <label className="block text-sm">
          <span className="font-medium">연락 링크</span>
          <input name="contactUrl" type="url" defaultValue={lodging.contactUrl ?? ""} className={field} />
        </label>
        <label className="block text-sm">
          <span className="font-medium">최저가</span>
          <input name="priceLow" type="number" min={0} step="1" defaultValue={lodging.priceLow ?? ""} className={field} />
        </label>
        <label className="block text-sm">
          <span className="font-medium">최고가</span>
          <input name="priceHigh" type="number" min={0} step="1" defaultValue={lodging.priceHigh ?? ""} className={field} />
        </label>
        <label className="block text-sm">
          <span className="font-medium">통화</span>
          <select name="currency" defaultValue={lodging.currency} className={field}>
            <option value="EUR">EUR</option>
            <option value="CHF">CHF</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium">확인 기준일</span>
          <input type="date" name="checkedAt" defaultValue={lodging.checkedAt} required className={field} />
        </label>
        <label className="block text-sm">
          <span className="font-medium">재확인일</span>
          <input type="date" name="recheckAt" defaultValue={lodging.recheckAt ?? ""} className={field} />
        </label>
        <label className="block text-sm">
          <span className="font-medium">수용 메모</span>
          <input name="capacityNote" maxLength={300} defaultValue={lodging.capacityNote ?? ""} className={field} />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium">가격·시즌 설명 (공개)</span>
          <input name="season" maxLength={300} defaultValue={lodging.season} className={field} />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium">대안 숙소 메모 (공개)</span>
          <input name="alternative" maxLength={300} defaultValue={lodging.alternative ?? ""} className={field} />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium">비고 (공개)</span>
          <textarea name="notes" maxLength={1000} rows={2} defaultValue={lodging.notes ?? ""} className="mt-1 w-full rounded-lg border border-rock/40 px-3 py-2" />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="tap rounded-lg bg-alpine px-4 font-semibold text-white disabled:opacity-60">
          {pending ? "저장 중…" : "숙박 정보 저장"}
        </button>
        {state.status === "saved" ? (
          <span role="status" className="text-sm text-emerald-800">
            저장됨 — 새로고침하면 최신 값이 보입니다
          </span>
        ) : null}
        {state.status !== "idle" && state.status !== "saved" ? (
          <span role="alert" className="text-sm text-safety">
            {state.message}
          </span>
        ) : null}
      </div>
    </form>
  );
}
