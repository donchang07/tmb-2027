import type { PublicBooking } from "@/lib/bookings/public";
import { BOOKING_STATUS_LABEL } from "@/lib/booking-status";
import { formatKoDateTime } from "@/lib/dates";
import { Badge } from "@/components/ui/Badge";
import type { EditorLodging } from "@/components/admin/BookingEditor";

export function PublicPreview({ lodgings, bookings }: { lodgings: EditorLodging[]; bookings: PublicBooking[] }) {
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <caption className="sr-only">방문자에게 보이는 예약 상태</caption>
        <thead className="bg-snow text-left text-xs text-rock">
          <tr>
            <th scope="col" className="px-3 py-2">
              Day
            </th>
            <th scope="col" className="px-3 py-2">
              숙박
            </th>
            <th scope="col" className="px-3 py-2">
              공개 상태
            </th>
            <th scope="col" className="hidden px-3 py-2 sm:table-cell">
              갱신
            </th>
          </tr>
        </thead>
        <tbody>
          {lodgings.map((l) => {
            const b = bookings.find((x) => x.lodgingId === l.id);
            const status = b?.status ?? "unbooked";
            return (
              <tr key={l.id} className="border-t border-rock/10">
                <td className="px-3 py-2">{l.dayLabel}</td>
                <td className="px-3 py-2">{l.nameOriginal}</td>
                <td className="px-3 py-2">
                  <Badge tone={status === "confirmed" ? "success" : status === "unbooked" ? "neutral" : "warn"}>{BOOKING_STATUS_LABEL[status]}</Badge>
                </td>
                <td className="hidden px-3 py-2 text-xs text-rock sm:table-cell">{b?.updatedAt ? formatKoDateTime(b.updatedAt) : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
