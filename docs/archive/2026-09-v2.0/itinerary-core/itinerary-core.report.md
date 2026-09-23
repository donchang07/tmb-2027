# Report — itinerary-core (PRD v2.0 개정)

> feature: itinerary-core · 순서 1/9 · 완료일 2026-09-17 · 최종 match rate **100%** (정적, 게이트 95 통과) · 반복 횟수 **1회**(Check → Act-1)
> Plan `docs/01-plan/itinerary-core.plan.md` · Design `docs/02-design/itinerary-core.design.md` · Analysis `docs/03-analysis/itinerary-core.analysis.md`

## Executive Summary

| 관점 | 내용 (실제 결과) |
|---|---|
| Problem | 구현이 PRD v2 수치(162.5 km·9,610 m, Day 9 +740/−680)를 확정값처럼 표시했고, 8/4 아침 이동은 별도 페이지에만 있었으며 빠른 링크에 기록이 없었다. |
| Solution | seed 3종(`trip.ts`·`days.ts`·`travel-legs.ts`)을 v2.0 값으로 갱신하고 `TripSchema.timezone`을 추가했다. 홈 지표를 5타일(하강 포함)로 바꾸고 "약" 접두어를 전부 제거했다. `src/lib/phases.ts`를 신설해 빠른 링크 5개와 단계 숨김 규칙을 두고, Day 상세에 `LegTimeline` 기반 "아침 이동" 섹션을 인라인으로 넣었다. |
| Function UX Effect | 홈에서 `163.0 km · 9,750 m · 9,725 m`를 포함한 확정 지표 5개가 보이고, `/day/d2027-08-04`에서 제네바→샤모니→레주슈 2구간이 페이지 이동 없이 확인된다. 빠른 링크는 일정·예산·지도·준비물·기록 5개다. |
| Core Value | 10명이 같은 확정 수치를 본다(SC-008). Trip 합계 = Day 합계가 테스트로 고정되어 수치 드리프트가 회귀로 잡힌다. |

### 1.3 Value Delivered

| 관점 | 지표·근거 |
|---|---|
| 수치 정합성 | `computeTotals(getDays()) === trip` = {163.0, 9750, 9725} — `tests/unit/seed.test.ts` 통과. 리포지토리 전역 "162.5"·"9,610" 0건 |
| 데이터 신뢰도 | 항공 2구간 `verificationStatus: "needs_check"` + "브리프 기준, 확인 필요" notes로 미확정 정보를 확정처럼 노출하지 않음 |
| 탐색 효율 | Day 1 상세에서 아침 이동 2구간을 인라인 확인(탭 1회 절감), 빠른 링크 5개 |
| 회귀 방어 | 단위 15건(seed 13 · phases 2) + E2E 문자열 단언, `tsc` 오류 0, Act-1 후 `vitest run` 77/77 |
| 안전 기본값 | 12개 trek Day 전부 `emergency`가 "112 · 숙박 연락처"로 시작(부록 A-1) |

## Context Anchor

| Key | Value |
|---|---|
| WHY | v2 수치가 그대로 남으면 팀이 옛 데이터를 확정값으로 오인한다. |
| WHO | 동행 10명·가족(열람), 리더(편집은 booking-tracker) |
| RISK | seed 합계 테스트·E2E 문자열이 v2 값에 고정돼 있어 갱신 누락 시 테스트가 깨진다. Day 10 routePoints 추가 시 route-visuals 노드와 이름 일치 필요. |
| SUCCESS | Trip 합계 = Day 합계 = 163.0/9,750/9,725, Day 1 상세에 2구간 아침 이동, 빠른 링크 5개, 항공편 needs_check 라벨 |
| SCOPE | seed·홈·일정·Day 1 아침 이동·빠른 링크. Lodging·예산·오프라인은 다른 feature |

## FR/SC

