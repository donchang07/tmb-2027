import Link from "next/link";
import { formatKoDate, type TodayState } from "@/lib/dates";
import type { Lodging, TravelLeg } from "@/lib/schema";
import type { BookingStatus } from "@/lib/booking-status";
import { DayCard } from "@/components/itinerary/DayCard";
import { TravelDayCard } from "@/components/itinerary/TravelDayCard";
import { StatusNote } from "@/components/ui/StatusNote";

export function TodayCard({
  state,
  lodging,
  legs,
  bookingStatus,
  bookingUpdatedAt = null,
}: {
  state: TodayState;
  lodging: Lodging | undefined;
  legs: TravelLeg[];
  bookingStatus: BookingStatus;
  bookingUpdatedAt?: string | null;
}) {
  if (state.kind === "empty") {
    return <StatusNote tone="error" title="일정 데이터를 불러올 수 없습니다">seed가 비어 있습니다. 관리자에게 알려 주세요.</StatusNote>;
  }
  if (state.kind === "before") {
    return (
      <StatusNote
        tone="info"
        title={`출발까지 D-${state.daysUntil} (현지 기준)`}
        action={
          <Link href={`/travel/${state.firstDay.id}`} data-testid="today-card-link" className="tap inline-flex items-center rounded-lg bg-alpine px-4 text-sm font-semibold text-white">
            첫 일정 보기 · {state.firstDay.nameKo}
          </Link>
        }
      >
        현지(Europe/Paris) 날짜 기준입니다. 첫 일정: {formatKoDate(state.firstDay.date)} {state.firstDay.nameKo}
      </StatusNote>
    );
  }
  if (state.kind === "after") {
    return (
      <StatusNote
        tone="info"
        title="원정이 종료되었습니다"
        action={
          <Link href="/itinerary" data-testid="today-card-link" className="tap inline-flex items-center rounded-lg bg-alpine px-4 text-sm font-semibold text-white">
            전체 일정 요약 보기
          </Link>
        }
      >
        마지막 일정: {state.lastDay.nameKo}
      </StatusNote>
    );
  }
  const day = state.day;
  return (
    <section aria-labelledby="today-heading">
      <h2 id="today-heading" className="mb-2 text-sm font-semibold text-rock">
        오늘
      </h2>
      {day.type === "trek" ? (
        <DayCard day={day} lodging={lodging} isToday bookingStatus={bookingStatus} bookingUpdatedAt={bookingUpdatedAt} linkTestId="today-card-link" />
      ) : (
        <TravelDayCard day={day} legs={legs} isToday linkTestId="today-card-link" />
      )}
    </section>
  );
}
