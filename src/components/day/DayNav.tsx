import Link from "next/link";
import type { Day } from "@/lib/schema";

export function DayNav({ prev, next }: { prev: Day | undefined; next: Day | undefined }) {
  const cls = "tap flex flex-1 flex-col justify-center rounded-lg border border-rock/30 bg-white px-4 py-2 text-sm hover:border-alpine";
  return (
    <nav aria-label="Day 이동" className="flex gap-3">
      {prev ? (
        <Link href={`/day/${prev.id}`} className={cls}>
          <span className="text-xs text-rock">이전 · Day {prev.trekDayNumber}</span>
          <span className="font-semibold">{prev.nameKo}</span>
        </Link>
      ) : (
        <span className={`${cls} text-rock`} aria-disabled="true">
          첫 번째 Day
        </span>
      )}
      {next ? (
        <Link href={`/day/${next.id}`} className={`${cls} text-right`}>
          <span className="text-xs text-rock">다음 · Day {next.trekDayNumber}</span>
          <span className="font-semibold">{next.nameKo}</span>
        </Link>
      ) : (
        <span className={`${cls} text-right text-rock`} aria-disabled="true">
          마지막 Day
        </span>
      )}
    </nav>
  );
}
