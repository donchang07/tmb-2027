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
          <polygon
            points={`${x},${y - 12} ${x - 11},${y + 8} ${x + 11},${y + 8}`}
            fill="#E3A43B"
            stroke="#17281F"
            strokeWidth={2}
            strokeLinejoin="round"
          />
        </g>
      );
    case "lodging":
      return (
        <g data-marker="lodging">
          <title>{title}</title>
          <circle cx={x} cy={y} r={7} fill="#fff" stroke="#17281F" strokeWidth={3} />
        </g>
      );
    case "start":
    case "finish":
      return (
        <g data-marker={node.kind}>
          <title>{title}</title>
          <rect x={x - 7} y={y - 7} width={14} height={14} transform={`rotate(45 ${x} ${y})`} fill="#17281F" stroke="#fff" strokeWidth={1.5} />
        </g>
      );
    case "town":
      return (
        <g data-marker="town">
          <title>{title}</title>
          <circle cx={x} cy={y} r={4.5} fill="#fff" stroke="#5C6B61" strokeWidth={1.5} />
        </g>
      );
    default:
      return (
        <g data-marker="waypoint">
          <title>{title}</title>
          <circle cx={x} cy={y} r={3} fill="#5C6B61" />
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
    <figure className="card p-2 sm:p-4">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="map-title map-desc" className="block h-auto w-full">
        <title id="map-title">TMB 2027 12개 Day 개요 지도 (개략 위치)</title>
        <desc id="map-desc">{desc}</desc>

        <rect width={W} height={H} rx={10} fill="#F3F6F1" />
        <text x={24} y={H - 22} fontSize={13} fill="#56655B">
          개략 위치 · 공식 지도 아님 · 거리·시간은 Day 카드 기준
        </text>
        <text x={W * 0.18} y={H * 0.86} fontSize={44} fontWeight={800} fill="#DCE2DA">
          FR
        </text>
        <text x={W * 0.6} y={H * 0.78} fontSize={44} fontWeight={800} fill="#DCE2DA">
          IT
        </text>
        <text x={W * 0.8} y={H * 0.2} fontSize={44} fontWeight={800} fill="#DCE2DA">
          CH
        </text>

        {segments.map((s) => (
          <path
            key={s.dayId}
            data-segment={s.trekDayNumber}
            d={segmentPath(s, byId)}
            stroke={s.color}
            strokeWidth={7}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {nodes.map((n) => {
          const p = byId.get(n.id);
          return p ? <Marker key={n.id} node={n} x={p.x} y={p.y} /> : null;
        })}

        {segments.map((s) => {
          const p = labelPos(s.nodeIds);
          return (
            <g key={`label-${s.dayId}`}>
              <rect
                x={p.x + 12}
                y={p.y - 26}
                width={32}
                height={20}
                rx={6}
                fill="#fff"
                stroke={s.color}
                strokeWidth={2}
              />
              <text x={p.x + 28} y={p.y - 12} fontSize={12} fontWeight={700} fill="#17281F" textAnchor="middle">
                D{s.trekDayNumber}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
