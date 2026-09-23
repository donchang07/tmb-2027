import type { Metadata } from "next";
import { ItineraryList } from "@/components/itinerary/ItineraryList";
import { StatusNote } from "@/components/ui/StatusNote";
import { getDays, getMissingFields, getTravelLegs } from "@/lib/itinerary";
import { getLodgingsAsync } from "@/lib/lodgings";
import { resolveTodayState, toLocalDateISO } from "@/lib/dates";
import { getPublicBookings } from "@/lib/bookings/public";
import type { TravelLeg } from "@/lib/schema";
import type { BookingStatus } from "@/lib/booking-status";

export const metadata: Metadata = { title: "전체 일정 — TMB 2027" };
export const dynamic = "force-dynamic";

export default async function ItineraryPage() {
  const days = getDays();
  const lodgings = await getLodgingsAsync();
  const state = resolveTodayState(days, toLocalDateISO(new Date()));
  const todayId = state.kind === "in_trip" ? state.day.id : null;
  const legsByDay: Record<string, TravelLeg[]> = {};
  const missingByDay: Record<string, string[]> = {};
  for (const d of days) {
    legsByDay[d.id] = getTravelLegs(d.id);
    const missing = getMissingFields(d, lodgings.find((l) => l.id === d.lodgingId));
    if (missing.length > 0) missingByDay[d.id] = missing;
  }
  const bookings = await getPublicBookings();
  const bookingStatuses: Record<string, BookingStatus> = {};
  const bookingUpdatedAt: Record<string, string | null> = {};
  for (const b of bookings) {
    bookingStatuses[b.lodgingId] = b.status;
    bookingUpdatedAt[b.lodgingId] = b.updatedAt;
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">전체 일정</h1>
      <p className="mb-4 text-sm text-rock">이동일 3일 + 트레킹 12일 · 2027-08-03 ~ 08-17</p>
      {state.kind === "before" ? (
        <div className="mb-4">
          <StatusNote title={`출발까지 D-${state.daysUntil}`}>현지 날짜 기준. 첫 일정은 {state.firstDay.nameKo}입니다.</StatusNote>
        </div>
      ) : null}
      {state.kind === "after" ? (
        <div className="mb-4">
          <StatusNote title="원정이 종료되었습니다">아래는 전체 일정 요약입니다.</StatusNote>
        </div>
      ) : null}
      <ItineraryList
        days={days}
        lodgings={lodgings}
        legsByDay={legsByDay}
        todayId={todayId}
        bookingStatuses={bookingStatuses}
        bookingUpdatedAt={bookingUpdatedAt}
        missingByDay={missingByDay}
      />
    </div>
  );
}
