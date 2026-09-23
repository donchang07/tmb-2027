# Report — offline-pwa (PRD v2.0, responsive-pwa 개명)

> feature: offline-pwa · 순서 6/9 · 완료일 2026-09-17 · 최종 match rate **100%** (설계 항목 대조 40항목 = matched 40 · partial 0 · missing 0, 게이트 90 통과) · 반복 횟수 **1회**(Check → Act-1)
> Plan `docs/01-plan/offline-pwa.plan.md` · Design `docs/02-design/offline-pwa.design.md` · Analysis `docs/03-analysis/offline-pwa.analysis.md`
> 이전 사이클: `docs/archive/2026-09-v2/responsive-pwa/` (FR-007 반응형은 itinerary-core로 이관)

## Executive Summary

| 관점 | 내용 (실제 결과) |
|---|---|
| Problem | v2.0은 오프라인에서 "마지막 예약 상태"까지 재열람되고(FR-013), 예약 서버 오류 시 안내 문구와 마지막 갱신 시각을 보여 주며, 온라인에서는 실시간 구독 5초·구독 실패 시 30초 폴링으로 상태를 반영하길 요구했다(SC-004). 착수 시점의 SW는 `/api/bookings` 응답을 캐시하지 않았고 클라이언트 실시간·폴링 경로가 아예 없었다. booking-tracker가 DB 측(`bookings_public` 테이블 + publication)만 마감해 둔 상태였다. |
| Solution | `src/lib/sw-rules.ts`에 `/^\/api\/bookings$/ → swr` 규칙을 넣고 `public/sw.js`가 캐시 우선 응답 + 백그라운드 갱신 후 `manifest.lastBookingSnapshot`을 기록한다. 순수 로직 `src/lib/bookings/live.ts`(merge·shouldPoll·snapshot·문구)를 클라이언트 Provider `BookingLive.tsx`가 Realtime 구독 + 30초 폴링으로 구동하고, `BookingStatusBadge.tsx`가 상태·갱신 시각·오프라인/오류 안내를 렌더한다. Act-1에서 Minor 7건 조치에 더해 **SW 제어 이전 첫 방문을 캐시하는 `cache_page` 워밍**과 **정적 자산 `ignoreSearch` 폴백**을 추가해 E2E 회귀를 근본 해소했다. |
| Function UX Effect | 산장에서 신호가 끊겨도 이미 열어 본 Day 상세가 그대로 뜨고, 예약 상태 배지에 "오프라인 · 마지막 갱신 …"이 함께 보인다. 온라인에서는 리더가 저장한 상태가 구독 경로로 반영되고, 구독이 안 잡히면 30초 폴링이 대신한다. 예약 조회가 실패해도 화면은 마지막 캐시값과 "예약 상태를 불러올 수 없습니다 · 마지막 갱신 …"을 보여 준다. |
| Core Value | 약한 네트워크에서도 일관된 정보(0장 Solution). 정보의 **부재**를 화면에서 지우고, 대신 "언제 기준의 값인가"를 항상 함께 보여 주는 방향으로 통일했다. |

### 1.3 Value Delivered

