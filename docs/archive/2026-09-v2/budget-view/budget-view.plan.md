# Plan — budget-view

> feature: budget-view · 순서 3/8 · 의존: itinerary-core · 규모: 소
> 출처: `docs/PRD.md` 8.6, FR-006, SC-003, 부록 A-3, 부록 D
> 작성일: 2026-09-16 · 상태: approved (L4 auto)

## 1. 목표
항공권 제외 1인당 저/중 예산을 항목별로 자동 합산하고 예비비 10%·총액·통화·환율·기준일·재확인 상태를 표시한다(S3).

## 2. 포함 요구사항
| FR | 요약 | 검증 |
|---|---|---|
| FR-006 | 항목별 저/중 합산, 통화·환율·기준일 표시 | 합계·10% 예비비·반올림 재계산 unit test |

SC-003: 저/중 소계·예비비·총액이 항목 합계와 일치, 반올림 오차 €1 이하.

## 3. 범위
### In
- seed `src/data/seed/budget.ts`: BudgetItem 9건(부록 D-1), ExchangeRate(CHF/EUR 1.07, EUR/KRW 1500, 2026-09-09), meta(contingencyRate 0.1, checkedAt, validUntil, assumptions)
- `src/lib/budget.ts`: `computeBudget`, `isBudgetStale`
- 화면 `/budget`: 항목 표, 합계(소계·예비비·총액), 환율·기준일·재확인 상태, 권장 준비 금액, 참고 메모
- Edge Case: 예산 기준일 만료 → “금액을 다시 확인해 주세요” + `budget_stale` warn, 이전 값 참고용 유지
### Out
- 예약 확정가 반영, 결제·정산(Non-goal)

## 4. 결정
- 재확인 기한 `validUntil` = 2027-03-31 [기본값] (예약·결제 전 재확인; 부록 B “결제·예산 공유 시”)
- 표시 통화 EUR, CHF 항목은 seed 근거에만 표기(합계는 EUR)

## 5. 성공 기준
1. unit: 소계 1460/2342, 예비비 146/234.2, 총액 1606/2576.2, 항목 합 재계산 오차 ≤ €1
2. `/budget` 렌더: 9행 + 3합계 행 + 환율/기준일 + 상태 배지
