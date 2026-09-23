# Design — itinerary-core

> feature: itinerary-core · Plan: `docs/01-plan/itinerary-core.plan.md`
> 작성일: 2026-09-16 · 상태: approved (L4 auto)

## 1. 아키텍처 개요

```
src/
  data/seed/
    trip.ts            Trip 1건
    days.ts            Day 15건 (travel 3 + trek 12)
    lodgings.ts        Lodging 12건
    travel-legs.ts     TravelLeg (8/3, 8/4 아침, 8/16, 8/17)
  lib/
    schema.ts          zod 스키마 + 타입 (Trip, Day, Lodging, TravelLeg, VerificationStatus)
    itinerary.ts       조회·합계·완전성 함수
    dates.ts           Europe/Paris 날짜 판정
    log.ts             구조화 로그 (Edge Case 로그 코드)
    format.ts          숫자·날짜 포맷 (ko-KR, tabular)
  components/
    layout/AppHeader.tsx, layout/BottomNav.tsx
    itinerary/DayCard.tsx, itinerary/TravelDayCard.tsx, itinerary/ItineraryList.tsx (client: 필터)
    home/Hero.tsx, home/TripMetrics.tsx, home/TodayCard.tsx, home/QuickLinks.tsx
    travel/LegTimeline.tsx
    ui/Badge.tsx, ui/StatusNote.tsx, ui/Skeleton.tsx, ui/ExternalLink.tsx
  app/
    layout.tsx, globals.css, page.tsx, loading.tsx, not-found.tsx
    itinerary/page.tsx, itinerary/loading.tsx
    travel/[dayId]/page.tsx
    day/[dayId]/page.tsx   (day-detail feature에서 구현)
```

Server Components 기본. 클라이언트 컴포넌트는 `ItineraryList`(필터 상태)만.

## 2. 데이터 계약 (`src/lib/schema.ts`)

```ts
export const VerificationStatus = z.enum(["confirmed", "researched", "estimated", "needs_check"]);
export const Country = z.enum(["FR", "IT", "CH", "KR"]);
export const DayType = z.enum(["travel", "trek"]);

export const RoutePointSchema = z.object({ nameKo: z.string(), nameOriginal: z.string(), altitudeM: z.number().nullable() });

export const DaySchema = z.object({
  id: z.string(),                       // "d2027-08-04"
  sequence: z.number().int().min(1).max(15),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: DayType,
  trekDayNumber: z.number().int().min(1).max(12).optional(), // trek만
  nameKo: z.string(), nameOriginal: z.string(),
  country: z.array(Country).min(1),
  distanceKm: z.number().optional(), gainM: z.number().optional(), lossM: z.number().optional(),
  duration: z.string().optional(),
  lunch: z.string().optional(),
  lodgingId: z.string().optional(),
  mapUrl: z.string().url().optional(),
  fallback: z.string().optional(),
  emergency: z.string().optional(),
  routePoints: z.array(RoutePointSchema).default([]),
  notes: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  sourceCheckedAt: z.string(),          // YYYY-MM-DD
  verificationStatus: VerificationStatus,
}).superRefine(trek 필수: distanceKm, gainM, lossM, duration, lunch, lodgingId, mapUrl, fallback, emergency, trekDayNumber);

export const LodgingSchema = z.object({
  id, nameOriginal, nameKo, location, country: Country, dayId,
  bookingChannel: z.enum(["portal", "own", "other"]),
  bookingUrl: z.string().url().nullable(),
  contactUrl: z.string().url().nullable(),
  verifiedPhone: z.string().nullable(),
  priceLow: z.number().nullable(), priceHigh: z.number().nullable(),
  currency: z.enum(["EUR", "CHF"]), season: z.string(), checkedAt: z.string(),
  alternative: z.string().nullable(),
  notes: z.string().optional(),
});

export const TravelLegSchema = z.object({
  id, dayId, sequence, mode: z.enum(["flight", "train", "bus", "walk", "transfer", "stay"]),
  originKo, originOriginal, destinationKo, destinationOriginal,
  departAt: z.string().nullable(), arriveAt: z.string().nullable(),  // "HH:mm" 현지
  duration: z.string(), bookingUrl: z.string().url().nullable(),
  fallback: z.string(), checkedAt: z.string(), verificationStatus: VerificationStatus,
  notes: z.string().optional(),
});

export const TripSchema = z.object({ id: z.literal("tmb-2027"), name, slogan, startDate, endDate, partySize: int>0,
  distanceKm: number, gainM: number, lossM: number, checkedAt, direction: z.literal("counterclockwise") });
// 수치(10 / 162.5 / 9610 / 9585)는 seed.test.ts에서 computeTotals 결과와 동일성으로 고정
```
TravelLeg `departAt/arriveAt`는 항상 `"HH:mm"` 현지 시각 또는 null. 익일 도착 등 부가 정보는 `notes`.
```
```

