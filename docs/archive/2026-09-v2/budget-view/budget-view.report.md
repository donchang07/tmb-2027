# Report — budget-view

> feature: budget-view (3/8) · 완료일 2026-09-16 · 최종 match rate **98%** (게이트 95 통과)
> Plan `docs/01-plan/budget-view.plan.md` · Design `docs/02-design/budget-view.design.md` · Analysis `docs/03-analysis/budget-view.analysis.md`

## 요약
부록 D-1의 9개 항목을 seed로 고정하고 `/budget`에서 저/중 소계·예비비 10%·총액을 자동 계산해 표시한다. 환율(CHF/EUR 1.07, EUR/KRW 1500)·기준일(2026-09-09)·재확인 기한(2027-03-31)과 상태 배지를 함께 보여 주며, 기한이 지나면 “금액을 다시 확인해 주세요” 경고와 `budget_stale` 로그를 남긴다.

## FR/SC
| ID | 상태 | 근거 |
|---|---|---|
| FR-006 | 완료 | BudgetTable + BudgetMeta, `computeBudget` |
| SC-003 | 통과 | budget.test — 합계 일치, 오차 ≤ €1 |

## 산출물
- `src/lib/schema.ts`(+Budget 스키마 3종), `src/data/seed/budget.ts`, `src/lib/budget.ts`
- `src/components/budget/{BudgetTable,BudgetMeta}.tsx`, `src/app/budget/{page,loading}.tsx`
- `tests/unit/budget.test.ts`

## 결정
- 재확인 기한 2027-03-31 [기본값] — 예약·결제 전 재확인 시점
- 표시 통화 EUR 단일, KRW는 권장 금액에만 병기
