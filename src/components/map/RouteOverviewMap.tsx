import { getRouteNodes, getRouteSegments, projectNodes, segmentPath } from "@/lib/route";
import type { RouteNode } from "@/lib/schema";
import { fmtM } from "@/lib/format";

const W = 800;
const H = 620;
const PAD = 60;

function Marker({ node, x, y }: { node: RouteNode; x: number; y: number }) {
  const title = `${node.nameOriginal}${node.altitudeM !== null ? ` · ${fmtM(node.altitudeM)}` : ""}`;
  switch (node.kind) {
    case "pass":
      return (
        <g data-marker="pass">
          <title>{title}</title>
          <polygon points={`${x},${y - 8} ${x - 7},${y + 5} ${x + 7},${y + 5}`} fill="#C84A36" stroke="#fff" strokeWidth={1.5} />
        </g>
      );
    case "lodging":
      return (
        <g data-marker="lodging">
          <title>{title}</title>
          <circle cx={x} cy={y} r={6.5} fill="#0F5D7A" stroke="#fff" strokeWidth={1.5} />
        </g>
      );
    case "start":
    case "finish":
      return (
        <g data-marker={node.kind}>
          <title>{title}</title>
          <rect x={x - 7} y={y - 7} width={14} height={14} transform={`rotate(45 ${x} ${y})`} fill="#1D2428" stroke="#fff" strokeWidth={1.5} />
        </g>
      );
    case "town":
      return (
        <g data-marker="town">
          <title>{title}</title>
          <circle cx={x} cy={y} r={5.5} fill="#fff" stroke="#56616A" strokeWidth={2} />
        </g>
      );
    default:
      return (
        <g data-marker="waypoint">
          <title>{title}</title>
          <circle cx={x} cy={y} r={3} fill="#56616A" />
        </g>
      );
  }
}

export function RouteOverviewMap() {
  const nodes = getRouteNodes();
  const segments = getRouteSegments();
  const projected = projectNodes(nodes, W, H, PAD);
  const byId = new Map(projected.map((p) => [p.id, p]));
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  const labelPos = (nodeIds: string[]) => {
    const pts = nodeIds.map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => !!p);
    const mid = pts[Math.floor(pts.length / 2)] ?? pts[0];
    return mid ? { x: mid.x, y: mid.y } : { x: 0, y: 0 };
  };

  const desc = segments
    .map((s) => `Day ${s.trekDayNumber}: ${s.nodeIds.map((id) => nodeById.get(id)?.nameOriginal ?? id).join(" → ")}`)
    .join(". ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-labelledby="map-title map-desc"
      className="h-auto w-full rounded-[16px] border border-rock/20 bg-snow"
    >
      <title id="map-title">TMB 2027 12개 Day 개요 지도 (개략 위치)</title>
      <desc id="map-desc">{desc}</desc>

      <text x={PAD} y={H - 24} fontSize={13} fill="#56616A">
        개략 위치 · 공식 지도 아님 · 거리·시간은 Day 카드 기준
      </text>
      <text x={W * 0.18} y={H * 0.86} fontSize={22} fontWeight={700} fill="#56616A" opacity={0.35}>
        FR
      </text>
      <text x={W * 0.6} y={H * 0.78} fontSize={22} fontWeight={700} fill="#56616A" opacity={0.35}>
        IT
      </text>
      <text x={W * 0.8} y={H * 0.2} fontSize={22} fontWeight={700} fill="#56616A" opacity={0.35}>
        CH
      </text>

      {segments.map((s) => (
        <path key={s.dayId} data-segment={s.trekDayNumber} d={segmentPath(s, byId)} stroke={s.color} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ))}

      {nodes.map((n) => {
        const p = byId.get(n.id);
        return p ? <Marker key={n.id} node={n} x={p.x} y={p.y} /> : null;
      })}

      {segments.map((s) => {
        const p = labelPos(s.nodeIds);
        return (
          <g key={`label-${s.dayId}`}>
            <rect x={p.x + 8} y={p.y - 20} width={30} height={18} rx={9} fill={s.color} />
            <text x={p.x + 23} y={p.y - 7} fontSize={11} fontWeight={700} fill="#fff" textAnchor="middle">
              D{s.trekDayNumber}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
