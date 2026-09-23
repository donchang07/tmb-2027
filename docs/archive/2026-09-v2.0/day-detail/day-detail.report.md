# Report — day-detail (PRD v2.0 개정)

> feature: day-detail · 순서 2/9 · 완료일 2026-09-17 · 최종 match rate **96.0%** (게이트 95 통과) · 반복 횟수 **1회**(Check → Act-1)
> Plan `docs/01-plan/day-detail.plan.md` · Design `docs/02-design/day-detail.design.md` · Analysis `docs/03-analysis/day-detail.analysis.md`

## Executive Summary

| 관점 | 내용 (실제 결과) |
|---|---|
| Problem | Day 12(샤모니) 숙소가 미정인데 카드가 Booking.com 링크를 "공식 예약"처럼 노출했고, 산장·고개 이름에 한국어 음차가 붙어 N-003과 어긋났으며, SC-001(홈→오늘 Day→숙박 연락 2탭)을 검증하는 E2E가 없었다. |
| Solution | `LodgingKind`(refuge/village/hotel/undecided)를 스키마에 도입하고 `chamonix-hotel`을 undecided로 전환해 링크·전화 대신 "숙소 미정 · 리더가 확정 예정"을 표시하고 `lodging_undecided`를 로그한다. `LodgingCard`·`RouteList`에서 음차 렌더를 제거했고, Act-1에서 `route.ts`·`ElevationProfile`·`RouteOverviewMap`까지 원어 단독 표기로 확장했다. SC-001 2탭 경로 E2E(`day-detail.spec.ts`)를 신설했다. |
| Function UX Effect | `/day/d2027-08-15`는 "샤모니의 호텔(미정)" + "리더가 확정 예정 · 확정 후 링크·연락처가 표시됩니다"를 보여 주고 예약·전화 버튼을 렌더하지 않는다. `/day/d2027-08-05`에는 "Refuge de la Balme"만 보이고 "라 발므 산장"은 고도 프로파일·지도를 포함해 어디에도 없다. |
| Core Value | 오래된·미확정 링크를 확정처럼 노출하지 않는다(PRD 3장 목표 4). 숙소 미정은 숨김이 아니라 명시적 상태로 드러난다. |

### 1.3 Value Delivered

| 관점 | 지표·근거 |
|---|---|
| 오정보 차단 | `chamonix-hotel` `bookingUrl`/`contactUrl`/`verifiedPhone` = null + undecided 분기에서 버튼 미렌더(`LodgingCard.tsx:93`) — Booking.com 링크 노출 0건 |
| 표기 일관성(SC-013/N-003) | Act-1 후 `src/` 전역에서 lodging/route `nameKo` 렌더 경로 **0건**. Day 제목 병기(FR-017)만 유지 |
| 상태 가시성 | 12건 lodging 전부 `kind` 보유, undecided는 warn 배지 + 안내 문구 + `lodging_undecided` info 로그 |
| 지표 정확도 | `getMissingFields`가 undecided 숙소를 contact 누락으로 세지 않음 → "확인 필요" 카운트 왜곡 제거 |
| 검증 자산 | `tests/e2e/day-detail.spec.ts` 4개 시나리오(2탭 경로·미정 표기·링크 부재·음차 0건), `tests/unit/itinerary.test.ts` kind/missing/contact |

## Context Anchor

| Key | Value |
|---|---|
| WHY | 미정 숙소를 링크로 노출하면 잘못된 예약 시도가 생긴다 |
| WHO | 방문자 전원 |
| RISK | `kind` 추가는 booking-tracker의 DB 스키마와 이름·enum이 같아야 한다 |
| SUCCESS | Day 12 카드 "숙소 미정", 음차 0건, SC-001 E2E 통과 |
| SCOPE | LodgingCard·RouteList·DayCard 표기, Lodging.kind, SC-001 E2E |

## FR/SC