| ID | 상태 | 근거 |
|---|---|---|
| FR-008 | ✅ 완료 | `TripMetrics.tsx` 5타일, 거리 `toFixed(1)`("163.0 km")·고도 `fmtM`(천 단위), "약" src 전역 0건 |
| FR-002 / SC-008 | ✅ 완료 | `days.ts` Day 9 = 16 km/+850/−1,015/"6 h", Day 10 = 13.5 km/+1,100/−975/"6 h" · Trip 합계 = Day 합계 (seed 산술 테스트) |
| FR-005 (이동 구간) | ✅ 완료 | 이동 구간 보유일 4개 유지 · `day/[dayId]/page.tsx` "아침 이동" 섹션(`aria-labelledby="morning-heading"`) + `LegTimeline`, 보조 링크 "이동 상세 보기 (2구간)" |
| FR-005 / 부록 B (항공) | ✅ 완료 | `travel-legs.ts` `leg-0803-1`·`leg-0817-2` `needs_check` + notes |
| 부록 A-1 (timezone) | ✅ 완료 | `src/lib/schema.ts` `TripSchema.timezone = z.literal("Europe/Paris")` + seed 값 |
| 부록 A-1 (emergency) | ✅ 완료 | `days.ts` `EMERGENCY` 상수 12개 Day 공통, "112 · 숙박 연락처"로 시작 |
| 8.1 / Edge (빠른 링크) | ✅ 완료 | `src/lib/phases.ts` `RELEASED`·`QUICK_LINKS` 5개·`visibleQuickLinks()`, 숨김 시 `nav_hidden_by_phase` info 로그(`src/lib/log.ts`) |
| FR-007 (1440×900) | ✅ 유지 | 기존 `tests/e2e/responsive.spec.ts` 커버(실행은 QA 단계) |
| SC-002 / SC-005 / SC-013 | ✅ 설계 반영 | 반응형 그리드(`grid-cols-2` / `sm:grid-cols-5`), E2E 축적 — 런타임 검증은 QA 단계 |

## Success Criteria 최종 (Plan §5)

| # | 기준 | 판정 | 근거 |
|---|---|:--:|---|
| 1 | `computeTotals(getDays())` = {163.0, 9750, 9725} = `trip` | ✅ | `tests/unit/seed.test.ts` 합계 테스트 pass |
| 2 | Day 9·10 값 + Day 10 routePoints에 "Col des Posettes" 1,997 m | ✅ | `days.ts` Balme 2191 → Posettes 1997 → Aiguillette 2201 순서, 테스트 pass |
| 3 | 12개 trek Day `emergency`가 "112 · 숙박 연락처"로 시작 | ✅ | `startsWith` 단언 pass |
| 4 | 항공 2구간 `needs_check` + notes "브리프 기준, 확인 필요" | ✅ | `travel-legs.ts` 2구간 확인, 테스트 pass |
| 5 | 홈에 "163.0 km"·"9,750 m"·"9,725 m", "약 " 없음 | ✅ | `TripMetrics.tsx` + `responsive.spec.ts` 단언, "약" 0건 |
| 6 | `/day/d2027-08-04`에 "아침 이동" 제목과 2구간 렌더 | ✅ | Act-1에서 E2E 테스트 추가(제목·2구간·제네바/레주슈·보조 링크 단언) |
| 7 | `visibleQuickLinks()` 5개, 하나 false → 4개 + 로그 1회 | ✅ | `tests/unit/phases.test.ts` 2건 pass |
| 8 | `tsc`·`vitest`·`next build` 통과 | ⚠️ 부분 | `tsc` 오류 0 · `vitest run` 77/77 pass · `next build`는 이번 Check 범위 밖(미실행) |

**충족: 7/8** (8번은 `next build` 미실행으로 부분 충족)

## 산출물

- `src/lib/schema.ts` — `TripSchema.timezone`
- `src/data/seed/trip.ts`, `src/data/seed/days.ts`, `src/data/seed/travel-legs.ts`
- `src/lib/phases.ts` (신규), `src/lib/log.ts` (`nav_hidden_by_phase`)
- `src/components/home/TripMetrics.tsx`, `src/components/home/QuickLinks.tsx`
- `src/app/day/[dayId]/page.tsx` (아침 이동 섹션), `src/components/travel/LegTimeline.tsx` (재사용)
- `tests/unit/seed.test.ts`, `tests/unit/phases.test.ts` (신규), `tests/e2e/responsive.spec.ts`
- 문서: `docs/02-design/itinerary-core.design.md` §2.2·§4·§6 정정(Act-1)

