import { Hero } from "@/components/home/Hero";
import { TripMetrics } from "@/components/home/TripMetrics";
import { TodayCard } from "@/components/home/TodayCard";
import { QuickLinks } from "@/components/home/QuickLinks";
import { computeTotals, getDays, getTravelLegs, getTrip } from "@/lib/itinerary";
import { getLodgingForDayAsync } from "@/lib/lodgings";
import { resolveTodayState, toLocalDateISO } from "@/lib/dates";
import { getPublicBookings } from "@/lib/bookings/public";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const trip = getTrip();
  const days = getDays();
  const totals = computeTotals(days);
  const state = resolveTodayState(days, toLocalDateISO(new Date()));
  const today = state.kind === "in_trip" ? state.day : undefined;
  const lodging = today ? await getLodgingForDayAsync(today) : undefined;
  const legs = today ? getTravelLegs(today.id) : [];
  const bookings = today?.lodgingId ? await getPublicBookings() : [];
  const booking = today?.lodgingId ? bookings.find((b) => b.lodgingId === today.lodgingId) : undefined;
  const bookingStatus = booking?.status ?? "unbooked";

  return (
    <div className="flex flex-col gap-[22px] sm:gap-10">
      <Hero slogan={trip.slogan} todayHref={today ? `/${today.type === "trek" ? "day" : "travel"}/${today.id}` : undefined} />
      <div className="order-2 sm:order-1">
        <TripMetrics trip={trip} totals={totals} />
      </div>
      <div className="order-1 sm:order-2" data-enter="2">
        <TodayCard state={state} lodging={lodging} legs={legs} bookingStatus={bookingStatus} bookingUpdatedAt={booking?.updatedAt ?? null} />
      </div>
      <div className="order-3">
        <QuickLinks />
      </div>
    </div>
  );
}
