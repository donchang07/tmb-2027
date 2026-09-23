import type { Day } from "@/lib/schema";
import { getElevationPoints } from "@/lib/route";
import { fmtM } from "@/lib/format";
import { StatusNote } from "@/components/ui/StatusNote";

const W = 640;
const H = 220;
const PAD_X = 36;
const PAD_TOP = 28;
const PAD_BOTTOM = 44;

export function ElevationProfile({ day }: { day: Day }) {
  const points = getElevationPoints(day);
  if (points.length < 3) {
    return <StatusNote tone="warn" title="고도점 확인 필요">출발·주요 고개·도착 3점 이상이 필요합니다 (기준일 {day.sourceCheckedAt}).</StatusNote>;
  }
  const alts = points.map((p) => p.altitudeM).filter((a): a is number => a !== null);
  const min = Math.min(...alts) - 100;
  const max = Math.max(...alts) + 100;
  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_TOP - PAD_BOTTOM;
  const x = (i: number) => PAD_X + (innerW * i) / (points.length - 1);
  const y = (a: number) => PAD_TOP + innerH - ((a - min) / (max - min || 1)) * innerH;

  const withAlt = points.map((p, i) => ({ ...p, i })).filter((p) => p.altitudeM !== null);
  const line = withAlt.map((p, idx) => `${idx === 0 ? "M" : "L"} ${x(p.i).toFixed(1)} ${y(p.altitudeM as number).toFixed(1)}`).join(" ");
  const first = withAlt[0];
  const last = withAlt[withAlt.length - 1];
  const area = first && last ? `${line} L ${x(last.i).toFixed(1)} ${(PAD_TOP + innerH).toFixed(1)} L ${x(first.i).toFixed(1)} ${(PAD_TOP + innerH).toFixed(1)} Z` : "";
  const peak = Math.max(...alts);
  const startAlt = points[0]?.altitudeM;
  const endAlt = points[points.length - 1]?.altitudeM;
  const label = `고도 프로파일 Day ${day.trekDayNumber}: 출발 ${startAlt !== null && startAlt !== undefined ? fmtM(startAlt) : "확인 필요"} · 최고 ${fmtM(peak)} · 도착 ${endAlt !== null && endAlt !== undefined ? fmtM(endAlt) : "확인 필요"}`;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="mt-3 h-auto w-full">
        <path d={area} fill="#0F5D7A" opacity={0.1} />
        <path d={line} stroke="#0F5D7A" strokeWidth={3} fill="none" strokeLinejoin="round" />
        {points.map((p, i) =>
          p.altitudeM !== null ? (
            <g key={p.sequence}>
              <circle cx={x(i)} cy={y(p.altitudeM)} r={5} fill={p.role === "via" ? "#C84A36" : "#0F5D7A"} stroke="#fff" strokeWidth={1.5} />
              <text x={x(i)} y={y(p.altitudeM) - 10} fontSize={11} fontWeight={700} textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"} fill="#1D2428">
                {fmtM(p.altitudeM)}
              </text>
              <text x={x(i)} y={H - 14} fontSize={10} textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"} fill="#56616A">
                {p.labelOriginal.length > 10 ? `${p.labelOriginal.slice(0, 10)}…` : p.labelOriginal}
              </text>
            </g>
          ) : (
            <text key={p.sequence} x={x(i)} y={H - 14} fontSize={10} textAnchor="middle" fill="#C84A36">
              고도 확인 필요
            </text>
          ),
        )}
      </svg>
      <table className="sr-only">
        <caption>Day {day.trekDayNumber} 고도점</caption>
        <thead>
          <tr>
            <th scope="col">순서</th>
            <th scope="col">지점</th>
            <th scope="col">고도</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.sequence}>
              <td>{p.sequence}</td>
              <td>{p.labelOriginal}</td>
              <td>{p.altitudeM !== null ? fmtM(p.altitudeM) : "고도 확인 필요"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
