# Design — day-detail

> feature: day-detail · Plan: `docs/01-plan/day-detail.plan.md` · 의존: itinerary-core
> 작성일: 2026-09-16 · 상태: approved (L4 auto)

## 1. 파일 구조

```
src/
  lib/map-url.ts                     parseMapUrl, isValidWalkingMapUrl
  lib/linkify.tsx                    linkify(text) — 텍스트 내 URL을 새 창 링크로
  components/day/
    DayMetrics.tsx                   거리·획득·하강·시간 4지표
    RouteList.tsx                    출발·경유(고개)·도착 목록 (고도 표기)
    LodgingCard.tsx                  숙박: 원어명·한국어명·위치·가격·예약 링크·연락·공개 상태·대안
    MapLinkCard.tsx                  Google walking 링크 + “공식 등산 경로 아님” 안내
    SafetyCard.tsx                   우천·피로 대안, 112, 확인 기준일
    DayNav.tsx                       이전/다음 Day 링크
  app/day/[dayId]/page.tsx, loading.tsx
```

## 2. `src/lib/map-url.ts`

```ts
export type ParsedMapUrl = { origin: string | null; destination: string | null; waypoints: string | null; travelmode: string | null; api: string | null };
export function parseMapUrl(url: string): ParsedMapUrl          // URL + searchParams, 실패 시 전부 null
export function isValidWalkingMapUrl(url: string): boolean       // api=1 && origin && destination && travelmode=walking
```

## 3. 페이지 `/day/[dayId]` (`src/app/day/[dayId]/page.tsx`)

- `generateMetadata`: `Day N · nameKo — TMB 2027`
- 데이터: `getDay`, `getLodgingForDay`, `getMissingFields`, `getTrekDays`(이전/다음), `getPublicBookings()`(status + updatedAt), `getTravelLegs(dayId)`(Day 1 아침 이동 링크용). `getContact`는 LodgingCard 내부에서 호출.
- `dynamic = "force-dynamic"` (예약 상태는 요청 시 조회; 따라서 `generateStaticParams` 미사용 — 12개 라우트는 요청 시 렌더)
- 점심 텍스트의 URL은 `src/lib/linkify.tsx` `linkify(text): ReactNode[]`로 자동 링크화
- `notFound()`: day 없음 또는 type !== "trek"
- 구성 순서(8.3 체크리스트):
  1. 헤더: 날짜(formatKoDate), `Day N` 배지, 국가 배지, `nameKo` h1, `nameOriginal` (`lang={langFor(day.country)}` — `src/lib/format.ts` `langFor`: FR→fr, IT→it, CH→fr, KR→ko; 첫 국가 기준), 아침 이동 legs 있으면 `/travel/[id]` 링크 “아침 이동 보기”
  2. `DayMetrics`
  3. `RouteList` (routePoints: 첫 항목 “출발”, 마지막 “도착”, 중간 “경유” 라벨; altitudeM `1,653 m`, null → “고도 확인 필요”)
  4. 식사·숙박: 점심(`lunch` 텍스트, URL 포함 시 자동 링크화 `linkify`) + `LodgingCard`
  5. `MapLinkCard`
  6. `SafetyCard`
  7. 데이터 상태: verificationStatus 라벨 + sourceCheckedAt + notes
  8. `DayNav`
- 누락 필드: `getMissingFields` 결과가 있으면 상단 StatusNote(warn) “이 항목은 확인 중입니다 · 기준일 {sourceCheckedAt}” + 누락 키 목록 + 관리자 점검 링크 `/admin`

## 4. 컴포넌트 계약

