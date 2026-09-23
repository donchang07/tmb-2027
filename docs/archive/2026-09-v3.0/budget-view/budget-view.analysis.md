# Analysis — budget-view (PRD v3.0 델타)

> feature: budget-view · Check 단계 · gap-detector 실행 2026-09-18 · 게이트 95%
> 설계: `docs/02-design/budget-view.design.md` · Plan: `docs/01-plan/budget-view.plan.md` §5
> PRD: `docs/PRD.md` v3.0 FR-006 · SC-003 · SC-015 · 부록 A-3 BudgetSummary · 부록 D-1
> 이전 사이클: `docs/archive/2026-09-v2.0/budget-view/` (v2.0 96.9%)

## 결과

| 지표 | 값 |
|---|---|
| 대조 항목 | 24 |
| matched | 23 |
| partial | 1 |
| missing | 0 |
| **Match Rate** | **(23 + 0.5×1) / 24 = 23.5 / 24 = 97.9%** |
| 게이트(95%) | **PASS** |
| Critical / Major | 0 / 0 |
| Minor | 1 |
| Info | 2 |

PRD v3.0 부록 D-1의 10항목·소계 1,600/2,457·예비비 160/245.7·총액 1,760/2,702.7·권장 €1,950~3,000·원화 295만~450만이 seed와 런타임 계산값에서 **전부 일치**했다. `src/lib/budget.ts`·`BudgetMeta.tsx`·`BudgetTable.tsx`는 설계 지시대로 변경되지 않았고, 합계·행 수는 seed에서 자동 파생된다.

## 검증 근거

### 1. 명령 실행

```
$ npx vitest run tests/unit/budget.test.ts
  Test Files  1 passed (1)
  Tests       8 passed (8)

$ npx tsc --noEmit
  TSC_EXIT=0   (출력 없음)
```

### 2. 런타임 계산값 덤프 (`getBudget()` 실측, 임시 테스트로 1회 추출 후 삭제)

```
ITEMS = 10
{"subtotalLow":1600,"subtotalMid":2457,
 "contingencyLow":160,"contingencyMid":245.7,
 "totalLow":1760,"totalMid":2702.7,"contingencyRate":0.1,
 "inflationLow":0.03,"inflationHigh":0.05,"inflationYears":2,
 "inflatedLow":1867.2,"inflatedHigh":2979.7,
 "recommendedLow":1950,"recommendedHigh":3000,
 "recommendedKrwManLow":295,"recommendedKrwManHigh":450}

fmtEur 출력: 소계 €1,600 / €2,457 · 예비비 €160 / €245.7
              합계 €1,760 / €2,702.7 · 권장 "€1,950 ~ €3,000"
meta.checkedAt   = 2026-09-18
assumptions[2]   = 트레킹 구간 리프트·케이블카 비용 없음(전 구간 도보), 8/16 에귀 뒤 미디 관광 케이블카만 포함
notes[0]         = 권장 준비 금액: 2027년 물가 인상(연 3~5%, 2년) 반영 1인 약 €1,950~3,000 (약 295만~450만 원, 1 EUR ≈ 1,500원)
items.at(-1)     = {"id":"aiguille-du-midi","category":"에귀 뒤 미디 케이블카 왕복(8/16 관광)",
                    "lowEur":75,"midEur":80,
                    "basis":"성인 왕복 2025 €75, 2027 인상 대비 €80. Compagnie du Mont Blanc 온라인 시간대 예약 [확정 2026-09-18, 요금 확인 필요]",
                    "sourceCheckedAt":"2026-09-18"}
```

### 3. 산술 교차 검증 (PRD D-1 대비 수기 재계산)

| 계산 | 식 | 결과 | PRD D-1 | 판정 |
|---|---|---:|---:|---|
| 저 소계 | 70+40+0+350+455+300+180+90+40+**75** | 1,600 | 1,600 | ✓ |
| 중 소계 | 132+80+10+530+545+420+360+180+120+**80** | 2,457 | 2,457 | ✓ |
| 저 예비비 | 1,600 × 0.1 | 160 | 160.00 | ✓ |
| 중 예비비 | 2,457 × 0.1 | 245.7 | 245.70 | ✓ |
| 저 합계 | 1,600 + 160 | 1,760 | €1,760.00 | ✓ |
| 중 합계 | 2,457 + 245.7 | 2,702.7 | €2,702.70 | ✓ |
| 저 인상 | 1,760 × 1.03² = 1,867.184 → round1 | 1,867.2 | ≈1,867 | ✓ |
| 중 인상 | 2,702.7 × 1.05² = 2,979.72675 → round1 | 2,979.7 | ≈2,980 | ✓ |
| 권장 하한 규칙 | 1,867.2 ≤ 1,950 ≤ 1,967.2 | 성립 | Plan §4 | ✓ |
| 권장 상한 규칙 | 2,979.7 ≤ 3,000 ≤ 3,079.7 | 성립 | Plan §4 | ✓ |
| 원화 하한 | round(1950×1500/50000)×5 = round(58.5)×5 = 59×5 | 295 | 295만 | ✓ |
| 원화 상한 | round(3000×1500/50000)×5 = 90×5 | 450 | 450만 | ✓ |

