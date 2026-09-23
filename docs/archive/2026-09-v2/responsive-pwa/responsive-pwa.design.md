# Design — responsive-pwa

> feature: responsive-pwa · Plan: `docs/01-plan/responsive-pwa.plan.md` · 의존: itinerary-core, day-detail
> 작성일: 2026-09-16 · 상태: approved (L4 auto)

## 1. 파일
```
public/sw.js                              Service Worker (plain JS, 빌드 불필요)
src/lib/sw-rules.ts                       SW 라우팅 규칙 순수 함수 (sw.js와 동일 로직, unit test 대상)
src/lib/cache-manifest.ts                 클라이언트에서 CacheManifest 읽기
src/components/pwa/SwRegister.tsx         (client) SW 등록
src/components/pwa/OfflineBanner.tsx      (client) 오프라인 배너 + 마지막 갱신 시각
src/app/offline/page.tsx                  캐시 없음 fallback
src/app/layout.tsx                        SwRegister + OfflineBanner 삽입
src/app/globals.css                       반응형 보정
tests/unit/sw-rules.test.ts
tests/e2e/responsive.spec.ts, tests/e2e/offline.spec.ts
```

## 2. 캐시 전략 (`public/sw.js`, I-002)

상수: `SW_VERSION = "tmb-2027-v1"`, 캐시 이름 `static-${v}`, `pages-${v}`, `manifest-${v}`. 프리캐시: `/offline`, `/manifest.webmanifest`, `/icons/icon-192.svg`, `/icons/icon-512.svg`.

| 요청 | 전략 |
|---|---|
| 비GET, `/api/*`, `/admin*`, `/auth/*`, `_next/webpack-hmr`, `__nextjs*`, `chrome-extension:` 등 | **bypass** (network-only, 캐시 안 함) |
| `/_next/static/*`, `/icons/*`, `/manifest.webmanifest`, `.svg/.png/.woff2` | **cache-first** (static) |
| `mode === "navigate"` (HTML 페이지) | **stale-while-revalidate**: 캐시 있으면 즉시 응답 + 백그라운드 fetch로 갱신, 없으면 network → 성공 시 캐시 저장(캐시 저장 실패는 try/catch로 무시, 응답에 영향 없음). network 실패 + 캐시 없음 → `/offline` 응답 |
| 기타 GET (RSC payload `?_rsc=`, 데이터) | **network-first**, 실패 시 캐시 |

- 페이지 캐시 저장 시 `CacheManifest` 갱신: `{ version, cachedAt(ISO), routes: { [pathname]: ISO }, sourceUpdatedAt }`을 `manifest-${v}` 캐시의 `/__cache-manifest` Request에 JSON Response로 저장.
- `activate`: 다른 버전 캐시 삭제, `clients.claim()`. `install`: `skipWaiting()`.
- 오프라인에서 캐시 페이지를 서빙하면 클라이언트에 `postMessage({ type: "offline_cache_served", url })`, 캐시 미스면 `{ type: "offline_cache_miss", url }`.

## 3. `src/lib/sw-rules.ts` (순수 함수, sw.js와 동일 규칙)
```ts
export const SW_VERSION = "tmb-2027-v1";
export const MANIFEST_CACHE = `manifest-${SW_VERSION}`; export const MANIFEST_KEY = "/__cache-manifest";
export const PRECACHE_URLS = ["/offline", "/manifest.webmanifest", "/icons/icon-192.svg", "/icons/icon-512.svg"];
export function shouldBypass(url: URL, method: string): boolean
export function isStaticAsset(url: URL): boolean
export type Strategy = "bypass" | "static" | "page" | "data";
export function classify(url: URL, method: string, mode: string): Strategy
```
sw.js는 번들 없이 배포되므로 동일 규칙을 복제 구현(주석으로 동기화 표시).

## 4. `src/lib/cache-manifest.ts`
```ts
export type CacheManifest = { version: string; cachedAt: string | null; routes: Record<string, string>; sourceUpdatedAt: string | null };
// MANIFEST_CACHE / MANIFEST_KEY 상수는 sw-rules.ts에서 import (sw.js와 동기화 대상)
export async function readCacheManifest(): Promise<CacheManifest | null>   // caches API 없으면 null
export function lastUpdatedFor(manifest: CacheManifest | null, pathname: string): string | null
```

