export const BOOKING_STATUSES = ["unbooked", "inquiry", "waitlist", "confirmed", "alternative"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  unbooked: "미예약",
  inquiry: "문의",
  waitlist: "대기",
  confirmed: "확정",
  alternative: "대안 확정",
};

export function isBookingStatus(v: unknown): v is BookingStatus {
  return typeof v === "string" && (BOOKING_STATUSES as readonly string[]).includes(v);
}