## 3. 조회 계층 (`src/lib/itinerary.ts`)

| 함수 | 시그니처 | 설명 |
|---|---|---|
| `getTrip()` | `() => Trip` | seed 검증 후 반환 (첫 조회 시 1회 `validateSeed`, lazy 플래그) |
| `getDays()` | `() => Day[]` | sequence 오름차순 |
| `getDay(id)` | `(id: string) => Day \| undefined` | |
| `getTrekDays()` | `() => Day[]` | type=trek 12건 |
| `getTravelDays()` | `() => Day[]` | type=travel 3건 |
| `getLodging(id)` | `(id: string) => Lodging \| undefined` | |
| `getLodgingForDay(day)` | `(day: Day) => Lodging \| undefined` | |
| `getTravelLegs(dayId)` | `(dayId: string) => TravelLeg[]` | sequence 순 |
| `computeTotals(days)` | `(days: Day[]) => { distanceKm, gainM, lossM }` | trek 합계, 소수 1자리 반올림 |
| `getMissingFields(day, lodging)` | `=> RequiredDayField[]` | FR-002 8필드 중 누락 키 목록 (`day_field_missing` 로그 대상) |
| `getContact(lodging)` | `=> { kind: "phone" \| "url" \| "none"; value }` | verifiedPhone → contactUrl → bookingUrl 우선순위 |
| `getLodgings()` | `() => Lodging[]` | 12건 |
| `getDaysWithLegs()` | `() => Day[]` | TravelLeg 보유 Day (8/3, 8/4, 8/16, 8/17) — `/travel/[dayId]` 정적 파라미터 |
| `validateSeed()` | `() => { ok: true } \| throws ZodError \| Error` | 빌드·테스트 시 전체 검증 (스키마 위반 → ZodError, 중복 id/date·lodgingId·dayId 참조 무결성 위반 → Error) |
| `REQUIRED_DAY_FIELDS` | `readonly [...]` | 8필드 상수 |

FR-002 8필드 정의: `distanceKm, gainM, lossM, duration, lunch, lodgingId, mapUrl, contact`(contact = lodging.verifiedPhone ?? lodging.contactUrl ?? lodging.bookingUrl; 전부 null이면 “확인 필요” 상태로 표시하되 누락으로 계산하지 않음 — SC-002 “값 또는 명시적 확인 필요 상태”).

## 4. 날짜 판정 (`src/lib/dates.ts`)

```ts
export const TRIP_TZ = "Europe/Paris";
export function toLocalDateISO(now: Date, tz = TRIP_TZ): string   // Intl.DateTimeFormat en-CA → YYYY-MM-DD
export type TodayState =
  | { kind: "in_trip"; day: Day }
  | { kind: "before"; daysUntil: number; firstDay: Day }
  | { kind: "after"; lastDay: Day }
  | { kind: "empty" };                                              // seed 비어있음 → 홈 오류 안내
export function resolveTodayState(days: Day[], todayISO: string): TodayState
export function daysBetween(aISO: string, bISO: string): number   // UTC 기준 일 수 차
export function formatKoDate(iso: string): string                  // "8월 4일 (수)"
export function formatKoDateTime(isoTimestamp: string): string    // ko-KR, Europe/Paris
export function isStale(checkedAtISO: string, todayISO: string, maxAgeDays: number): boolean
```
- `resolveTodayState`가 `before`/`after`를 반환하면 `logEvent("trip_date_outside", "info")`.