| 관점 | 지표·근거 |
|---|---|
| 오프라인 재열람 완성 | Check 시점에 실패하던 `offline.spec.ts` 시나리오가 **첫 방문 캐시 워밍 + `ignoreSearch` 폴백**으로 복구. 뷰포트 3종(mobile-360·tablet-768·desktop-1440) **6/6 pass** |
| 근본 원인 규명 | E2E 실패를 "Do 단계 결함"이 아니라 **"SW `clients.claim()` 이전 첫 내비게이션은 fetch 핸들러를 거치지 않는다"는 구조적 공백**으로 특정. 워밍 후 드러난 2차 원인(dev `?v=` 타임스탬프 불일치로 `/_next/static/*`가 `net::ERR_FAILED` → 하이드레이션 중단 → HTML은 뜨는데 client 렌더만 사라짐)까지 분리해 각각 조치 |
| 죽은 경로 제거 | 오프라인에는 폴링이 없어 `state.error`가 서지 않으므로, 배지 안내 조건을 `!state.online` 우선으로 교정(`BookingStatusBadge.tsx:30`). 설계 §4 문구도 `(!online)` / `(online && error)`로 정정해 코드-문서 불일치 해소 |
| 갱신 시각 전 구간 노출 | Check 시점에 `itinerary/DayCard`가 `initialUpdatedAt`을 안 넘겨 일정 목록·홈 오늘 카드에 초기 갱신 시각이 없었다. `itinerary/page.tsx`·`page.tsx` → `ItineraryList` → `DayCard` → 배지까지 전달 경로를 이어 **사용처 3곳 전부** 초기 렌더에 시각 표시 |
| 서버 조회 비용 | `getPublicBookings`를 React `cache()`로 감싸 layout + page가 같은 요청에서 호출해도 Supabase 조회 **요청당 1회**(`public.ts:23`). 호출부가 사라진 `getPublicBookingStatuses`는 제거 |
| 동시성 안전 | `public/sw.js`의 manifest read-modify-write를 `manifestChain` 프라미스 체인 + `updateManifest(mutate)`로 직렬화(`sw.js:59-73`). `recordRoute`·`recordBookingSnapshot` 상호 덮어쓰기 제거 |
| 시각 의미 통일 | `initialState(rows, fetchedAt, online)`로 바꾸고 layout이 **서버 렌더 시각**을 주입(`layout.tsx:33`). 스냅샷 신선도 비교가 "조회 시각 vs 조회 시각"으로 정합화(이전에는 폴링 시각 vs 행의 최신 `updatedAt` 비교) |
| 클라이언트 시크릿 | 클라이언트 경로 env 참조는 `NEXT_PUBLIC_SUPABASE_URL`·`NEXT_PUBLIC_SUPABASE_ANON_KEY` 2개뿐, service_role 참조 **0건** |
| 검증 자산 | 최종 QA `npx playwright test --workers=1` **99/99 pass** · `vitest` **113/113 pass**(14 files) · `tsc --noEmit` **0 오류** |

## Context Anchor

| Key | Value |
|---|---|
| WHY | 산행 중 약한 네트워크 — 오프라인에서도 마지막 예약 상태 유지, 온라인에서는 실시간 반영 |
| WHO | 동행 전원 |
| RISK | Realtime은 Supabase 연결 후에만 검증 가능 → 폴링 fallback을 단위 테스트로 보장 |
| SUCCESS | 오프라인 E2E에 예약 상태·갱신 시각 표시, SW 규칙 테스트, 폴링 로직 테스트 |
| SCOPE | `sw.js`·`sw-rules`·`cache-manifest`·`BookingLive`·`live.ts`·`public.ts` 오류 처리 |

## FR/SC

