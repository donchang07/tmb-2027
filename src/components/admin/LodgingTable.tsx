"use client";

import { useState } from "react";
import type { BookingRow } from "@/lib/bookings/admin";
import type { Lodging } from "@/lib/schema";
import { BOOKING_STATUS_LABEL, type BookingStatus } from "@/lib/booking-status";
import { formatKoDate, formatKoDateTime } from "@/lib/dates";
import { fmtMoney } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
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

export function LodgingTable({ rows, lodgings }: { rows: LodgingTableRow[]; lodgings: EditorLodging[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const names = new Map(rows.map((r) => [r.lodging.id, r.lodging.nameOriginal]));
  const open = rows.find((r) => r.lodging.id === openId) ?? null;

  const toggle = (id: string) => setOpenId((cur) => (cur === id ? null : id));

  const editButton = (row: LodgingTableRow) => (
    <button
      type="button"
      onClick={() => toggle(row.lodging.id)}
      aria-expanded={openId === row.lodging.id}
      aria-controls="lodging-edit-panel"
      className="tap rounded-lg border border-alpine/40 px-3 text-sm font-semibold text-alpine"
    >
      {openId === row.lodging.id ? "닫기" : "편집"}
    </button>
  );

  return (
    <div className="space-y-3">
      <div className="card hidden overflow-hidden lg:block">
        <table className="w-full text-sm">
          <caption className="sr-only">14박 숙박·예약 목록</caption>
          <thead className="bg-snow text-left text-xs text-rock">
            <tr>
              <th scope="col" className="px-3 py-2">Day/날짜</th>
              <th scope="col" className="px-3 py-2">숙박</th>
              <th scope="col" className="px-3 py-2">상태</th>
              <th scope="col" className="px-3 py-2">대안 숙소</th>
              <th scope="col" className="px-3 py-2">전화(검증일)</th>
              <th scope="col" className="px-3 py-2">링크</th>
              <th scope="col" className="px-3 py-2">가격</th>
              <th scope="col" className="px-3 py-2">재확인일</th>
              <th scope="col" className="px-3 py-2">갱신</th>
              <th scope="col" className="px-3 py-2">편집</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.lodging.id} className="border-t border-rock/10 align-top">
                <td className="px-3 py-2 whitespace-nowrap">
                  {row.dayLabel}
                  <span className="block text-xs text-rock">{formatKoDate(row.date)}</span>
                </td>
                <td className="px-3 py-2">{row.lodging.nameOriginal}</td>
                <td className="px-3 py-2">
                  <Badge tone={statusOf(row) === "confirmed" ? "success" : statusOf(row) === "unbooked" ? "neutral" : "warn"}>
                    {BOOKING_STATUS_LABEL[statusOf(row)]}
                  </Badge>
                </td>
                <td className="px-3 py-2">{alternativeText(row, names)}</td>
                <td className="px-3 py-2">{phoneText(row.lodging)}</td>
                <td className="px-3 py-2">{row.lodging.bookingUrl ? "예약" : row.lodging.contactUrl ? "연락" : "—"}</td>
                <td className="px-3 py-2 whitespace-nowrap">{priceText(row.lodging)}</td>
                <td className="px-3 py-2">{row.lodging.recheckAt ?? "—"}</td>
                <td className="px-3 py-2 text-xs text-rock">{row.booking?.updated_at ? formatKoDateTime(row.booking.updated_at) : "—"}</td>
                <td className="px-3 py-2">{editButton(row)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 lg:hidden">
        {rows.map((row) => (
          <li key={row.lodging.id} className="card p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="font-bold">{row.lodging.nameOriginal}</p>
                <p className="text-xs text-rock">
                  {row.dayLabel} · {formatKoDate(row.date)}
                </p>
              </div>
              <Badge tone={statusOf(row) === "confirmed" ? "success" : statusOf(row) === "unbooked" ? "neutral" : "warn"}>
                {BOOKING_STATUS_LABEL[statusOf(row)]}
              </Badge>
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
              <dt className="text-rock">대안 숙소</dt>
              <dd>{alternativeText(row, names)}</dd>
              <dt className="text-rock">전화(검증일)</dt>
              <dd>{phoneText(row.lodging)}</dd>
              <dt className="text-rock">가격</dt>
              <dd>{priceText(row.lodging)}</dd>
              <dt className="text-rock">재확인일</dt>
              <dd>{row.lodging.recheckAt ?? "—"}</dd>
              <dt className="text-rock">갱신</dt>
              <dd className="text-xs text-rock">{row.booking?.updated_at ? formatKoDateTime(row.booking.updated_at) : "—"}</dd>
            </dl>
            <div className="mt-3">{editButton(row)}</div>
          </li>
        ))}
      </ul>

      <div id="lodging-edit-panel">
        {open ? (
          <div className="card space-y-4 p-4">
            <h3 className="text-lg font-bold">
              {open.dayLabel} · {open.lodging.nameOriginal} 편집
            </h3>
            <BookingEditor lodging={{ id: open.lodging.id, nameOriginal: open.lodging.nameOriginal, dayLabel: open.dayLabel }} row={open.booking} lodgings={lodgings} />
            <LodgingFields lodging={open.lodging} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
