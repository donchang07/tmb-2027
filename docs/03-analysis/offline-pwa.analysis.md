# Analysis — offline-pwa (PRD v2.0)

> feature: offline-pwa · Design: `docs/02-design/offline-pwa.design.md` · Plan: `docs/01-plan/offline-pwa.plan.md`
> 근거 PRD: `docs/PRD.md` v2.0 FR-013(L145) · SC-004(L171) · SC-006(L173) · Edge L193~195 · I-002(L332) · 부록 A-4 `CacheManifest`(L437)
> 작성일: 2026-09-17 · 단계: PDCA Check (gap 탐지)

## 결과

| 항목 | 값 |
|---|---|
| 대조 항목 수 | 36 (Design §1~§7) |
| matched | 32 |
| partial | 4 |
| missing | 0 |
| Match Rate | **(32 + 0.5×4) / 36 = 94.4%** |
| 게이트(≥90%) | **PASS** |
| `npx vitest run` | PASS — 14 files / 111 tests |
| `npx tsc --noEmit` | PASS — exit 0 |
| `npx playwright test` | 미실행(지시에 따름) |
| Blocker | 없음 |
| Major | 없음 |
| Minor(권장 조치) | 6 |

## 검증 근거

| 검증 | 명령 / 위치 | 결과 |
|---|---|---|
| 단위 테스트 | `npx vitest run` | 14 파일 111개 전부 통과, 1.27s |
| 타입 검사 | `npx tsc --noEmit` | 오류 0, exit 0 |
| SWR 규칙 | `tests/unit/sw-rules.test.ts:32-45` | `matchRule("/api/bookings")==="swr"`, `/api/admin/*`·`/admin`·`/auth/*` → `network-only`, `classify` GET swr / POST bypass |
| 폴링 4조합 | `tests/unit/booking-live.test.ts:135-141` | `POLL_MS===30_000`, online·visible·!subscribed 조합 4종 |
| 병합 규칙 | `tests/unit/booking-live.test.ts:68-95` | 최신 `updatedAt` 우선, 오래된 행 무시, `null updatedAt`은 신규 키에만 |
| 오류 문구 | `tests/unit/booking-live.test.ts:163-167` | `"예약 상태를 불러올 수 없습니다 · 마지막 갱신 없음"` 정확 일치 |
| 스냅샷 키 | `src/lib/bookings/live.ts:6` / 테스트 `:143-161` | `SNAPSHOT_KEY = "tmb.bookingSnapshot"` |
| 클라이언트 시크릿 | `grep -rn "process\.env\." src/components src/lib/supabase src/lib/bookings` | `NEXT_PUBLIC_SUPABASE_URL`·`NEXT_PUBLIC_SUPABASE_ANON_KEY` 외 없음, service_role 참조 0건 |
| SW manifest 기록 | `public/sw.js:70-82` | `recordBookingSnapshot`이 `manifest.lastBookingSnapshot = { fetchedAt, bookings }` 기록 |
| SSR 안전성 | `src/components/pwa/BookingLive.tsx:38,41,58,76` | `navigator`·`window`·`document` 접근이 모두 `useEffect` 내부, 초기 state는 서버 props로 산출 |

## 항목별 대조

### §1 파일