### LodgingCard
props: `{ lodging: Lodging | undefined; status: BookingStatus; statusUpdatedAt: string | null }`
- lodging undefined → StatusNote “숙박 확인 필요”
- 표시: `nameOriginal`(굵게) + `nameKo`, `location`, 가격 `fmtMoney(priceLow~priceHigh, currency)` + `season`, `checkedAt`
- 공개 예약 상태 배지 `BOOKING_STATUS_LABEL[status]` (기본 unbooked → “미예약”, `booking_status_defaulted`는 public.ts에서 로그) + `statusUpdatedAt` 있으면 `formatKoDateTime`
- 예약 링크: `bookingUrl` → ExternalLink “공식 예약 ({포털|자체|기타})”; null → “예약 링크 확인 필요”
- 연락: `getContact(lodging)`
  - phone → `<a href="tel:">` 전화
  - url → ExternalLink “공식 연락”
  - none → “연락 수단 확인 필요”
  - `verifiedPhone === null` 이면 항상 “전화 확인 필요” 배지 + `logEvent("lodging_phone_unverified", "warn", { lodgingId })` (서버 렌더 시)
- `alternative` 있으면 “대안 숙소” 줄; status === "alternative" 이면 “대안 숙소 확인 필요” 강조 + `lodging_unavailable` warn 로그
- `notes` 표시

### MapLinkCard
props: `{ mapUrl: string | undefined; from: RoutePoint | undefined; to: RoutePoint | undefined }`
- mapUrl 있고 `isValidWalkingMapUrl` true → 버튼형 외부 링크 `<a target=_blank rel=noopener noreferrer>` “Google 지도로 걷기 경로 열기” (full-width on mobile, 44px)
- invalid/undefined → “지도 링크 확인 필요” (warn)
- 항상 문구: “Google 지도는 공식 등산 경로가 아닙니다. 실제 길 찾기는 공식 지도·GPX·현장 표지를 따르세요.”
- 출발·도착 원어명 표기

### SafetyCard
props: `{ fallback: string | undefined; emergency: string | undefined; checkedAt: string }`
- “우천·피로 시 대안” 문단, “비상” 문단(112 강조, `tel:112` 링크), “확인 기준일 {checkedAt}”
- 값 undefined → “확인 필요”

### DayMetrics
props `{ day: Day }` → 4개 지표(값 없으면 “—”)

### RouteList
props `{ points: RoutePoint[]; lang?: string }` → `<ol>` 세로 목록, 원어명에 `lang` 적용

### LodgingCard 원어명 `lang`
`langFor(lodging.country)`

### DayNav
props `{ prev: Day | undefined; next: Day | undefined }` → 두 링크(44px), 없으면 비활성 텍스트

## 5. Edge Case
| 상황 | 구현 |
|---|---|
| Day 데이터 누락 | 상단 StatusNote + 나머지 표시 + `/admin` 링크, `day_field_missing` warn |
| 예약 상태 없음 | “미예약” + 공식 예약·연락 링크 |
| 전화 미검증 | “전화 확인 필요” 배지 + 공식 연락/예약 링크 fallback, `lodging_phone_unverified` warn |
| 숙소 만실·예약 실패(status alternative) | “대안 숙소 확인 필요” + `alternative` 표시, `lodging_unavailable` warn |
| 외부 링크 실패 | 링크는 `<a>`이므로 브라우저 처리; 카드에 주소(`location`)·공식 연락 수단을 항상 함께 표시해 fallback 확보 |

## 6. 테스트 (`tests/unit/map-url.test.ts`)
- 12 trek Day `mapUrl` 모두 `isValidWalkingMapUrl` true, `parseMapUrl().travelmode === "walking"`, origin/destination 비어있지 않음
- 잘못된 URL(`travelmode=driving`, origin 누락, 비URL 문자열) → false
- 12 Day `fallback` 비어있지 않음, `emergency` “112” 포함 (SC-010)

## 7. 삽입 지점(후속 feature)
- 고도 프로파일 SVG: `RouteList` 아래 `<ElevationProfile dayId />` (route-visuals)
- 예약 편집 패널: 리더 로그인 시 `LodgingCard` 아래 (booking-tracker)
- 기록 타임라인: 페이지 하단 (trip-journal)