## 5. 로그 (`src/lib/log.ts`)

```ts
export type LogLevel = "info" | "warn" | "security";
export type LogCode = "trip_date_outside" | "day_field_missing" | "booking_status_defaulted" | "lodging_phone_unverified"
  | "external_link_failed" | "offline_cache_served" | "offline_cache_miss" | "lodging_unavailable" | "admin_auth_required"
  | "admin_forbidden" | "booking_conflict" | "unsaved_changes" | "budget_stale" | "journal_upload_rejected";
export function logEvent(code: LogCode, level: LogLevel, meta?: Record<string, unknown>): void
```
출력: `console.info/warn` 에 JSON 1줄 `{ ts, code, level, ...meta }`. 테스트 환경(`NODE_ENV=test`)에서는 무음.

## 6. 화면

### 6.1 홈 `/` (`src/app/page.tsx`)
- `Hero`: 그라디언트 배경(알파인 블루→설백), `<h1>걸어야 산다!</h1>`, 부제 “TMB 2027 · Tour du Mont-Blanc”
- `TripMetrics`: 4개 지표 — “2027-08-03 ~ 08-17”, “10명”, “약 162.5 km”, “약 9,610 m”. 값은 `getTrip()`과 `computeTotals()` 일치.
- `TodayCard`: `resolveTodayState(getDays(), toLocalDateISO(new Date()))`
  - in_trip → 해당 Day 카드(DayCard 또는 TravelDayCard) + “오늘” 배지, 링크 `/day/[id]` 또는 `/travel/[id]`
  - before → “출발까지 D-N”, 첫 일정 링크
  - after → “원정이 종료되었습니다”, 일정 요약 링크
- `QuickLinks`: 일정 `/itinerary`, 예산 `/budget`, 지도 `/map`, 준비물 `/packing` (각 44px 이상)
- 상태: `app/loading.tsx` skeleton; seed 비어있으면 `StatusNote` “일정 데이터를 불러올 수 없습니다”.
- `export const dynamic = "force-dynamic"` (오늘 판정은 요청 시각 기준)

### 6.2 전체 일정 `/itinerary`
- `ItineraryList` (client): props `days`, `lodgings`, `legsByDay`, `todayId`, `bookingStatuses?`, `missingByDay?`; 필터 탭 전체/이동/트레킹 (`role="tablist"`, 44px)
- `DayCard`(trek): 날짜, “Day N”, 구간 nameKo + nameOriginal(작게), 거리·획득·하강·시간, 숙박 원어명 + 공개 예약 상태 배지(기본 “미예약” — booking-tracker 연동 전까지 seed 기본), 국가 배지(🇫🇷 대신 텍스트 “FR/IT/CH”), 링크 `/day/[id]`
- `TravelDayCard`(travel): 날짜, “이동일”, 구간, 구간 수·주요 모드, 링크 `/travel/[id]`
- 오늘 카드 `aria-current="date"` + 강조 테두리, 기간 밖이면 상단 `StatusNote`로 D-N/종료 안내
- 빈 상태: “일정 없음”

### 6.3 이동일 상세 `/travel/[dayId]`
- `generateStaticParams` = travel day 3개 + 8/4(아침 이동 보유)
- 헤더: 날짜, nameKo/nameOriginal
- `LegTimeline`: 각 leg — 모드 아이콘 텍스트(항공/기차/버스/도보/이동/숙박), 출발→도착(Ko + Original), 출발/도착 시각(null이면 “시간 확인 필요”), 소요, 예매 링크(`target=_blank rel=noopener noreferrer`), 상태 배지(확정/조사/추정/재확인 필요), checkedAt
- fallback 박스: “지연 시 대안” — leg.fallback 나열
- 8/3(제네바), 8/16(취리히): 호텔 `stay` leg 포함. 8/17은 귀국 항공만.
- `notFound()` when dayId 없음 또는 legs 0건
- `travel/[dayId]/loading.tsx` skeleton

