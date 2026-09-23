import { cache } from "react";
import { isBookingStatus, type BookingStatus } from "@/lib/booking-status";
import { logEvent } from "@/lib/log";
import { createSupabaseAnonClient } from "@/lib/supabase/server";

export type PublicBooking = {
  lodgingId: string;
  status: BookingStatus;
  alternativeLodging: string | null;
  alternativeLodgingId: string | null;
  updatedAt: string | null;
};

type PublicRow = {
  lodging_id: string;
  status: string;
  alternative_lodging: string | null;
  alternative_lodging_id: string | null;
  updated_at: string | null;
};

/** 요청 단위 메모이즈 — layout·page가 같은 요청에서 각각 호출해도 조회는 1회 */
export const getPublicBookings = cache(async (): Promise<PublicBooking[]> => {
  const supabase = createSupabaseAnonClient();
  if (!supabase) {
    logEvent("booking_status_defaulted", "info", { reason: "supabase_not_configured" });
    return [];
  }
  const { data, error } = await supabase
    .from("bookings_public")
    .select("lodging_id,status,alternative_lodging,alternative_lodging_id,updated_at");
  if (error) {
    logEvent("booking_fetch_failed", "warn", { reason: error.message });
    return [];
  }
  const rows = (data ?? []) as PublicRow[];
  if (rows.length === 0) {
    logEvent("booking_status_defaulted", "warn", { reason: "bookings_public_empty — 마이그레이션·테이블 권한 확인" });
    return [];
  }
  return rows
    .filter((row) => isBookingStatus(row.status))
    .map((row) => ({
      lodgingId: row.lodging_id,
      status: row.status as BookingStatus,
      alternativeLodging: row.alternative_lodging,
      alternativeLodgingId: row.alternative_lodging_id,
      updatedAt: row.updated_at,
    }));
});
