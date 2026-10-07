"use client";

import { startTransition, useActionState } from "react";
import { saveLodgingAction, type SaveLodgingState } from "@/app/admin/bookings/actions";
import { LodgingKind, type Lodging } from "@/lib/schema";

const KIND_LABEL: Record<Lodging["kind"], string> = { refuge: "산장", village: "마을 숙소", hotel: "호텔", undecided: "미정" };

const initial: SaveLodgingState = { status: "idle", message: null };

async function saveOrNetworkError(prev: SaveLodgingState, formData: FormData): Promise<SaveLodgingState> {
  try {
    return await saveLodgingAction(prev, formData);
  } catch {
    return { status: "error", message: "저장 실패: 네트워크 연결을 확인한 뒤 다시 시도하세요." };
  }
}

const field = "field";

export function LodgingFields({ lodging }: { lodging: Lodging }) {
  const [state, action, pending] = useActionState(saveOrNetworkError, initial);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => action(formData));
      }}
      className="flex min-w-0 flex-col gap-3" aria-labelledby={`lodging-fields-${lodging.id}`}>
      <h4 id={`lodging-fields-${lodging.id}`} className="text-base font-bold sm:text-[19px]">
        숙박 정보 <span className="text-xs font-normal text-ink-3">v{lodging.version}</span>
      </h4>
      <input type="hidden" name="id" value={lodging.id} />
      <input type="hidden" name="version" value={lodging.version} />

      <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
        <label className="flex flex-col gap-1.5 text-[13px]">
          <span className="font-semibold">유형</span>
          <select name="kind" defaultValue={lodging.kind} className={field}>
            {LodgingKind.options.map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-[13px]">
          <span className="font-semibold">객실 유형</span>
          <input name="roomType" maxLength={100} defaultValue={lodging.roomType ?? ""} className={field} />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] sm:col-span-2">
          <span className="font-semibold">주소</span>
          <input name="address" maxLength={200} defaultValue={lodging.address ?? ""} className={field} />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px]">
          <span className="font-semibold">검증된 전화</span>
          <input name="verifiedPhone" maxLength={30} defaultValue={lodging.verifiedPhone ?? ""} className={field} />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px]">
          <span className="font-semibold">전화 검증일</span>
          <input type="date" name="phoneVerifiedAt" defaultValue={lodging.phoneVerifiedAt ?? ""} className={field} />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px]">
          <span className="font-semibold">예약 링크</span>
          <input name="bookingUrl" type="url" defaultValue={lodging.bookingUrl ?? ""} className={field} />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px]">
          <span className="font-semibold">연락 링크</span>
          <input name="contactUrl" type="url" defaultValue={lodging.contactUrl ?? ""} className={field} />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px]">
          <span className="font-semibold">최저가</span>
          <input name="priceLow" type="number" min={0} step="1" defaultValue={lodging.priceLow ?? ""} className={field} />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px]">
          <span className="font-semibold">최고가</span>
          <input name="priceHigh" type="number" min={0} step="1" defaultValue={lodging.priceHigh ?? ""} className={field} />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px]">
          <span className="font-semibold">통화</span>
          <select name="currency" defaultValue={lodging.currency} className={field}>
            <option value="EUR">EUR</option>
            <option value="CHF">CHF</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-[13px]">
          <span className="font-semibold">확인 기준일</span>
          <input type="date" name="checkedAt" defaultValue={lodging.checkedAt} required className={field} />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px]">
          <span className="font-semibold">재확인일</span>
          <input type="date" name="recheckAt" defaultValue={lodging.recheckAt ?? ""} className={field} />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px]">
          <span className="font-semibold">수용 메모</span>
          <input name="capacityNote" maxLength={300} defaultValue={lodging.capacityNote ?? ""} className={field} />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] sm:col-span-2">
          <span className="font-semibold">가격·시즌 설명 (공개)</span>
          <input name="season" maxLength={300} defaultValue={lodging.season} className={field} />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] sm:col-span-2">
          <span className="font-semibold">대안 숙소 메모 (공개)</span>
          <input name="alternative" maxLength={300} defaultValue={lodging.alternative ?? ""} className={field} />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] sm:col-span-2">
          <span className="font-semibold">비고 (공개)</span>
          <textarea name="notes" maxLength={1000} rows={2} defaultValue={lodging.notes ?? ""} className="field leading-normal" />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-white w-full border-[1.5px] border-forest-900 px-5 py-[11px] font-bold sm:w-auto">
          {pending ? "저장 중…" : state.status === "error" ? "저장 재시도" : "숙박 정보 저장"}
        </button>
        {state.status === "saved" ? (
          <span role="status" className="text-[13px] text-forest-700">
            저장됨 — 새로고침하면 최신 값이 보입니다
          </span>
        ) : null}
        {state.status !== "idle" && state.status !== "saved" ? (
          <span role="alert" className="text-[13px] font-semibold text-danger-ink">
            {state.message}
          </span>
        ) : null}
      </div>
    </form>
  );
}