| # | 설계 항목 | 판정 | 근거 |
|---|---|---|---|
| 1 | `public/sw.js` — `/api/bookings` SWR + manifest 스냅샷 | matched | `public/sw.js:15,161-186,70-82` |
| 2 | `src/lib/sw-rules.ts` — 규칙 테이블 `{ /^\/api\/bookings$/, "swr" }` | matched | `src/lib/sw-rules.ts:11-16` |
| 3 | `src/lib/cache-manifest.ts` — `lastBookingSnapshot?` 타입 | matched | `src/lib/cache-manifest.ts:55` |
| 4 | `src/lib/bookings/live.ts` 신규 순수 로직 | matched | `src/lib/bookings/live.ts:1-146` |
| 5 | `BookingLive.tsx` — Provider + `useBookingStatus(lodgingId)` | **partial** | Provider·Context는 있으나 공개 훅 이름·시그니처가 `useBookingLive(): { state, get }` (`src/components/pwa/BookingLive.tsx:24-26`). 설계의 `useBookingStatus(lodgingId)` 미존재 |
| 6 | `BookingStatusBadge.tsx` client 배지 | matched | `src/components/pwa/BookingStatusBadge.tsx:115-136` |
| 7 | `src/lib/supabase/browser.ts` — 미설정 시 `null` | matched | `src/lib/supabase/browser.ts:5-9`, `src/lib/supabase/env.ts:1-6` |
| 8 | `public.ts` 오류 → `booking_fetch_failed` | matched | `src/lib/bookings/public.ts:30-33` |
| 9 | `log.ts` 코드 추가 | matched | `src/lib/log.ts:7` |
| 10 | `layout.tsx` — `<BookingLive initial={bookings}>` (서버 조회) | matched | `src/app/layout.tsx:26,33` |
| 11 | 배지 사용처 3곳(LodgingCard·DayCard·TodayCard) | **partial** | `LodgingCard.tsx:48`은 `initialUpdatedAt` 전달, `itinerary/DayCard.tsx:52`는 미전달 → 목록/홈(`TodayCard.tsx:60` 경유)에서 "상태 갱신 시각" 초기 렌더 누락 |
| 12 | 테스트 3종 파일 | matched | `tests/unit/sw-rules.test.ts`, `tests/unit/booking-live.test.ts`, `tests/e2e/offline.spec.ts` |

### §2 `live.ts`

| # | 설계 항목 | 판정 | 근거 |
|---|---|---|---|
| 13 | `Snapshot` / `LiveState` 타입 | matched | `live.ts:8-16` |
| 14 | `POLL_MS = 30_000` | matched | `live.ts:5` |
| 15 | `mergeBookings` — `updatedAt`이 더 새로운 행만 교체 | matched | `live.ts:42-50` (`isNewer` 26-30), 테스트 `booking-live.test.ts:68-95` |
| 16 | `applyRealtimeRow` | matched | `live.ts:52-62`, 미지정 status는 동일 객체 반환(테스트 `:111`) |
| 17 | `shouldPoll` — online && visible && !subscribed | matched | `live.ts:64-66` |
| 18 | `saveSnapshot(storage, s)` key `"tmb.bookingSnapshot"` | matched | `live.ts:6,112-120` |
| 19 | `loadSnapshot(storage)` | matched | `live.ts:122-138` (JSON 파손·타입 불일치 → `null`) |
| 20 | `errorMessage(fetchedAt)` 문구 | matched | `live.ts:140-142` — `예약 상태를 불러올 수 없습니다 · 마지막 갱신 {시각\|없음}` |

### §3 `BookingLive.tsx`

| # | 설계 항목 | 판정 | 근거 |
|---|---|---|---|
| 21 | Context `{ state, get(lodgingId) }` | matched | `BookingLive.tsx:19-26,95-98` |
| 22 | 마운트 시 `loadSnapshot` → 더 새로우면 병합 | **partial** | `BookingLive.tsx:41-46`. 비교식이 스냅샷의 `fetchedAt`(폴링 시각)과 서버 초기값의 `fetchedAt`(= 행의 최신 `updatedAt`, `live.ts:37`)을 직접 비교 → 의미가 다른 두 시각의 비교라 사실상 항상 스냅샷이 "더 새로움"으로 판정. 행 단위 `mergeBookings`가 최신 우선이라 데이터 역행은 없으나 `state.fetchedAt` 의미가 흔들림 |
| 23 | `navigator.onLine` + `online`/`offline` 이벤트 | matched | `BookingLive.tsx:45,48-55` (cleanup 포함) |
| 24 | Realtime `bookings_public` 구독 + `SUBSCRIBED` 게이팅 + `removeChannel` | matched | `BookingLive.tsx:58-74` |
| 25 | `setInterval(POLL_MS)` + `shouldPoll` + `fetch(no-store)` → merge / error | matched | `BookingLive.tsx:76-89` |
| 26 | 변경 시 `saveSnapshot` | matched | `BookingLive.tsx:91-93` |