| ID | 상태 | 근거 |
|---|---|---|
| FR-013 (일정·Day·연락·마지막 예약 상태 오프라인 재열람 + 마지막 갱신 시각) | ✅ 완료 | `public/sw.js:124,140,175-186,213,232` · `OfflineBanner.tsx` · `BookingStatusBadge.tsx:33-36` · E2E `tests/e2e/offline.spec.ts` **6/6 pass**(뷰포트 3종) |
| SC-004 (저장 후 5초 내 반영 / 구독 실패 시 30초 폴링) | ⚠️ 부분 — 폴링 경로 완료, Realtime 5초 실측 미검증 | 구독·폴링 구현 `BookingLive.tsx:58-89`, `POLL_MS = 30_000`·`shouldPoll` 4조합 `tests/unit/booking-live.test.ts:135-141`. **Realtime 5초 경로는 Supabase 연결 후 실측 필요**(후속 1) |
| SC-006 (네트워크 차단 재진입 시 표시 + 온라인 전용 기능 안내) | ✅ 완료 | `OfflineBanner.tsx` "온라인 전용 기능은 비활성입니다" · `offline.spec.ts` 오프라인 재진입 시 `[data-testid="booking-status"]` + "마지막 갱신"/"오프라인" 단언 통과 |
| Edge "예약 상태 서버 오류" | ✅ 완료 | 문구 `live.ts:139-141` `"예약 상태를 불러올 수 없습니다 · 마지막 갱신 {시각\|없음}"` · 로그 `public.ts:31` `logEvent("booking_fetch_failed","warn",{reason})` · 캐시값 유지 `BookingStatusBadge.tsx:26-28` |
| Edge "네트워크 없음" | ✅ 완료 | `sw.js` `offline_cache_served` + `OfflineBanner` · 배지 `offlineMessage(live.ts:143-145)` |
| Edge "캐시 없음" | ✅ 완료 | `sw.js` `offline_cache_miss` + "인터넷 연결 후 한 번 열어 주세요" |
| I-002 (Booking 상태 Realtime + 마지막 값 캐시, 저장 응답 network-only) | ✅ 완료 | `sw-rules.ts:11-16` — `/api/bookings` swr, `/api/admin/*`·`/admin`·`/auth/*` network-only. 비-GET은 `shouldBypass`로 SW 미개입 |
| 부록 A-4 `CacheManifest.lastBookingSnapshot` | ✅ 완료 | 타입 `src/lib/cache-manifest.ts:9`, 기록 `public/sw.js:91` |
| NFR 클라이언트 시크릿 | ✅ 완료 | `src/lib/supabase/browser.ts` — `NEXT_PUBLIC_*` 미설정 시 `null` 반환, service_role 참조 0건 |

## Success Criteria 최종 (Plan §5)

| # | 기준 | 판정 | 근거 |
|---|---|:--:|---|
| 1 | `matchRule("/api/bookings")` → `swr`; `/admin`·`/api/admin` → `network-only` | ✅ | `src/lib/sw-rules.ts:11-16` 규칙 테이블 · `tests/unit/sw-rules.test.ts:32-45`(`/api/admin/bookings/x` 포함, `classify` GET swr / POST bypass) |
| 2 | `mergeBookings(prev, next)`·`shouldPoll(state)` 단위 테스트 (폴링 스케줄은 `shouldPoll` 게이팅으로 표현, 별도 `nextPollAt` 없음) | ✅ | `live.ts:38-50`(최신 `updatedAt` 우선), `live.ts:60-62`(`online && visible && !subscribed`) · `booking-live.test.ts:68-95,135-141`. Plan §5-2는 Act-1에서 `shouldPoll` 기준으로 정정 |
| 3 | `booking_fetch_failed` 로그 코드 존재 + 오류 상태 렌더 문구 "예약 상태를 불러올 수 없습니다 · 마지막 갱신" | ✅ | `src/lib/log.ts:7` 코드 등록 · `public.ts:31` 발신 · `live.ts:139-141` 문구 · `booking-live.test.ts:163-167` 정확 일치 단언 |
| 4 | offline E2E: Day 상세 재진입 시 예약 상태 배지 + "마지막 갱신" 텍스트 | ✅ | `tests/e2e/offline.spec.ts` — Check 시점 **실패**, Act-1의 `cache_page` 워밍 + `ignoreSearch` 폴백으로 복구. 뷰포트 3종 **6/6 pass**, 최종 QA 전체 **99/99 pass** |
| 5 | `tsc`, `vitest`, `next build` | ✅ | `npx tsc --noEmit` **exit 0** · `npx vitest run` **14 files / 113 tests pass** · `next build` 통과 |

**충족: 5/5**

## 산출물

