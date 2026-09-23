"use client";

import { BOOKING_STATUS_LABEL, type BookingStatus } from "@/lib/booking-status";
import { errorMessage, offlineMessage } from "@/lib/bookings/live";
import { formatKoDateTime } from "@/lib/dates";
import { Badge } from "@/components/ui/Badge";
import { useBookingLive } from "@/components/pwa/BookingLive";

function statusTone(status: BookingStatus): "neutral" | "success" | "warn" | "safety" {
  if (status === "confirmed") return "success";
  if (status === "unbooked") return "neutral";
  if (status === "alternative") return "safety";
  return "warn";
}

export function BookingStatusBadge({
  lodgingId,
  initialStatus,
  initialUpdatedAt = null,
}: {
  lodgingId?: string;
  initialStatus: BookingStatus;
  initialUpdatedAt?: string | null;
}) {
  const { state, get } = useBookingLive();
  const live = lodgingId ? get(lodgingId) : undefined;
  const status = live?.status ?? initialStatus;
  const updatedAt = live?.updatedAt ?? initialUpdatedAt;
  // 오프라인이면 폴링 자체가 없어 state.error가 서지 않으므로 online 여부로도 안내한다
  const notice = !state.online ? offlineMessage(state.fetchedAt) : state.error ? errorMessage(state.fetchedAt) : null;

  return (
    <span data-testid="booking-status" className="inline-flex flex-col items-end gap-0.5 text-right">
      <Badge tone={statusTone(status)}>{BOOKING_STATUS_LABEL[status]}</Badge>
      {updatedAt ? <span className="text-xs text-rock">상태 갱신 {formatKoDateTime(updatedAt)}</span> : null}
      {notice ? <span className="text-xs text-amber-800">{notice}</span> : null}
    </span>
  );
}
