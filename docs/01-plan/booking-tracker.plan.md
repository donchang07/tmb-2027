# Plan — booking-tracker (PRD v3.1 델타: 취리히 호텔 → 샤모니 2박째)

> feature: booking-tracker · 순서 2/3 (v3.1 델타) · 의존: itinerary-core · 규모: 소
> 출처: `docs/PRD.md` v3.1 FR-010 · D-007 · 8.4 · 부록 A-2 · 부록 C-2 8/16 · 부록 C-4 3번
> 이전 사이클: `docs/archive/2026-09-v3.0/booking-tracker/` (v2.0 사이클 97.9%)
> 작성일: 2026-09-18 · 상태: approved (L4 auto)

## Executive Summary
| 관점 | 내용 |
|---|---|
| Problem | 14박 관리 대상 중 8/16 숙박이 취리히 호텔(`zurich-hotel`, 후보 4곳)로 남아 있으나 v3.1은 8/15와 같은 샤모니 호텔 2박째다. |
| Solution | seed와 마이그레이션의 `zurich-hotel`을 `chamonix-hotel-2`(dayId 8/16, kind undecided, FR, 후보 없음, "2박 연속 예약" 안내)로 교체하고 bookings 초기 행도 바꾼다. 14박 수는 유지. |
| Function UX Effect | 8/16 이동일 숙박 카드와 관리자 14행 목록에 "샤모니의 호텔(미정) · 2박째"가 보인다. |
| Core Value | 리더의 예약 관리 대상이 실제 일정과 일치. |

## Context Anchor
| Key | Value |
|---|---|
| WHY | D-007 |
| WHO | 리더, 방문자 |
| RISK | seed↔마이그레이션 문구 불일치, 남은 `zurich-hotel` 참조 |
| SUCCESS | 코드·SQL·테스트에 zurich-hotel 0건, 14박 유지, E2E 통과 |
| SCOPE | lodgings seed, migration 000003, 테스트·E2E |

## 2. 포함 요구사항 (델타)
| ID | 요구 | 검증 |
|---|---|---|
| FR-010 / N-007 | 14박: 제네바 1·트레킹 11·샤모니 2 | seed 14개, dayId 1:1 |
| A-2 / I-006 | 마이그레이션 seed 행·bookings 초기 행이 seed와 일치 | SQL 텍스트 테스트 |
| 8.4 | 8/16 숙박 블록: "2박째", "숙소 미정", 후보 없음, 폼 없음 | security E2E |

## 3. 범위
### In: `src/data/seed/lodgings.ts`, `supabase/migrations/20260917000003_lodgings.sql`, `tests/unit/{lodgings,bookings,itinerary,seed}.test.ts`, `tests/e2e/security.spec.ts` · Out: 관리자 UI 로직(변경 없음)

## 4. 결정
- 8/15·8/16을 하나의 lodging으로 합치지 않는다(Day↔Lodging 1:1, 예약 상태 관리 단위 유지). 대신 `chamonix-hotel-2`의 notes에 "8/15 숙소와 동일 호텔 2박 연속 예약"을 명시.
- 아직 적용 전인 마이그레이션이므로 000003의 행을 직접 교체(연결 후에는 8.7에서 갱신).

## 5. 성공 기준
1. `zurich-hotel` 문자열이 src·tests·supabase에 0건
2. seed `chamonix-hotel-2`: dayId 8/16, kind undecided, country FR, candidates [], notes에 "2박 연속"; SQL에 동일 행·notes, bookings insert에 `chamonix-hotel-2`
3. 기존 14박·kind 분포 테스트 갱신 후 통과, security E2E 8/16 케이스 통과
4. `tsc`, `vitest`