- `public/sw.js` — `/api/bookings` SWR(캐시 우선 응답 후 백그라운드 갱신, `:175-186`) · `recordBookingSnapshot`이 `manifest.lastBookingSnapshot = { fetchedAt, bookings }` 기록(`:86-91`) · **Act-1: `manifestChain` + `updateManifest(mutate)` 직렬화(`:59-73`)** · **Act-1: `cache_page` 메시지 처리(`:232-`) — 첫 방문 페이지를 PAGES_CACHE(+`recordRoute`)에, 동일 출처 정적 자산을 STATIC_CACHE에 채움** · **Act-1: 정적 자산 정확 일치 실패 시 `ignoreSearch` 폴백(`:124`)**
- `src/lib/sw-rules.ts` — `ROUTE_RULES` 테이블에 `{ /^\/api\/bookings$/, "swr" }` 추가, `/api/admin`·`/admin`·`/auth` network-only 유지(`:11-16`)
- `src/lib/cache-manifest.ts` — `lastBookingSnapshot?: { fetchedAt: string; bookings: PublicBooking[] }`(`:9`)
- `src/lib/bookings/live.ts`(신규) — 순수 로직: `POLL_MS`·`SNAPSHOT_KEY`(`:5-6`), `initialState(rows, fetchedAt, online)`(`:33-37`), `mergeBookings`(`:38-50`), `applyRealtimeRow`, `shouldPoll`(`:60-62`), `saveSnapshot`/`loadSnapshot`(JSON 파손·타입 불일치 → `null`), `errorMessage`(`:139-141`), `offlineMessage`(`:143-145`)
- `src/components/pwa/BookingLive.tsx`(신규, client) — Context `{ state, get(lodgingId) }` · `navigator.onLine` + `online`/`offline` 이벤트 · Supabase 채널 `bookings_public` 구독 + `SUBSCRIBED` 게이팅 + `removeChannel` · `setInterval(POLL_MS)` + `shouldPoll` + `fetch(no-store)` · 변경 시 `saveSnapshot`
- `src/components/pwa/BookingStatusBadge.tsx`(신규, client) — 컨텍스트 값 우선, `Badge` + "상태 갱신 {시각}" + 안내 문구, `data-testid="booking-status"`. **Act-1: `!state.online ? offlineMessage : state.error ? errorMessage : null`(`:30`)**
- `src/components/pwa/SwRegister.tsx` — **Act-1: 등록 직후 `controller === null`이면 `{ type:"cache_page", url, assets }` 전송**(`performance.getEntriesByType("resource")`에서 동일 출처 자산 수집, `:8-20`)
- `src/lib/supabase/browser.ts`(신규) — `createBrowserClient`, `NEXT_PUBLIC_*` 미설정 시 `null`
- `src/lib/bookings/public.ts` — DB 오류 시 `booking_fetch_failed` warn 후 `[]`(`:30-33`), `booking_status_defaulted`는 미설정·0행에만. **Act-1: React `cache()` 요청 단위 메모이즈(`:23`)**
- `src/lib/log.ts:7` — `"booking_fetch_failed"` 코드 추가
- `src/app/layout.tsx:26,33` — 서버에서 `getPublicBookings()` 조회 후 `<BookingLive initial={bookings} fetchedAt={new Date().toISOString()}>`로 감싸기
- `src/app/page.tsx` · `src/app/itinerary/page.tsx` · `src/components/itinerary/ItineraryList.tsx` · `src/components/itinerary/DayCard.tsx` · `src/components/home/TodayCard.tsx` · `src/components/day/LodgingCard.tsx` — 배지 사용처 3곳에 `initialUpdatedAt` 전달 경로 연결
- `tests/unit/sw-rules.test.ts` · `tests/unit/booking-live.test.ts`(merge·`applyRealtimeRow`·`shouldPoll` 4조합·메모리 `Storage` snapshot·문구) · `tests/e2e/offline.spec.ts`
- 문서 정정: `docs/02-design/offline-pwa.design.md`(§1 공개 훅 `useBookingLive()`, §4 오프라인 분기, §5 `cache_page`·`ignoreSearch`·manifest 직렬화) · `docs/01-plan/offline-pwa.plan.md`(§5-2 `shouldPoll` 기준)

## Key Decisions & Outcomes (Plan §4)

