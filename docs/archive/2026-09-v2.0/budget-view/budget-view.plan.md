# Plan — budget-view (PRD v2.0 개정)

> feature: budget-view · 순서 3/9 · 의존: itinerary-core · 규모: 소
> 출처: `docs/PRD.md` v2.0 FR-006 · SC-003 · S3 · 8.6 · 11.2 #5 · N-006, N-012 · 부록 A-3, D-1
> 이전 사이클: `docs/archive/2026-09-v2/budget-view/`
> 작성일: 2026-09-17 · 상태: approved (L4 auto)

## Executive Summary
| 관점 | 내용 |
|---|---|
| Problem | 숙박 항목이 재산정(마을 350/530, 산장 455/545)되어 합계가 1,677.5/2,614.7로 바뀌었고, 물가 인상 반영 권장 준비 금액(€1,850~2,900, 280만~435만 원)을 산식과 함께 표시해야 한다. |
| Solution | seed 항목·근거·환율(USD/EUR 추가)을 갱신하고, `BudgetSummary`에 inflation·recommended 필드를 더해 산식을 화면에 표시한다. |
| Function UX Effect | 예산 화면에서 소계·예비비·총액·권장 준비 금액·원화 환산이 자동 계산돼 보인다. |
| Core Value | 참가 결정을 위한 근거 있는 금액 공유. |

## Context Anchor
| Key | Value |
|---|---|
| WHY | 재산정된 예산을 옛 값으로 보여 주면 준비 금액이 틀린다 |
| WHO | 참가 검토자 |
| RISK | 권장값은 산식값(1,780/2,883)을 작성자가 상향 반올림한 고정값이라 산식과 표시값의 관계를 테스트로 고정해야 함 |
| SUCCESS | 소계 1,525/2,377 · 총액 1,677.5/2,614.7 · 권장 1,850~2,900 · 원화 280만~435만 |
| SCOPE | budget seed·lib·화면·테스트 |

## 2. 포함 요구사항 (델타)
| ID | v2.0 변경 | 검증 |
|---|---|---|
| FR-006 | 항목 합계 + 통화·환율·기준일 + 물가 인상(연 3~5%, 2년) 반영 권장 준비 금액 | 산술 테스트 |
| SC-003 | 소계·예비비·총액·권장 준비 금액이 항목 합계와 일치, 반올림 오차 €1 이하 | 단위 테스트 |
| D-1 | 마을형 350/530, 산장 455/545, 근거 문구, 보험·취리히 근거 문구, 가정 문구 | seed 검사 |
| 11.2 #5 | CHF/EUR 1.07 · USD/EUR 0.92 · EUR/KRW 1,500 | seed 검사 |
| A-3 | `BudgetSummary.inflationLow/High, recommendedLow/High` | 타입·테스트 |

## 3. 범위
### In
- `src/data/seed/budget.ts`, `src/lib/schema.ts`(ExchangeRate pair에 USD/EUR, BudgetMeta에 inflationLow/High·inflationYears)
- `src/lib/budget.ts`(computeSummary 확장, KRW 환산 helper), `src/components/budget/BudgetMeta.tsx`(권장 금액·산식·원화), `BudgetTable.tsx`(필요 시)
- `tests/unit/budget.test.ts`, `tests/e2e/responsive.spec.ts` 문자열
### Out
- 예산 편집 UI(비범위)

## 4. 결정
- `computeSummary`가 `inflatedLow = total.low × (1+inflationLow)^years`, `inflatedHigh = total.high × (1+inflationHigh)^years`를 계산하고, 권장값(`recommendedLowEur/HighEur`)은 seed 상수로 유지하되 테스트로 `inflated ≤ recommended ≤ inflated + 100`을 강제한다.
- 원화: `recommended × EUR/KRW`를 5만 원 단위로 반올림해 "약 280만~435만 원"으로 표시.

## 5. 성공 기준
1. 소계 1,525 / 2,377 · 예비비 152.5 / 237.7 · 총액 1,677.5 / 2,614.7
2. inflated ≈ 1,780.4 / 2,882.7, 권장 1,850 / 2,900, 원화 280만 / 435만
3. exchangeRates 3쌍, 예산 화면에 "USD/EUR 0.92" 표시
4. 화면에 산식 문구("× 1.03²", "× 1.05²") 표시
5. `tsc`, `vitest`, `next build` 통과
