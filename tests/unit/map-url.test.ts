import { describe, expect, it } from "vitest";
import { isValidWalkingMapUrl, parseMapUrl } from "@/lib/map-url";
import { getTrekDays } from "@/lib/itinerary";
import { getRouteNodes } from "@/lib/route";

describe("Google walking map URLs (FR-003)", () => {
  it("all 12 trek days have api=1, origin, destination, travelmode=walking", () => {
    for (const d of getTrekDays()) {
      expect(d.mapUrl, d.id).toBeDefined();
      const p = parseMapUrl(d.mapUrl!);
      expect(p.api, d.id).toBe("1");
      expect(p.origin?.length ?? 0, d.id).toBeGreaterThan(0);
      expect(p.destination?.length ?? 0, d.id).toBeGreaterThan(0);
      expect(p.travelmode, d.id).toBe("walking");
      expect(isValidWalkingMapUrl(d.mapUrl!), d.id).toBe(true);
      expect(d.mapUrl!.startsWith("https://www.google.com/maps/dir/")).toBe(true);
    }
  });

  it("waypoints are route-node coordinates inside the TMB bounding box (Google이 이름을 못 찾는 문제 방지)", () => {
    const nodes = getRouteNodes();
    for (const d of getTrekDays()) {
      const wp = parseMapUrl(d.mapUrl!).waypoints;
      expect(wp, d.id).toMatch(/^\d{2}\.\d+,\d\.\d+$/);
      const [lat = NaN, lon = NaN] = wp!.split(",").map(Number);
      expect(lat, d.id).toBeGreaterThan(45.6);
      expect(lat, d.id).toBeLessThan(46.2);
      expect(lon, d.id).toBeGreaterThan(6.6);
      expect(lon, d.id).toBeLessThan(7.2);
      const match = nodes.some((n) => Math.abs(n.lat - lat) < 1e-6 && Math.abs(n.lon - lon) < 1e-6);
      expect(match, `${d.id} waypoint ${wp} should equal a route node`).toBe(true);
    }
  });

  it("rejects invalid map URLs", () => {
    expect(isValidWalkingMapUrl("https://www.google.com/maps/dir/?api=1&origin=A&destination=B&travelmode=driving")).toBe(false);
    expect(isValidWalkingMapUrl("https://www.google.com/maps/dir/?api=1&destination=B&travelmode=walking")).toBe(false);
    expect(isValidWalkingMapUrl("https://www.google.com/maps/dir/?origin=A&destination=B&travelmode=walking")).toBe(false);
    expect(isValidWalkingMapUrl("not a url")).toBe(false);
    expect(parseMapUrl("not a url")).toEqual({ origin: null, destination: null, waypoints: null, travelmode: null, api: null });
  });
});

describe("safety fields (FR-014, SC-010)", () => {
  it("all 12 trek days have non-empty fallback and 112 in emergency", () => {
    for (const d of getTrekDays()) {
      expect(d.fallback?.trim().length ?? 0, d.id).toBeGreaterThan(0);
      expect(d.emergency ?? "", d.id).toContain("112");
    }
  });
});
