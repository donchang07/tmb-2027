# Design — budget-view (PRD v2.0 개정)

> feature: budget-view · Plan: `docs/01-plan/budget-view.plan.md` · 의존: itinerary-core
> 작성일: 2026-09-17 · 상태: approved (L4 auto)

## Context Anchor
| Key | Value |
|---|---|
| WHY | 재산정 예산·권장 준비 금액 반영 |
| WHO | 참가 검토자 |
| RISK | 권장값 고정 상수와 산식의 관계 |
| SUCCESS | 1,525/2,377 → 1,677.5/2,614.7 → 권장 1,850~2,900 → 280만~435만 원 |
| SCOPE | seed·lib·BudgetMeta·테스트 |

## 1. 파일
```
src/lib/schema.ts                     ExchangeRate pair + "USD/EUR"; BudgetMeta + inflationLow, inflationHigh, inflationYears
src/data/seed/budget.ts               항목·근거·환율·가정·notes·권장값
src/lib/budget.ts                     BudgetSummary 확장, toKrwMan()
src/components/budget/BudgetMeta.tsx  권장 준비 금액 블록(산식·원화)
tests/unit/budget.test.ts
tests/e2e/responsive.spec.ts          €1,677.5 / €2,614.7
```

## 2. seed (`budget.ts`)
| id | lowEur | midEur | basis |
|---|---|---|---|
| village-lodging | 350 | 530 | "C-3 하한 합계 €349(Gai Soleil 85 + Edelweiss CHF 95 + Plein Air CHF 82 + Auberge MB CHF 70) / 개인실 2인 분담 상한 합계 약 €530 [확정 2026-09-16]" · sourceCheckedAt 2026-09-16 |
| refuge-halfboard | 455 | 545 | category "산장 하프보드 7박(도미토리, 전부 프랑스·이탈리아)" · "C-3 하한 합계 €453(68+60+75+70+70+60+50) / 상한 합계 €542 [확정 2026-09-16]" · 2026-09-16 |
| city-hotels | 300 | 420 | "제네바 3성 약 €150~180/실, 샤모니 8월 €200~300/실, 취리히 HB 3성 약 €195~270/실(USD 210~290 환산)" |
| insurance | 40 | 120 | "국내 다이렉트 종합형 약 €20~55(3~8만원) / World Nomads 2주 약 €140~275($150~300, 연령 의존)" |
나머지 5개 항목 불변.

```ts
exchangeRates: CHF/EUR 1.07 · USD/EUR 0.92 · EUR/KRW 1500 (checkedAt 2026-09-09)
budgetMeta: contingencyRate 0.1, checkedAt "2026-09-16", validUntil "2027-03-31",
  inflationLow 0.03, inflationHigh 0.05, inflationYears 2,
  recommendedLowEur 1850, recommendedHighEur 2900,
  assumptions[0]: "8/3 제네바 1박 · 8/4 레 콩타민 1박부터 8/14 라 플레제르까지 트레킹 숙박 11박(마을형 4박 + 산장 7박) · 8/15 샤모니 1박 · 8/16 취리히 1박 = 총 14박"
  assumptions[3]: "2025~2026 요금 기준, 2027년 물가 인상은 권장 준비 금액에만 반영, 항공권 제외"
  notes[0]: "권장 준비 금액: 2027년 물가 인상(연 3~5%, 2년) 반영 1인 약 €1,850~2,900 (약 280만~435만 원, 1 EUR ≈ 1,500원)"
  notes[2]: "SBB 단체권은 출발 2영업일 전까지 명단 제출. 8/3 밤 제네바 도착이 늦어 제네바 1박으로 확정했다."
```

## 3. `src/lib/budget.ts`
```ts
export type BudgetSummary = {
  subtotal: {low, mid}; contingency: {low, mid}; total: {low, mid};
  inflationLow: number; inflationHigh: number; inflationYears: number;
  inflatedLow: number; inflatedHigh: number;      // total.low×(1+low)^y, total.mid×(1+high)^y (소수 1자리 반올림)
  recommendedLow: number; recommendedHigh: number; // seed 상수
  recommendedKrwManLow: number; recommendedKrwManHigh: number; // toKrwMan
};
export function toKrwMan(eur: number, eurKrw: number): number // Math.round(eur*eurKrw/50000)*5  → 만 원 단위(5만 단위 반올림)
```
`computeSummary(items, meta, rates)`; `rates`에서 EUR/KRW 조회(없으면 1500).

## 4. 화면 `BudgetMeta.tsx`
"권장 준비 금액(화면 표시)" 카드:
- 큰 글씨 `€1,850 ~ €2,900` · `약 280만~435만 원 (1 EUR ≈ 1,500원)`
- 산식 줄: `저 €1,677.5 × 1.03² ≈ €1,780 → €1,850 · 중 €2,614.7 × 1.05² ≈ €2,883 → €2,900 (반올림 여유)` — 값은 summary에서 계산해 출력
- 환율 줄: `CHF/EUR 1.07 · USD/EUR 0.92 · EUR/KRW 1,500 · 기준일 2026-09-09`
- 기존 기준일·재확인 상태(`budget_stale`) 유지

## 5. 테스트
- subtotal {1525, 2377}, contingency {152.5, 237.7}, total {1677.5, 2614.7}
- inflatedLow ≈ 1780.4(±0.1), inflatedHigh ≈ 2882.7; `inflated ≤ recommended ≤ inflated + 100`
- toKrwMan(1850,1500)=280, toKrwMan(2900,1500)=435
- 반올림 오차 ≤ €1 (기존)
- E2E: 예산 화면에 "€1,677.5", "€2,614.7", "€1,850", "€2,900", "USD/EUR"
