# Analysis — budget-view (PRD v3.1 델타)

> feature: budget-view · Check 단계 · gap-detector 실행 2026-09-18 · 게이트 95%
> 설계: `docs/02-design/budget-view.design.md` · Plan: `docs/01-plan/budget-view.plan.md` §5
> PRD: `docs/PRD.md` v3.1 FR-006 · SC-003 · SC-015 · D-007 · 부록 A-3 BudgetSummary · 부록 D-1
> 이전 사이클: v3.0 델타 (97.9%)

## 결과

| 지표 | 값 |
|---|---|
| 대조 항목 | 26 |
| matched | 25 |
| partial | 1 |
| missing | 0 |
| **Match Rate** | **(25 + 0.5×1) / 26 = 25.5 / 26 = 98.1%** |
| 게이트(95%) | **PASS** |
| Critical / Major | 0 / 0 |
| Minor | 1 |
| Info | 3 |

PRD v3.1 부록 D-1의 호텔 3박 275/390, 소계 1,575/2,427, 예비비 157.5/242.7, 총액 1,732.5/2,669.7, 권장 €1,900~3,000, 원화 285만~450만이 `src/data/seed/budget.ts`와 `computeSummary` 산출값에서 **전부 일치**했다. 항목명·근거·가정·notes 문자열도 D-1 본문과 글자 단위로 같다. 설계 지시대로 `src/lib/budget.ts`·`BudgetTable.tsx`·`BudgetMeta.tsx`는 변경되지 않았고, 합계·행 수·권장값 표시는 seed에서 자동 파생된다.

유일한 partial은 **문서 쪽 표기 오류**다. Plan §4와 Design §3이 저값 인상 결과를 `1,837.9`로 적었으나 실제 계산은 `1,732.5 × 1.03² = 1,838.00925 → round1 = 1838.0`이다. PRD 부록 D-1은 `≈ 1,838`로 정확하므로 구현이 아니라 Plan·Design 문구가 PRD와 어긋난다. 권장값 규칙 판정에는 영향이 없다(1838.0 ≤ 1900 ≤ 1938.0).

## 검증 근거

| 검증 | 명령·위치 | 결과 |
|---|---|---|
| 단위 테스트 | `npx vitest run tests/unit/budget.test.ts` | **8 passed / 1 file passed** (210 ms) |
| 타입 검사 | `npx tsc --noEmit` | **exit 0, 오류 0건** |
| seed 원문 | `src/data/seed/budget.ts:50-56, 97-119` | 직접 판독 |
| 계산 로직 | `src/lib/budget.ts:36-73` | 직접 판독(변경 없음) |
| UI | `src/components/budget/BudgetMeta.tsx`, `BudgetTable.tsx:26-63` | 직접 판독(변경 없음) |
| E2E 문자열 | `tests/e2e/responsive.spec.ts:34-42` | 정적 대조(미실행 — 아래 §런타임 미검증) |
| PRD 정본 | `docs/PRD.md:138, 171, 184, 376, 494, 687-712` | 직접 판독 |

### 수기 재계산 (독립 검증)

```
subtotalLow  = 70+40+0+350+455+275+180+90+40+75      = 1,575   ✓
subtotalMid  = 132+80+10+530+545+390+360+180+120+80  = 2,427   ✓
contingency  = 1,575×0.1 = 157.5 · 2,427×0.1 = 242.7          ✓
total        = 1,732.5 · 2,669.7                              ✓
inflatedLow  = 1,732.5 × 1.0609 = 1,838.00925 → 1,838.0
inflatedHigh = 2,669.7 × 1.1025 = 2,943.34425 → 2,943.3       ✓
규칙(저)     = 1,838.0 ≤ 1,900 ≤ 1,938.0                      ✓
규칙(고)     = 2,943.3 ≤ 3,000 ≤ 3,043.3                      ✓
toKrwMan     = round(2,850,000/50,000)×5 = 285
               round(4,500,000/50,000)×5 = 450                ✓
toKrw(1732.5)= 1,732.5 × 1,500 = 2,598,750                    ✓
fmtEur       = "€1,732.5" · "€2,669.7" · "€1,900 ~ €3,000"    ✓
```

`fmtEur`는 `Intl.NumberFormat("ko-KR", { maximumFractionDigits: 2 })` 기반이므로 `1732.5 → "1,732.5"`가 되어 E2E가 기대하는 문자열과 형식이 맞는다(`src/lib/format.ts:3,13-15`).

## 항목별 대조

