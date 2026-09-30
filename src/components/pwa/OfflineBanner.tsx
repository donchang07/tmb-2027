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
    <div role="status" className="bg-warn-bg text-sm leading-[1.45] text-warn-fg">
      <div className="mx-auto w-full max-w-[1200px] px-[18px] py-2.5 sm:px-10">
        <b>오프라인 · 마지막 갱신 {lastUpdated ? formatKoDateTime(lastUpdated) : "기록 없음"}</b>
        <span> · 지도·예약 편집 등 온라인 전용 기능은 비활성입니다.</span>
      </div>
    </div>
  );
}
