# Plan — day-detail (PRD v3.0 델타: FR-018 정본 동기화 + Day 12 숙박 권장 문구)

> feature: day-detail · 순서 3/3 (v3.0 델타) · 의존: itinerary-core · 규모: 소
> 출처: `docs/PRD.md` v3.0 FR-003(좌표·산길 링크), FR-018(GPX), SC-014 · N-013~N-015 · 부록 A-1 RouteSegment/GpxEntry · 부록 C-3 Day 12 숙박 권장
> 이전 사이클: `docs/archive/2026-09-v2.0/day-detail/` (v2.0 96%, Act-2~4로 좌표·산길 링크·GPX 구현 완료)
> 작성일: 2026-09-18 · 상태: approved (L4 auto)

## Executive Summary
| 관점 | 내용 |
|---|---|
| Problem | FR-003 보완·FR-018(GPX)은 v2.0 사이클의 Act-2~4로 이미 구현됐지만 Plan/Design 정본에 없고, v3.0의 Day 12 숙박 권장 문구(승강장 도보 10분 이내)가 seed·마이그레이션에 없다. |
| Solution | 구현 완료분을 Design에 정식 명세로 옮기고(설계-구현 동기화), Day 12 숙박 `season`/`notes`와 마이그레이션 seed 행을 v3.0 문구로 갱신한다. |
| Function UX Effect | Day 12 숙박 카드에 "에귀 뒤 미디 승강장 도보 10분 이내 권장"이 보인다. |
| Core Value | 정본·설계·구현 3자 일치. |

## Context Anchor
| Key | Value |
|---|---|
| WHY | 정본 동기화·Day 12 숙박 조건 반영 |
| WHO | 리더(예약), 방문자 |
| RISK | 마이그레이션 seed 행과 TS seed의 문구 불일치 |
| SUCCESS | Design이 FR-003/FR-018 구현을 정확히 기술, Day 12 문구 seed↔SQL 일치, 기존 테스트 통과 |
| SCOPE | 설계 문서, lodgings seed·SQL Day 12 문구, 테스트 |

## 2. 포함 요구사항 (델타)
| ID | 요구 | 검증 |
|---|---|---|
| FR-003 | 경유지 좌표 + GraphHopper 산길 링크(구현 완료) | 기존 `map-url.test`·`route.test` |
| FR-018 / SC-014 | 12개 GPX 다운로드(구현 완료) | 기존 `gpx.test`·E2E |
| C-3 Day 12 | 숙박 카드에 "에귀 뒤 미디 승강장 도보 10분 이내 권장" | seed·SQL 텍스트 테스트 |

## 3. 범위
### In: `docs/02-design/day-detail.design.md`(정식 명세), `src/data/seed/lodgings.ts` chamonix-hotel `season`·`notes`, `supabase/migrations/20260917000003_lodgings.sql` 동일 행, `tests/unit/lodgings.test.ts` · Out: 코드 로직 변경

## 4. 결정
- 이미 적용되지 않은 마이그레이션(Supabase 미연결)이므로 000003의 seed 행을 직접 갱신한다(연결 후에는 리더가 8.7에서 갱신).

## 5. 성공 기준
1. Design §7·§8이 `map-url.ts`·`route.ts`·`gpx.ts`·`MapLinkCard`·`build-gpx.mjs` 실제 구현과 일치
2. chamonix-hotel `notes`에 "승강장 도보 10분", seed와 SQL 문구 동일
3. `tsc`, `vitest`, E2E day-detail 통과