### §4 `BookingStatusBadge.tsx`

| # | 설계 항목 | 판정 | 근거 |
|---|---|---|---|
| 27 | props `{ lodgingId, initialStatus, initialUpdatedAt }` | matched | `BookingStatusBadge.tsx:115-123` |
| 28 | 컨텍스트 값 우선 | matched | `BookingStatusBadge.tsx:124-127` |
| 29 | `error && !online` 오프라인 문구 / `error && online` `errorMessage` (tone warn) | **partial** | `BookingStatusBadge.tsx:128,134`. 분기 자체는 구현되었으나 (a) 오프라인 시 `shouldPoll`이 false라 fetch가 아예 없어 `state.error`가 true가 되지 않음 → `offlineMessage` 분기 도달 불가(사실상 죽은 경로), (b) tone은 `Badge tone="warn"`이 아니라 `text-amber-800` 텍스트로 표현 |
| 30 | `data-testid="booking-status"` | matched | `BookingStatusBadge.tsx:131` |

### §5 SW / §6 `public.ts` / §7 테스트

| # | 설계 항목 | 판정 | 근거 |
|---|---|---|---|
| 31 | `/api/bookings` 캐시 우선 응답 + 백그라운드 갱신 + manifest 기록 | matched | `public/sw.js:161-186` (`if (cached) return cached` 후 network promise 진행), `:70-82` |
| 32 | 나머지 규칙 유지(app-shell cache-first, 페이지 SWR, `/admin`·`/api/admin`·`/auth` network-only) | matched | `public/sw.js:10-19,38-45,107-158,188-198` |
| 33 | DB 오류 시 `booking_fetch_failed` warn 후 `[]`, `defaulted`는 미설정·0행에만 | matched | `src/lib/bookings/public.ts:22-38` |
| 34 | sw-rules 테스트 (`/api/bookings` swr, `/api/admin/bookings/x` network-only) | matched | `tests/unit/sw-rules.test.ts:32-45` |
| 35 | booking-live 테스트 (merge·applyRealtimeRow·shouldPoll 4조합·snapshot·errorMessage) | matched | `tests/unit/booking-live.test.ts:59-168`, 메모리 `Storage` 구현 `:19-39` |
| 36 | offline.spec 확장 (배지 존재 + "마지막 갱신"\|"오프라인") | matched | `tests/e2e/offline.spec.ts:27-41` (실행은 미수행) |

### PRD 직접 대조

| PRD 항목 | 상태 | 근거 |
|---|---|---|
| FR-013 오프라인 재열람 + 마지막 갱신 시각 | 코드상 충족 | `public/sw.js:116-186`, `OfflineBanner.tsx:59-64`, e2e `offline.spec.ts:15-22,33-38` (런타임 미검증) |
| SC-004 5초 내 반영 / 실패 시 30초 폴링 | 폴링 fallback만 검증 | `BookingLive.tsx:58-89`, 테스트 `booking-live.test.ts:135-141`. Realtime 5초 경로는 런타임 미검증 |
| SC-006 재진입 표시 + 온라인 전용 안내 | 코드상 충족 | `OfflineBanner.tsx:61-62` "온라인 전용 기능은 비활성입니다", e2e `:18-19` |
| Edge "예약 상태 서버 오류" | 충족 | 문구 `live.ts:140-142`, 로그 `public.ts:31`, 캐시값 유지 `BookingStatusBadge.tsx:126-127` |
| Edge "네트워크 없음" | 충족(배너 경로) | `OfflineBanner.tsx:61`, `sw.js:136` `offline_cache_served` |
| Edge "캐시 없음" | 충족 | `sw.js:142-144` `offline_cache_miss` + "인터넷 연결 후 한 번 열어 주세요" |
| I-002 Booking Realtime + 마지막 값 캐시, 저장 응답 network-only | 충족 | `sw-rules.ts:11-16`, `sw.js:14-19`, 비-GET은 `shouldBypass`로 SW 미개입(`sw.js:27`) |
| A-4 `CacheManifest.lastBookingSnapshot` | 충족 | 타입 `cache-manifest.ts:55`, 기록 `sw.js:76` |
| 클라이언트 시크릿 없음 | 충족 | 클라이언트 경로 env 참조는 `NEXT_PUBLIC_*` 2개뿐 |

