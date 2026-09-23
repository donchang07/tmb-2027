export type ParsedMapUrl = {
  origin: string | null;
  destination: string | null;
  waypoints: string | null;
  travelmode: string | null;
  api: string | null;
};

const EMPTY: ParsedMapUrl = { origin: null, destination: null, waypoints: null, travelmode: null, api: null };

export function parseMapUrl(url: string): ParsedMapUrl {
  try {
    const u = new URL(url);
    const p = u.searchParams;
    return {
      origin: p.get("origin"),
      destination: p.get("destination"),
      waypoints: p.get("waypoints"),
      travelmode: p.get("travelmode"),
      api: p.get("api"),
    };
  } catch {
    return EMPTY;
  }
}

export function isValidWalkingMapUrl(url: string): boolean {
  const p = parseMapUrl(url);
  return p.api === "1" && !!p.origin && !!p.destination && p.travelmode === "walking";
}

// Design Ref: day-detail Act-3 — Google 도보 그래프에는 고개 구간 등산로가 없어 도로로 우회한다(D4 94 km·D7 233 km·D9 45 km·D10 113 km).
// GraphHopper hike 프로파일(OSM 등산로, sac_scale 반영)은 12개 Day 모두 실제 산길로 계산된다(2026-09-18 실측).
export const TRAIL_ROUTER_BASE = "https://graphhopper.com/maps/";

export function buildTrailUrl(points: readonly { lat: number; lon: number }[]): string | undefined {
  if (points.length < 2) return undefined;
  const qs = points.map((p) => `point=${p.lat}%2C${p.lon}`).join("&");
  return `${TRAIL_ROUTER_BASE}?${qs}&profile=hike&layer=OpenStreetMap`;
}

export function parseTrailUrl(url: string): { points: { lat: number; lon: number }[]; profile: string | null } {
  try {
    const u = new URL(url);
    const points = u.searchParams
      .getAll("point")
      .map((v) => v.split(",").map(Number))
      .filter((a): a is [number, number] => a.length === 2 && a.every((n) => Number.isFinite(n)))
      .map(([lat, lon]) => ({ lat, lon }));
    return { points, profile: u.searchParams.get("profile") };
  } catch {
    return { points: [], profile: null };
  }
}

export function isValidTrailUrl(url: string): boolean {
  const p = parseTrailUrl(url);
  return url.startsWith(TRAIL_ROUTER_BASE) && p.profile === "hike" && p.points.length >= 2;
}
