# Design — budget-view (PRD v3.0 델타)

> feature: budget-view · Plan: `docs/01-plan/budget-view.plan.md` · 의존: itinerary-core
> 작성일: 2026-09-18 · 상태: approved (L4 auto)

## Context Anchor
| Key | Value |
|---|---|
| WHY | 케이블카 비용 반영 |
| WHO | 참가 검토자 |
| RISK | 요금 미확정 |
| SUCCESS | 1,600/2,457 → 1,760/2,702.7 → 1,950~3,000 → 295만~450만 |
| SCOPE | seed·테스트 |

## 1. 파일
```
src/data/seed/budget.ts          항목 추가·가정·notes·권장값
tests/unit/budget.test.ts        수치 갱신 + 케이블카 항목 검사
tests/e2e/responsive.spec.ts     예산 문자열·행 수
```

## 2. seed (`budget.ts`)
```ts
// budgetItems 마지막에 추가
{ id: "aiguille-du-midi", category: "에귀 뒤 미디 케이블카 왕복(8/16 관광)", lowEur: 75, midEur: 80,
  basis: "성인 왕복 2025 €75, 2027 인상 대비 €80. Compagnie du Mont Blanc 온라인 시간대 예약 [확정 2026-09-18, 요금 확인 필요]",
  sourceCheckedAt: "2026-09-18" }
budgetMeta.checkedAt: "2026-09-18"
assumptions[2]: "트레킹 구간 리프트·케이블카 비용 없음(전 구간 도보), 8/16 에귀 뒤 미디 관광 케이블카만 포함"
notes[0]: "권장 준비 금액: 2027년 물가 인상(연 3~5%, 2년) 반영 1인 약 €1,950~3,000 (약 295만~450만 원, 1 EUR ≈ 1,500원)"
recommendedLowEur: 1950, recommendedHighEur: 3000
```
`computeBudget`·`BudgetMeta.tsx`·`BudgetTable.tsx`는 변경 없음(항목 수·합계는 자동).

## 3. 테스트
- `budget.test.ts`: items 10, subtotal {1600, 2457}, contingency {160, 245.7}, total {1760, 2702.7}, inflatedLow ≈ 1867.2 (±0.2), inflatedHigh ≈ 2979.7, recommended 1950/3000, `inflated ≤ recommended ≤ inflated+100`, toKrwMan 295/450, 케이블카 항목 존재·basis에 "확인 필요"
- `responsive.spec.ts`: `tbody tr` 10, tfoot에 "€1,760", "€2,702.7", "€1,950 ~ €3,000"