## 지적과 조치 필요

| # | 심각도 | 지적 | 권장 조치 |
|---|---|---|---|
| 1 | Minor | 오프라인일 때 `shouldPoll`이 false라 fetch가 없고 `state.error`가 true가 되지 않아, `BookingStatusBadge.tsx:128`의 `offlineMessage` 분기가 실제로는 도달 불가한 죽은 경로다. 오프라인 안내는 `OfflineBanner`만 담당한다 | 배지 안내 조건을 `state.error \|\| !state.online`로 넓히거나, 배지에서 오프라인 분기를 제거하고 배너에 일임한다(둘 중 하나로 설계 §4 문구를 정정) |
| 2 | Minor | `src/app/layout.tsx:26`과 `src/app/day/[dayId]/page.tsx:41`(및 `travel/[dayId]/page.tsx:30`, `itinerary/page.tsx:25`, `page.tsx:20`)가 같은 요청에서 `getPublicBookings()`를 각각 호출 → Supabase 조회가 요청당 2회 이상 발생 | `getPublicBookings`를 React `cache()`로 감싸 요청 단위 메모이즈 |
| 3 | Minor | 설계 §1이 명시한 `useBookingStatus(lodgingId)` 훅이 없고 `useBookingLive()` + `get()` 조합으로 대체됨 | 얇은 `useBookingStatus(lodgingId)` 래퍼를 추가하거나 설계 문서를 실제 API로 정정 |
| 4 | Minor | `itinerary/DayCard.tsx:52`가 `initialUpdatedAt`을 넘기지 않아 일정 목록·홈 오늘 카드의 배지에는 초기 "상태 갱신 시각"이 표시되지 않는다(FR-013의 "마지막 갱신 시각") | `itinerary/page.tsx`·`page.tsx`가 `getPublicBookings()` 결과의 `updatedAt`을 내려 주고 `DayCard`에서 전달 |
| 5 | Minor | `BookingLive.tsx:44`의 스냅샷 신선도 비교가 "폴링 시각(스냅샷)" vs "행의 최신 updatedAt(서버 초기값)"이라 의미가 다른 두 값을 비교한다 | `initialState`가 `fetchedAt`에 서버 렌더 시각을 넣도록 바꾸거나, 스냅샷 비교를 행 단위 `updatedAt` 최대값 기준으로 통일 |
| 6 | Minor | `public/sw.js`의 `recordRoute`(58-68)와 `recordBookingSnapshot`(70-82)이 각각 manifest를 read-modify-write 한다. 동시 실행 시 한쪽 갱신이 덮어써질 수 있다 | manifest 갱신을 단일 직렬 큐(프라미스 체인)로 묶는다 |
| 7 | Info | Plan §5-2가 요구한 `nextPollAt` 단위 테스트는 해당 함수 자체가 설계 §2에서 빠지며 사라졌다(`shouldPoll`로 대체) | Plan 문서의 성공 기준 2를 설계에 맞춰 정정 |
| 8 | Info | 클라이언트 번들에 포함되는 `src/lib/supabase/browser.ts` → `src/lib/supabase/env.ts`에 서버 전용 `getAdminEmail()`(`env.ts:12-15`)이 같이 들어 있다. Next가 비-`NEXT_PUBLIC_` 값을 `undefined`로 치환하므로 유출은 없으나 경계가 흐릿하다 | `getAdminEmail`을 서버 전용 모듈로 분리 |

