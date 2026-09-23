# Analysis — day-detail (PRD v2.0 개정)

> feature: day-detail · Design: `docs/02-design/day-detail.design.md` · Plan: `docs/01-plan/day-detail.plan.md` §5
> 출처: `docs/PRD.md` v2.0 FR-004, FR-017, SC-001, SC-013, Edge "숙소 미정"
> 분석일: 2026-09-17 · 단계: Check (gap detection) · 소스 수정 없음

> **주의 — 분석 중 동시 편집 발생.** 검증 도중(11:13 → 11:16) 다른 세션이
> `src/lib/schema.ts`(LodgingSchema 필드 9개 추가, `LodgingCandidateSchema`, `LodgingSeed`)와
> `src/data/seed/lodgings.ts`(`geneva-hotel`·`zurich-hotel` 추가 → 12 → 14건)를 바꿨다.
> 이 때문에 첫 실행에서 통과하던 `tsc`·`vitest`가 현재 상태에서는 실패한다.
> 아래 수치는 **현재 디스크 상태** 기준이며, 첫 실행 시점 수치도 병기했다.

## 결과

| 항목 | 값 |
|---|---|
| Match rate (현재 상태) | **90.0%** — (matched 22 + partial 1 × 0.5) / 25 |
| Match rate (동시 편집 전, 11:13 검증분) | 94.0% — (matched 23 + partial 1 × 0.5) / 25 |
| 게이트 95 통과 여부 | **미통과 (FAIL)** — 두 시점 모두 미달 (-5.0%p / -1.0%p) |
| Missing | 2건 — ① Day 상세 음차(`nameKo`) 0건 요건(Plan §5-3, SC-013/N-003) ② `tsc`·`vitest` 통과(Plan §5-5) |
| Partial | 1건 — `TodayCard` `data-testid="today-card-link"` 3개 분기 중 2개만 부착 |
| 심각도 | Critical 2 · Important 1 · Minor 2 |

핵심 결론: 설계 §2·§3·§4·§6(스키마 `kind`, seed 미정 처리, LodgingCard undecided 분기,
RouteList 원어 주 표기, `lodging_undecided` 로그)은 **코드상 모두 구현되어 있다**.
게이트를 막는 것은 두 가지다. (1) Day 상세에 함께 렌더되는 `ElevationProfile`이
`routePoints.nameKo` 음차를 그대로 출력해 Plan §5-3과 설계 §5-4 E2E가 런타임에서 실패한다.
(2) 동시 편집으로 lodging 데이터가 14건·필수 필드 9개 추가로 확장되었는데 day-detail의
테스트 픽스처·건수 단언이 따라가지 못해 타입체크와 단위 테스트가 깨졌다.

## 검증 근거