| ID | 상태 | 근거 |
|---|---|---|
| FR-004 (숙소 미정) | ✅ 완료 | `schema.ts` `LodgingKind` + `Lodging.kind` · `lodgings.ts` `chamonix-hotel` 미정 필드 9종 · `LodgingCard.tsx:50-59,93` undecided 분기 |
| FR-004 (전화 미검증) | ✅ 유지 | `LodgingCard.tsx:37,113` "전화 확인 필요" + `lodging_phone_unverified` warn (undecided 분기에서는 미렌더) |
| FR-017 / SC-013 (표기) | ✅ 완료 | `RouteList.tsx:16-19` 원어 주 표기 · Act-1로 `route.ts:78`·`ElevationProfile.tsx:48,72`·`RouteOverviewMap.tsx:10,65` 음차 제거. Day 제목 한국어·원어 병기는 유지 |
| SC-001 (2탭 경로) | ✅ 작성 완료 / 런타임 대기 | `tests/e2e/day-detail.spec.ts:9-23` + Act-1에서 `TodayCard` 3개 분기 전부 `data-testid="today-card-link"` 부착 |
| SC-002 | ✅ 설계 반영 | Day 상세 렌더 경로 무변경, 카드 구조 유지 |
| Edge "숙소 미정" | ✅ 완료 | `LodgingCard.tsx:36` `logEvent("lodging_undecided","info",{lodgingId})` · `log.ts:8` 코드 등록 |
| 부록 A-2 `kind` | ✅ 완료 | enum 값·이름이 PRD A-2 및 booking-tracker DB `lodging_kind`와 1:1 |

## Success Criteria 최종 (Plan §5)

| # | 기준 | 판정 | 근거 |
|---|---|:--:|---|
| 1 | `LodgingSchema.parse` — 12개 모두 kind 존재, chamonix-hotel = undecided | ✅ | `lodgings.ts` 12건 kind 매핑(refuge 7 · village 4 · undecided 1) 확인 |
| 2 | undecided 렌더에 "숙소 미정"·"리더가 확정 예정" 포함, 예약·전화 버튼 없음 | ✅ | `LodgingCard.tsx:54-55,59,93` |
| 3 | 공개 UI에 lodgings/route `nameKo` 음차 0건("라 발므 산장" 미출현) | ✅ | Act-1 조치 #1·#4로 해소 — `src/` 전역 렌더 경로 0건 |
| 4 | `day-detail.spec.ts` 통과(홈 → Day → 숙박 연락 요소 또는 "숙소 미정") | ⚠️ 부분 | 테스트 4건 작성 완료·정적 근거로 실패 원인 제거. `playwright test` 미실행(지시) |
| 5 | `tsc`·`vitest`·`next build` 통과 | ❌ | `tsc` 2건 / `vitest` 4건 실패 — **전부 booking-tracker 소유 범위**(lodging 14건 확장·`alternative_lodging_id`)의 드리프트. 이번 Act에서 신규 실패 0건. `next build` 미실행 |

**충족: 3/5** (4번 부분 충족, 5번 미충족 — 원인은 타 사이클 이관 항목)

## 산출물

- `src/lib/schema.ts` — `LodgingKind`, `Lodging.kind`, `nameKo` optional
- `src/data/seed/lodgings.ts` — 12건 kind 배정, `chamonix-hotel` 미정 처리
- `src/lib/log.ts` — `lodging_undecided`
- `src/lib/itinerary.ts` — `getMissingFields` undecided 예외
- `src/components/day/LodgingCard.tsx`, `src/components/day/RouteList.tsx`
- Act-1 편집 6개: `src/lib/route.ts`, `src/components/map/ElevationProfile.tsx`, `src/components/map/RouteOverviewMap.tsx`, `src/components/itinerary/DayCard.tsx`, `src/components/itinerary/TravelDayCard.tsx`, `src/components/home/TodayCard.tsx`
- `tests/unit/itinerary.test.ts`, `tests/e2e/day-detail.spec.ts` (신규)
- 문서: `docs/02-design/day-detail.design.md` §5 개정(Act-1)

## Key Decisions & Outcomes (Plan §4)

| 결정 | 준수 | 결과 |
|---|:--:|---|
| `kind` 값·이름은 PRD A-2와 동일(`refuge\|village\|hotel\|undecided`), booking-tracker DB enum `lodging_kind`와 1:1 | ✅ | enum 일치. booking-tracker가 추가한 `geneva-hotel`·`zurich-hotel`도 `kind: "undecided"`로 day-detail 분기와 그대로 호환됨이 확인됨 |
| 음차(`nameKo`)는 seed에 남기되 공개·관리자 UI 어디에도 렌더하지 않는다 | ✅ (Act-1에서 완성) | Check 시점에는 `ElevationProfile`·`RouteOverviewMap`이 음차를 렌더해 결정 위반이었다. Act-1에서 `route.ts`의 `label: p.nameKo` → `nameOriginal`로 근원을 고쳐 전역 0건 달성 |
| SC-001 E2E는 날짜 고정 불가 → 홈 "오늘 카드" 링크 1탭 + Day 상세 숙박 연락 요소 확인 2탭으로 판정 | ⚠️ 조정 | `after` 분기가 `/itinerary`, `before` 분기가 `/travel/:id`로 가서 Day 상세가 아니다. E2E는 `FIRST_TREK_DAY`로 재이동해 판정하며, Act-1에서 이 동작을 설계 §5에 명문화했다. "탭 2 이하"의 엄밀 검증은 여행 기간 중 실행에서만 성립 |
| `getMissingFields`에서 undecided는 contact 누락으로 세지 않음 | ✅ | `itinerary.ts:115-116`. 명시적 상태를 결함으로 집계하지 않음 |

