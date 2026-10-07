"use client";

import { useEffect, useRef, useState } from "react";
import type { BookingRow } from "@/lib/bookings/admin";
import type { Lodging } from "@/lib/schema";
import { BOOKING_STATUS_LABEL, type BookingStatus } from "@/lib/booking-status";
import { formatKoDate, formatKoDateTime } from "@/lib/dates";
import { fmtMoney } from "@/lib/format";
import { dayPhoto } from "@/lib/photos";
import { Badge } from "@/components/ui/Badge";
import { Photo } from "@/components/ui/Photo";
import { BookingEditor, type EditorLodging } from "@/components/admin/BookingEditor";
import { LodgingFields } from "@/components/admin/LodgingFields";

export type LodgingTableRow = { lodging: Lodging; dayLabel: string; date: string; booking: BookingRow | null };

function priceText(lodging: Lodging): string {
  if (lodging.priceLow === null) return "—";
  if (lodging.priceHigh !== null && lodging.priceHigh !== lodging.priceLow) {
    return `${fmtMoney(lodging.priceLow, lodging.currency)}~${fmtMoney(lodging.priceHigh, lodging.currency)}`;
  }
  return fmtMoney(lodging.priceLow, lodging.currency);
}

function phoneText(lodging: Lodging): string {
  if (!lodging.verifiedPhone) return "확인 필요";
  return lodging.phoneVerifiedAt ? `${lodging.verifiedPhone} (${lodging.phoneVerifiedAt})` : lodging.verifiedPhone;
}

function alternativeText(row: LodgingTableRow, names: Map<string, string>): string {
  const byId = row.booking?.alternative_lodging_id;
  if (byId) return names.get(byId) ?? byId;
  return row.booking?.alternative_lodging ?? lodgingAlternative(row.lodging);
}

function lodgingAlternative(lodging: Lodging): string {
  return lodging.alternative ?? "—";
}

function statusOf(row: LodgingTableRow): BookingStatus {
  return row.booking?.status ?? "unbooked";
}

function statusTone(status: BookingStatus): "neutral" | "success" | "warn" | "sage" {
  if (status === "confirmed") return "success";
  if (status === "unbooked") return "neutral";
  if (status === "alternative") return "sage";
  return "warn";
}