## 5. 클라이언트 컴포넌트
### SwRegister
- `useEffect`(브라우저 API 등록 — 데이터 fetching 아님): `"serviceWorker" in navigator` → `navigator.serviceWorker.register("/sw.js", { scope: "/" })`. 렌더 없음.

### OfflineBanner
- 상태: `online`(navigator.onLine, `online/offline` 이벤트), `lastUpdated`(readCacheManifest → 현재 pathname)
- SW 메시지 수신: `offline_cache_served` → `logEvent("offline_cache_served","info")`, `offline_cache_miss` → warn
- 오프라인이면 상단 고정 배너(`role="status"`): “오프라인 · 마지막 갱신 {formatKoDateTime}” (없으면 “오프라인 · 마지막 갱신 기록 없음”) + “지도·예약 편집 등 온라인 전용 기능은 비활성입니다”
- 온라인이면 렌더 없음

## 6. `/offline` 페이지
- 정적. StatusNote(warn) “인터넷 연결 후 한 번 열어 주세요” + 재시도 버튼(`<a href="/">` 44px) + 비상 정보 카드(112 `tel:`, “숙박 연락은 Day 상세에서 확인”) + 마운트 시 `offline_cache_miss` 로그(OfflineBanner가 메시지로 처리하므로 페이지는 문구만).
- metadata title “오프라인 — TMB 2027”

## 7. 레이아웃 변경
- `layout.tsx`: `<body>` 최상단 `<OfflineBanner />`, 하단 `<SwRegister />`
- `globals.css`: `img, svg, video { max-width: 100%; height: auto }`, `table { width: 100% }`, `* { min-width: 0 }` 대신 `.card { min-width: 0 }`; `@media (max-width: 380px) { .text-4xl 대체 }` 불필요 — Hero h1 `text-4xl` 360px에서 줄바꿈 허용(`break-keep`)

## 8. 접근성·터치
- 독립 링크·버튼은 `.tap`(min 44×44) 또는 `h-14`; 카드 전체를 감싸는 블록 링크(DayCard·TravelDayCard)는 실측 높이(>44px)로 충족; 본문 인라인 링크(`linkify`)는 문장 흐름상 예외. 배지 등 비상호작용 요소 제외
- 색 대비: 알파인 블루 `#0F5D7A` on 설백 `#F7F8F5` = 6.9:1, 바위 회색 `#56616A` on white = 5.9:1 (AA 통과)

## 9. 테스트
### unit `tests/unit/sw-rules.test.ts`
- bypass: POST, `/api/bookings`, `/admin`, `/_next/webpack-hmr`
- static: `/_next/static/chunks/a.js`, `/icons/icon-192.svg`, `/manifest.webmanifest`
- page: navigate `/day/d2027-08-04`; data: GET `/itinerary?_rsc=abc`

### e2e `tests/e2e/responsive.spec.ts` (3 projects: 360×640, 768×1024, 1440×900)
- `/`, `/itinerary`, `/day/d2027-08-04`, `/budget`: `document.documentElement.scrollWidth <= window.innerWidth`
- 내비·주요 링크 bounding box ≥ 44×44 (nav a, main a.tap, button)
- axe (`@axe-core/playwright`) critical/serious 위반 0
- `/budget`: `tbody tr` 9, `tfoot tr` 3

### e2e `tests/e2e/offline.spec.ts` (chromium)
- `/`, `/itinerary`, `/day/d2027-08-04` 방문 → SW 준비 대기 → `context.setOffline(true)` → `/day/d2027-08-04` 재방문: h1 표시, 숙박 원어명, “오프라인 · 마지막 갱신” 배너
- 미방문 `/day/d2027-08-15` → `/offline` 문구 “인터넷 연결 후 한 번 열어 주세요”

## 10. Edge Case
| 상황 | 구현 |
|---|---|
| 네트워크 없음 | OfflineBanner “오프라인 · 마지막 갱신 시각”, 캐시 페이지 서빙, `offline_cache_served` |
| 캐시 없음 | `/offline` fallback, `offline_cache_miss` |
| 외부 지도·예약 링크 실패 | 외부 링크는 SW 범위 밖; Day 상세가 주소·연락 수단을 항상 표시 |
