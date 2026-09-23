# Design — offline-pwa (PRD v2.0)

> feature: offline-pwa · Plan: `docs/01-plan/offline-pwa.plan.md` · 의존: booking-tracker
> 작성일: 2026-09-17 · 상태: approved (L4 auto)

## Context Anchor
| Key | Value |
|---|---|
| WHY | 약한 네트워크에서 마지막 예약 상태 유지, 온라인 실시간 반영 |
| WHO | 동행 전원 |
| RISK | Realtime 런타임 검증은 Supabase 연결 후 |
| SUCCESS | SWR 규칙·폴링 로직·오류 문구·offline E2E |
| SCOPE | sw·cache-manifest·BookingLive·live.ts·public.ts |

## 1. 파일
```
public/sw.js                              /api/bookings SWR + manifest.lastBookingSnapshot
src/lib/sw-rules.ts                       규칙 테이블에 { pattern: /^\/api\/bookings$/, strategy: "swr" }
src/lib/cache-manifest.ts                 lastBookingSnapshot?: { fetchedAt: string; bookings: PublicBooking[] }
src/lib/bookings/live.ts                  (신규) 순수 로직
src/components/pwa/BookingLive.tsx        (신규) Provider + useBookingLive() → { state, get(lodgingId) }
src/components/pwa/SwRegister.tsx         등록 직후 첫 방문 페이지·정적 자산 캐시 요청(cache_page 메시지)
src/components/pwa/BookingStatusBadge.tsx (신규) client 배지: 상태 + 갱신 시각 + 오류 문구
src/lib/supabase/browser.ts               (신규) createBrowserClient (NEXT_PUBLIC_* 없으면 null)
src/lib/bookings/public.ts                오류 → booking_fetch_failed
src/lib/log.ts                            + "booking_fetch_failed"
src/app/layout.tsx                        <BookingLive initial={bookings} fetchedAt={서버 렌더 시각}> 로 감싸기(초기값 서버 조회)
src/components/day/LodgingCard.tsx, itinerary/DayCard.tsx, home/TodayCard.tsx  → BookingStatusBadge 사용
tests/unit/sw-rules.test.ts, tests/unit/booking-live.test.ts, tests/e2e/offline.spec.ts
```

## 2. `live.ts`
```ts
export type Snapshot = { fetchedAt: string; bookings: PublicBooking[] };
export type LiveState = { bookings: Record<string, PublicBooking>; fetchedAt: string|null; source: "server"|"realtime"|"poll"|"snapshot"; error: boolean; online: boolean };
export const POLL_MS = 30_000;
export function mergeBookings(state, rows: PublicBooking[], source, at = new Date().toISOString()): LiveState   // updatedAt이 더 새로운 행만 교체
export function applyRealtimeRow(state, row: PublicRow): LiveState
export function shouldPoll(s: { online: boolean; visible: boolean; subscribed: boolean }): boolean  // online && visible && !subscribed
export function saveSnapshot(storage: Storage|null, s: LiveState): void   // key "tmb.bookingSnapshot"
export function loadSnapshot(storage: Storage|null): Snapshot|null
export function errorMessage(fetchedAt: string|null): string  // "예약 상태를 불러올 수 없습니다 · 마지막 갱신 {시각|없음}"
```

## 3. `BookingLive.tsx`
- Context `{ state, get(lodgingId) }`. 초기 `fetchedAt`은 layout이 넘긴 서버 렌더 시각(스냅샷·폴링의 조회 시각과 같은 의미). 마운트 시 `loadSnapshot`으로 fetchedAt이 더 새로우면 병합.
- `navigator.onLine`·`online/offline` 이벤트 → `state.online`.
- Realtime: `createBrowserClient()`가 있으면 채널 구독; 상태 콜백 `SUBSCRIBED`→`subscribed=true`, 그 외 false. 언마운트 시 `removeChannel`.
- 폴링: `setInterval(POLL_MS)`에서 `shouldPoll`이면 `fetch("/api/bookings", { cache: "no-store" })` → ok면 merge(source "poll"), 실패면 `error=true`.
- 변경 시 `saveSnapshot`.

## 4. `BookingStatusBadge.tsx`
props `{ lodgingId, initialStatus, initialUpdatedAt }`(사용처 3곳 모두 `initialUpdatedAt` 전달). 컨텍스트 값이 있으면 우선. 렌더: `Badge` + `상태 갱신 {formatKoDateTime}` + (`!online`) "오프라인 · 마지막 갱신 …" / (`online && error`) `errorMessage` (warn 색 텍스트). 오프라인에는 폴링이 없어 `error`가 서지 않으므로 오프라인 분기는 `online` 여부로 판정한다. 배지 `data-testid="booking-status"`.

## 5. SW (`public/sw.js`)
- 규칙: `/api/bookings` → cache-first 응답 후 백그라운드 갱신(SWR); 성공 시 manifest `lastBookingSnapshot = { fetchedAt: now, bookings }`.
- 나머지 규칙 유지(app-shell cache-first, 페이지 SWR, `/admin`·`/api/admin`·`/auth` network-only).
- manifest read-modify-write(`recordRoute`·`recordBookingSnapshot`)는 단일 프라미스 체인으로 직렬화해 상호 덮어쓰기를 막는다.
- `cache_page` 메시지: 첫 방문은 SW 제어 밖에서 로드되어 내비게이션·정적 자산이 fetch 핸들러를 거치지 않는다. 클라이언트가 등록 직후 현재 URL과 로드된 동일 출처 자산 목록을 보내면 SW가 페이지를 PAGES_CACHE(+`recordRoute`)에, 자산을 STATIC_CACHE에 채운다.
- SW 등록은 프로덕션 빌드에서만(`shouldRegisterSw`). dev 서버 청크는 해시가 없어 캐시하면 안 되며, dev에서는 `SwRegister`와 `layout.tsx`의 dev 전용 인라인 스크립트가 기존 SW·캐시를 제거한다. E2E는 프로덕션 빌드로 실행(`playwright.config.ts`, `.next-e2e`).

## 6. `public.ts`
DB 오류 시 `logEvent("booking_fetch_failed","warn",{reason})` 후 `[]` 반환(기존 defaulted 로그는 미설정·0행에만).

## 7. 테스트
- sw-rules: `/api/bookings` swr, `/api/admin/bookings/x` network-only
- booking-live: merge(최신 updatedAt 우선), applyRealtimeRow, shouldPoll 4조합, save/load snapshot(메모리 Storage), errorMessage 문구
- offline.spec: `/day/d2027-08-05` 방문 → offline → 재진입 → `[data-testid="booking-status"]` 존재 + "마지막 갱신" 또는 "오프라인" 텍스트