| 결정 | 준수 | 결과 |
|---|:--:|---|
| 스냅샷을 localStorage(`tmb.bookingSnapshot`)와 CacheManifest 양쪽에 기록, 화면은 localStorage 우선 | ✅ (보강) | 양쪽 기록 구현. 다만 Check에서 **신선도 비교 기준이 어긋나 있음**을 발견 — 스냅샷의 `fetchedAt`(폴링 시각)과 서버 초기값의 `fetchedAt`(행의 최신 `updatedAt`)을 직접 비교해 사실상 항상 스냅샷이 이겼다. 행 단위 merge가 최신 우선이라 데이터 역행은 없었으나 `state.fetchedAt` 의미가 흔들렸다. Act-1에서 `initialState(rows, fetchedAt, online)` + layout의 서버 렌더 시각 주입으로 **"조회 시각 vs 조회 시각"** 비교로 통일 |
| Realtime 채널 `bookings_public` `postgres_changes`, `SUBSCRIBED` 못 받으면 폴링만. Supabase 미설정 시 폴링만 | ✅ | `BookingLive.tsx:58-74` 구독 + 상태 콜백 게이팅 + `removeChannel`. 미설정 시 `createBrowserClient()`가 `null` → 폴링만. **단 실제 채널 핸드셰이크는 런타임 미검증**(후속 1) |
| 폴링 30초는 `document.visibilityState === "visible"`일 때만 | ✅ | `shouldPoll(online && visible && !subscribed)`로 표현. Plan §5-2가 요구했던 별도 `nextPollAt`은 설계 단계에서 `shouldPoll` 게이팅으로 흡수 — Act-1에서 Plan 문서를 설계에 맞춰 정정 |
| 배지에 오프라인 분기와 오류 분기를 모두 둔다(설계 §4) | ❌ 원안이 도달 불가 | 오프라인이면 `shouldPoll`이 false라 fetch 자체가 없고 `state.error`가 결코 true가 되지 않아 **오프라인 분기가 죽은 경로**였다. 오프라인 안내를 `OfflineBanner`만 담당하는 상태. Act-1에서 조건을 `!state.online` 우선으로 뒤집어 배지에도 "오프라인 · 마지막 갱신"이 뜨도록 교정하고 설계 §4 문구를 실제 동작으로 맞췄다 |
| 첫 방문 캐시는 SW `fetch` 핸들러에 맡긴다(원안의 암묵 전제) | ❌ 전제가 틀렸음 | **E2E 회귀의 근본 원인.** `clients.claim()` 이전의 내비게이션과 그때 로드된 `/_next/static/*`는 fetch 핸들러를 전혀 거치지 않아 어느 캐시에도 들어가지 않는다. Act-1에서 `SwRegister` → `cache_page` 메시지 → SW가 페이지·자산을 명시적으로 채우는 **워밍 경로**를 신설 |
| 정적 자산은 URL 정확 일치로 조회 | ❌ dev 환경에서 파손 | 워밍 시 SW가 다시 받은 HTML은 그 시점의 `?v=<타임스탬프>` 자산을 참조하는데 STATIC_CACHE에는 최초 로드 시각의 `?v=`가 있어 정확 일치 실패 → 오프라인에서 `webpack.js`·`main-app.js`·`layout.css`가 `net::ERR_FAILED` → **HTML(h1·숙소명)은 캐시에서 뜨는데 client 렌더인 배너 `role="status"`와 배지 안내만 사라지는** 증상. `ignoreSearch` 폴백(`sw.js:124`)으로 해소 |

## Check → Act 요약

