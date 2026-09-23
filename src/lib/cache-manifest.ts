import { MANIFEST_CACHE, MANIFEST_KEY } from "@/lib/sw-rules";
import type { PublicBooking } from "@/lib/bookings/public";

export type CacheManifest = {
  version: string;
  cachedAt: string | null;
  routes: Record<string, string>;
  sourceUpdatedAt: string | null;
  lastBookingSnapshot?: { fetchedAt: string; bookings: PublicBooking[] };
};

export async function readCacheManifest(): Promise<CacheManifest | null> {
  if (typeof caches === "undefined") return null;
  try {
    const cache = await caches.open(MANIFEST_CACHE);
    const res = await cache.match(MANIFEST_KEY);
    if (!res) return null;
    const json: unknown = await res.json();
    if (typeof json !== "object" || json === null || !("routes" in json)) return null;
    return json as CacheManifest;
  } catch {
    return null;
  }
}

export function lastUpdatedFor(manifest: CacheManifest | null, pathname: string): string | null {
  if (!manifest) return null;
  return manifest.routes[pathname] ?? manifest.cachedAt ?? null;
}
