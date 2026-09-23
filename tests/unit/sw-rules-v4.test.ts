import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  classify,
  isCacheableResponse,
  NETWORK_FIRST_TIMEOUT_MS,
  pageStrategy,
  resolveNetworkFirst,
  SW_VERSION,
  USER_SCOPED_HEADER,
} from "@/lib/sw-rules";

const u = (p: string) => new URL(p, "http://localhost:3000");

function res(headers: Record<string, string>, ok = true, type = "basic") {
  const h = new Headers(headers);
  return { ok, type, headers: h };
}

describe("service worker v3 user-scoped cache isolation (DATA-012, I-025)", () => {
  it("① does not cache /day responses marked x-tmb-user-scoped: 1", () => {
    expect(USER_SCOPED_HEADER).toBe("x-tmb-user-scoped");
    expect(isCacheableResponse(res({ "x-tmb-user-scoped": "1" }))).toBe(false);
  });

  it("② caches /day responses without the header even with Cache-Control: no-store", () => {
    expect(isCacheableResponse(res({ "cache-control": "no-store" }))).toBe(true);
    expect(isCacheableResponse(res({}, false))).toBe(false);
    expect(isCacheableResponse(res({}, true, "opaqueredirect"))).toBe(false);
  });

  it("③ keeps GET /api/bookings on swr", () => {
    expect(classify(u("/api/bookings"), "GET", "cors")).toBe("swr");
  });

  it("④ uses network-first for /day and returns the network response when it arrives", () => {
    expect(pageStrategy("/day/d2027-08-04")).toBe("network-first");
    expect(resolveNetworkFirst("ok", true)).toBe("network");
    expect(resolveNetworkFirst("ok", false)).toBe("network");
  });

  it("⑤ serves the cached copy when offline", () => {
    expect(resolveNetworkFirst("error", true)).toBe("cache");
    expect(resolveNetworkFirst("error", false)).toBe("offline-fallback");
  });

  it("⑥ serves the cached copy after the 3 second timeout", () => {
    expect(NETWORK_FIRST_TIMEOUT_MS).toBe(3000);
    expect(resolveNetworkFirst("timeout", true)).toBe("cache");
    expect(resolveNetworkFirst("timeout", false)).toBe("wait-network");
  });

  it("treats /login and /signup as network-only and /packing as network-first", () => {
    expect(classify(u("/login"), "GET", "navigate")).toBe("network-only");
    expect(classify(u("/signup?next=/packing"), "GET", "navigate")).toBe("network-only");
    expect(classify(u("/login"), "POST", "cors")).toBe("bypass");
    expect(pageStrategy("/packing")).toBe("network-first");
    expect(pageStrategy("/itinerary")).toBe("cache-first");
    expect(pageStrategy("/")).toBe("cache-first");
  });

  it("keeps public/sw.js in sync with v3 rules", () => {
    const sw = readFileSync(resolve(__dirname, "../../public/sw.js"), "utf8");
    expect(SW_VERSION).toBe("tmb-2027-v3");
    expect(sw).toContain("tmb-2027-v3");
    expect(sw).toContain("USER_SCOPED_HEADER");
    expect(sw).toContain('"x-tmb-user-scoped"');
    expect(sw).toContain("clear_pages");
    expect(sw).toContain("/^\\/login$/");
    expect(sw).toContain("/^\\/signup$/");
    expect(sw).toContain("3000");
  });
});
