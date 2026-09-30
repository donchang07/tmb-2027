import Link from "next/link";
import { formatKoDate, type TodayState } from "@/lib/dates";
import type { Lodging, TravelLeg } from "@/lib/schema";
import type { BookingStatus } from "@/lib/booking-status";
import { COUNTRY_LABEL, MODE_LABEL, fmtKm, fmtM, langFor } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { BookingStatusBadge } from "@/components/pwa/BookingStatusBadge";
import { ElevationProfile } from "@/components/map/ElevationProfile";
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
          <Link href={`/travel/${state.firstDay.id}`} data-testid="today-card-link" className="btn btn-primary whitespace-normal text-left">
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
          <Link href="/itinerary" data-testid="today-card-link" className="btn btn-primary">
            전체 일정 요약 보기
          </Link>
        }
      >
        마지막 일정: {state.lastDay.nameKo}
      </StatusNote>
    );
  }
  const day = state.day;
  const trek = day.type === "trek";
  const modes = Array.from(new Set(legs.filter((l) => l.mode !== "stay").map((l) => MODE_LABEL[l.mode] ?? l.mode)));
  const metrics = [
    { label: "거리", value: day.distanceKm !== undefined ? fmtKm(day.distanceKm) : "—", accent: false },
    { label: "획득", value: day.gainM !== undefined ? fmtM(day.gainM, "+") : "—", accent: true },
    { label: "하강", value: day.lossM !== undefined ? fmtM(day.lossM, "-") : "—", accent: false },
    { label: "시간", value: day.duration ?? "—", accent: false },
  ];
  return (
    <section aria-labelledby="today-heading">
      <article
        aria-current="date"
        className="card-dark grid gap-3.5 p-5 sm:gap-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:gap-x-10 lg:gap-y-[18px]"
      >
        <div className="flex flex-col gap-3.5 sm:gap-[18px] lg:col-start-1 lg:row-start-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <h2 id="today-heading" className="text-[21px] font-bold sm:text-[26px]">
              오늘
            </h2>
            <span className="text-[13px] text-on-dark-muted sm:text-sm">{formatKoDate(day.date)}</span>
            <Badge tone="light">{trek ? `Day ${day.trekDayNumber}` : "이동일"}</Badge>
            <Badge tone="amber">오늘</Badge>
            {day.country.map((c) => (
              <span key={c} className="whitespace-nowrap text-[13px] text-on-dark-muted sm:text-sm">
                {COUNTRY_LABEL[c] ?? c}
              </span>
            ))}
          </div>
          <h3 className="text-[19px] font-bold leading-[1.35] tracking-[-0.02em] sm:text-[26px]">{day.nameKo}</h3>
          <p className="text-[13px] text-on-dark-muted sm:text-sm" lang={trek ? langFor(day.country) : undefined}>
            {day.nameOriginal}
          </p>
          {trek ? null : (
            <p className="text-sm sm:text-base">
              구간 {legs.length}개 · {modes.length > 0 ? modes.join(" · ") : "시간 확인 필요"}
            </p>
          )}
        </div>
        {trek ? (
          <div className="flex flex-col gap-3.5 sm:gap-5 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <dl className="grid grid-cols-4 gap-1 sm:gap-3">
              {metrics.map((m) => (
                <div key={m.label}>
                  <dt className="text-xs text-on-dark-muted sm:text-[13px]">{m.label}</dt>
                  <dd className={`text-[15px] font-bold tracking-[-0.02em] sm:text-2xl lg:text-xl xl:text-2xl ${m.accent ? "text-amber" : ""}`}>{m.value}</dd>
                </div>
              ))}
            </dl>
            <ElevationProfile day={day} variant="dark" />
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dark-line pt-3 sm:pt-[18px] lg:col-start-1 lg:row-start-2 lg:self-end">
          {trek ? (
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 text-sm font-semibold sm:text-[17px] [&_.text-ink-3]:text-on-dark-muted [&_.text-warn-fg]:text-amber">
              <span className="min-w-0">
                숙박: <span lang={lodging ? langFor(lodging.country) : undefined}>{lodging?.nameOriginal ?? "확인 필요"}</span>
              </span>
              <BookingStatusBadge lodgingId={day.lodgingId} initialStatus={bookingStatus} initialUpdatedAt={bookingUpdatedAt} />
            </div>
          ) : (
            <span />
          )}
          <Link href={trek ? `/day/${day.id}` : `/travel/${day.id}`} data-testid="today-card-link" className="btn btn-accent lg:bg-bone lg:text-forest-900">
            {trek ? "Day 상세" : "이동 상세 보기"}
          </Link>
        </div>
      </article>
    </section>
  );
}
