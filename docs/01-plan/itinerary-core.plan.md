# Plan — itinerary-core (PRD v3.1 델타: 8/16 샤모니 2박째 · 8/17 공항 직행)

> feature: itinerary-core · 순서 1/3 (v3.1 델타) · 의존: — · 규모: 소
> 출처: `docs/PRD.md` v3.1 FR-005 · SC-015 · S4 · 8.4 · Edge 케이블카 운휴 · D-006·D-007 · I-012 · 부록 A-3 · 부록 C-2 8/16·8/17
> 이전 사이클: `docs/archive/2026-09-v3.0/itinerary-core/` (v3.0 100%)
> 작성일: 2026-09-18 · 상태: approved (L4 auto)

## Executive Summary
| 관점 | 내용 |
|---|---|
| Problem | v3.1(D-007)은 8/16을 에귀 뒤 미디 관광 + 샤모니 2박째로, 8/17을 샤모니 → 제네바 공항 → 취리히 공항 직행으로 바꿨는데 구현은 v3.0(8/16 취리히 이동, 8/17 취리히 중앙역 → 공항)이다. |
| Solution | 8/16 구간을 케이블카 왕복 + 숙박(2박째) 2구간으로 줄이고 케이블카 fallback을 오후 슬롯/Montenvers로 바꾼다. 8/17을 버스(08:00→09:30 제네바 공항)·직통 IC(10:15→13:05 취리히 공항)·항공(18:40) 3구간과 공유셔틀 fallback으로 재구성한다. 8/16 `lodgingId`를 `chamonix-hotel-2`로 연결한다. |
| Function UX Effect | 8/16 카드는 관광과 연속 숙박만 보이고, 8/17 카드는 08:00 출발 원칙과 공항 도착 여유가 보인다. |
| Core Value | 마지막 이틀을 확정 일정으로 공유. |

## Context Anchor
| Key | Value |
|---|---|
| WHY | D-007 확정 일정 반영 |
| WHO | 동행 전원 |
| RISK | 8/17 장거리 이동(I-012), 직통 열차 시각 미확정 → needs_check |
| SUCCESS | 8/16 2구간·8/17 3구간·fallback·lodgingId 연결, 테스트 통과 |
| SCOPE | travel-legs 8/16·8/17, days 8/16·8/17, 테스트 |

## 2. 포함 요구사항 (델타)
| ID | 요구 | 검증 |
|---|---|---|
| FR-005 | 8/17 카드에 샤모니 → 제네바 공항 → 취리히 공항 → 인천 3구간, 08:00 이전 출발, 셔틀 fallback | seed·E2E |
| SC-015 | 8/16 케이블카 + 샤모니 2박째, 8/17 3구간 | seed 테스트 |
| Edge | 케이블카 운휴 fallback: 오후 슬롯 또는 Montenvers(이동 영향 없음) | seed 문자열 |
| C-2 | 8/16·8/17 시각·링크·주의 문구 | seed 값 |

## 3. 범위
### In: `src/data/seed/travel-legs.ts`(leg-0816-0 fallback, leg-0816-3 stay, leg-0817-0/1/2), `src/data/seed/days.ts`(8/16·8/17), `tests/unit/seed.test.ts`, `tests/e2e/responsive.spec.ts` · Out: 숙박 seed(booking-tracker), 예산(budget-view)

## 4. 결정
- 8/16 구간 id는 `leg-0816-0`(cablecar)·`leg-0816-3`(stay)만 남긴다(버스·열차 삭제). 8/17은 `leg-0817-0`(bus)·`leg-0817-1`(train)·`leg-0817-2`(flight).
- 직통 IC 시각(10:15→13:05)은 [조사·기준일 2026-09-18, 확인 필요]로 `needs_check`.

## 5. 성공 기준
1. `getTravelLegs("d2027-08-16")` 길이 2: cablecar(07:00→10:00, fallback에 "오후 슬롯" 또는 "Montenvers"), stay(destinationKo에 "2박째")
2. `getTravelLegs("d2027-08-17")` 길이 3: bus 08:00→09:30 Genève Aéroport(fallback "공유셔틀"), train Genève-Aéroport→Zürich Flughafen 13:05 도착, flight 18:40
3. 8/16 day `lodgingId === "chamonix-hotel-2"`, nameKo에 "에귀 뒤 미디"·"2박째"; 8/17 nameKo에 "취리히 공항", lodgingId 없음
4. E2E `/travel/d2027-08-16` 타임라인 2개·"2박째", `/travel/d2027-08-17` 타임라인 3개·"Genève Aéroport"·"Zürich Flughafen"·"공유셔틀"·"18:40"
5. `tsc`, `vitest`, 프로덕션 E2E
