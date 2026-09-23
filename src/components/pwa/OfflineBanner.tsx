"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { lastUpdatedFor, readCacheManifest } from "@/lib/cache-manifest";
import { formatKoDateTime } from "@/lib/dates";
import { logEvent } from "@/lib/log";

export function OfflineBanner() {
  const pathname = usePathname();
  const [online, setOnline] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    const onMessage = (e: MessageEvent) => {
      const data: unknown = e.data;
      if (typeof data !== "object" || data === null || !("type" in data)) return;
      const type = (data as { type: unknown }).type;
      if (type === "offline_cache_served") logEvent("offline_cache_served", "info", { url: (data as { url?: unknown }).url });
      if (type === "offline_cache_miss") logEvent("offline_cache_miss", "warn", { url: (data as { url?: unknown }).url });
    };
    navigator.serviceWorker?.addEventListener("message", onMessage);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      navigator.serviceWorker?.removeEventListener("message", onMessage);
    };
  }, []);

  useEffect(() => {
    if (online) return;
    let cancelled = false;
    readCacheManifest().then((m) => {
      if (!cancelled) setLastUpdated(lastUpdatedFor(m, pathname));
    });
    return () => {
      cancelled = true;
    };
  }, [online, pathname]);

  if (online) return null;

  return (
    <div role="status" className="sticky top-0 z-40 bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">
      <span className="font-semibold">오프라인 · 마지막 갱신 {lastUpdated ? formatKoDateTime(lastUpdated) : "기록 없음"}</span>
      <span className="block text-xs">지도·예약 편집 등 온라인 전용 기능은 비활성입니다.</span>
    </div>
  );
}
