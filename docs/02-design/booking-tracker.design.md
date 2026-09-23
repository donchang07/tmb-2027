# Design — booking-tracker (PRD v3.1 델타)

> feature: booking-tracker · Plan: `docs/01-plan/booking-tracker.plan.md` · 의존: itinerary-core
> 작성일: 2026-09-18 · 상태: approved (L4 auto) · v2.0 본설계: `docs/archive/2026-09-v3.0/booking-tracker/booking-tracker.design.md`

## Context Anchor
| Key | Value |
|---|---|
| WHY | D-007 취리히 호텔 삭제 |
| WHO | 리더, 방문자 |
| RISK | seed↔SQL 불일치 |
| SUCCESS | zurich-hotel 0건, chamonix-hotel-2 seed·SQL·bookings 일치 |
| SCOPE | lodgings seed, migration, tests, E2E |

## 1. 파일
```
src/data/seed/lodgings.ts                          zurich-hotel 블록 → chamonix-hotel-2
supabase/migrations/20260917000003_lodgings.sql    lodgings insert 행 교체, bookings insert ('geneva-hotel'), ('chamonix-hotel-2')
tests/unit/lodgings.test.ts                        dayId·kind·후보(제네바만)·SQL 일치 검사
tests/unit/bookings.test.ts, itinerary.test.ts, seed.test.ts   id 갱신
tests/e2e/security.spec.ts                         8/16 케이스: "2박째"·"숙소 미정"·후보 없음·폼 없음
```

## 2. seed (`chamonix-hotel-2`)
```ts
{ id: "chamonix-hotel-2", nameOriginal: "샤모니의 호텔(미정) · 2박째", nameKo: "샤모니 호텔 2박째 (미정)", kind: "undecided",
  location: "Chamonix-Mont-Blanc, 1,035 m", country: "FR", dayId: "d2027-08-16", bookingChannel: "other",
  bookingUrl: null, contactUrl: null, verifiedPhone: null, priceLow: 200, priceHigh: 300, currency: "EUR",
  season: "8월 실당 €200~300 추정 · 8/15와 같은 호텔 2박 연속 예약", checkedAt: "2026-09-18", alternative: null, candidates: [],
  notes: "8/15 숙소와 동일 호텔 2박 연속 예약(체크아웃·짐 이동 없음) · 에귀 뒤 미디 승강장(샤모니 남역) 도보 10분 이내 권장 [확정 2026-09-18, D-007]" }
```
SQL 행은 같은 값(country 'FR', candidates '[]'::jsonb, notes 동일 문자열).

## 3. 표시
`LodgingCard`(undecided 분기)·`LodgingTable`·`PublicPreview`는 데이터 기반이라 변경 없음. 8/16 이동일 페이지 숙박 섹션에 "숙소 미정"·"리더가 확정 예정"과 notes가 렌더된다.

## 4. 테스트
- `lodgings.test.ts`: 8/3 geneva-hotel · 8/15 chamonix-hotel · 8/16 chamonix-hotel-2, `zurich-hotel` 없음, undecided 3개, 후보는 제네바 4곳만, SQL에 chamonix-hotel-2 행·notes·bookings insert, zurich-hotel 0건
- `bookings.test.ts`: trek lodging 12개 필터가 chamonix-hotel-2 제외, bookings insert 문자열
- `itinerary.test.ts`: undecided id 목록 `["geneva-hotel","chamonix-hotel","chamonix-hotel-2"]`
- `seed.test.ts`: 호텔 이동일 lodging id `["geneva-hotel","chamonix-hotel-2"]`
- `security.spec.ts`: `/travel/d2027-08-16`에 "2박째"·"숙소 미정", "Fred Hotel Zürich Hauptbahnhof" 0건, `form` 0개