## 런타임 미검증 (Realtime·Supabase 연결 후)

| 항목 | 미검증 이유 | 연결 후 확인 방법 |
|---|---|---|
| SC-004 "저장 후 5초 내 반영" | Supabase Realtime 연결 필요 | 관리자 화면에서 상태 저장 → 다른 브라우저의 Day 상세 배지가 5초 내 변경되는지 관측 |
| `SUBSCRIBED` 콜백 → `subscribedRef` 게이팅 | 실제 채널 핸드셰이크 필요 | 구독 성공 시 30초 폴링이 중단되는지 네트워크 탭에서 확인 |
| `bookings_public` Realtime publication / RLS | DB 설정 의존 | `supabase_realtime` publication에 `bookings_public` 포함 여부, anon SELECT 정책 확인 |
| SW 실제 캐시·`lastBookingSnapshot` 기록 | 단위 테스트는 규칙 테이블만 검증 | 배포 후 DevTools → Application → Cache Storage `manifest-tmb-2027-v1` 의 `/__cache-manifest` 본문 확인 |
| offline E2E (`tests/e2e/offline.spec.ts`) | 본 분석에서 Playwright 미실행 | `npx playwright test tests/e2e/offline.spec.ts` (chromium) |
| `next build` (Plan §5-5) | 본 분석 범위 밖 | `npm run build`로 layout의 서버 조회·client 경계 검증 |
| 폴링 실패 시 배지 오류 문구 렌더 | 서버 오류 재현 필요 | `/api/bookings` 500 주입 후 30초 경과 시 "예약 상태를 불러올 수 없습니다 · 마지막 갱신 …" 노출 확인 |

## Act-1 반영 (2026-09-17)

### 조치 결과

| # | 조치 | 결과 |
|---|---|---|
| 1 | 배지 오프라인 분기를 `!state.online` 우선으로 변경(`BookingStatusBadge.tsx:30`) — 오프라인이면 `offlineMessage`, 온라인+오류면 `errorMessage`. 설계 §4 문구를 `(!online)` / `(online && error)`로 정정 | 완료 — 죽은 경로 해소, 오프라인 재진입 시 배지에도 "오프라인 · 마지막 갱신" 노출 |
| 2 | `getPublicBookings`를 React `cache()`로 감쌈(`src/lib/bookings/public.ts:23`). 호출부가 사라진 `getPublicBookingStatuses`는 제거 | 완료 — layout + page가 같은 요청에서 호출해도 Supabase 조회 1회 |
| 3 | 설계 §1을 실제 API `useBookingLive()` → `{ state, get(lodgingId) }`로 정정(문서 전용) | 완료 |
| 4 | `itinerary/page.tsx`·`page.tsx`가 `getPublicBookings()`의 `updatedAt`을 내려 주고 `ItineraryList`/`TodayCard` → `DayCard` → 배지 `initialUpdatedAt`까지 전달 | 완료 — 일정 목록·홈 오늘 카드에도 초기 "상태 갱신 시각" 표시 |
| 5 | `initialState(rows, fetchedAt, online)`로 변경하고 layout이 서버 렌더 시각을 넘김(`layout.tsx:33`). 스냅샷 비교가 "조회 시각 vs 조회 시각"으로 통일 | 완료 — 단위 테스트 `booking-live.test.ts:60`도 같은 의미로 갱신 |
| 6 | `public/sw.js`에 `manifestChain` 프라미스 체인 + `updateManifest(mutate)` 도입, `recordRoute`·`recordBookingSnapshot`이 이를 경유 | 완료 — manifest read-modify-write 직렬화 |
| 7 | Plan §5-2의 `nextPollAt`을 `shouldPoll` 기준으로 정정(문서 전용) | 완료 |
| 8 | (지시에 따라 skip) `getAdminEmail` 서버 전용 분리 | 미조치 — 다음 사이클 이월 |
| E2E-A | 첫 방문 캐시 워밍: `SwRegister`가 등록 직후 `{ type:"cache_page", url, assets }` 메시지 전송, SW가 페이지(PAGES_CACHE + `recordRoute`)와 동일 출처 정적 자산(STATIC_CACHE)을 채움 | 완료 — `offline.spec.ts:37` 배지 노출 |
| E2E-B | `handleStatic`이 정확 일치 실패 시 `ignoreSearch` 폴백으로 재조회 | 완료 — dev `?v=` 타임스탬프 불일치로 끊기던 오프라인 하이드레이션 복구 |