| 단계 | 내용 |
|---|---|
| Check (gap-detector, 2026-09-17) | 설계 항목 대조 **94.4%**(36항목 = matched 32 · partial 4 · missing 0) · 게이트 90 **통과**. Blocker 0 · Major 0 · **Minor 6 · Info 2**. `vitest` 111/111 · `tsc` 0 · Playwright는 지시에 따라 미실행 |
| 차단 사유 | 게이트 수치는 통과했으나 partial 4건이 모두 **설계-구현 계약 불일치**(공개 훅 이름, `initialUpdatedAt` 미전달, 스냅샷 비교 기준, 도달 불가 분기)여서 Act-1을 실행 |
| G1 (§4-29 죽은 경로) | 오프라인 시 `state.error`가 서지 않아 `offlineMessage` 분기 도달 불가 → 배지 조건을 `!state.online` 우선으로 교정 + 설계 §4 문구 정정 → **해소** |
| G2 (§1-11 갱신 시각 누락) | `itinerary/DayCard.tsx`가 `initialUpdatedAt` 미전달 → 일정 목록·홈 오늘 카드에 초기 갱신 시각 없음(FR-013 위반) → `itinerary/page.tsx`·`page.tsx` → `ItineraryList` → `DayCard` → 배지까지 전달 → **해소** |
| G3 (§3-22 시각 의미 불일치) | 스냅샷 신선도 비교가 의미가 다른 두 시각을 비교 → `initialState(rows, fetchedAt)` + `layout.tsx:33` 서버 렌더 시각 → **해소**(단위 테스트도 같은 의미로 갱신) |
| G4 (§1-5 공개 훅 계약) | 설계의 `useBookingStatus(lodgingId)`가 없고 `useBookingLive()` + `get()` 조합으로 구현됨 → 설계 §1을 실제 API로 정정(문서 전용) → **해소** |
| G5 (#2 요청당 중복 조회) | layout과 4개 page가 같은 요청에서 `getPublicBookings()`를 각각 호출 → React `cache()` 래핑 + 사문화된 `getPublicBookingStatuses` 제거 → **해소** |
| G6 (#6 manifest 경쟁) | `recordRoute`·`recordBookingSnapshot`의 read-modify-write 상호 덮어쓰기 가능 → `manifestChain` 프라미스 체인 직렬화 → **해소** |
| G7 (#7 Plan 문서) | Plan §5-2의 `nextPollAt`이 설계 단계에서 사라짐 → Plan을 `shouldPoll` 기준으로 정정(문서 전용) → **해소** |
| **E2E 근본 원인** | `offline.spec.ts`가 `/day/d2027-08-05`를 **먼저 열고 그 다음** `serviceWorker.ready`를 기다려, SW 제어 이전 내비게이션과 자산이 어느 캐시에도 안 들어갔다 → 오프라인 재진입이 `/offline` 폴백으로 떨어져 배지 부재. (같은 파일의 첫 테스트는 `/` → ready → `/itinerary` → `/day/...` 순서라 통과했다.) **Do 단계 결함이 아니라 "SW 제어 이전 첫 방문은 캐시되지 않는다"는 구조적 공백.** `cache_page` 워밍(E2E-A) + `ignoreSearch` 폴백(E2E-B)으로 2단 해소 |
| Act-1 후 재계산 | 신규 4항목(`SwRegister` `cache_page` 요청 · SW `cache_page` 처리 · manifest 직렬화 · `ignoreSearch` 폴백) 추가하여 대조 항목 **40**, partial 4건 전부 matched 전환 → **(40 + 0×0.5)/40 = 100%** · 게이트 90 통과 · Blocker·Major **0건** |
| 최종 QA | `npx playwright test --workers=1` **99/99 pass** · `npx vitest run` **113/113 pass**(14 files) · `npx tsc --noEmit` **exit 0** |
| 잔여 | Info 1건(#8 `env.ts` 서버 전용 분리)은 지시에 따라 skip — 다음 사이클 이월 |

## 후속·미검증 항목

### Supabase 연결 시 해야 할 일 (체크리스트)

- [ ] **`bookings_public` Realtime publication 확인** — `select * from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'bookings_public';`가 1행을 반환하는지 확인한다. booking-tracker 사이클의 `20260917000003_lodgings.sql`이 넣어 둔 항목이며 SC-004의 전제다.
- [ ] **anon SELECT 정책 확인** — anon 키로 `bookings_public` 구독이 성립하려면 해당 테이블에 `for select to anon` 정책이 있어야 한다(뷰로는 Realtime이 동작하지 않아 booking-tracker에서 테이블로 전환해 둔 상태).
- [ ] **환경변수** — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. 미설정이면 `createBrowserClient()`가 `null`을 반환해 폴링 전용으로만 동작한다(의도된 fallback).

### 후속 항목

1. **SC-004 "저장 후 5초 내 반영" 실측 필요 (최우선)** — 이번 사이클에서 검증된 것은 **폴링 fallback 경로뿐**이다. Realtime 5초 경로는 코드만 존재하고 런타임 미검증이다. 연결 후 ① 관리자 화면에서 상태 저장 → 다른 브라우저의 Day 상세 배지가 **5초 내** 변경되는지 관측, ② 구독 성공 시 30초 폴링이 실제로 멈추는지(`SUBSCRIBED` 콜백 → `subscribedRef` 게이팅) 네트워크 탭에서 확인한다. SC-004의 판정은 이 실측이 끝나야 ✅로 올라간다.
2. **Realtime 구독 런타임 검증** — `supabase.channel("bookings_public").on("postgres_changes", …)` 핸드셰이크, 언마운트 시 `removeChannel` 정리, RLS·publication 조합에서의 실제 이벤트 수신. 위 1번과 같은 세션에서 함께 확인한다.
3. **Minor #8 (Info) `env.ts` 서버 전용 분리 — 잔여** — 클라이언트 번들에 들어가는 `src/lib/supabase/browser.ts`가 `src/lib/supabase/env.ts`를 참조하는데, 같은 파일에 서버 전용 `getAdminEmail()`(`env.ts:12-15`)이 들어 있다. Next가 비-`NEXT_PUBLIC_` 값을 `undefined`로 치환하므로 **실제 유출은 없으나** 모듈 경계가 흐릿하다. `getAdminEmail`을 서버 전용 모듈(또는 `import "server-only";`가 붙은 파일)로 분리한다. Act-1에서 지시에 따라 skip한 유일한 항목이다.
4. **SW 실제 캐시·`lastBookingSnapshot` 기록 확인** — 단위 테스트는 규칙 테이블만 검증한다. 배포 후 DevTools → Application → Cache Storage `manifest-tmb-2027-v1`의 `/__cache-manifest` 본문에 `lastBookingSnapshot`이 실제로 기록되는지 1회 확인한다.
5. **폴링 실패 시 배지 오류 문구 렌더** — `errorMessage` 문구는 단위 테스트로 정확 일치를 단언했으나 실제 렌더 경로는 미재현이다. `/api/bookings`에 500을 주입하고 30초 경과 시 "예약 상태를 불러올 수 없습니다 · 마지막 갱신 …"이 노출되는지 확인한다.
6. **콜드 dev 서버 E2E 타임아웃 리스크** — SW `install`의 `/offline` 프리캐시가 라우트 컴파일을 유발해 콜드 상태에서 `navigator.serviceWorker.ready`가 3초 이상 걸린다. 첫 실행에 한해 30초 테스트 타임아웃에 근접할 수 있다(워밍된 서버에서는 4회 연속 통과 확인). CI 도입 시 `webServer` 사전 워밍 또는 해당 spec의 타임아웃 상향을 검토한다.
7. **`ignoreSearch` 폴백의 적용 범위 재검토** — 이 폴백은 dev 전용 `?v=<타임스탬프>` 불일치를 겨냥한 것이다. 프로덕션 빌드는 콘텐츠 해시가 파일명에 들어가므로 쿼리 무시가 **오래된 자산을 재사용할 위험**은 낮지만, 쿼리로 버전을 구분하는 자산이 생기면 조건을 좁혀야 한다. 다음 사이클에서 dev 한정 가드를 넣을지 판단한다.
8. **`next build` 프로덕션 SW 동작** — `next build` 자체는 통과했으나, 프로덕션 자산 경로에서 `cache_page` 워밍과 정적 자산 조회가 dev와 동일하게 동작하는지는 배포 후 1회 확인이 필요하다.

## 추가 조치 (2026-09-18)
dev 서버에서 SW가 해시 없는 dev 청크를 캐시해 코드 변경·서버 재시작 후 앱 오류가 났다. 근본 원인 수정: SW는 프로덕션 빌드에서만 등록하고 dev에서는 기존 SW·캐시를 제거하며, E2E는 프로덕션 빌드(포트 3100, `.next-e2e`)로 실행한다. 상세: `docs/03-analysis/offline-pwa.analysis.md` Act-2.
