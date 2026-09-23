import Link from "next/link";
import type { Day, TravelLeg } from "@/lib/schema";
import { formatKoDate } from "@/lib/dates";
import { COUNTRY_LABEL, MODE_LABEL } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";

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
      className={`card p-4 ${isToday ? "border-2 border-alpine ring-2 ring-alpine/20" : ""}`}
    >
      <Link href={`/travel/${day.id}`} data-testid={linkTestId} className="block">
        <div className="flex flex-wrap items-center gap-2 text-sm text-rock">
          <span className="font-semibold text-ink">{formatKoDate(day.date)}</span>
          <Badge>이동일</Badge>
          {isToday ? <Badge tone="safety">오늘</Badge> : null}
          {day.country.map((c) => (
            <Badge key={c}>{COUNTRY_LABEL[c] ?? c}</Badge>
          ))}
        </div>
        <h3 className="mt-2 text-lg font-bold leading-snug">{day.nameKo}</h3>
        <p className="text-sm text-rock">{day.nameOriginal}</p>
        <p className="mt-3 text-sm">
          구간 {legs.length}개 · {modes.length > 0 ? modes.join(" · ") : "시간 확인 필요"}
        </p>
      </Link>
    </article>
  );
}
