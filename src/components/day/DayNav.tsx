import Link from "next/link";
import type { Day } from "@/lib/schema";

export function DayNav({ prev, next }: { prev: Day | undefined; next: Day | undefined }) {
  const cls = "card tap flex flex-col justify-center gap-0.5 p-3 text-[13px] sm:p-3.5 sm:text-sm";
  return (
    <nav aria-label="Day 이동" className="grid grid-cols-2 gap-2 sm:gap-2.5">
      {prev ? (
        <Link href={`/day/${prev.id}`} className={`${cls} ix-tile`}>
          <span className="text-ink-3">이전 · Day {prev.trekDayNumber}</span>
          <span className="font-semibold">{prev.nameKo}</span>
        </Link>
      ) : (
        <span className={`${cls} text-ink-3`} aria-disabled="true">
          첫 번째 Day
        </span>
      )}
      {next ? (
        <Link href={`/day/${next.id}`} className={`${cls} ix-tile text-right`}>
          <span className="text-ink-3">다음 · Day {next.trekDayNumber}</span>
          <span className="font-semibold">{next.nameKo}</span>
        </Link>
      ) : (
        <span className={`${cls} text-right text-ink-3`} aria-disabled="true">
          마지막 Day
        </span>
      )}
    </nav>
  );
}
