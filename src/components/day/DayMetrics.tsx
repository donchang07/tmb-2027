import type { Day } from "@/lib/schema";
import { fmtKm, fmtM } from "@/lib/format";

export function DayMetrics({ day }: { day: Day }) {
  const items = [
    { label: "거리", value: day.distanceKm !== undefined ? fmtKm(day.distanceKm) : "—" },
    { label: "획득", value: day.gainM !== undefined ? fmtM(day.gainM, "+") : "—" },
    { label: "하강", value: day.lossM !== undefined ? fmtM(day.lossM, "-") : "—" },
    { label: "시간", value: day.duration ?? "—" },
  ];
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3" aria-label="핵심 지표">
      {items.map((it) => (
        <div key={it.label} className="card p-3.5 sm:p-[18px] lg:p-3.5 xl:p-[18px]">
          <dt className="text-xs text-ink-3 sm:text-[13px]">{it.label}</dt>
          <dd className="mt-0.5 text-[22px] font-bold tracking-[-0.02em] sm:mt-1 whitespace-nowrap lg:text-[19px] xl:text-2xl">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
