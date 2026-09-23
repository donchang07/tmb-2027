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
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="핵심 지표">
      {items.map((it) => (
        <div key={it.label} className="card p-4 text-center">
          <dt className="text-xs text-rock">{it.label}</dt>
          <dd className="mt-1 text-2xl font-black text-alpine">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
