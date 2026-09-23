# Design — day-detail (PRD v3.0 델타)

> feature: day-detail · Plan: `docs/01-plan/day-detail.plan.md` · 의존: itinerary-core
> 작성일: 2026-09-17 · v3.0 동기화 2026-09-18 · 상태: approved (L4 auto)

## Context Anchor
| Key | Value |
|---|---|
| WHY | 미정 숙소 링크 오노출 방지, 음차 제거(N-003) |
| WHO | 방문자 전원 |
| RISK | kind enum은 booking-tracker DB와 동일해야 함 |
| SUCCESS | Day 12 "숙소 미정", 음차 0건, SC-001 E2E |
| SCOPE | schema kind, lodgings seed, LodgingCard, RouteList, log, E2E |

## 1. 파일
```
src/lib/schema.ts                    LodgingKind, Lodging.kind, nameKo optional
src/data/seed/lodgings.ts            kind 12개, chamonix-hotel 미정 처리
src/lib/log.ts                       + "lodging_undecided"
src/lib/itinerary.ts                 getMissingFields: undecided 예외
src/components/day/LodgingCard.tsx   undecided 분기, nameKo 제거
src/components/day/RouteList.tsx     원어 주 표기
tests/unit/itinerary.test.ts         kind·missing·contact
tests/e2e/day-detail.spec.ts         SC-001 2탭 경로
```

## 2. 스키마
```ts
export const LodgingKind = z.enum(["refuge", "village", "hotel", "undecided"]);
LodgingSchema: kind: LodgingKind, nameKo: z.string().min(1).optional()
```
seed kind: gai-soleil village · la-balme refuge · mottets refuge · maison-vieille refuge · bertone refuge · elena refuge · edelweiss village · plein-air village · auberge-mont-blanc village · la-boerne refuge · la-flegere refuge · chamonix-hotel undecided.
`chamonix-hotel`: `nameOriginal: "샤모니의 호텔(미정)"`, `location: "Chamonix-Mont-Blanc, 1,035 m"`, `bookingChannel: "other"`, `bookingUrl: null`, `contactUrl: null`, `verifiedPhone: null`, `priceLow: 200, priceHigh: 300, currency: "EUR"`, `season: "8월 실당 €200~300 추정 · 리더가 확정 후 입력"`, `checkedAt: "2026-09-16"`.

## 3. LodgingCard 분기
```
kind === "undecided":
  제목: lodging.nameOriginal (예: 샤모니의 호텔(미정))
  Badge "숙소 미정" (tone warn) + 예약 상태 배지
  본문: "리더가 확정 예정 · 확정 후 링크·연락처가 표시됩니다"
  가격·기준일 dl 유지, 예약/전화/연락 버튼 및 "전화 확인 필요" 배지 렌더 안 함
  logEvent("lodging_undecided", "info", { lodgingId })
else: 기존 렌더. nameKo 줄 삭제 → `{lodging.location}`만.
```
`getContact`는 그대로. `getMissingFields`: `lodging?.kind === "undecided"`면 `contact`를 누락으로 세지 않는다(숙소 미정은 명시적 상태).

## 4. RouteList
각 점: `<span className="font-semibold" lang={lang}>{p.nameOriginal}</span>` + 고도. `nameKo`는 렌더하지 않는다(Day 제목만 병기).

## 5. E2E `tests/e2e/day-detail.spec.ts` (SC-001)
1. `/` 진입 → `[data-testid="today-card-link"]` 클릭(여행 기간 중이면 오늘 Day 카드 링크, 기간 밖이면 첫 이동일/전체 일정 링크) — TodayCard 3개 분기 모두 testid 부착. 기간 밖 진입 시 E2E는 첫 trek Day 상세로 이동해 판정한다.
2. Day 상세에서 `article[aria-labelledby^="lodging-"]` 안에 `a[href^="tel:"]` 또는 "공식 연락"/"공식 예약" 링크 또는 "숙소 미정" 텍스트 중 하나 존재
3. `/day/d2027-08-15`에 "숙소 미정", "리더가 확정 예정" 표시, `a[href*="booking.com"]` 없음
4. `/day/d2027-08-05`에 "라 발므 산장" 미출현, "Refuge de la Balme" 출현