### E2E 회귀 근본 원인

`offline.spec.ts:28`은 `/day/d2027-08-05`를 **먼저 열고 그 다음에** `serviceWorker.ready`를 기다린다. SW가 `clients.claim()`으로 제어를 잡기 전의 내비게이션과 그때 로드된 `/_next/static/*`는 `fetch` 핸들러를 전혀 거치지 않으므로 PAGES_CACHE·STATIC_CACHE 어디에도 들어가지 않았다. 따라서 오프라인 재진입은 `/offline` 폴백으로 떨어졌고 `[data-testid="booking-status"]`가 존재하지 않았다. (`offline.spec.ts:7-10`의 첫 테스트는 `/` → ready → `/itinerary` → `/day/...` 순서라 두 번째 이후 내비게이션이 이미 제어 상태였고, 그래서 통과했다.) 즉 Do 단계에서 바뀐 `OfflineBanner`·`BookingLive`·`cache-manifest`의 결함이 아니라, **"SW 제어 이전의 첫 방문은 캐시되지 않는다"는 구조적 공백**이 원인이다.

페이지 워밍을 넣자 두 번째 원인이 드러났다: 워밍 시 SW가 다시 받아 온 HTML은 그 시점의 `?v=<타임스탬프>` 자산을 참조하는데 STATIC_CACHE에는 최초 로드 시각의 `?v=`가 들어 있어 정확 일치에 실패했다(dev 전용 쿼리). 그 결과 오프라인에서 `webpack.js`·`main-app.js`·`layout.css`가 `net::ERR_FAILED`로 끊겨 하이드레이션이 중단됐고, **HTML(h1·숙소명)은 캐시에서 뜨는데 클라이언트 렌더인 배너 `role="status"`와 배지 안내만 사라지는** 증상이 나왔다. `ignoreSearch` 폴백으로 해소했다.

잔여 리스크: 콜드 dev 서버에서는 SW `install`의 `/offline` 프리캐시가 라우트 컴파일을 유발해 `navigator.serviceWorker.ready`가 3초 이상 걸린다. 첫 실행에 한해 30초 테스트 타임아웃에 근접할 수 있다(워밍된 서버에서는 4회 연속 통과 확인).

### 항목별 대조 재집계

| 대상 | Check 판정 | Act-1 판정 | 근거 |
|---|---|---|---|
| §1-5 `BookingLive` 공개 훅 | partial | matched | 설계 §1을 `useBookingLive()` → `{ state, get }`으로 정정 |
| §1-11 배지 사용처 3곳 | partial | matched | `DayCard.tsx:54`·`TodayCard.tsx:62`·`LodgingCard.tsx:48` 모두 `initialUpdatedAt` 전달 |
| §3-22 스냅샷 신선도 비교 | partial | matched | `live.ts:33` `initialState(rows, fetchedAt)` + `layout.tsx:33` 서버 렌더 시각 |
| §4-29 오프라인/오류 분기 | partial | matched | `BookingStatusBadge.tsx:30` `!online` 분기 도달 가능, 설계 §4 문구 일치(warn 색 텍스트) |
| §1-37 `SwRegister` cache_page 요청 (신규) | — | matched | `SwRegister.tsx:9-20` |
| §5-38 SW `cache_page` 처리 (신규) | — | matched | `public/sw.js:204-233` 페이지+자산 캐시, `recordRoute` 기록 |
| §5-39 manifest 기록 직렬화 (신규) | — | matched | `public/sw.js:59-73` |
| §5-40 정적 자산 `ignoreSearch` 폴백 (신규) | — | matched | `public/sw.js:124` |

