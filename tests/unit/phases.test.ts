import { describe, expect, it, vi } from "vitest";
import { QUICK_LINKS, RELEASED, visibleQuickLinks } from "@/lib/phases";

describe("quick link phase rules (8.1 / Edge)", () => {
  it("returns all 5 quick links when every phase is released", () => {
    const links = visibleQuickLinks();
    expect(links).toHaveLength(5);
    expect(links.map((l) => l.key)).toEqual(["itinerary", "budget", "map", "packing", "journal"]);
    expect(links.map((l) => l.href)).toEqual(["/itinerary", "/budget", "/map", "/packing", "/journal"]);
    expect(QUICK_LINKS.every((l) => l.label.length > 0 && l.desc.length > 0)).toBe(true);
  });

  it("hides an unreleased link and logs nav_hidden_by_phase once", () => {
    const log = vi.fn();
    const links = visibleQuickLinks({ ...RELEASED, journal: false }, log);
    expect(links).toHaveLength(4);
    expect(links.map((l) => l.key)).not.toContain("journal");
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith("nav_hidden_by_phase", "info", { key: "journal" });
  });
});