## 6. Edge Case
| 상황 | 문구 | 로그 |
|---|---|---|
| 숙소 미정 | "숙소 미정" · "리더가 확정 예정" | `lodging_undecided` info |
| 전화 미검증 | "전화 확인 필요" | `lodging_phone_unverified` warn |

## 7. 산길 경로 링크 (2026-09-18 추가)
- `src/lib/map-url.ts`: `buildTrailUrl(points)` → `https://graphhopper.com/maps/?point=lat%2Clon&…&profile=hike&layer=OpenStreetMap`, `isValidTrailUrl`
- `src/lib/route.ts`: `getTrailUrlForDay(dayId)` = 출발 노드 → `trailViaIds`(없으면 중간 노드 전부) → 도착 노드
- `src/data/seed/route-segments.ts`: 3·4·7·11·12일 `trailViaIds`(주요 경유지 1곳 — 고개 또는 대표 지점: Col du Bonhomme·Col de la Seigne·Grand Col Ferret·Lac Blanc·Le Brévent)
- `MapLinkCard`: Google 걷기 링크(FR-003) + 산길 경로 링크(`data-testid="trail-link"`) + 우회 경고 문구

## 8. Day별 GPX 다운로드 (2026-09-18 추가)
- `scripts/build-gpx.mjs`(`npm run build:gpx`, 노선·경유지 변경 시 재실행 → 단위 테스트 통과 후 배포, PRD I-010) → `public/gpx/tmb2027-day-NN.gpx`(12) + `src/data/gpx-manifest.json`(dayId, trekDayNumber, file, lengthKm, ascendM, trackPoints, viaNodeIds, generatedAt, source)
- `src/lib/gpx.ts`: `getGpxForDay(dayId)`, `gpxLabel(entry)`
- `MapLinkCard`: `gpx` prop → 다운로드 버튼(`data-testid="gpx-download"`), 출처 문구(© OpenStreetMap contributors, ODbL)
- `next.config.ts` `/gpx/:file*` 헤더, SW `STATIC_EXT`에 gpx

## 9. v3.0 Day 12 숙박 권장 문구 (2026-09-18)
- `src/data/seed/lodgings.ts` `chamonix-hotel`: `season: "8월 실당 €200~300 추정 · 리더가 확정 후 입력"` 유지, `notes: "호텔 미확정 · 다음 날 06:30 에귀 뒤 미디 출발이므로 샤모니 남역(Aiguille du Midi 승강장) 도보 10분 이내 권장 [확정 2026-09-18]"`
- `supabase/migrations/20260917000003_lodgings.sql` chamonix-hotel 행의 notes를 동일 문구로 갱신
- `tests/unit/lodgings.test.ts`: seed notes에 "승강장 도보 10분" 포함, SQL 텍스트에도 동일 문구 포함

## 10. 구현 상태 매핑 (정본 동기화)
| PRD v3.0 | 구현 | 검증 |
|---|---|---|
| FR-003 경유지 좌표 | `days.ts` mapUrl `waypoints=lat%2Clng` (route node) | `map-url.test.ts` |
| FR-003 산길 경로 링크 | `map-url.ts buildTrailUrl`, `route.ts getTrailUrlForDay`, `route-segments.ts trailViaIds`, `MapLinkCard` `trail-link` | `route.test.ts`, `day-detail.spec.ts` |
| FR-018 GPX | `scripts/build-gpx.mjs`, `public/gpx/*.gpx`, `src/data/gpx-manifest.json`, `src/lib/gpx.ts`, `MapLinkCard` `gpx-download`, `next.config.ts` 헤더, SW `.gpx` static | `gpx.test.ts`, `sw-rules.test.ts`, `day-detail.spec.ts` |
| 부록 C-3 Day 12 숙박 권장(승강장 도보 10분) | `src/data/seed/lodgings.ts` chamonix-hotel `notes`, `supabase/migrations/20260917000003_lodgings.sql` 동일 행 | `lodgings.test.ts` "Day 12 lodging guidance" |