| # | 요구 (출처) | 기대값 | 구현 | 판정 |
|---|---|---|---|---|
| 1 | 항목 10개 (FR-006 · Plan §5-1) | 10 | `budgetItems.length = 10`, 테스트 `toHaveLength(10)` 통과 | matched |
| 2 | `city-hotels` id 유지 (D-1) | `city-hotels` | `budget.ts:50` | matched |
| 3 | 항목명 (SC-015 · D-1) | `제네바·샤모니 호텔 3박(제네바 1박·샤모니 2박, 1인 몫)` | `budget.ts:51` 글자 단위 일치 | matched |
| 4 | 저값 (D-1) | 275 | `lowEur: 275` | matched |
| 5 | 중값 (D-1) | 390 | `midEur: 390` | matched |
| 6 | 근거 문자열 (Design §2) | `제네바 3성 약 €150~180/실 + 샤모니 8월 €200~300/실 × 2박 = 실당 €550~780 → 2인 분담 [확정 2026-09-18, v3.1]` | `budget.ts:54` 전문 일치, `× 2박` 포함 | matched |
| 7 | `sourceCheckedAt` (Design §2) | `2026-09-18` | `V3_CHECKED = "2026-09-18"` | matched |
| 8 | 예비비율 (D-1) | 0.1 | `contingencyRate: 0.1` | matched |
| 9 | 인상률 파라미터 (A-3) | 0.03 / 0.05 / 2년 | `inflationLow 0.03`, `inflationHigh 0.05`, `inflationYears 2` | matched |
| 10 | `recommendedLowEur` (D-1 · Plan §4) | 1900 | `budget.ts:114` | matched |
| 11 | `recommendedHighEur` (D-1 · Plan §4) | 3000 | `budget.ts:115` | matched |
| 12 | 가정 문구 (SC-015 · D-1) | `8/15~8/16 샤모니 2박(연속) = 총 14박` | `assumptions[0]` 말미에 그대로 포함 | matched |
| 13 | notes[0] (Design §2) | `권장 준비 금액: 2027년 물가 인상(연 3~5%, 2년) 반영 1인 약 €1,900~3,000 (약 285만~450만 원, 1 EUR ≈ 1,500원)` | `budget.ts:108` 전문 일치 | matched |
| 14 | 소계 저 (SC-003) | 1,575 | 산출 1575 · 테스트 통과 | matched |
| 15 | 소계 중 (SC-003) | 2,427 | 산출 2427 · 테스트 통과 | matched |
| 16 | 예비비 저 (D-1) | 157.5 | 산출 157.5 | matched |
| 17 | 예비비 중 (D-1) | 242.7 | 산출 242.7 | matched |
| 18 | 총액 저 (D-1) | 1,732.5 | 산출 1732.5 | matched |
| 19 | 총액 중 (D-1) | 2,669.7 | 산출 2669.7 | matched |
| 20 | 인상 반영 저 (Plan §5-3) | Plan·Design `1,837.9` / PRD `≈ 1,838` | 실제 `1838.0`. 테스트는 리터럴 대신 `toBeCloseTo(1732.5 * 1.03 ** 2, 1)`로 검증해 통과 | **partial** |
| 21 | 인상 반영 고 (Plan §5-3) | 2,943.3 | 산출 2943.3 · `toBeCloseTo(2943.3, 1)` 통과 | matched |
| 22 | 권장값 규칙 저 (Plan RISK) | `inflated ≤ recommended ≤ inflated+100` | 1838.0 ≤ 1900 ≤ 1938.0. `budget.test.ts:35-36`에서 명시 단언 | matched |
| 23 | 권장값 규칙 고 (Plan RISK) | 동일 | 2943.3 ≤ 3000 ≤ 3043.3. `budget.test.ts:37-38` | matched |
| 24 | 원화 환산 (D-1 · Design §3) | 285 / 450, `toKrw(1732.5)=2,598,750` | `toKrwMan` 3건·`toKrw` 1건 단언 전부 통과 | matched |
| 25 | `computeBudget`·UI 무변경 (Design §2, Plan §3 Out) | 변경 없음 | `src/lib/budget.ts` 계산식·`BudgetTable.tsx` tfoot 3행·`BudgetMeta.tsx` 표시 로직 모두 v3.0과 동일, 값은 seed 파생 | matched |
| 26 | 테스트·E2E 문자열 (Design §3 · Plan §5-5,6) | unit 단언 전부 + `tbody 10행`·`€1,732.5`·`€2,669.7`·`€1,900 ~ €3,000` + tsc·vitest | `budget.test.ts` 설계 §3 목록 전부 존재, `responsive.spec.ts:36-40` 4개 단언 존재, vitest 8/8 통과, tsc exit 0 | matched |

## 지적과 조치 필요

