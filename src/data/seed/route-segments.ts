import type { RouteSegment } from "@/lib/schema";

export const SEGMENT_COLORS = [
  "#0F5D7A",
  "#C84A36",
  "#2E7D32",
  "#6A1B9A",
  "#EF6C00",
  "#00838F",
  "#AD1457",
  "#558B2F",
  "#4527A0",
  "#B26A00",
  "#00695C",
  "#8E24AA",
] as const;

// trailViaIds: 산길 경로 링크(GraphHopper hike)의 경유지. 생략하면 nodeIds의 중간 노드 전부를 경유한다.
// 2026-09-18 실측: 3·4·7·11·12일은 중간 노드를 전부 경유시키면 등산로 밖으로 우회(21~34 km)하므로 주요 경유지 1곳(고개 또는 대표 지점)만 경유한다.
const seg = (n: number, date: string, nodeIds: string[], trailViaIds?: string[]): RouteSegment => ({
  dayId: `d2027-08-${date}`,
  trekDayNumber: n,
  nodeIds,
  ...(trailViaIds ? { trailViaIds } : {}),
  color: SEGMENT_COLORS[n - 1] ?? "#0F5D7A",
});

export const routeSegments: RouteSegment[] = [
  seg(1, "04", ["les-houches", "col-de-voza", "les-contamines"]),
  seg(2, "05", ["les-contamines", "nd-de-la-gorge", "nant-borrant", "la-balme"]),
  seg(3, "06", ["la-balme", "col-du-bonhomme", "col-croix-bonhomme", "col-des-fours", "mottets"], ["col-du-bonhomme"]),
  seg(4, "07", ["mottets", "col-de-la-seigne", "elisabetta", "lac-combal", "col-checrouit", "maison-vieille"], ["col-de-la-seigne"]),
  seg(5, "08", ["maison-vieille", "courmayeur", "bertone"]),
  seg(6, "09", ["bertone", "bonatti", "arnouvaz", "elena"]),
  seg(7, "10", ["elena", "grand-col-ferret", "la-peule", "la-fouly"], ["grand-col-ferret"]),
  seg(8, "11", ["la-fouly", "praz-de-fort", "issert", "champex-lac"]),
  seg(9, "12", ["champex-lac", "bovine", "col-de-la-forclaz", "trient"]),
  seg(10, "13", ["trient", "col-de-balme", "col-des-posettes", "posettes", "tre-le-champ"]),
  seg(11, "14", ["tre-le-champ", "aiguillette-argentiere", "lac-blanc", "la-flegere"], ["lac-blanc"]),
  seg(12, "15", ["la-flegere", "planpraz", "le-brevent", "bellachat", "chamonix"], ["le-brevent"]),
];
