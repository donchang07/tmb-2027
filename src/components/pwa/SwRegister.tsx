"use client";

import { useEffect } from "react";
import { shouldRegisterSw } from "@/lib/sw-rules";

// Design Ref: offline-pwa §5 — SW는 프로덕션 빌드에서만. dev에서는 이전 세션이 남긴 SW·캐시를 제거한다.
export function SwRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (!shouldRegisterSw(process.env.NODE_ENV)) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .then(() => ("caches" in window ? caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))) : undefined))
        .catch(() => {
          // 정리 실패는 치명적이지 않음
        });
      return;
    }

    // 새 SW가 제어권을 가져오면(배포 후) 이미 제어 중이던 탭만 1회 재로드해 HTML과 청크를 맞춘다
    const hadController = navigator.serviceWorker.controller !== null;
    let reloaded = false;
    const onControllerChange = () => {
      if (!hadController || reloaded) return;
      reloaded = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    // 제어 밖에서 로드된 첫 방문 페이지는 SW에 캐시를 요청한다(FR-013)
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        if (hadController) return;
        const worker = registration.installing ?? registration.waiting ?? registration.active;
        const assets = performance
          .getEntriesByType("resource")
          .map((e) => e.name)
          .filter((name) => name.startsWith(window.location.origin));
        worker?.postMessage({ type: "cache_page", url: window.location.href, assets });
      })
      .catch(() => {
        // 등록 실패는 치명적이지 않음(온라인 동작 유지)
      });

    return () => navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
  }, []);
  return null;
}
