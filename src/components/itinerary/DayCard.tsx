import Link from "next/link";
import type { Day, Lodging } from "@/lib/schema";
import { formatKoDate } from "@/lib/dates";
import { COUNTRY_LABEL, fmtKm, fmtM, langFor } from "@/lib/format";
import { dayPhoto } from "@/lib/photos";
import { Badge } from "@/components/ui/Badge";
import { Photo } from "@/components/ui/Photo";
import { BookingStatusBadge } from "@/components/pwa/BookingStatusBadge";
import { type BookingStatus } from "@/lib/booking-status";

export function DayCard({
  day,
  lodging,
  isToday = false,
  bookingStatus = "unbooked",
  bookingUpdatedAt = null,
  missingFields = [],
  linkTestId,
}: {
  day: Day;
  lodging: Lodging | undefined;
  isToday?: boolean;
  bookingStatus?: BookingStatus;
  bookingUpdatedAt?: string | null;
  missingFields?: string[];
  linkTestId?: string;
}) {
  return (
    <article
      aria-current={isToday ? "date" : undefined}
      className={`card ix-tile h-full sm:overflow-hidden ${isToday ? "outline-2 outline-offset-1 outline-amber sm:outline-offset-2" : ""}`}
    >
      <Link
        href={`/day/${day.id}`}
        data-testid={linkTestId}
        className="relative grid h-full grid-cols-[84px_minmax(0,1fr)] items-center gap-3 rounded-[12px] p-2.5 sm:flex sm:flex-col sm:items-stretch sm:gap-0 sm:p-0"
      >
        <Photo src={dayPhoto(day.id)} className="h-[84px] rounded-[9px] sm:h-[150px] sm:flex-none sm:rounded-none" />
        <div className="flex min-w-0 flex-col gap-1 sm:flex-1 sm:gap-2 sm:px-[18px] sm:pb-[18px] sm:pt-4">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-ink-3 sm:text-[13px]">
            <span className="flex gap-1.5 sm:absolute sm:left-3 sm:top-3">
              <Badge tone="dark">Day {day.trekDayNumber}</Badge>
              {isToday ? <Badge tone="amber">오늘</Badge> : null}
            </span>
            <span>{formatKoDate(day.date)}</span>
            <span className="flex gap-1.5 sm:ml-auto">
              {day.country.map((c) => (
                <span key={c} className="whitespace-nowrap">
                  {COUNTRY_LABEL[c] ?? c}
                </span>
              ))}
            </span>
          </div>
          <h3 className="text-[15px] font-bold leading-[1.3] sm:text-lg sm:leading-[1.35] sm:tracking-[-0.01em]">{day.nameKo}</h3>
          <p className="text-xs text-ink-3 sm:text-[13px]" lang={langFor(day.country)}>
            {day.nameOriginal}
          </p>
          <dl className="flex flex-wrap gap-x-1.5 text-xs font-semibold text-forest-700 sm:mt-0.5 sm:text-sm">
            <Metric label="거리" value={day.distanceKm !== undefined ? fmtKm(day.distanceKm) : "—"} />
            <Metric label="획득" value={day.gainM !== undefined ? fmtM(day.gainM, "+") : "—"} />
            <Metric label="하강" value={day.lossM !== undefined ? fmtM(day.lossM, "-") : "—"} />
            <Metric label="시간" value={day.duration ?? "—"} last />
          </dl>
          <div className="flex items-center justify-between gap-1.5 text-xs sm:mt-auto sm:border-t sm:border-line-soft sm:pt-2.5 sm:text-sm">
            <span className="truncate text-ink-2 sm:text-forest-900">
              숙박: <span className="font-semibold">{lodging?.nameOriginal ?? "확인 필요"}</span>
            </span>
            <span className="flex-none">
              <BookingStatusBadge lodgingId={day.lodgingId} initialStatus={bookingStatus} initialUpdatedAt={bookingUpdatedAt} />
            </span>
          </div>
          {missingFields.length > 0 ? (
            <p className="text-xs text-warn-fg">
              이 항목은 확인 중입니다 · 기준일 {day.sourceCheckedAt} ({missingFields.join(", ")})
            </p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}

function Metric({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div className="whitespace-nowrap">
      <dt className="sr-only">{label}</dt>
      <dd>
        {value}
        {last ? null : <span aria-hidden="true"> ·</span>}
      </dd>
    </div>
  );
}
