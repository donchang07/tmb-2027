# Plan — today-and-safety (PRD v2.0 신규 feature)

> feature: today-and-safety · 순서 4/9 · 의존: day-detail · 규모: 소
> 출처: `docs/PRD.md` v2.0 FR-009, FR-014 · SC-010 · S1, S5 · 8.1, 8.3 · Edge "여행 기간 밖" · 11.2 #4 · N-004, N-005 · 부록 C-3 대안
> 작성일: 2026-09-17 · 상태: approved (L4 auto)

## Executive Summary
| 관점 | 내용 |
|---|---|
| Problem | v2.0은 모든 날짜 판정을 Europe/Paris로 확정하고 D-day 문구에 "(현지 기준)"을 붙이며, Day 2~11 전부에 실제 우천·피로 대안 문장(“확인 필요” 0건)을 요구한다. 기존 대안 문장은 v2 조사분이고 SafetyCard는 "확인 필요"를 기본값으로 쓴다. |
| Solution | Day 2~11 fallback을 PRD C-3 2026-09-16 대안 문장으로 교체하고, TodayCard 문구를 "출발까지 D-N (현지 기준)"으로 맞추며, SC-010 검증 테스트와 한국 08:00 = 파리 01:00 경계 테스트를 추가한다. |
| Function UX Effect | 출발 전 한국에서 봐도 현지 기준 D-day가 명시되고, 각 Day 안전 카드에 구체적 우회·버스 대안이 보인다. |
| Core Value | 산행 중 의사결정을 한 화면에서 끝낸다. |

## Context Anchor
| Key | Value |
|---|---|
| WHY | 시간대 혼동·대안 부재는 현장 판단 지연으로 이어진다 |
| WHO | 동행 전원 |
| RISK | days.ts는 itinerary-core가 먼저 수정하므로 순서 의존 |
| SUCCESS | D-N 문구 "(현지 기준)", Day 2~11 대안에 "확인 필요" 0건, 경계 테스트 통과 |
| SCOPE | dates·TodayCard·days.ts fallback·SafetyCard·테스트 |

## 2. 포함 요구사항
| ID | 요구 | 검증 |
|---|---|---|
| FR-009 | 기간 내 오늘 카드 강조, 기간 밖 "출발까지 D-N (현지 기준)" 또는 "원정이 종료되었습니다"(8/17 Europe/Paris 자정 이후), 모든 판정 Europe/Paris | 경계 단위 테스트(KST 08:00 = 파리 01:00) |
| FR-014 | Day 2~11 우천·피로 대안, 12개 Day 112·숙박 연락 수단. Day 1·12 선택 | seed 완전성 테스트 |
| SC-010 | Day 2~11 "확인 필요" 0건 | 단위 테스트 |

## 3. 범위
### In
- `src/data/seed/days.ts`: Day 2~11 fallback을 PRD C-3 대안 문장으로 교체(Day 1·12 유지)
- `src/components/home/TodayCard.tsx`: 제목 "출발까지 D-N (현지 기준)", `data-testid="today-card-link"`
- `src/components/day/SafetyCard.tsx`: fallback 없을 때 "대안 선택 사항(Day 1·12)" 문구, 있으면 원문; emergency 기본 "112 · 숙박 연락처"
- `tests/unit/dates.test.ts`(KST 08:00 경계 케이스), `tests/unit/seed.test.ts`(SC-010)
### Out
- 예약 상태 캐시(offline-pwa)

## 4. 결정
- "원정이 종료되었습니다"는 Paris 날짜 > endDate(8/18 00:00 CEST 이후)로 판정(기존 `resolveTodayState` 유지).
- SafetyCard의 "확인 필요" 기본 문구는 Day 1·12만 해당할 수 있으므로 "대안 선택 사항" 표기로 바꾸되, 현재 seed는 Day 1·12도 문장이 있으므로 화면에서는 나타나지 않는다.

## 5. 성공 기준
1. `resolveTodayState("2027-08-02T23:00:00Z")`(파리 8/3 01:00) → in_trip Day 8/3; `"2027-08-17T22:00:00Z"` → after
2. Day 2~11 fallback 길이 ≥ 20, "확인 필요" 미포함, 우천·피로 관련 어휘 포함
3. TodayCard 기간 밖 렌더에 "(현지 기준)"
4. `tsc`, `vitest`, `next build`
