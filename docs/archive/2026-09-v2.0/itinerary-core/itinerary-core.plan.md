# Plan — itinerary-core (PRD v2.0 개정)

> feature: itinerary-core · 순서 1/9 · 의존: — · 규모: 중
> 출처: `docs/PRD.md` v2.0 FR-001, FR-002, FR-005, FR-007, FR-008, FR-017 · SC-002, SC-005, SC-008, SC-013 · 8.1, 8.2, 8.3(아침 이동), 11.3, 부록 A-1, C-1, C-2, C-3
> 이전 사이클: `docs/archive/2026-09-v2/itinerary-core/` (v2 기준 완료) · 이번 사이클은 v2.0 델타만 다룬다
> 작성일: 2026-09-17 · 상태: approved (L4 auto)

## Executive Summary
| 관점 | 내용 |
|---|---|
| Problem | v2.0에서 홈 지표(163.0 km·9,750 m·9,725 m), Day 9·10 수치, 이동 구간(8/4 아침 이동을 Day 1 안에), 항공편 라벨, 빠른 링크 규칙이 바뀌었는데 구현은 v2 값(162.5·9,610, Day 9 +740/−680 등)을 표시한다. |
| Solution | seed(trip·days·travel-legs)를 v2.0 값으로 갱신하고, 홈 지표에 하강을 추가하며 "약" 접두어를 제거한다. Day 1 상세에 ‘아침 이동’ 타임라인을 인라인으로 넣고, 빠른 링크에 기록을 추가하고 단계 숨김 규칙(`nav_hidden_by_phase`)을 둔다. |
| Function UX Effect | 방문자는 홈에서 v2.0 확정 지표 5개를 보고, Day 1 상세 안에서 제네바→샤모니→레주슈 이동을 바로 확인한다. |
| Core Value | 10명이 같은 확정 수치를 본다(SC-008). |

## Context Anchor
| Key | Value |
|---|---|
| WHY | v2 수치가 그대로 남으면 팀이 옛 데이터를 확정값으로 오인한다. |
| WHO | 동행 10명·가족(열람), 리더(편집은 booking-tracker) |
| RISK | seed 합계 테스트·E2E 문자열이 v2 값에 고정돼 있어 갱신 누락 시 테스트가 깨진다. Day 10 routePoints 추가 시 route-visuals 노드와 이름 일치 필요. |
| SUCCESS | Trip 합계 = Day 합계 = 163.0/9,750/9,725, Day 1 상세에 2구간 아침 이동, 빠른 링크 5개, 항공편 needs_check 라벨 |
| SCOPE | seed·홈·일정·Day 1 아침 이동·빠른 링크. Lodging·예산·오프라인은 다른 feature |

## 1. 목표
v2.0 부록 C-1·C-2·A-1과 8.1을 구현에 그대로 반영한다.

## 2. 포함 요구사항 (델타)
| ID | v2.0 변경 | 검증 |
|---|---|---|
| FR-008 | 홈 지표 163.0 km · 획득 9,750 m · 하강 9,725 m, 거리 소수 1자리·고도 천 단위, "약" 없음 | 렌더 테스트·E2E 문자열 |
| FR-002/SC-008 | Day 9: 16 km +850/−1,015 6 h · Day 10: 13.5 km +1,100/−975 6 h, Col des Posettes(1,997 m) 경유점 · Trip 합계 = Day 합계 | seed 산술 테스트 |
| FR-005 | 이동 구간이 있는 날 4개(8/3·8/4·8/16·8/17). 8/4 아침 구간은 Day 1 상세 ‘아침 이동’ 섹션에 인라인 표시 | Day 1 상세 렌더 테스트 |
| FR-005/부록 B | 항공편 2구간은 "브리프 기준, 확인 필요" → `verificationStatus: needs_check` | seed 검사 |
| A-1 | `Trip.timezone = "Europe/Paris"` | schema |
| A-1 | `Day.emergency` 기본값 "112 · 숙박 연락처" | seed 검사 |
| 8.1 / Edge | 빠른 링크: 일정, 예산, 지도, 준비물, 기록 · 단계 미배포 링크 숨김 + `nav_hidden_by_phase` info 로그 | 단위 테스트 |
| FR-007 | 1440×900 데스크톱 포함 (이미 충족) | 기존 E2E |

## 3. 범위
### In
- `src/data/seed/trip.ts`, `days.ts`, `travel-legs.ts`, `src/lib/schema.ts`(timezone)
- `src/components/home/TripMetrics.tsx`(하강 타일, "약" 제거), `QuickLinks.tsx`(5개 + 단계 규칙), `src/lib/phases.ts`(신규), `src/lib/log.ts`(`nav_hidden_by_phase`)
- `src/app/day/[dayId]/page.tsx`: 아침 이동 섹션(`LegTimeline` 재사용)
- 테스트: `tests/unit/seed.test.ts`(합계·Day 9/10·emergency·항공 needs_check), `tests/unit/phases.test.ts`, `tests/e2e/responsive.spec.ts` 문자열
### Out
- Lodging 14박·kind(day-detail, booking-tracker), 예산(budget-view), 고개 노드(route-visuals), FR-017 산장·고개 원어 표기(day-detail)

## 4. 결정
- Trip 합계는 seed 상수로 두고 테스트가 Day 합계와 대조한다(11.3 "반올림 없음").
- 단계 규칙은 `src/lib/phases.ts`의 `RELEASED = { itinerary, budget, map, packing, journal }` 상수(현재 전부 true). false인 링크는 렌더하지 않고 `nav_hidden_by_phase`를 로그한다.
- Day 1 ‘아침 이동’은 `legs.length > 0`인 trek Day에 섹션으로 렌더하고 `/travel/{dayId}` 링크는 보조로 유지한다.

## 5. 성공 기준
1. `computeTotals(getDays())` = {163.0, 9750, 9725} = `trip` 값
2. Day 9·10 값과 Day 10 routePoints에 "Col des Posettes" 1,997 m 포함
3. 12개 trek Day의 `emergency`가 "112 · 숙박 연락처"로 시작
4. 항공편 2구간 `verificationStatus === "needs_check"`, notes에 "브리프 기준, 확인 필요"
5. 홈 지표 텍스트 "163.0 km", "9,750 m", "9,725 m" 존재, "약 " 없음
6. `/day/d2027-08-04`에 "아침 이동" 제목과 2구간 렌더
7. `visibleQuickLinks()`가 5개 반환, 하나를 false로 두면 4개 + 로그 호출
8. `tsc`, `vitest`, `next build` 통과
