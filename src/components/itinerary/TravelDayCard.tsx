import Link from "next/link";
import type { Day, TravelLeg } from "@/lib/schema";
import { formatKoDate } from "@/lib/dates";
import { COUNTRY_LABEL, MODE_LABEL } from "@/lib/format";
import { dayPhoto } from "@/lib/photos";
import { Badge } from "@/components/ui/Badge";
import { Photo } from "@/components/ui/Photo";

export function TravelDayCard({
  day,
  legs,
  isToday = false,
  linkTestId,
}: {
  day: Day;
  legs: TravelLeg[];
  isToday?: boolean;
  linkTestId?: string;
}) {
  const modes = Array.from(new Set(legs.filter((l) => l.mode !== "stay").map((l) => MODE_LABEL[l.mode] ?? l.mode)));
  return (
    <article
      aria-current={isToday ? "date" : undefined}
      className={`card ix-tile h-full sm:overflow-hidden ${isToday ? "outline-2 outline-offset-1 outline-amber sm:outline-offset-2" : ""}`}
    >
      <Link
        href={`/travel/${day.id}`}
        data-testid={linkTestId}
        className="relative grid h-full grid-cols-[84px_minmax(0,1fr)] items-center gap-3 rounded-[12px] p-2.5 sm:flex sm:flex-col sm:items-stretch sm:gap-0 sm:p-0"
      >
        <Photo src={dayPhoto(day.id)} className="h-[84px] rounded-[9px] sm:h-[150px] sm:flex-none sm:rounded-none" />
        <div className="flex min-w-0 flex-col gap-1 sm:flex-1 sm:gap-2 sm:px-[18px] sm:pb-[18px] sm:pt-4">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-ink-3 sm:text-[13px]">
            <span className="flex gap-1.5 sm:absolute sm:left-3 sm:top-3">
              <Badge tone="dark">이동일</Badge>
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
          <p className="text-xs text-ink-3 sm:text-[13px]">{day.nameOriginal}</p>
          <p className="text-xs font-semibold text-forest-700 sm:mt-0.5 sm:text-sm">
            구간 {legs.length}개 · {modes.length > 0 ? modes.join(" · ") : "시간 확인 필요"}
          </p>
        </div>
      </Link>
    </article>
  );
}