## 7. 공통 레이아웃
- `app/layout.tsx`: `<html lang="ko">`, metadata `{ title: "TMB 2027 — 걸어야 산다!", robots: { index: false, follow: false }, manifest: "/manifest.webmanifest" }`, viewport width=device-width + themeColor `#0F5D7A`, `AppHeader`(로고 텍스트 “TMB 2027”, sm 이상에서 보조 메뉴 일정·예산·지도·준비물·관리자), `<main className="mx-auto max-w-3xl px-4 pb-28">`, `BottomNav`(모바일 전용 하단 5탭 홈·일정·예산·지도·준비물, 각 `.tap` = min 44×44px)
- `next.config.ts`: 전 경로 `X-Robots-Tag: noindex, nofollow`(D-004 unlisted+noindex), `/sw.js` no-cache 헤더
- `app/not-found.tsx`: “페이지를 찾을 수 없습니다” + 홈 링크
- `globals.css`: Tailwind v4 `@import "tailwindcss"; @theme { --color-alpine: #0F5D7A; --color-snow: #F7F8F5; --color-rock: #56616A; --color-safety: #C84A36; --radius-card: 16px; }`, `html { overflow-x: hidden }`, `body { font-variant-numeric: tabular-nums }`

## 8. Seed 값 (부록 C 그대로)

Day id 규칙 `d2027-08-DD`. Lodging id: `gai-soleil, la-balme, mottets, maison-vieille, bertone, elena, edelweiss, plein-air, auberge-mont-blanc, la-boerne, la-flegere, chamonix-hotel`. 모든 12 trek Day `emergency` = “긴급 112 (유럽 공통) · 숙박 연락은 아래 숙박 카드 참고”. `verifiedPhone`는 전부 null(부록 B “전화번호 미수록”).
`app/manifest.ts`(Next Metadata Route)로 `/manifest.webmanifest` 제공: name/short_name/start_url "/"/display standalone/theme `#0F5D7A`/background `#F7F8F5`/icons `public/icons/icon-192.svg`, `icon-512.svg`.

## 8.1 예약 상태 연동 지점
- `src/lib/booking-status.ts`: `BOOKING_STATUSES`(unbooked|inquiry|waitlist|confirmed|alternative), `BOOKING_STATUS_LABEL`(미예약/문의/대기/확정/대안 확정), `isBookingStatus`
- `src/lib/bookings/public.ts`: `getPublicBookingStatuses(): Promise<Record<lodgingId, BookingStatus>>` — Supabase 미설정·오류 시 빈 객체 반환 + `booking_status_defaulted` info 로그 → 카드는 “미예약” 기본. (실제 테이블·RLS는 booking-tracker feature)
- `src/lib/supabase/env.ts`(`getSupabasePublicEnv`, `isSupabaseConfigured`, `getAdminEmail`), `src/lib/supabase/server.ts`(`createSupabaseServerClient`, `createSupabaseAnonClient`; env 없으면 `null`)

## 9. API Contract
서버 API 없음(정적 seed). 모듈 export만 §3·§4·§5·§8.1 표 그대로.

## 10. 테스트 (`tests/unit/`)
- `seed.test.ts`: 15일·정렬·중복 없음 / trek 12·travel 3 / 합계 162.5·9610·9585 / trek 8필드 완전성 / 병기 / lodging 12 + dayId 매핑 / travel days legs ≥ 1 & fallback 비어있지 않음 / zod 통과
- `dates.test.ts`: `toLocalDateISO` 2027-08-03T23:30Z → Paris 08-04(01:30) / 2027-08-02T21:59Z → 08-02, 22:00Z → 08-03 / `resolveTodayState` before(D-N)/in_trip/after
- `itinerary.test.ts`: `getMissingFields` 누락 계산, `computeTotals` 반올림

## 11. Edge Case 매핑
| 상황 | 구현 |
|---|---|
| 여행 기간 밖 | TodayCard before/after + `trip_date_outside` |
| Day 데이터 누락 | `getMissingFields` → 카드에 “이 항목은 확인 중입니다 · 기준일 {sourceCheckedAt}” + `day_field_missing` warn |
| 예약 상태 없음 | “미예약” 배지 기본 |

## 12. 완료 체크리스트
- [x] 스키마·seed·조회 함수
- [x] 홈·일정·이동일 상세 화면
- [x] 레이아웃·내비·전역 스타일
- [x] unit 테스트 3파일
- [x] typecheck 통과
