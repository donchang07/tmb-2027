import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getGpxForDay, getGpxManifest, gpxLabel } from "@/lib/gpx";
import { getTrekDays } from "@/lib/itinerary";
import { getRouteSegments } from "@/lib/route";

const PUBLIC = path.resolve(__dirname, "../../public");

describe("day GPX downloads (day-detail Act-4)", () => {
  it("has one GPX per trek day whose file exists with a track and named waypoints", () => {
    const manifest = getGpxManifest();
    expect(manifest).toHaveLength(12);
    for (const day of getTrekDays()) {
      const g = getGpxForDay(day.id);
      expect(g, day.id).toBeDefined();
      const file = path.join(PUBLIC, g!.file);
      expect(existsSync(file), g!.file).toBe(true);
      const xml = readFileSync(file, "utf8");
      expect(xml.startsWith('<?xml version="1.0"')).toBe(true);
      expect(xml).toContain('<gpx xmlns="http://www.topografix.com/GPX/1/1"');
      expect(xml).toContain("<trkseg>");
      expect((xml.match(/<trkpt /g) ?? []).length, g!.file).toBe(g!.trackPoints);
      expect((xml.match(/<wpt /g) ?? []).length, g!.file).toBeGreaterThanOrEqual(3);
      expect(xml).toContain("OpenStreetMap contributors");
      expect(xml).toContain(`TMB 2027 Day ${day.trekDayNumber}`);
    }
  });

  it("uses the same via points as the trail link and stays within ±40% of the PRD distance", () => {
    for (const seg of getRouteSegments()) {
      const g = getGpxForDay(seg.dayId)!;
      const expected = [seg.nodeIds[0], ...(seg.trailViaIds ?? seg.nodeIds.slice(1, -1)), seg.nodeIds[seg.nodeIds.length - 1]];
      expect(g.viaNodeIds, seg.dayId).toEqual(expected);
      const day = getTrekDays().find((d) => d.id === seg.dayId)!;
      expect(g.lengthKm, seg.dayId).not.toBeNull();
      expect(g.lengthKm!, seg.dayId).toBeGreaterThan(day.distanceKm! * 0.6);
      expect(g.lengthKm!, seg.dayId).toBeLessThan(day.distanceKm! * 1.4);
    }
  });

  it("Day 7 track passes within 300 m of Grand Col Ferret", () => {
    const g = getGpxForDay("d2027-08-10")!;
    const xml = readFileSync(path.join(PUBLIC, g.file), "utf8");
    const pts = [...xml.matchAll(/<trkpt lon="([\d.]+)" lat="([\d.]+)"/g)].map((m) => ({ lon: Number(m[1]), lat: Number(m[2]) }));
    const col = { lat: 45.8883, lon: 7.0756 };
    const minM = Math.min(...pts.map((p) => Math.hypot((p.lat - col.lat) * 111_000, (p.lon - col.lon) * 77_000)));
    expect(minM).toBeLessThan(300);
    expect(gpxLabel(g)).toMatch(/^Day 7 · \d+\.\d km · \+\d+ m$/);
  });
});
