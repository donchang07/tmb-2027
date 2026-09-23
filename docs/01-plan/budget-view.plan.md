# Plan — budget-view (PRD v3.1 델타: 호텔 3박 재산정)

> feature: budget-view · 순서 3/3 (v3.1 델타) · 의존: itinerary-core · 규모: 소
> 출처: `docs/PRD.md` v3.1 FR-006 · SC-003, SC-015 · D-007 · 부록 A-3 BudgetSummary · 부록 D-1
> 이전 사이클: `docs/archive/2026-09-v3.0/budget-view/` (v3.0 97.9%)
> 작성일: 2026-09-18 · 상태: approved (L4 auto)

## Executive Summary
| 관점 | 내용 |
|---|---|
| Problem | 호텔 3박 항목이 제네바·샤모니·취리히 기준(300/420)인데 v3.1은 제네바 1박·샤모니 2박이다. |
| Solution | 항목을 275/390으로 재산정(실당 €550~780 → 2인 분담)하고 소계 1,575/2,427 · 예비비 157.5/242.7 · 총액 1,732.5/2,669.7 · 권장 €1,900~3,000(약 285만~450만 원)으로 갱신한다. |
| Function UX Effect | 예산 화면 합계·권장 금액이 새 일정 기준으로 보인다. |
| Core Value | 정확한 준비 금액. |

## Context Anchor
| Key | Value |
|---|---|
| WHY | D-007 숙박 구성 변경 |
| WHO | 참가 검토자 |
| RISK | 권장값 규칙(inflated ≤ recommended ≤ inflated+100) |
| SUCCESS | 1,575/2,427 → 1,732.5/2,669.7 → 1,900/3,000 → 285만/450만 |
| SCOPE | budget seed·테스트·E2E 문자열 |

## 2. 포함 요구사항 (델타)
| ID | 요구 | 검증 |
|---|---|---|
| FR-006 / SC-003 | 10항목 합산·권장 재계산 | 산술 테스트 |
| SC-015 | 호텔 3박 = 제네바 1박·샤모니 2박 | seed 문자열 |
| D-1 | 항목명·275/390·근거·가정·notes·권장 1,900/3,000 | seed 검사 |

## 3. 범위
### In: `src/data/seed/budget.ts`, `tests/unit/budget.test.ts`, `tests/e2e/responsive.spec.ts` · Out: lib·UI(변경 없음)

## 4. 결정
- 권장 저값 1,900: 1,732.5 × 1.03² = 1,837.9 → 1,900(≤ 1,937.9 ✓). 고값 3,000: 2,669.7 × 1.05² = 2,943.3 → 3,000(≤ 3,043.3 ✓). `toKrwMan(1900)=285`, `toKrwMan(3000)=450`.

## 5. 성공 기준
1. items 10, `city-hotels` 275/390, category에 "샤모니 2박", basis에 "× 2박"
2. subtotal 1,575/2,427 · contingency 157.5/242.7 · total 1,732.5/2,669.7
3. inflated ≈ 1,837.9/2,943.3 · recommended 1,900/3,000 · KRW 285/450
4. assumptions에 "샤모니 2박(연속)", notes[0]에 "€1,900~3,000"·"285만~450만"
5. E2E 예산 화면 "€1,732.5", "€2,669.7", "€1,900 ~ €3,000", tbody 10행
6. `tsc`, `vitest`
