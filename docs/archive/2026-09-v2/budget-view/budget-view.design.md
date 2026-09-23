# Design — budget-view

> feature: budget-view · Plan: `docs/01-plan/budget-view.plan.md` · 의존: itinerary-core
> 작성일: 2026-09-16 · 상태: approved (L4 auto)

## 1. 파일
```
src/lib/schema.ts            + BudgetItemSchema, ExchangeRateSchema, BudgetMetaSchema
src/data/seed/budget.ts      budgetItems(9), exchangeRates(2), budgetMeta
src/lib/budget.ts            computeBudget, getBudget, isBudgetStale
src/components/budget/BudgetTable.tsx     항목 표 + 합계 행
src/components/budget/BudgetMeta.tsx      환율·기준일·상태·권장 금액
src/app/budget/page.tsx, loading.tsx
tests/unit/budget.test.ts
```

## 2. 스키마 (`schema.ts` 추가)
```ts
export const BudgetItemSchema = z.object({ id, category: string, lowEur: number>=0, midEur: number>=0, basis: string, sourceCheckedAt: isoDate });
export const ExchangeRateSchema = z.object({ pair: z.enum(["CHF/EUR","EUR/KRW"]), rate: number>0, checkedAt: isoDate });
export const BudgetMetaSchema = z.object({ contingencyRate: number (0.1), checkedAt: isoDate, validUntil: isoDate, assumptions: string[], notes: string[], recommendedLowEur: 1750, recommendedHighEur: 2800 });
```

## 3. `src/lib/budget.ts`
```ts
export type BudgetSummary = { subtotalLow, subtotalMid, contingencyLow, contingencyMid, totalLow, totalMid, contingencyRate };
export function round2(n: number): number                       // 소수 2자리
export function computeBudget(items: BudgetItem[], rate: number): BudgetSummary
   // subtotal = Σ low / Σ mid, contingency = round2(subtotal*rate), total = round2(subtotal + contingency)
export function getBudget(): { items, rates, meta, summary }     // seed zod 검증(1회) + computeBudget
export function isBudgetStale(meta, todayISO): boolean           // todayISO > meta.validUntil
export function toKrw(eur: number, rates): number | null         // EUR/KRW 환율 있으면 반올림(만원 단위 아님, 원)
```
stale이면 페이지에서 `logEvent("budget_stale","warn",{ validUntil })`.

## 4. Seed (부록 D-1 그대로)
| id | category | low | mid |
|---|---|---:|---:|
| train-zrh-gva | ZRH↔GVA 기차 왕복(2등석) | 70 | 132 |
| bus-gva-cha | 제네바↔샤모니 버스 왕복 | 40 | 80 |
| valley-transit | 샤모니 계곡 교통(샤모니↔레주슈) | 0 | 10 |
| village-lodging | 마을형 숙소 4박(1인 몫) | 300 | 480 |
| refuge-halfboard | 산장 하프보드 7박(도미토리) | 440 | 560 |
| city-hotels | 제네바·샤모니·취리히 호텔 3박(1인 몫) | 300 | 420 |
| lunch-drinks | 점심·도시락·음료 12일 | 180 | 360 |
| hotel-day-meals | 호텔 숙박일 식사 3일 | 90 | 180 |
| insurance | 여행자보험 15일 | 40 | 120 |
소계 1460 / 2342 · 예비비 146.00 / 234.20 · 합계 1606.00 / 2576.20. 환율 CHF/EUR 1.07, EUR/KRW 1500 (2026-09-09). validUntil 2027-03-31. 권장 준비 €1,750~2,800.

## 5. 화면 `/budget`
- `dynamic = "force-dynamic"` (stale 판정은 오늘 날짜)
- h1 “예산 (1인, 항공권 제외)”, 부제 “저/중 범위 · EUR 기준”
- stale → 상단 `StatusNote(warn)` “금액을 다시 확인해 주세요” + “아래 값은 {checkedAt} 기준 참고용입니다”
- `BudgetTable`: `<table>` (caption “항목별 1인 예산”, sr-only), 열 항목/저(€)/중(€)/근거·비고. 모바일(<640px)에서는 행을 `flex flex-wrap`으로 바꾸고 근거 td를 `block w-full`로 항목 아래 줄에 표시(단일 td, 중복 출력 없음); sm 이상은 table-row/cell. `<tfoot>` 소계 / 예비비 10% / **합계(1인, 항공권 제외)**. 숫자 `fmtEur`, tabular-nums(body 상속).
- `BudgetMeta`: 카드 — 환율 `<dl>` 그리드(pair, rate, checkedAt), 기준일 `meta.checkedAt`, 재확인 기한 `validUntil`, 상태 배지(“기준일 유효” / “재확인 필요”), 권장 준비 금액 “€1,750 ~ €2,800 (약 {toKrw(low)} ~ {toKrw(high)} 원)”, 가정 목록(`assumptions`), 참고 메모(`notes`)
- 상태: `loading.tsx` skeleton; 항목 0건 → StatusNote “계산 불가 — 예산 항목이 없습니다”

## 6. 테스트 (`tests/unit/budget.test.ts`)
- 소계 1460 / 2342, 예비비 146 / 234.2, 총액 1606 / 2576.2
- 항목 합계 재계산 = 소계 (오차 ≤ 1)
- `round2` 및 contingency 산술 — 임의 항목([10.005, 20.004])에서 total = round2(subtotal*1.1) 오차 ≤ 0.01
- `isBudgetStale`: validUntil 당일 false, 익일 true
- `toKrw(1606, rates) === 2409000`, 환율 없으면 null
- seed zod 통과, 9 항목

## 7. Edge Case
| 상황 | 구현 |
|---|---|
| 예산 기준일 만료 | StatusNote + 값 유지 + `budget_stale` warn |
| 빈 계산 불가 | 항목 0건 안내 |