반올림 오차는 전 항목 0 (SC-003의 €1 이하 기준을 충족).

## 항목별 대조

### A. seed (`src/data/seed/budget.ts`)

| # | 대조 항목 | 근거 | 구현 | 판정 |
|---|---|---|---|---|
| A1 | budgetItems 10개 | PRD FR-006 "10항목", Design §3, Plan §5-1 | `ITEMS = 10` | matched |
| A2 | 마지막 항목 id `aiguille-du-midi` | Design §2 | `items.at(-1).id === "aiguille-du-midi"` | matched |
| A3 | category "에귀 뒤 미디 케이블카 왕복(8/16 관광)" | PRD D-1 표 행, Design §2 | 문자 단위 동일 | matched |
| A4 | lowEur 75 / midEur 80 | PRD D-1 (75/80), Plan §5-1 | 75 / 80 | matched |
| A5 | basis 문구(2025 €75, 2027 €80, "요금 확인 필요") | Design §2, PRD D-1 · I-009 | Design 지정 문자열과 완전 일치 | matched |
| A6 | sourceCheckedAt "2026-09-18" | Design §2 (`V3_CHECKED`) | `V3_CHECKED = "2026-09-18"` | matched |
| A7 | budgetMeta.checkedAt "2026-09-18" | Design §2 | `checkedAt: V3_CHECKED` | matched |
| A8 | assumptions[2] 가정 문구 | PRD D-1 **가정** 문장, Design §2 | 문자 단위 동일 | matched |
| A9 | notes[0] 권장 금액 문구(€1,950~3,000, 295만~450만, 1 EUR ≈ 1,500원) | PRD D-1 불릿, Design §2 | Design 지정 문자열과 일치 | matched |
| A10 | recommendedLowEur 1950 / HighEur 3000 | PRD A-3 · D-1, Design §2 | 1950 / 3000 | matched |
| A11 | 환율 3종(CHF/EUR 1.07, USD/EUR 0.92, EUR/KRW 1500) 유지 | PRD 9장 가정 | 변경 없음 | matched |

### B. 계산 로직 (`src/lib/budget.ts`) — 변경 없음이 요구사항

| # | 대조 항목 | 근거 | 구현 | 판정 |
|---|---|---|---|---|
| B1 | `computeBudget` 미변경(합계 자동 파생) | Design §2 마지막 줄 | v2.0 파일 그대로, 케이블카 특수 분기 없음 | matched |
| B2 | BudgetSummary 필드(subtotal·contingencyRate·total·inflationLow/High·recommendedLow/High) | PRD 부록 A-3 | 타입·런타임 모두 존재 | matched |
| B3 | 소계/예비비/총액 = 1,600·2,457 / 160·245.7 / 1,760·2,702.7 | PRD D-1, SC-003 | 런타임 덤프 일치 | matched |
| B4 | inflated 1,867.2 / 2,979.7 | PRD A-3 "(1,867/2,980)", Plan §5-3 | 1867.2 / 2979.7 | matched |
| B5 | toKrwMan 295 / 450 | Plan §4 · §5-3 | 295 / 450 | matched |

### C. UI 컴포넌트 — 변경 없음이 요구사항

| # | 대조 항목 | 근거 | 구현 | 판정 |
|---|---|---|---|---|
| C1 | `BudgetTable.tsx` 미변경, 행 수는 items.map으로 자동 10행 | Design §2 | 하드코딩 행 없음, tfoot 3행 고정 | matched |
| C2 | `BudgetMeta.tsx` 미변경, 권장 금액·원화·가정·notes를 meta/summary에서 렌더 | Design §2 | `{fmtEur(recommendedLow)} ~ {fmtEur(recommendedHigh)}` → "€1,950 ~ €3,000", `약 295만~450만 원` | matched |

### D. 테스트

