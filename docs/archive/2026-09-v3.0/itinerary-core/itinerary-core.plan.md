# Plan — itinerary-core (PRD v3.0 델타: 8/16 에귀 뒤 미디 관광)

> feature: itinerary-core · 순서 1/3 (v3.0 델타) · 의존: — · 규모: 소
> 출처: `docs/PRD.md` v3.0 FR-005 · SC-015 · S4 · 8.4 · Edge "케이블카 운휴·악천후" · D-006 · I-009 · 부록 A-3 `TravelLeg.mode cablecar` · 부록 C-2 8/16
> 이전 사이클: `docs/archive/2026-09-v2.0/itinerary-core/` (v2.0 100%)
> 작성일: 2026-09-18 · 상태: approved (L4 auto)

## Executive Summary
| 관점 | 내용 |
|---|---|
| Problem | v3.0은 8/16 아침 에귀 뒤 미디 케이블카 관광(D-006)을 확정했지만 구현의 8/16 이동일은 09:30 버스 출발 기준이고 `TravelMode`에 케이블카가 없다. |
| Solution | `TravelMode`에 `cablecar`를 추가하고 8/16 구간을 케이블카 왕복(06:30~10:00) → 11:30 버스 → 13:30 IC → 17:00 취리히로 재구성한다. 운휴 fallback과 `cablecar_suspended` 로그, 고도 주의 문구를 이동일 카드에 표시한다. |
| Function UX Effect | 8/16 카드 첫 구간에서 케이블카 슬롯·예약 링크·주의·운휴 대안을 보고, 이후 버스·열차 시각이 새 일정으로 보인다. |
| Core Value | 원정 마무리 관광까지 한 화면에서 확정 일정으로 공유한다. |

## Context Anchor
| Key | Value |
|---|---|
| WHY | D-006 확정 일정과 화면 불일치 방지 |
| WHO | 동행 전원(열람), 리더(예약) |
| RISK | 2027 운행 시간·요금 미확정 → needs_check 라벨과 재확인일 유지 |
| SUCCESS | 8/16 카드에 케이블카 구간·운휴 fallback, 이후 구간 시각 갱신, 테스트 통과 |
| SCOPE | schema TravelMode, travel-legs 8/16, days 8/16 notes, MODE_LABEL, LegTimeline 케이블카 주의, log 코드, 테스트 |

## 2. 포함 요구사항 (델타)
| ID | 요구 | 검증 |
|---|---|---|
| FR-005 | 8/16 카드 첫 구간에 케이블카 왕복(출발·도착·소요·예약 링크·운휴 fallback) 표시, `mode: cablecar` | seed·렌더 테스트 |
| SC-015 | 8/16 카드가 케이블카 구간과 운휴 시 09:30 버스 복귀 fallback을 표시 | travel-legs 단위 테스트 |
| Edge | 케이블카 운휴 → "에귀 뒤 미디 운휴 · 09:30 버스 일정으로 이동", `cablecar_suspended` info | 로그 코드 존재 |
| A-3 | `TravelMode` enum에 `cablecar` | schema |
| C-2 | 8/16: 케이블카 07:00 슬롯 → 11:30 버스 → 13:30 IC → 17:00~17:30 취리히 | seed 값 |

## 3. 범위
### In
- `src/lib/schema.ts` TravelMode + `cablecar`
- `src/lib/format.ts` MODE_LABEL `cablecar: "케이블카"`
- `src/data/seed/travel-legs.ts`: `leg-0816-0`(sequence 1, cablecar 왕복) 신설, 기존 버스·열차·숙박 구간 sequence·시각 갱신
- `src/data/seed/days.ts` 8/16 `nameKo/nameOriginal/notes` 갱신
- `src/components/travel/LegTimeline.tsx`: cablecar 구간에 고도 주의 문구(notes 활용) — 기존 렌더 재사용
- `src/lib/log.ts` `cablecar_suspended`
- `tests/unit/seed.test.ts`(SC-015), `tests/unit/sw-rules.test.ts` 무관, E2E `responsive.spec.ts` 8/16 카드 케이블카 라벨
### Out
- 예산(budget-view), 실제 예약 처리, 실시간 운행 상태 조회(비목표)

## 4. 결정
- 케이블카는 왕복 1구간(`mode: cablecar`, 출발 07:00·도착 10:00, duration "왕복 약 3 h(탑승 40분 + 전망 60~90분 + 대기)")으로 표현하고 상행·하행을 나누지 않는다.
- 운휴 판정은 앱이 하지 않는다. fallback 문구로 안내하고, 리더가 당일 판단한다(`cablecar_suspended`는 fallback 표시 시점의 정보 로그 코드로 등록).
- 시각은 PRD C-2 값을 그대로 seed에 넣고 `verificationStatus: "needs_check"`(2027 시간표 미확정).

## 5. 성공 기준
1. `TravelMode.parse("cablecar")` 통과, MODE_LABEL에 케이블카
2. 8/16 legs: sequence 1이 cablecar(07:00→10:00, bookingUrl montblancnaturalresort.com, fallback에 "09:30 버스"), sequence 2 버스 11:30→13:00~13:30, sequence 3 IC 13:30→17:00, sequence 4 stay
3. days 8/16 nameKo에 "에귀 뒤 미디" 포함
4. `LogCode`에 `cablecar_suspended`
5. `/travel/d2027-08-16` 렌더에 "케이블카", "Aiguille du Midi", "운휴" 문구
6. `tsc`, `vitest`, `next build`
