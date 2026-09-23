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
    <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5" aria-label="원정 지표">
      <Metric label="기간" value={period} />
      <Metric label="인원" value={`${trip.partySize}명`} />
      {/* Design Ref: §4 — 거리는 소수 1자리 고정("163.0 km"), fmtKm은 정수일 때 소수점을 생략한다 */}
      <Metric label="트레킹" value={`${totals.distanceKm.toFixed(1)} km`} />
      <Metric label="획득 고도" value={fmtM(totals.gainM)} />
      <Metric label="하강 고도" value={fmtM(totals.lossM)} />
    </dl>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <dt className="text-xs text-rock">{label}</dt>
      <dd className="mt-1 text-xl font-bold text-alpine">{value}</dd>
    </div>
  );
}
