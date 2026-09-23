import { describe, expect, it } from "vitest";
import { classify, isStaticAsset, matchRule, PRECACHE_URLS, shouldBypass } from "@/lib/sw-rules";

const u = (p: string) => new URL(p, "http://localhost:3000");

describe("service worker routing rules (I-002, FR-013)", () => {
  it("bypasses non-GET, api, admin, auth and HMR", () => {
    expect(shouldBypass(u("/api/bookings"), "GET")).toBe(true);
    expect(shouldBypass(u("/admin"), "GET")).toBe(true);
    expect(shouldBypass(u("/admin/bookings"), "GET")).toBe(true);
    expect(shouldBypass(u("/auth/callback"), "GET")).toBe(true);
    expect(shouldBypass(u("/journal/d2027-08-04"), "GET")).toBe(true);
    expect(shouldBypass(u("/_next/webpack-hmr"), "GET")).toBe(true);
    expect(shouldBypass(u("/day/d2027-08-04"), "POST")).toBe(true);
    expect(shouldBypass(u("/day/d2027-08-04"), "GET")).toBe(false);
  });

  it("identifies static assets", () => {
    expect(isStaticAsset(u("/_next/static/chunks/a.js"))).toBe(true);
    expect(isStaticAsset(u("/icons/icon-192.svg"))).toBe(true);
    expect(isStaticAsset(u("/manifest.webmanifest"))).toBe(true);
    expect(isStaticAsset(u("/itinerary"))).toBe(false);
  });

  it("classifies navigations as page and RSC payload as data", () => {
    expect(classify(u("/day/d2027-08-04"), "GET", "navigate")).toBe("page");
    expect(classify(u("/itinerary?_rsc=abc"), "GET", "cors")).toBe("data");
    expect(classify(u("/_next/static/css/x.css"), "GET", "no-cors")).toBe("static");
    expect(classify(u("/api/admin/bookings/x"), "GET", "cors")).toBe("bypass");
  });

  it("matches route rules: bookings swr, admin/auth network-only (I-002)", () => {
    expect(matchRule("/api/bookings")).toBe("swr");
    expect(matchRule("/api/admin/bookings/x")).toBe("network-only");
    expect(matchRule("/admin")).toBe("network-only");
    expect(matchRule("/admin/bookings")).toBe("network-only");
    expect(matchRule("/auth/callback")).toBe("network-only");
    expect(matchRule("/day/d2027-08-05")).toBeNull();
  });

  it("classifies GET /api/bookings as swr and its POST as bypass", () => {
    expect(classify(u("/api/bookings"), "GET", "cors")).toBe("swr");
    expect(classify(u("/api/bookings"), "POST", "cors")).toBe("bypass");
    expect(classify(u("/api/bookings/x"), "GET", "cors")).toBe("bypass");
  });

  it("precaches offline page and manifest", () => {
    expect(PRECACHE_URLS).toContain("/offline");
    expect(PRECACHE_URLS).toContain("/manifest.webmanifest");
  });
});

describe("service worker registration policy (stale dev chunk 방지)", () => {
  it("registers only in production builds", async () => {
    const { shouldRegisterSw, SW_VERSION } = await import("@/lib/sw-rules");
    expect(shouldRegisterSw("production")).toBe(true);
    expect(shouldRegisterSw("development")).toBe(false);
    expect(shouldRegisterSw("test")).toBe(false);
    expect(shouldRegisterSw(undefined)).toBe(false);
    expect(SW_VERSION).toBe("tmb-2027-v3");
  });

  it("keeps public/sw.js version in sync and free of dev-only branches", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const sw = readFileSync(resolve(__dirname, "../../public/sw.js"), "utf8");
    expect(sw).toContain('const SW_VERSION = "tmb-2027-v3";');
    expect(sw).not.toContain("NETWORK_FIRST");
    expect(sw).not.toContain("ignoreSearch");
  });
});

describe("gpx downloads are cached as static assets", () => {
  it("classifies /gpx/*.gpx as static", () => {
    expect(isStaticAsset(new URL("http://localhost/gpx/tmb2027-day-07.gpx"))).toBe(true);
    expect(classify(new URL("http://localhost/gpx/tmb2027-day-07.gpx"), "GET", "no-cors")).toBe("static");
  });
});
