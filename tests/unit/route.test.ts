import { describe, expect, it } from "vitest";
import { getElevationPoints, getMarkerSummary, getRouteNode, getRouteNodes, getRouteSegments, getSegmentForDay, projectNodes, segmentPath, TITLE_PASSES, validateRouteSeed } from "@/lib/route";
import { getDay, getTrekDays } from "@/lib/itinerary";

describe("route overview seed (FR-011, SC-009)", () => {
  it("validates and has 12 ordered segments mapped to trek days", () => {
    expect(validateRouteSeed()).toEqual({ ok: true });
    const segs = getRouteSegments();
    expect(segs).toHaveLength(12);
    segs.forEach((s, i) => {
      expect(s.trekDayNumber).toBe(i + 1);
      const day = getDay(s.dayId);
      expect(day?.type).toBe("trek");
      expect(day?.trekDayNumber).toBe(i + 1);
    });
    expect(new Set(segs.map((s) => s.color)).size).toBe(12);
  });

  it("segments are connected end-to-start and reference existing nodes", () => {
    const segs = getRouteSegments();
    for (let i = 0; i < segs.length; i++) {
      for (const id of segs[i]!.nodeIds) expect(getRouteNode(id), id).toBeDefined();
      if (i > 0) expect(segs[i]!.nodeIds[0]).toBe(segs[i - 1]!.nodeIds[segs[i - 1]!.nodeIds.length - 1]);
    }
    expect(segs[0]!.nodeIds[0]).toBe("les-houches");
    expect(segs[11]!.nodeIds[segs[11]!.nodeIds.length - 1]).toBe("chamonix");
  });

  it("has pass and lodging markers", () => {
    const nodes = getRouteNodes();
    const count = (k: string) => nodes.filter((n) => n.kind === k).length;
    expect(count("pass")).toBeGreaterThanOrEqual(10);
    expect(count("lodging")).toBe(11);
    expect(count("start")).toBe(1);
    expect(count("finish")).toBe(1);
  });
});

describe("marker completeness (FR-011, SC-009a)", () => {
  it("covers every C-3 title pass and 12 lodging markers", () => {
    const summary = getMarkerSummary();
    expect(summary.missingTitlePasses).toEqual([]);
    expect(summary.lodging).toBe(12);
    expect(TITLE_PASSES).toHaveLength(12);
    expect(summary.passes.length).toBeGreaterThanOrEqual(TITLE_PASSES.length);
  });

  it("places the added passes on Day 4 and Day 10 segments", () => {
    const segs = getRouteSegments();
    expect(segs[3]!.nodeIds).toContain("col-checrouit");
    expect(segs[9]!.nodeIds).toContain("col-des-posettes");
    expect(getRouteNode("col-checrouit")?.altitudeM).toBe(1956);
  });

  it("keeps Col des Posettes at 1,997 m on the Day 10 segment (FR-012)", () => {
    const day10 = getRouteSegments()[9]!;
    const node = day10.nodeIds.map((id) => getRouteNode(id)).find((n) => n?.nameOriginal === "Col des Posettes");
    expect(node?.altitudeM).toBe(1997);
    expect(node?.kind).toBe("pass");
  });

  it("projects nodes inside padding and builds SVG paths", () => {
    const nodes = getRouteNodes();
    const projected = projectNodes(nodes, 800, 620, 60);
    expect(projected).toHaveLength(nodes.length);
    for (const p of projected) {
      expect(Number.isNaN(p.x) || Number.isNaN(p.y)).toBe(false);
      expect(p.x).toBeGreaterThanOrEqual(60);
      expect(p.x).toBeLessThanOrEqual(740);
      expect(p.y).toBeGreaterThanOrEqual(60);
      expect(p.y).toBeLessThanOrEqual(560);
    }
    const byId = new Map(projected.map((p) => [p.id, p]));
    for (const s of getRouteSegments()) {
      const d = segmentPath(s, byId);
      expect(d.startsWith("M ")).toBe(true);
      expect(d.split(" L ").length).toBe(s.nodeIds.length);
    }
  });
});

describe("elevation points (FR-012, SC-009)", () => {
  it("every trek day has >= 3 points with start/end roles", () => {
    for (const day of getTrekDays()) {
      const pts = getElevationPoints(day);
      expect(pts.length, day.id).toBeGreaterThanOrEqual(3);
      expect(pts[0]?.role).toBe("start");
      expect(pts[pts.length - 1]?.role).toBe("end");
      pts.slice(1, -1).forEach((p) => expect(p.role).toBe("via"));
      pts.forEach((p, i) => expect(p.sequence).toBe(i + 1));
      expect(pts.filter((p) => p.altitudeM !== null).length).toBeGreaterThanOrEqual(3);
    }
  });

  it("pass days include a pass node and a via elevation point at or above 1,500 m", () => {
    const noPassDays = new Set([2, 5, 6, 8, 11]); // 회복일·계곡길·발코니 길(Day 6)·사다리/호수 구간(Day 11) — PRD 표에 고개 없음
    for (const day of getTrekDays()) {
      if (noPassDays.has(day.trekDayNumber ?? 0)) continue;
      const seg = getSegmentForDay(day.id);
      expect(seg, day.id).toBeDefined();
      const passes = seg!.nodeIds.map((id) => getRouteNode(id)).filter((n) => n?.kind === "pass");
      expect(passes.length, day.id).toBeGreaterThanOrEqual(1);
      const via = getElevationPoints(day).filter((p) => p.role === "via" && (p.altitudeM ?? 0) >= 1500);
      expect(via.length, day.id).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("trail route links (GraphHopper hike, day-detail Act-3)", () => {
  it("every trek day has a hike-profile link with origin, via and destination on route nodes", async () => {
    const { getTrailUrlForDay, getRouteSegments, getRouteNode } = await import("@/lib/route");
    const { isValidTrailUrl, parseTrailUrl } = await import("@/lib/map-url");
    for (const seg of getRouteSegments()) {
      const url = getTrailUrlForDay(seg.dayId);
      expect(url, seg.dayId).toBeDefined();
      expect(isValidTrailUrl(url!), seg.dayId).toBe(true);
      const { points } = parseTrailUrl(url!);
      const expectedIds = [seg.nodeIds[0], ...(seg.trailViaIds ?? seg.nodeIds.slice(1, -1)), seg.nodeIds[seg.nodeIds.length - 1]];
      expect(points.length, seg.dayId).toBe(expectedIds.length);
      expectedIds.forEach((id, i) => {
        const n = getRouteNode(id!);
        expect(points[i]?.lat, `${seg.dayId} ${id}`).toBe(n?.lat);
        expect(points[i]?.lon, `${seg.dayId} ${id}`).toBe(n?.lon);
      });
    }
  });

  it("Day 7 routes over Grand Col Ferret (45.8883, 7.0756)", async () => {
    const { getTrailUrlForDay } = await import("@/lib/route");
    expect(getTrailUrlForDay("d2027-08-10")).toContain("point=45.8883%2C7.0756");
  });
});
