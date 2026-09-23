# Plan — budget-view (PRD v3.0 델타: 에귀 뒤 미디 케이블카 항목)

> feature: budget-view · 순서 2/3 (v3.0 델타) · 의존: itinerary-core · 규모: 소
> 출처: `docs/PRD.md` v3.0 FR-006 · SC-003, SC-015 · D-006 · 부록 A-3 BudgetSummary · 부록 D-1
> 이전 사이클: `docs/archive/2026-09-v2.0/budget-view/` (v2.0 96.9%)
> 작성일: 2026-09-18 · 상태: approved (L4 auto)

## Executive Summary
| 관점 | 내용 |
|---|---|
| Problem | 8/16 에귀 뒤 미디 케이블카(성인 왕복 €75~80)가 예산에 없다. |
| Solution | D-1에 10번째 항목을 추가하고 소계 1,600/2,457 · 예비비 160/245.7 · 총액 1,760/2,702.7 · 권장 €1,950~3,000(약 295만~450만 원)으로 재산정한다. 가정 문구를 "트레킹 구간 케이블카 미사용, 8/16 관광 케이블카만 포함"으로 바꾼다. |
| Function UX Effect | 예산 화면에 케이블카 항목과 갱신된 합계·권장 금액이 자동 계산돼 보인다. |
| Core Value | 참가 결정을 위한 정확한 준비 금액. |

## Context Anchor
| Key | Value |
|---|---|
| WHY | 관광 비용 누락 방지 |
| WHO | 참가 검토자 |
| RISK | 2027 요금 미확정 → basis에 확인 필요 표기 |
| SUCCESS | 소계 1,600/2,457 · 총액 1,760/2,702.7 · 권장 1,950/3,000 · 원화 295만/450만 |
| SCOPE | budget seed·테스트·E2E 문자열 |

## 2. 포함 요구사항 (델타)
| ID | 요구 | 검증 |
|---|---|---|
| FR-006 | 10항목 합산, 권장 준비 금액 재계산 | 산술 테스트 |
| SC-003 | 소계·예비비·총액·권장이 항목 합계와 일치, 반올림 오차 €1 이하 | 단위 테스트 |
| SC-015 | 예산 표에 케이블카 항목 포함 | seed 검사 |
| D-1 | 항목 "에귀 뒤 미디 케이블카 왕복(8/16 관광)" 75/80, 가정 문구, notes 권장 금액 문구 | seed 검사 |

## 3. 범위
### In: `src/data/seed/budget.ts`, `tests/unit/budget.test.ts`, `tests/e2e/responsive.spec.ts` 예산 문자열 · Out: lib 로직(변경 없음), UI 컴포넌트(변경 없음)

## 4. 결정
- 권장값은 v2.0과 같은 방식으로 작성자 고정 상수(1,950/3,000)이며 테스트는 `inflated ≤ recommended ≤ inflated + 100` 규칙을 유지한다(1,867.2 ≤ 1,950 ≤ 1,967.2 ✓, 2,979.7 ≤ 3,000 ≤ 3,079.7 ✓).
- `toKrwMan(1950)=295`, `toKrwMan(3000)=450`.

## 5. 성공 기준
1. items 10개, 마지막 항목 id `aiguille-du-midi` 75/80
2. subtotal 1,600/2,457 · contingency 160/245.7 · total 1,760/2,702.7
3. inflated ≈ 1,867.2/2,979.7 · recommended 1,950/3,000 · KRW 295/450
4. assumptions에 "에귀 뒤 미디", notes[0]에 "€1,950~3,000"과 "295만~450만"
5. E2E 예산 화면에 "€1,760", "€2,702.7", "€1,950 ~ €3,000", tbody 10행
6. `tsc`, `vitest`
