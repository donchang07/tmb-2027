import { z } from "zod";
import { buildTrailUrl } from "@/lib/map-url";
import { routeNodes } from "@/data/seed/route-nodes";
import { routeSegments, SEGMENT_COLORS } from "@/data/seed/route-segments";
import { RouteNodeSchema, RouteSegmentSchema } from "@/lib/schema";
import type { Day, ElevationPoint, RouteNode, RouteSegment } from "@/lib/schema";
import { getDay } from "@/lib/itinerary";

export { SEGMENT_COLORS };

// PRD 부록 C-3 Day 제목에 등장하는 고개 원어명 12개 — 개요 지도 마커 완전성 기준.
export const TITLE_PASSES = [
  "Col de Voza",
  "Col du Bonhomme",
  "Col de la Croix du Bonhomme",
  "Col des Fours",
  "Col de la Seigne",
  "Col Chécrouit",
  "Grand Col Ferret",
  "Col de la Forclaz",
  "Col de Balme",
  "Col des Posettes",
  "Aiguillette des Posettes",
  "Le Brévent",
] as const;

export type MarkerSummary = { lodging: number; passes: string[]; missingTitlePasses: string[] };

export function getMarkerSummary(nodes: RouteNode[] = getRouteNodes()): MarkerSummary {
  return {
    lodging: nodes.filter((n) => n.kind === "lodging" || n.kind === "finish").length,
    passes: nodes.filter((n) => n.kind === "pass").map((n) => n.nameOriginal),
    missingTitlePasses: TITLE_PASSES.filter((p) => !nodes.some((n) => n.nameOriginal === p)),
  };
}

let validated = false;

export function validateRouteSeed(): { ok: true } {
  if (validated) return { ok: true };
  z.array(RouteNodeSchema).parse(routeNodes);
  z.array(RouteSegmentSchema).parse(routeSegments);
  const ids = new Set(routeNodes.map((n) => n.id));
  if (ids.size !== routeNodes.length) throw new Error("duplicate route node id");
  if (routeSegments.length !== 12) throw new Error(`expected 12 segments, got ${routeSegments.length}`);
  routeSegments.forEach((s, i) => {
    if (s.trekDayNumber !== i + 1) throw new Error(`segment order mismatch at ${i}`);
    const day = getDay(s.dayId);
    if (!day || day.type !== "trek" || day.trekDayNumber !== s.trekDayNumber) throw new Error(`segment ${s.trekDayNumber} dayId mismatch`);
    for (const id of s.nodeIds) if (!ids.has(id)) throw new Error(`unknown node ${id} in segment ${s.trekDayNumber}`);
    for (const id of s.trailViaIds ?? []) {
      if (!s.nodeIds.slice(1, -1).includes(id)) throw new Error(`trailViaIds ${id} must be an intermediate node of segment ${s.trekDayNumber}`);
    }
  });
  validated = true;
  return { ok: true };
}

export function getRouteNodes(): RouteNode[] {
  validateRouteSeed();
  return routeNodes;
}

export function getRouteNode(id: string): RouteNode | undefined {
  return getRouteNodes().find((n) => n.id === id);
}

export function getRouteSegments(): RouteSegment[] {
  validateRouteSeed();
  return [...routeSegments].sort((a, b) => a.trekDayNumber - b.trekDayNumber);
}

export function getSegmentForDay(dayId: string): RouteSegment | undefined {
  return getRouteSegments().find((s) => s.dayId === dayId);
}

/** Day의 산길 경로 링크(GraphHopper hike): 출발 → trailViaIds(없으면 중간 노드 전부) → 도착 */
export function getTrailUrlForDay(dayId: string): string | undefined {
  const seg = getSegmentForDay(dayId);
  if (!seg) return undefined;
  const first = seg.nodeIds[0];
  const last = seg.nodeIds[seg.nodeIds.length - 1];
  if (!first || !last) return undefined;
  const viaIds = seg.trailViaIds ?? seg.nodeIds.slice(1, -1);
  const nodes = [first, ...viaIds, last].map((id) => getRouteNode(id)).filter((n): n is RouteNode => n !== undefined);
  return buildTrailUrl(nodes);
}

export function getElevationPoints(day: Day): ElevationPoint[] {
  const n = day.routePoints.length;
  return day.routePoints.map((p, i) => ({
    dayId: day.id,
    sequence: i + 1,
    label: p.nameOriginal,
    labelOriginal: p.nameOriginal,
    altitudeM: p.altitudeM,
    role: i === 0 ? "start" : i === n - 1 ? "end" : "via",
  }));
}

export type Projected = { id: string; x: number; y: number };

export function projectNodes(nodes: RouteNode[], width: number, height: number, padding: number): Projected[] {
  if (nodes.length === 0) return [];
  const meanLat = nodes.reduce((a, n) => a + n.lat, 0) / nodes.length;
  const k = Math.cos((meanLat * Math.PI) / 180);
  const xs = nodes.map((n) => n.lon * k);
  const ys = nodes.map((n) => -n.lat);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const scale = Math.min(innerW / (maxX - minX || 1), innerH / (maxY - minY || 1));
  const offsetX = padding + (innerW - (maxX - minX) * scale) / 2;
  const offsetY = padding + (innerH - (maxY - minY) * scale) / 2;
  return nodes.map((n, i) => ({
    id: n.id,
    x: Math.round((offsetX + ((xs[i] ?? 0) - minX) * scale) * 10) / 10,
    y: Math.round((offsetY + ((ys[i] ?? 0) - minY) * scale) * 10) / 10,
  }));
}

export function segmentPath(seg: RouteSegment, projectedById: Map<string, Projected>): string {
  return seg.nodeIds
    .map((id, i) => {
      const p = projectedById.get(id);
      if (!p) return "";
      return `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`;
    })
    .filter(Boolean)
    .join(" ");
}