## Check → Act 요약

| 단계 | 내용 |
|---|---|
| Check (2026-09-17) | **90.0%** — matched 22 · partial 1 · missing 2 / 25. 게이트 미통과(−5.0%p). Critical 2 · Important 1 · Minor 2. (동시 편집 이전 11:13 시점 기준은 94.0%) |
| 특이사항 | 검증 중 booking-tracker 세션이 `schema.ts`(필수 필드 9개 추가)·`lodgings.ts`(12 → 14건)를 동시 편집해 `tsc`/`vitest`가 깨졌다. 분석은 현재 디스크 상태와 첫 실행 시점 수치를 병기했다 |
| Critical #1 | `ElevationProfile`이 Day 상세에서 `routePoints.nameKo`를 SVG 라벨·sr-only 표에 출력 → `route.ts:78`을 `nameOriginal`로, `ElevationProfile:48,72`를 `labelOriginal` 단독으로 수정 → **해소** |
| Critical #2 | 동시 편집발 `tsc` 1건·`vitest` 2건 실패 → booking-tracker 소유 파일(편집 금지) → **미해소·이관** |
| Important #3 | `TodayCard`의 `today`(in_trip) 분기에 testid 없음 → `DayCard`/`TravelDayCard`에 `linkTestId?` prop 추가, 3개 분기 전부 부착 → **해소** |
| Minor #4 | `/map` `RouteOverviewMap`의 `<title>`·`desc` 음차 → `nameOriginal` 단독 → **해소** |
| Minor #5 | 설계 §5-1 문구와 실제 링크 동작 불일치 → 링크는 유지하고 설계 문구를 구현에 맞춰 개정 → **해소(문서)** |
| Act-1 후 재계산 | 판정 변화: #18 partial → matched, #22 missing → matched, #25 missing 유지. **(24 + 0) / 25 = 96.0%** (+6.0%p) · 게이트 95 **통과** |

## 후속·미검증 항목

1. **잔여 missing 1건 (Plan §5-5, 타 사이클 이관)** — `tests/unit/itinerary.test.ts:29` 픽스처 TS2740(신규 필수 필드 9개 누락), `itinerary.test.ts:63`·`tests/unit/seed.test.ts:107`의 `toHaveLength(12)` vs 실제 14건. booking-tracker 사이클에서 픽스처를 `LodgingSeed`(`z.input`) 타입으로 바꾸고 건수·kind 분포 단언(refuge 7 / village 4)을 14건 기준으로 갱신한 뒤 day-detail을 재검증해야 한다.
2. **런타임 미검증(E2E)** — `npx playwright test tests/e2e/day-detail.spec.ts` 미실행. Critical #1·Important #3의 해소는 정적 근거뿐이므로, QA 단계에서 실제 실행해 2탭 경로·"라 발므 산장" 0건·미정 카드 표기를 확인한다.
3. **빌드 미검증** — `next build` 미실행. 타입 오류가 테스트 파일에 한정돼 빌드는 통과할 가능성이 높으나 확인되지 않았다.
4. **단위 렌더 공백** — jsdom/testing-library 미설치로 `LodgingCard` undecided 분기의 DOM 검증(배지 톤, 버튼 부재, `dl` 유지)이 없다. 또 `logEvent`가 `NODE_ENV === "test"`/`VITEST`에서 조기 반환하므로(`src/lib/log.ts:22`) `lodging_undecided` 발생 자체는 어느 테스트도 검증하지 않는다.
5. **Supabase 연결 후 할 일** — lodging이 DB(`supabase/migrations/20260917000003_lodgings.sql`)로 이동한 뒤에도 `kind` enum이 앱 `LodgingKind`와 1:1인지, undecided 행이 공개 뷰에서 링크·전화를 노출하지 않는지 확인한다. `geneva-hotel`·`zurich-hotel` 이동일 숙소 2건의 표기도 함께 점검한다.
6. **SC-001 엄밀 검증** — 여행 기간(2027-08-03~17) 밖에서는 E2E가 우회 경로로 판정한다. 시스템 시각을 기간 내로 고정한 실행 또는 `after` 분기 링크를 마지막 Day 상세로 돌리는 변경 중 하나를 QA에서 결정한다.
