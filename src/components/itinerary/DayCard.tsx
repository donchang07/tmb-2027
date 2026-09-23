import Link from "next/link";
import type { Day, Lodging } from "@/lib/schema";
import { formatKoDate } from "@/lib/dates";
import { COUNTRY_LABEL, fmtKm, fmtM, langFor } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
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
      className={`card p-4 transition ${isToday ? "border-2 border-alpine ring-2 ring-alpine/20" : ""}`}
    >
      <Link href={`/day/${day.id}`} data-testid={linkTestId} className="block focus-visible:outline-none">
        <div className="flex flex-wrap items-center gap-2 text-sm text-rock">
          <span className="font-semibold text-ink">{formatKoDate(day.date)}</span>
          <Badge tone="alpine">Day {day.trekDayNumber}</Badge>
          {isToday ? <Badge tone="safety">오늘</Badge> : null}
          {day.country.map((c) => (
            <Badge key={c}>{COUNTRY_LABEL[c] ?? c}</Badge>
          ))}
        </div>
        <h3 className="mt-2 text-lg font-bold leading-snug">{day.nameKo}</h3>
        <p className="text-sm text-rock" lang={langFor(day.country)}>
          {day.nameOriginal}
        </p>
        <dl className="mt-3 grid grid-cols-4 gap-2 text-center">
          <Metric label="거리" value={day.distanceKm !== undefined ? fmtKm(day.distanceKm) : "—"} />
          <Metric label="획득" value={day.gainM !== undefined ? fmtM(day.gainM, "+") : "—"} />
          <Metric label="하강" value={day.lossM !== undefined ? fmtM(day.lossM, "-") : "—"} />
          <Metric label="시간" value={day.duration ?? "—"} />
        </dl>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="truncate">
            숙박: <span className="font-medium">{lodging?.nameOriginal ?? "확인 필요"}</span>
          </span>
          <BookingStatusBadge lodgingId={day.lodgingId} initialStatus={bookingStatus} initialUpdatedAt={bookingUpdatedAt} />
        </div>
        {missingFields.length > 0 ? (
          <p className="mt-2 text-xs text-amber-800">
            이 항목은 확인 중입니다 · 기준일 {day.sourceCheckedAt} ({missingFields.join(", ")})
          </p>
        ) : null}
      </Link>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-snow px-1 py-2">
      <dt className="text-[11px] text-rock">{label}</dt>
      <dd className="text-sm font-bold">{value}</dd>
    </div>
  );
}
