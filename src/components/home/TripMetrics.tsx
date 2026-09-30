import type { Trip } from "@/lib/schema";
import { fmtM } from "@/lib/format";

export function TripMetrics({
  trip,
  totals,
}: {
  trip: Trip;
  totals: { distanceKm: number; gainM: number; lossM: number };
}) {
  const period = `${trip.startDate} ~ ${trip.endDate.slice(5)}`;
  return (
    <dl
      className="grid grid-cols-2 gap-x-4 gap-y-3.5 border-t border-line pt-4 sm:grid-cols-4 sm:gap-x-7 sm:gap-y-5 sm:pb-1 sm:pt-5 lg:grid-cols-[1.5fr_repeat(4,1fr)]"
      aria-label="원정 지표"
    >
      <Metric label="기간" value={period} wide />
      <Metric label="인원" value={`${trip.partySize}명`} />
      {/* Design Ref: §4 — 거리는 소수 1자리 고정("163.0 km"), fmtKm은 정수일 때 소수점을 생략한다 */}
      <Metric label="트레킹" value={`${totals.distanceKm.toFixed(1)} km`} />
      <Metric label="획득 고도" value={fmtM(totals.gainM)} />
      <Metric label="하강 고도" value={fmtM(totals.lossM)} />
    </dl>
  );
}

function Metric({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2 sm:col-span-4 lg:col-span-1" : ""}>
      <dt className="text-xs text-ink-3 sm:text-[13px]">{label}</dt>
      <dd className="mt-0.5 whitespace-nowrap text-[19px] font-bold tracking-[-0.02em] sm:mt-1.5 sm:text-[22px] lg:text-2xl">{value}</dd>
    </div>
  );
}