| # | 대조 항목 | 근거 | 구현 | 판정 |
|---|---|---|---|---|
| D1 | items 10 · id · 75/80 · basis "확인 필요" 검사 | Design §3 | `tests/unit/budget.test.ts:8-12` 존재·통과, **단 it() 제목이 "has 9 items"로 남음** | **partial** |
| D2 | subtotal 1600/2457 · contingency 160/245.7 · total 1760/2702.7 단언 | Design §3 | `budget.test.ts:18-25` | matched |
| D3 | inflatedLow ≈1867.2(±0.2) · inflatedHigh ≈2979.7 · recommended 1950/3000 | Design §3 | `budget.test.ts:30-35` (`toBeCloseTo(…, 1)`로 더 엄격) | matched |
| D4 | `inflated ≤ recommended ≤ inflated + 100` 규칙 유지 | Plan §4, Design §3 | `budget.test.ts:36-39` 양쪽 다 | matched |
| D5 | toKrwMan 295/450 + summary 필드 | Design §3 | `budget.test.ts:43-47` | matched |
| D6 | 항목 합계 ↔ 소계 오차 €1 이하 (SC-003) | PRD SC-003 | `budget.test.ts:50-57` | matched |
| D7 | E2E `tbody tr` 10행 | Design §3, Plan §5-5 | `tests/e2e/responsive.spec.ts:36` `toHaveCount(10)` | matched |
| D8 | E2E tfoot "€1,760" · "€2,702.7" | Design §3 | `responsive.spec.ts:38-39` | matched |
| D9 | E2E "€1,950 ~ €3,000" | Design §3 | `responsive.spec.ts:40` | matched |

### E. 게이트 명령

| # | 대조 항목 | 근거 | 결과 | 판정 |
|---|---|---|---|---|
| E1 | `npx vitest run tests/unit/budget.test.ts` | Plan §5-6 | 8 passed / 8 | matched |
| E2 | `npx tsc --noEmit` | Plan §5-6 | exit 0, 에러 0 | matched |

## 지적과 조치 필요

### Minor-1 — 단위 테스트 제목이 v2.0(9항목) 그대로 남음
- 위치: `C:\Users\donch\work1\tests\unit\budget.test.ts:6`
- 현재: `it("seed passes validation and has 9 items", …)` — 본문은 `expect(items).toHaveLength(10)`
- 영향: 기능·검증 정확성에는 영향 없음. 테스트 리포트 가독성과 문서 신뢰도만 저하.
- 조치: 제목 문자열 `9 items` → `10 items` 로 1개 단어 교체. (본 Check 단계에서는 소스 미수정)

### Info-1 — seed `notes[0]`에 PRD의 "가정" 한 단어 누락
- PRD D-1 불릿: `… 1 EUR ≈ 1,500원 가정)` / seed: `… 1 EUR ≈ 1,500원)`
- Design §2가 지정한 문자열은 seed 쪽과 동일하므로 **설계 대비 gap 아님**. PRD 원문과의 표기 차이만 기록한다. 조치 불요(원하면 PRD 쪽 문구를 seed에 맞추는 편이 저비용).

### Info-2 — seed `basis`가 PRD D-1 표보다 운영사명 1개를 더 담음
- PRD D-1 표: `… 온라인 시간대 예약 [확정 2026-09-18, 요금 확인 필요]`
- seed: `… Compagnie du Mont Blanc 온라인 시간대 예약 [확정 2026-09-18, 요금 확인 필요]`
- Design §2 지정 문자열과 일치하고, PRD I-009·부록 C-4가 같은 운영사를 명시하므로 정보 보강으로 판단. 조치 불요.

### 후속 추적(기존 위험, 신규 gap 아님)
- PRD I-009: 2027 시즌 요금·시간표 미공개 → `basis`의 "요금 확인 필요" 표기로 리스크가 노출되어 있음. 2027-03 시즌 오픈 시 `lowEur`/`midEur`·`sourceCheckedAt` 재확인 필요.

## 런타임 미검증

다음 항목은 정적 대조와 단위 테스트로만 확인했고, 실제 브라우저 렌더링은 이번 Check에서 실행하지 않았다.

1. **E2E `tests/e2e/responsive.spec.ts`의 `budget table renders 10 items and 3 total rows`** — Playwright 실행(개발 서버 기동) 미수행. `tbody tr` 10행·tfoot 3행·"€1,760"·"€2,702.7"·"€1,950 ~ €3,000"·"USD/EUR" 가시성은 코드 경로(`BudgetTable`의 `items.map` + `fmtEur`, `BudgetMeta`의 권장 금액 문단)로 추론한 결과다.
2. **`/budget` 페이지의 반응형·a11y(SC-005, WCAG 2.2 AA)** — 10번째 행 추가에 따른 가로 스크롤·탭 타깃 회귀 미측정.
3. **`isBudgetStale` 경고 배너 실제 표시** — 오늘(2026-09-18) 기준 `validUntil` 2027-03-31 이전이라 비표시가 정상이나, 화면 확인은 하지 않았다.

→ Act 단계에서 `npx playwright test tests/e2e/responsive.spec.ts --workers=1` 1회 실행을 권고한다.
