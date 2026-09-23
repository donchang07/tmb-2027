# Design — budget-view (PRD v3.1 델타)

> feature: budget-view · Plan: `docs/01-plan/budget-view.plan.md` · 의존: itinerary-core
> 작성일: 2026-09-18 · 상태: approved (L4 auto)

## Context Anchor
| Key | Value |
|---|---|
| WHY | 호텔 3박 구성 변경(D-007) |
| WHO | 참가 검토자 |
| RISK | 권장값 규칙 |
| SUCCESS | 1,560/2,430 → 1,716/2,673 → 1,900~3,000 → 285만~450만 (케이블카 60/83 실측 반영) |
| SCOPE | seed·테스트 |

## 1. 파일
```
src/data/seed/budget.ts          city-hotels 항목·가정·notes·recommendedLowEur
tests/unit/budget.test.ts        수치 갱신
tests/e2e/responsive.spec.ts     예산 문자열
```

## 2. seed
```ts
{ id: "city-hotels", category: "제네바·샤모니 호텔 3박(제네바 1박·샤모니 2박, 1인 몫)", lowEur: 275, midEur: 390,
  basis: "제네바 3성 약 €150~180/실 + 샤모니 8월 €200~300/실 × 2박 = 실당 €550~780 → 2인 분담 [확정 2026-09-18, v3.1]", sourceCheckedAt: "2026-09-18" }
assumptions[0]: "... 8/15~8/16 샤모니 2박(연속) = 총 14박"
notes[0]: "권장 준비 금액: 2027년 물가 인상(연 3~5%, 2년) 반영 1인 약 €1,900~3,000 (약 285만~450만 원, 1 EUR ≈ 1,500원)"
recommendedLowEur: 1900, recommendedHighEur: 3000
```
`computeBudget`·UI 변경 없음.

## 3. 테스트
- `budget.test.ts`: 케이블카 항목 60/83, subtotal {1560, 2430}, contingency {156, 243}, total {1716, 2673}, inflatedLow ≈ 1820.4, inflatedHigh ≈ 2946.9, recommended 1900/3000, `inflated ≤ recommended ≤ inflated+100`, toKrwMan 285/450, `toKrw(1716)` = 2,574,000
- `responsive.spec.ts`: tbody 10행, tfoot "€1,716"·"€2,673", "€1,900 ~ €3,000"