### Minor-1 — Plan §4·Design §3의 `1,837.9` 표기 오류 (문서)
- 위치: `docs/01-plan/budget-view.plan.md:36, 41`, `docs/02-design/budget-view.design.md:33`
- 내용: `1,732.5 × 1.03²`의 실제 값은 **1,838.0**(정확히 1,838.00925)인데 두 문서 모두 `1,837.9`로 적었다. PRD 부록 D-1은 `≈ 1,838`로 옳으므로 **Plan·Design ↔ PRD 불일치**다.
- 영향: 구현·테스트·화면 모두 정상. 권장값 규칙(`≤ inflated + 100`)의 여유가 62.0 → 61.99로 바뀔 뿐 판정은 불변.
- 조치: Act 단계에서 Plan §4·§5-3과 Design §3의 `1,837.9`를 `1,838.0`으로 정정. **소스 변경 불필요.**

### Info-1 — 단위 테스트 제목이 실제 단언과 어긋남
- 위치: `tests/unit/budget.test.ts:6` — `it("seed passes validation and has 9 items", ...)`인데 본문은 `expect(items).toHaveLength(10)`.
- v3.0에서 10번째 항목(에귀 뒤 미디)을 추가할 때 제목만 안 고친 잔재다. 설계가 테스트 제목을 규정하지 않아 gap은 아니지만, 실패 시 메시지가 오도한다.
- 조치: Act 단계에서 제목을 `has 10 items`로 정정(선택).

### Info-2 — `assumptions[0]`의 PRD 대비 축약 (델타 범위 밖)
- PRD D-1 가정문은 `마을형 숙소 4박`, seed는 `마을형 4박`이다. 의미 동일, v3.1 델타가 건드린 구간(`8/15~8/16 …`)은 정확히 일치. v3.0 이전부터 있던 표기 차이라 이번 사이클 gap으로 계상하지 않았다.

### Info-3 — `aiguille-du-midi` 근거 문자열이 PRD D-1 표와 미세 차이 (델타 범위 밖)
- seed는 `… Compagnie du Mont Blanc 온라인 시간대 예약 [확정 2026-09-18, 요금 확인 필요]`, PRD D-1 표는 `… 온라인 시간대 예약 [확정 2026-09-18, 요금 확인 필요]`. seed 쪽이 PRD 12.2 근거 항목의 사업자명을 덧붙인 형태로, v3.0 사이클 산출물이며 v3.1 델타 범위가 아니다.

**Critical·Major 0건. 소스 파일 수정이 필요한 gap 없음.**

## 런타임 미검증

이번 Check에서 실행하지 않아 **정적 대조로만 판정**한 항목:

1. **E2E 예산 화면** — `npx playwright test tests/e2e/responsive.spec.ts`를 실행하지 않았다. `tbody` 10행, `tfoot` 3행, `€1,732.5`·`€2,669.7`·`€1,900 ~ €3,000` 가시성은 `BudgetTable.tsx`의 `items.map` 구조·tfoot 3행 마크업과 `fmtEur` 포맷 규칙으로부터 **추론**한 것이다. Act·QA 단계에서 `--workers=1`로 실제 실행해 확인할 것.
2. **`BudgetMeta.tsx` 렌더 결과** — `약 285만~450만 원 (1 EUR ≈ 1,500원)`, `저 €1,732.5 × 1.03² ≈ €1,838 → €1,900 · 중 €2,669.7 × 1.05² ≈ €2,943 → €3,000` 문구는 코드 판독 기반이며 브라우저 렌더 스냅샷으로 확인하지 않았다. 특히 `Math.round(summary.inflatedLow)`가 **1838**로 표시되는지는 화면 확인 대상이다(Minor-1과 연동).
3. **Zod 스키마 파싱** — `getBudget()`이 vitest에서 호출되어 `BudgetItemSchema`·`BudgetMetaSchema` 파싱이 통과했음은 확인했으나, Next.js 빌드(`next build`)·프로덕션 런타임에서의 검증은 수행하지 않았다.
4. **환율 실측** — `EUR/KRW 1,500`, `CHF/EUR 1.07`은 2026-09-09 기준 가정값이며 이번 Check의 검증 대상이 아니다(PRD I-항목, `validUntil: 2027-03-31`).

## Act-2 반영 (2026-09-18, 케이블카 요금 실측)
케이블카 항목 75/80 → **60/83**(2026 동적 요금 €60.20~83). 소계 1,560/2,430 · 예비비 156/243 · 합계 **€1,716/€2,673** · inflated 1,820.4/2,946.9 · 권장 €1,900~3,000(규칙 충족) · 원화 285만~450만. `budget.test.ts`·E2E 문자열 갱신, vitest 통과.