export function LodgingTable({ rows, lodgings }: { rows: LodgingTableRow[]; lodgings: EditorLodging[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const names = new Map(rows.map((r) => [r.lodging.id, r.lodging.nameOriginal]));
  const open = rows.find((r) => r.lodging.id === openId) ?? null;
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openId) return;
    const panel = panelRef.current;
    if (!panel) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    panel.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
    panel.querySelector<HTMLElement>("select, input")?.focus({ preventScroll: true });
  }, [openId]);

  const toggle = (id: string) => setOpenId((cur) => (cur === id ? null : id));

  const editButton = (row: LodgingTableRow) => (
    <button
      type="button"
      onClick={() => toggle(row.lodging.id)}
      aria-expanded={openId === row.lodging.id}
      aria-controls="lodging-edit-panel"
      className="btn btn-outline px-3 text-sm"
    >
      {openId === row.lodging.id ? "닫기" : "편집"}
    </button>
  );

  return (
    <div className="flex flex-col gap-3 sm:gap-5">
      <div className="card hidden overflow-x-auto lg:block">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">14박 숙박·예약 목록</caption>
          <thead className="bg-bone/50 text-left text-xs text-ink-3">
            <tr>
              <th scope="col" className="py-3 pl-4 pr-2 font-semibold">Day/날짜</th>
              <th scope="col" className="px-2 py-3 font-semibold">숙박</th>
              <th scope="col" className="px-2 py-3 font-semibold">상태</th>
              <th scope="col" className="px-2 py-3 font-semibold">대안 숙소</th>
              <th scope="col" className="px-2 py-3 font-semibold">전화(검증일)</th>
              <th scope="col" className="px-2 py-3 font-semibold">링크</th>
              <th scope="col" className="px-2 py-3 font-semibold">가격</th>
              <th scope="col" className="px-2 py-3 font-semibold">재확인일</th>
              <th scope="col" className="px-2 py-3 font-semibold">갱신</th>
              <th scope="col" className="py-3 pl-2 pr-4 font-semibold">편집</th>
            </tr>
          </thead>
          <tbody data-stagger>
            {rows.map((row) => (
              <tr key={row.lodging.id} className={`border-t border-line-soft align-middle ${openId === row.lodging.id ? "bg-warn-bg/50" : ""}`}>
                <td className="whitespace-nowrap py-2.5 pl-4 pr-2">
                  <b>{row.dayLabel}</b>
                  <span className="block text-xs text-ink-3">{formatKoDate(row.date)}</span>
                </td>
                <td className="px-2 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Photo src={dayPhoto(row.lodging.dayId)} className="h-10 w-10 shrink-0 rounded-[8px]" />
                    <b>{row.lodging.nameOriginal}</b>
                  </div>
                </td>
                <td className="px-2 py-2.5">
                  <Badge tone={statusTone(statusOf(row))}>{BOOKING_STATUS_LABEL[statusOf(row)]}</Badge>
                </td>
                <td className="px-2 py-2.5 text-ink-2">{alternativeText(row, names)}</td>
                <td className="px-2 py-2.5 text-ink-2">{phoneText(row.lodging)}</td>
                <td className="px-2 py-2.5 text-ink-2">{row.lodging.bookingUrl ? "예약" : row.lodging.contactUrl ? "연락" : "—"}</td>
                <td className="whitespace-nowrap px-2 py-2.5">{priceText(row.lodging)}</td>
                <td className="whitespace-nowrap px-2 py-2.5 text-ink-2">{row.lodging.recheckAt ?? "—"}</td>
                <td className="px-2 py-2.5 text-xs text-ink-3">{row.booking?.updated_at ? formatKoDateTime(row.booking.updated_at) : "—"}</td>
                <td className="py-2.5 pl-2 pr-4">{editButton(row)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul data-stagger className="flex flex-col gap-3 lg:hidden">
        {rows.map((row) => (
          <li key={row.lodging.id} className={`card p-3 ${openId === row.lodging.id ? "outline outline-2 outline-amber" : ""}`}>
            <div className="grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-3">
              <Photo src={dayPhoto(row.lodging.dayId)} className="h-[52px] rounded-[9px]" />
              <div className="flex min-w-0 flex-col items-start gap-0.5">
                <p className="max-w-full truncate text-[15px] font-bold">{row.lodging.nameOriginal}</p>
                <p className="text-xs text-ink-3">
                  {row.dayLabel} · {formatKoDate(row.date)}
                </p>
                <Badge tone={statusTone(statusOf(row))} className="px-2 py-0.5 text-[11px]">
                  {BOOKING_STATUS_LABEL[statusOf(row)]}
                </Badge>
              </div>
              {editButton(row)}
            </div>
            <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 border-t border-line-soft pt-3 text-[13px]">
              <dt className="text-ink-3">대안 숙소</dt>
              <dd>{alternativeText(row, names)}</dd>
              <dt className="text-ink-3">전화(검증일)</dt>
              <dd>{phoneText(row.lodging)}</dd>
              <dt className="text-ink-3">가격</dt>
              <dd>{priceText(row.lodging)}</dd>
              <dt className="text-ink-3">재확인일</dt>
              <dd>{row.lodging.recheckAt ?? "—"}</dd>
              <dt className="text-ink-3">갱신</dt>
              <dd className="text-xs text-ink-3">{row.booking?.updated_at ? formatKoDateTime(row.booking.updated_at) : "—"}</dd>
            </dl>
          </li>
        ))}
      </ul>

      <div id="lodging-edit-panel" ref={panelRef} className="scroll-mt-20">
        {open ? (
          <div className="card flex flex-col gap-4 border-2 border-amber p-4 sm:p-6">
            <h3 className="text-base font-bold sm:text-[19px]">
              {open.dayLabel} · {open.lodging.nameOriginal} 편집
            </h3>
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-7">
              <BookingEditor lodging={{ id: open.lodging.id, nameOriginal: open.lodging.nameOriginal, dayLabel: open.dayLabel }} row={open.booking} lodgings={lodgings} />
              <LodgingFields lodging={open.lodging} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
