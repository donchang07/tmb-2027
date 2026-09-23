import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { BookingLive } from "@/components/pwa/BookingLive";
import { OfflineBanner } from "@/components/pwa/OfflineBanner";
import { SwRegister } from "@/components/pwa/SwRegister";
import { getPublicBookings } from "@/lib/bookings/public";

const DEV_SW_CLEANUP = `(function(){if(!('serviceWorker' in navigator))return;var sw=navigator.serviceWorker;var had=!!sw.controller;sw.getRegistrations().then(function(rs){return Promise.all(rs.map(function(r){return r.unregister();}));}).then(function(){return 'caches' in window?caches.keys().then(function(ks){return Promise.all(ks.map(function(k){return caches.delete(k);}));}):null;}).then(function(){if(had)location.reload();}).catch(function(){});})();`;

export const metadata: Metadata = {
  title: "TMB 2027 — 걸어야 산다!",
  description: "2027년 8월 3일~17일 성인 10명의 Tour du Mont-Blanc 원정 일정·산장·예산 공유",
  robots: { index: false, follow: false },
  applicationName: "TMB 2027",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "TMB 2027", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0F5D7A",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const bookings = await getPublicBookings();
  return (
    <html lang="ko">
      {process.env.NODE_ENV !== "production" ? (
        <head>
          {/* dev 전용: 이전 세션의 SW가 옛 청크를 서빙해 하이드레이션이 깨지면 SwRegister(청크 안)가 실행되지 못한다.
              청크와 무관한 인라인 스크립트로 SW·캐시를 제거하고, 제어 중이던 경우에만 1회 재로드한다. */}
          <script dangerouslySetInnerHTML={{ __html: DEV_SW_CLEANUP }} />
        </head>
      ) : null}
      <body className="min-h-dvh">
        <OfflineBanner />
        <AppHeader />
        <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-4">
          <BookingLive initial={bookings} fetchedAt={new Date().toISOString()}>
            {children}
          </BookingLive>
        </main>
        <BottomNav />
        <SwRegister />
      </body>
    </html>
  );
}