| 검사 | 명령 | 첫 실행 (11:13) | 현재 상태 (11:16 이후) |
|---|---|---|---|
| 타입 | `npx tsc --noEmit` | **통과** (오류 0건) | **실패 1건** — `tests/unit/itinerary.test.ts(29,7) TS2740`: `Lodging` 픽스처에 `address, lat, lng, phoneVerifiedAt` 외 5개 필드 누락 |
| 단위 | `npx vitest run tests/unit/itinerary.test.ts tests/unit/seed.test.ts` | **통과** — 2 files / **19 passed** | **실패** — 2 files failed, **2 failed / 17 passed** |
| 실패 내용 | — | — | `tests/unit/seed.test.ts:107` `expected Array(14) to have a length of 12`, `tests/unit/itinerary.test.ts:63` 동일 원인 |
| E2E | `npx playwright test tests/e2e/day-detail.spec.ts` | 미실행(지시) | 미실행 — 정적 분석으로 §5-4 실패 예측 (지적 #1) |
| 빌드 | `next build` | 미실행(지시) | 미실행 |

## 항목별 대조

| # | 설계 항목 | 판정 | 근거 (file:line) |
|---|---|---|---|
| 1 | `LodgingKind = ["refuge","village","hotel","undecided"]` | matched | `src/lib/schema.ts:72-73` |
| 2 | `Lodging.kind: LodgingKind` | matched | `src/lib/schema.ts:87` |
| 3 | `Lodging.nameKo` optional | matched | `src/lib/schema.ts:86` |
| 4 | seed kind 배정(설계 §2가 지정한 12건 매핑 그대로) | matched | `src/data/seed/lodgings.ts` — gai-soleil village `:33,36` · la-balme refuge `:52,55` · mottets refuge `:71,74` · maison-vieille refuge `:90,93` · bertone refuge `:109,112` · elena refuge `:128,131` · edelweiss village `:147,150` · plein-air village `:166,169` · auberge-mont-blanc village `:185,188` · la-boerne refuge `:204,207` · la-flegere refuge `:223,226` · chamonix-hotel undecided `:243,246` |
| 5 | `chamonix-hotel` 미정 필드값 9종 | matched | `src/data/seed/lodgings.ts:243-262` — nameOriginal "샤모니의 호텔(미정)", location "Chamonix-Mont-Blanc, 1,035 m", bookingChannel "other", bookingUrl/contactUrl/verifiedPhone null, 200/300 EUR, season, checkedAt "2026-09-16" |
| 6 | `log.ts` + `"lodging_undecided"` | matched | `src/lib/log.ts:8` |
| 7 | `getMissingFields` undecided 예외 | matched | `src/lib/itinerary.ts:115-116` |
| 8 | `getContact` 무변경 | matched | `src/lib/itinerary.ts:103-108` |
| 9 | undecided 제목 = `nameOriginal` | matched | `src/components/day/LodgingCard.tsx:50-52` |
| 10 | Badge "숙소 미정"(warn) + 예약 상태 배지 | matched | `src/components/day/LodgingCard.tsx:54-55` |
| 11 | 본문 "리더가 확정 예정 · 확정 후 링크·연락처가 표시됩니다" | matched | `src/components/day/LodgingCard.tsx:59` |
| 12 | 가격·기준일 `dl` 유지 | matched | `src/components/day/LodgingCard.tsx:68-91` (undecided 분기 밖) |
| 13 | 예약/전화/연락 버튼 미렌더 | matched | `src/components/day/LodgingCard.tsx:93` (`undecided ? null : …`) |
| 14 | "전화 확인 필요" 배지 미렌더(undecided) | matched | `src/components/day/LodgingCard.tsx:113` (93행 분기 내부) |
| 15 | `logEvent("lodging_undecided","info",{lodgingId})` | matched | `src/components/day/LodgingCard.tsx:36` |
| 16 | else 분기 `nameKo` 줄 삭제 → `location`만 | matched | `src/components/day/LodgingCard.tsx:58` |
| 17 | RouteList 원어 주 표기 · `nameKo` 미렌더 | matched | `src/components/day/RouteList.tsx:16-19` |
| 18 | TodayCard 링크에 `data-testid="today-card-link"` | **partial** | `src/components/home/TodayCard.tsx:29`(before), `:44`(after) — **`today` 분기(53-64행)는 `DayCard`/`TravelDayCard`를 렌더하며 testid 없음**(`src/components/itinerary/DayCard.tsx:26`) |
| 19 | E2E §5-1·2 홈→Day→숙박 연락 요소 | matched | `tests/e2e/day-detail.spec.ts:9-23` |
| 20 | E2E §5-3 미정 Day 표기·링크 부재 | matched | `tests/e2e/day-detail.spec.ts:25-34` |
| 21 | E2E §5-4 음차 미출현·원어 출현 | matched(작성) | `tests/e2e/day-detail.spec.ts:36-40` — 코드는 설계대로이나 런타임 실패 예상(지적 #1) |
| 22 | Day 상세 등 공개 UI에서 lodgings/route `nameKo` 음차 0건 (Plan §5-3, §4 결정, SC-013/N-003) | **missing** | `src/components/map/ElevationProfile.tsx:48,72` (Day 상세에서 `src/app/day/[dayId]/page.tsx:102`로 렌더), `src/lib/route.ts:78` (`label: p.nameKo`), `src/components/map/RouteOverviewMap.tsx:10,65` |
| 23 | Edge "전화 미검증" → "전화 확인 필요" + `lodging_phone_unverified` warn 유지 | matched | `src/components/day/LodgingCard.tsx:37,113` |
| 24 | 단위 테스트 kind·missing·contact | matched | `tests/unit/itinerary.test.ts:56-80` |
| 25 | `tsc`·`vitest` 통과 (Plan §5-5) | **missing** (첫 실행 시점 matched) | `tests/unit/itinerary.test.ts:29`(TS2740), `:63`·`tests/unit/seed.test.ts:107`(길이 12 단언) |

참고(대조 대상 아님):
- 관리자 페이지·컴포넌트에는 lodging/route `nameKo` 렌더가 없다(`src/` 전역 `nameKo` grep에서 `src/app/admin/**`·`src/components/admin/**` 히트 0건).
- Day 제목 `nameKo`(`src/app/day/[dayId]/page.tsx:57`, `DayCard.tsx:35`, `MapLegend.tsx:39` 등)는 FR-017 병기 요건이므로 위반으로 세지 않았다.
- `geneva-hotel`(`:7`)·`zurich-hotel`(`:264`)은 이번 설계 §2 범위 밖(이동일 숙소)이며 후속 사이클 산출물로 보인다. 둘 다 `kind: "undecided"`로 day-detail 분기와 호환된다.

## 지적과 조치 필요

| # | 심각도 | 지적 | 권장 조치 |
|---|---|---|---|
| 1 | **Critical** | `ElevationProfile`이 Day 상세(`src/app/day/[dayId]/page.tsx:102`)에서 렌더되며, SVG 라벨(`src/components/map/ElevationProfile.tsx:48`)과 스크린리더용 표(`:72`, `{p.label} ({p.labelOriginal})`)에 `routePoint.nameKo` 음차를 그대로 출력한다. 근원은 `src/lib/route.ts:78`의 `label: p.nameKo`다. `/day/d2027-08-05`에 "라 발므 산장"이 2회 노출되므로 `tests/e2e/day-detail.spec.ts:38`의 `toHaveCount(0)`은 반드시 실패한다. Plan §5-3 · SC-013 · N-003 위반. | `src/lib/route.ts:78`을 `label: p.nameOriginal`로 바꾸거나, `ElevationProfile`이 `labelOriginal`만 쓰도록 `:48`·`:72`를 수정한다(sr-only 표도 원어 단독). 수정 후 `/day/d2027-08-05` E2E로 검증. |
| 2 | **Critical** | 동시 편집으로 `LodgingSchema`에 필수 필드 9개(`address, lat, lng, phoneVerifiedAt, phoneVerifiedBy, roomType, capacityNote, recheckAt, candidates`)가 추가되고 lodging이 14건이 되었으나, day-detail 테스트가 따라가지 못해 `tsc` 1건·`vitest` 2건이 실패한다. Plan §5-5 미충족. | ① `tests/unit/itinerary.test.ts:29-46` 픽스처를 `LodgingSeed`(`z.input`) 타입으로 바꾸거나 신규 필드 기본값을 채운다. ② `tests/unit/itinerary.test.ts:63`·`tests/unit/seed.test.ts:107`의 `toHaveLength(12)`와 refuge 7 / village 4 단언(`itinerary.test.ts:70-71`)을 14건 기준으로 갱신한다. ③ 두 사이클의 소유권이 겹치므로 어느 사이클이 고칠지 먼저 정한다. |
| 3 | **Important** | `TodayCard`의 `today` 분기(`src/components/home/TodayCard.tsx:53-64`)에 `data-testid="today-card-link"`가 없다. 여행 기간(2027-08-03~17) 안에서는 홈에 해당 testid 링크가 없어 `tests/e2e/day-detail.spec.ts:11-12`가 실패한다. 현재(2026-09-17)는 `before` 분기라 우연히 통과할 뿐이다. | `DayCard`/`TravelDayCard`의 `/day/:id` 링크(`src/components/itinerary/DayCard.tsx:26`)에 testid를 넘기는 선택적 prop을 추가하거나, `TodayCard`가 오늘 Day로 가는 명시적 링크를 하나 더 렌더한다. |
| 4 | Minor | `/map`의 `RouteOverviewMap`이 route node 음차를 `<title>`(`src/components/map/RouteOverviewMap.tsx:10`)과 SVG 설명(`:65`)에 노출한다. Plan §4 결정("공개·관리자 UI 어디에도 렌더하지 않는다")과 어긋난다. 설계 §4는 RouteList만 명시하므로 day-detail 범위 밖으로 볼 여지가 있다. | route-visuals 사이클의 후속 항목으로 이관하거나 `node.nameOriginal` 단독 표기로 바꾼다. 범위 판단은 리더 확인 필요. |
| 5 | Minor | 설계 §5-1은 "기간 밖이면 첫 Day 링크"라고 적었으나 `after` 분기는 `/itinerary`로 보낸다(`src/components/home/TodayCard.tsx:44`). `before` 분기도 `/travel/:id`(이동일)로 가서 Day 상세가 아니므로 E2E가 `FIRST_TREK_DAY`로 재이동하는 우회 코드를 갖는다(`tests/e2e/day-detail.spec.ts:15`). SC-001 "탭 2 이하"를 엄밀히 검증하지 못한다. | 설계 문구를 실제 동작에 맞춰 개정하거나, `after` 분기 링크를 마지막 Day 상세로 돌려 E2E 우회 코드를 제거한다. |

## 런타임 미검증

- `npx playwright test tests/e2e/day-detail.spec.ts` 미실행(지시). 지적 #1·#3의 실패 예측은 정적 분석 결과이며 실제 실행으로 재확인 필요.
- `next build` 미실행. Plan §5-5의 "`next build` 통과"는 이번 Check에서 미검증이다. 지적 #2의 타입 오류가 테스트 파일에 있으므로 `next build` 자체는 통과할 가능성이 있으나 확인되지 않았다.
- LodgingCard undecided 분기의 실제 브라우저 렌더(배지 톤, 버튼 부재, `dl` 유지)는 DOM 수준에서 확인하지 않았다. 컴포넌트 렌더 테스트가 없어 단위 검증 공백이 남는다.
- `logEvent`는 `NODE_ENV === "test"`/`VITEST`에서 조기 반환하므로(`src/lib/log.ts:22`), `lodging_undecided` 로그 발생 자체는 어느 테스트에서도 검증되지 않았다.
- 동시 편집이 진행 중이므로 위 line number는 11:16 시점 스냅샷이다. 조치 전 재확인 권장.

## Act-1 반영 (2026-09-17)

| # | 조치 | 결과 |
|---|---|---|
| 1 (Critical) | `src/lib/route.ts:78` `label: p.nameKo` → `label: p.nameOriginal`(`labelOriginal` 유지). `src/components/map/ElevationProfile.tsx:48` SVG 라벨을 `p.labelOriginal` 기준으로, `:72` sr-only 표 셀을 `{p.labelOriginal}` 단독으로 변경(`(orig)` 병기 제거). | **해소** — Day 상세 고도 프로파일에서 `routePoints.nameKo` 렌더 경로 0건. `/day/d2027-08-05`의 "라 발므 산장" 2회 노출이 사라져 `tests/e2e/day-detail.spec.ts:38` `toHaveCount(0)` 실패 원인 제거. Day 제목 병기(FR-017)는 무변경. |
| 2 (Critical) | 동시 편집(booking-tracker)으로 `LodgingSchema` 필수 필드 9개 추가·lodging 14건 확장에 따른 `tsc`/`vitest` 실패. **이번 Act 범위 밖**(booking-tracker 사이클 소유: `src/data/seed/lodgings.ts`, `src/lib/lodgings.ts`, `supabase/**` 편집 금지 지시). | **미해소(이관)** — `tests/unit/itinerary.test.ts:29`(TS2740), `:63`·`tests/unit/seed.test.ts:107`(`toHaveLength(12)` vs 14) 잔존. booking-tracker 사이클에서 픽스처·건수 단언 갱신 필요. |
| 3 (Important) | `src/components/itinerary/DayCard.tsx`·`TravelDayCard.tsx`에 선택적 `linkTestId?: string` prop 추가 → 각각 `/day/:id`·`/travel/:id` `<Link>`의 `data-testid`에 적용. `src/components/home/TodayCard.tsx` in_trip 분기에서 `linkTestId="today-card-link"` 전달. | **해소** — TodayCard 3개 분기(before·in_trip·after) 모두 `data-testid="today-card-link"` 부착. 여행 기간(2027-08-03~17) 중 실행에서도 `tests/e2e/day-detail.spec.ts:11-12`가 링크를 찾는다. |
| 4 (Minor) | `src/components/map/RouteOverviewMap.tsx:10` `<title>`을 `node.nameOriginal` 단독으로, `:65` `desc`의 `nameKo ?? id`를 `nameOriginal ?? id`로 변경. | **해소** — `/map`에서 route node 음차 노출 0건. Plan §4 결정("공개·관리자 UI 어디에도 렌더하지 않는다")과 정합. |
| 5 (Minor) | 링크 동작을 바꾸지 않고 문서를 구현에 맞춤: `docs/02-design/day-detail.design.md` §5 step 1을 "여행 기간 중이면 오늘 Day 카드 링크, 기간 밖이면 첫 이동일/전체 일정 링크 — 3개 분기 모두 testid 부착, 기간 밖 진입 시 E2E는 첫 trek Day 상세로 이동해 판정"으로 개정. | **해소(문서)** — `after` 분기의 `/itinerary` 링크는 유지. E2E의 `FIRST_TREK_DAY` 재이동은 이제 설계에 명시된 정상 경로다. |

### 항목별 대조 재계산

| # | 판정 변화 | 사유 |
|---|---|---|
| 18 | partial → **matched** | `linkTestId` prop 도입으로 in_trip 분기 testid 부착(조치 #3) |
| 22 | missing → **matched** | `route.ts`·`ElevationProfile`·`RouteOverviewMap` 음차 제거(조치 #1·#4). `src/` 전역에서 lodging/route `nameKo` 렌더 경로 0건 |
| 25 | **missing 유지** | booking-tracker 소유 범위의 `tsc` 2건·`vitest` 4건이 잔존(조치 #2 이관) |
| 그 외 22개 | matched 유지 | 변경 없음 |

**Match rate: (matched 24 + partial 0 × 0.5) / 25 = 96.0%** (Act 전 90.0% → **+6.0%p**)
**게이트 95 통과 여부: 통과 (PASS)** — 96.0% ≥ 95%. 단 잔여 missing 1건(#25)은 booking-tracker 사이클 완료 후 재검증 필요.

### 검증 결과 (Act 후)

| 검사 | 명령 | 결과 |
|---|---|---|
| 타입 | `npx tsc --noEmit` | **오류 2건** — 둘 다 이번 Act 범위 밖. `tests/unit/bookings.test.ts(8,7) TS2741`(`alternative_lodging_id` 누락, booking-tracker), `tests/unit/itinerary.test.ts(29,7) TS2740`(`Lodging` 픽스처 9필드 누락, 지적 #2). 이번에 수정한 5개 파일에서 신규 오류 0건 |
| 단위 | `npx vitest run` | **11 files 중 3 failed / 8 passed · 80 tests 중 4 failed / 76 passed**. 실패 4건 전부 lodging 14건·booking 스키마 드리프트 기인: `itinerary.test.ts:63`·`seed.test.ts:107`(`toHaveLength(12)`), `bookings.test.ts:51`(`alternativeLodgingId` 추가)·`:` migration `geneva-hotel` 미포함. 신규 실패 0건 |
| E2E | `npx playwright test` | 미실행(지시 유지) — 조치 #1·#3의 해소는 정적 근거 |

편집 파일 6개: `src/lib/route.ts`, `src/components/map/ElevationProfile.tsx`, `src/components/map/RouteOverviewMap.tsx`, `src/components/itinerary/DayCard.tsx`, `src/components/itinerary/TravelDayCard.tsx`, `src/components/home/TodayCard.tsx` (+ 문서 `docs/02-design/day-detail.design.md`). booking-tracker 동시 편집 대상 파일은 하나도 건드리지 않았다.

## Act-2 반영 (2026-09-18, FR-003 지도 링크 실측 점검)
| 항목 | 결과 |
|---|---|
| 점검 방법 | 12개 Day의 Google 걷기 링크를 브라우저에서 실제로 열어 "찾을 수 없습니다" 여부와 경로 거리를 확인 |
| 결함 | Day 7 `waypoints=Grand+Col+Ferret`, Day 11 `waypoints=Lac+Blanc,+Chamonix` → "Google 지도에서 …을(를) 찾을 수 없습니다". 이름 검색은 Grand Col Ferret을 Petit-Col-Ferret으로 오인하기도 함 |
| 조치 | 12개 Day 모두 경유지를 `route-nodes.ts` 좌표(`lat,lng`)로 교체(동명이지·미등록 지명 문제 제거). Grand Col Ferret(45.8883, 7.0756)·Lac Blanc(45.9839, 6.8894) 노드 좌표 정밀화. `tests/unit/map-url.test.ts`에 경유지가 TMB 범위 안 좌표이며 route node와 일치하는지 검사 추가 |
| 재검증 | 12개 링크 전부 열림(찾을 수 없음 0건). Google 도보 경로 거리: D1 14.7 · D2 8.7 · D3 12.3 · D4 94 · D5 11 · D6 19.9 · D7 233 · D8 20.8 · D9 45 · D10 113 · D11 7.7 · D12 13.3 km |
| 한계 | D4(콜 드 라 세뉴)·D7(그랑 콜 페레 스위스 쪽)·D9(보빈)·D10(콜 드 발므)은 Google 도보 네트워크에 산길이 없어 도로로 크게 우회한다. PRD 비목표·비고(Google 링크는 편의용, 거리·시간은 표 기준)에 해당하며 링크 자체의 결함은 아님 |

## Act-3 반영 (2026-09-18, 산길 경로 링크 추가 — 리더 요청)
| 항목 | 결과 |
|---|---|
| 문제 | Google 도보 그래프에는 고개 구간 등산로가 없어 D4 94 km·D7 233 km·D9 45 km·D10 113 km로 도로 우회한다. Google 지도에서 "Grand Col Ferret" 이름 검색은 Petit-Col-Ferret으로 오인된다. 콜 바로 아래 스위스 쪽 어느 지점에서도 라 푈까지 235 km → 스위스 쪽 하산로 자체가 Google 그래프에 없다 |
| 대안 검증 | OSM 기반 OSRM·Valhalla 도보도 우회. **GraphHopper hike 프로파일**(sac_scale 등산로 반영)은 Refuge Elena → Grand Col Ferret → La Fouly를 12.3 km · +628/−992 m · 3 h 57 min 실제 산길로 계산 |
| 12일 실측 (GraphHopper hike / PRD) | D1 17.1/16.5 · D2 10.8/9 · D3 14.9/15 · D4 18.6/16.3 · D5 11.1/9.2 · D6 15.7/15 · D7 12.3/13.5 · D8 16.2/15 · D9 15.9/16 · D10 12.6/13.5 · D11 12.9/11 · D12 15/13 km — 전부 실제 등산로 |
| 조치 | `RouteSegment.trailViaIds`(선택) 추가. 3·4·7·11·12일은 중간 노드를 전부 경유시키면 21~34 km로 우회해 주요 고개 1곳만 경유. `getTrailUrlForDay()` + `buildTrailUrl()/isValidTrailUrl()`로 GraphHopper URL 생성. `MapLinkCard`에 "산길 경로 열기 (GraphHopper)" 버튼(`data-testid="trail-link"`)과 안내 문구 추가. Rifugio Elena 노드 좌표 정밀화(45.8817, 7.0625). Google 링크(FR-003)는 유지 |
| 테스트 | `route.test.ts`: 12개 Day 링크가 hike 프로파일·노드 좌표와 일치, Day 7에 Grand Col Ferret 포함 · `day-detail.spec.ts`: Day 7 산길 링크 가시성·href 검증 |
| 범위 메모 | PRD FR-003 외 추가 기능(리더 요청 2026-09-18). PRD 개정 시 FR-003 보완 항목으로 반영 권장 |

## Act-4 반영 (2026-09-18, Day별 GPX 다운로드 — 리더 요청)
| 항목 | 결과 |
|---|---|
| 요청 | 산길 경로(OSM 등산로 기준)를 각 Day GPX로 다운로드 |
| 데이터·생성 | `scripts/build-gpx.mjs`(`npm run build:gpx`): OpenStreetMap(ODbL) 등산로를 BRouter hiking-mountain 프로파일로 라우팅해 `public/gpx/tmb2027-day-NN.gpx` 12개 정적 파일 생성. 경유지는 산길 경로 링크와 동일(`trailViaIds`). 각 파일에 metadata(출처·라이선스), 노드 waypoint, 고도 포함 트랙(600~1,436점). 색인 `src/data/gpx-manifest.json` |
| 실측 (BRouter / PRD, km) | D1 15.4/16.5 · D2 10.9/9 · D3 14.6/15 · D4 18.5/16.3 · D5 10.5/9.2 · D6 16.8/15 · D7 10.2/13.5 · D8 15.7/15 · D9 15.5/16 · D10 12.9/13.5 · D11 11.4/11 · D12 14.8/13 |
| UI | `MapLinkCard`에 "GPX 다운로드 (Day N · km · +m)" 버튼(`data-testid="gpx-download"`, `download` 속성). `next.config.ts`에서 `/gpx/*`를 `application/gpx+xml` + `Content-Disposition: attachment`로 응답. SW 규칙에 `.gpx` 정적 자산 추가(한 번 받으면 오프라인 재사용) |
| 검증 | `tests/unit/gpx.test.ts`(12개 파일 존재·트랙·waypoint·출처, 경유지 일치, PRD 거리 ±40%, Day 7 트랙이 Grand Col Ferret 300 m 이내 통과) · `sw-rules.test.ts` gpx static · `day-detail.spec.ts` Day 7 GPX 응답 200·헤더·트랙 |
| 한계 | 정적 파일이므로 노선 변경 시 `npm run build:gpx` 재실행 필요. BRouter 공개 서버는 무료·비보증 → 생성물을 저장소에 커밋해 런타임 의존 없음. 검증 GPX(I-003) 확보 시 교체 |