## Key Decisions & Outcomes (Plan §4)

| 결정 | 준수 | 결과 |
|---|:--:|---|
| Trip 합계는 seed 상수로 두고 테스트가 Day 합계와 대조(11.3 "반올림 없음") | ✅ | `seed.test.ts`가 상수 vs 계산값을 대조. 이후 Day 수치 변경 시 즉시 실패하는 구조 확보 |
| 단계 규칙은 `phases.ts`의 `RELEASED` 상수(현재 전부 true), false면 렌더 생략 + `nav_hidden_by_phase` 로그 | ✅ | 구현·테스트 모두 일치. 링크 숨김이 조용한 실패가 되지 않도록 info 로그로 관측 가능 |
| Day 1 '아침 이동'은 `legs.length > 0`인 trek Day에 섹션 렌더, `/travel/{dayId}` 링크는 보조로 유지 | ✅ | 조건부 렌더 + 보조 링크 "이동 상세 보기 (2구간)" 확인. 구 링크 잔존 0건 |
| (Act-1 추가) 거리 포맷은 `fmtKm` 대신 `toFixed(1)` — 코드가 진실 | ✅ | `fmtKm`는 `maximumFractionDigits: 1`이라 163 → "163 km"로 깨짐. 설계 문서를 코드에 맞춰 정정(저위험 선택) |

## Check → Act 요약

| 단계 | 내용 |
|---|---|
| Check (gap-detector, 2026-09-17) | **93.3%** — matched 27 · partial 2 · missing 1 / 30. 게이트 95 미통과(−1.7%p). Critical 0 · Important 1 · Minor 2 |
| Important #1 | Plan SC-6(Day 1 "아침 이동" 렌더)을 검증하는 자동 테스트 부재 → `responsive.spec.ts`에 E2E 1건 추가, 설계 §6 목록 갱신 → **matched** |
| Minor #2 | 설계 §4의 `fmtKm` 지정이 실제 요구 문자열("163.0 km")과 충돌 → 설계를 `toFixed(1)`로 정정 → **matched** |
| Minor #3 | 설계 §2.2 `EMERGENCY` 리터럴이 실제 상수와 불일치 → 설계를 실제 값으로 정정 → **matched** |
| Act-1 후 재계산 | **30/30 = 100% (정적)** · 게이트 95 통과 · `tsc` 오류 0 · `vitest run` 77/77 |

## 후속·미검증 항목

1. **런타임 미검증(E2E)** — `npx playwright test tests/e2e/responsive.spec.ts` 미실행. 홈 지표 3개 문자열 렌더, 6개 페이지 가로 스크롤·44px 탭 타깃·axe(SC-005), Act-1에서 추가한 Day 1 "아침 이동" 테스트가 모두 실행 대기 상태다. QA 단계(전체 feature 완료 후 일괄 `playwright test`)에서 수행한다.
2. **빌드 미검증** — `next build`(Plan §5-8)는 이번 Check 범위 밖이었다. QA 단계에서 실행해 Success Criteria 8번을 마감한다.
3. **시각 검증** — `TripMetrics`·`QuickLinks`의 모바일 `grid-cols-2` / 데스크톱 1440×900 `sm:grid-cols-5` 실제 레이아웃(FR-007)은 스크린샷 확인 필요.
4. **Supabase 연결 후 할 일** — 이번 feature는 seed 정적 데이터만 다루므로 Supabase 의존 없음. 단 booking-tracker가 lodging을 DB로 옮긴 뒤 `days.ts`/`lodgings.ts` 참조 정합성을 한 번 재확인한다.
5. **Minor 잔여** — 없음(Act-1에서 Minor 2건 모두 문서 정정으로 해소). 다만 `fmtKm`의 `minimumFractionDigits` 미설정은 그대로이므로, 다른 화면에서 "163.0 km" 형식이 필요해지면 `src/lib/format.ts` 수정 + 기존 호출부 회귀 확인이 선행돼야 한다.
6. **교차 의존** — Day 10 `routePoints`의 "Col des Posettes"(1,997 m)는 route-visuals의 노드명과 일치해야 한다. route-visuals 사이클에서 노드 정합성 확인 완료 여부를 최종 QA에서 교차 점검한다.