| 항목 | 값 |
|---|---|
| 대조 항목 수 | 40 (Design §1~§7, Act-1에서 4항목 추가) |
| matched | 40 |
| partial | 0 |
| missing | 0 |
| Match Rate | **(40 + 0×0.5) / 40 = 100%** |
| 게이트(≥90%) | **PASS** |

### 검증 결과

| 검증 | 명령 | 결과 |
|---|---|---|
| 타입 검사 | `npx tsc --noEmit` | PASS — exit 0 |
| 단위 테스트 | `npx vitest run` | PASS — 14 files / 113 tests, 1.03s |
| E2E(지정) | `npx playwright test --project=desktop-1440 tests/e2e/offline.spec.ts tests/e2e/day-detail.spec.ts` | PASS — 5/5 |
| E2E(뷰포트 3종) | `npx playwright test tests/e2e/offline.spec.ts` | PASS — 6/6 (mobile-360·tablet-768·desktop-1440) |
| E2E(회귀) | `npx playwright test --project=desktop-1440 tests/e2e/packing.spec.ts tests/e2e/security.spec.ts` | PASS — 12/12 |

### 변경 파일

`public/sw.js` · `src/components/pwa/SwRegister.tsx` · `src/components/pwa/BookingLive.tsx` · `src/components/pwa/BookingStatusBadge.tsx` · `src/lib/bookings/live.ts` · `src/lib/bookings/public.ts` · `src/app/layout.tsx` · `src/app/page.tsx` · `src/app/itinerary/page.tsx` · `src/components/itinerary/ItineraryList.tsx` · `src/components/itinerary/DayCard.tsx` · `src/components/home/TodayCard.tsx` · `tests/unit/booking-live.test.ts` · `docs/02-design/offline-pwa.design.md` · `docs/01-plan/offline-pwa.plan.md`

## Act-2 반영 (2026-09-18, 런타임 결함 — 근본 원인 수정)
| 증상 | 근본 원인 | 조치 | 검증 |
|---|---|---|---|
| localhost dev에서 관리자 탭 진입 시 `Cannot read properties of undefined (reading 'call')`, 이후 홈까지 "Application error" | 서비스 워커가 **개발 서버**의 자산을 캐시했다. dev 청크(`/_next/static/chunks/app/layout.js` 등)는 파일명에 해시가 없어 코드가 바뀌면 캐시된 옛 청크가 새 HTML과 섞이고, 서버가 내려가면 캐시된 HTML이 없는 청크를 요청해 ChunkLoadError가 난다. 하이드레이션이 깨지면 SW를 갱신하는 `SwRegister`(청크 안)도 실행되지 못해 스스로 회복하지 못한다. | (1) `SwRegister`: `shouldRegisterSw(NODE_ENV)`가 참인 **프로덕션 빌드에서만** 등록, dev에서는 기존 SW·캐시를 제거. 배포 후 새 SW가 제어권을 잡으면 이미 제어 중이던 탭만 1회 재로드. (2) `layout.tsx`: dev 전용 인라인 스크립트(청크 무관)로 오염된 브라우저의 SW·캐시를 제거하고 제어 중이던 경우 1회 재로드. (3) `playwright.config.ts`: E2E를 `next build && next start -p 3100`(프로덕션)로 실행, `NEXT_DIST_DIR=.next-e2e`로 dev `.next`와 분리(`next.config.ts distDir`). (4) `sw.js`: v2로 캐시 버전 상향, 앞서 임시로 넣었던 localhost network-first·`ignoreSearch` 분기 제거. | `tsc` 0, `vitest` 115/115, 프로덕션 E2E 전체(아래 QA 갱신), dev 브라우저에서 SW 0개·캐시 0개 확인 후 홈·Day·관리자 정상 |
