import type { PublicBooking } from "@/lib/bookings/public";
import { BOOKING_STATUS_LABEL } from "@/lib/booking-status";
import { formatKoDateTime } from "@/lib/dates";
import { Badge } from "@/components/ui/Badge";
import type { EditorLodging } from "@/components/admin/BookingEditor";

export function PublicPreview({ lodgings, bookings }: { lodgings: EditorLodging[]; bookings: PublicBooking[] }) {
  return (
    <div className="card overflow-hidden">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">방문자에게 보이는 예약 상태</caption>
        <thead className="bg-bone/50 text-left text-xs text-ink-3">
          <tr>
            <th scope="col" className="px-3 py-3 font-semibold sm:px-4">
              Day
            </th>
            <th scope="col" className="px-3 py-3 font-semibold sm:px-4">
              숙박
            </th>
            <th scope="col" className="px-3 py-3 font-semibold sm:px-4">
              공개 상태
            </th>
            <th scope="col" className="hidden px-3 py-3 font-semibold sm:table-cell sm:px-4">
              갱신
            </th>
          </tr>
        </thead>
        <tbody>
          {lodgings.map((l) => {
            const b = bookings.find((x) => x.lodgingId === l.id);
            const status = b?.status ?? "unbooked";
            return (
              <tr key={l.id} className="border-t border-line-soft">
                <td className="whitespace-nowrap px-3 py-2.5 font-bold sm:px-4">{l.dayLabel}</td>
                <td className="px-3 py-2.5 sm:px-4">{l.nameOriginal}</td>
                <td className="px-3 py-2.5 sm:px-4">
                  <Badge tone={status === "confirmed" ? "success" : status === "unbooked" ? "neutral" : status === "alternative" ? "sage" : "warn"}>{BOOKING_STATUS_LABEL[status]}</Badge>
                </td>
                <td className="hidden px-3 py-2.5 text-xs text-ink-3 sm:table-cell sm:px-4">{b?.updatedAt ? formatKoDateTime(b.updatedAt) : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
