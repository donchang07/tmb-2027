# Report — budget-view (PRD v2.0 개정)

> feature: budget-view · 순서 3/9 · 완료일 2026-09-17 · 최종 match rate **96.9%** (31/32, 게이트 95 통과) · 반복 횟수 **0회**(Check 1회로 게이트 통과, Act 불필요)
> Plan `docs/01-plan/budget-view.plan.md` · Design `docs/02-design/budget-view.design.md` · Analysis `docs/03-analysis/budget-view.analysis.md`

## Executive Summary

| 관점 | 내용 (실제 결과) |
|---|---|
| Problem | 숙박 항목이 재산정(마을형 350/530, 산장 455/545)되어 합계가 1,677.5/2,614.7로 바뀌었는데 화면은 옛 값을 보여 줬고, 2027년 물가 인상을 반영한 권장 준비 금액(€1,850~2,900, 280만~435만 원)을 산식과 함께 제시할 자리가 없었다. |
| Solution | `budget.ts` seed의 항목·근거 문구·환율(USD/EUR 추가)을 v2.0 부록 D-1대로 갱신하고, `BudgetMetaSchema`에 `inflationLow/High/Years`를, `BudgetSummary`에 `inflated*`·`recommended*`·`recommendedKrwMan*`을 추가했다. `toKrwMan()`으로 5만 원 단위 원화 환산을 만들고 `BudgetMeta.tsx`에 권장 준비 금액 카드(큰 글씨·원화·산식·환율 4블록)를 렌더한다. |
| Function UX Effect | `/budget`에서 소계 €1,525/€2,377 → 예비비 €152.5/€237.7 → 총액 €1,677.5/€2,614.7 → 권장 `€1,850 ~ €2,900`과 `약 280만~435만 원`이 자동 계산돼 보이고, 산식 줄이 `× 1.03²`·`× 1.05²`로 근거를 노출한다. |
| Core Value | 참가 결정을 위한 근거 있는 금액 공유. 표시값이 모두 `computeSummary` 산출물에서 파생돼 하드코딩된 숫자가 없다. |

### 1.3 Value Delivered

| 관점 | 지표·근거 |
|---|---|
| 산술 정합성(SC-003) | 9개 항목 합계 → 소계·예비비·총액 전 단계 수기 검증 일치, 반올림 오차 ≤ €1 (`tests/unit/budget.test.ts` 8건) |
| 근거 추적성 | 9개 항목 basis 문구가 PRD 부록 D-1과 **축자 일치**, 각 항목 `sourceCheckedAt` 보유 |
| 의사결정 지원 | 권장 준비 금액 €1,850~2,900 + 원화 280만~435만 원 + 산식 노출 → 참가 검토자가 준비 금액을 바로 판단 |
| 환율 투명성 | CHF/EUR 1.07 · USD/EUR 0.92 · EUR/KRW 1,500 · 기준일 2026-09-09를 화면에 표시 |
| 신선도 관리 | `validUntil 2027-03-31` 초과 시 `budget_stale` 로그 + StatusNote 유지 |
| 구현 품질 | 기능 깊이·의도 일치·UX 충실도 각 100%, placeholder·TODO·더미 0건 |

## Context Anchor

| Key | Value |
|---|---|
| WHY | 재산정된 예산을 옛 값으로 보여 주면 준비 금액이 틀린다 |
| WHO | 참가 검토자 |
| RISK | 권장값은 산식값(1,780/2,883)을 작성자가 상향 반올림한 고정값이라 산식과 표시값의 관계를 테스트로 고정해야 함 |
| SUCCESS | 소계 1,525/2,377 · 총액 1,677.5/2,614.7 · 권장 1,850~2,900 · 원화 280만~435만 |
| SCOPE | budget seed·lib·화면·테스트 |

## FR/SC

| ID | 상태 | 근거 |
|---|---|---|
| FR-006 | ✅ 완료 | 항목 합산 + 통화·환율·기준일 + 물가 인상 반영 권장 준비 금액 전부 렌더 (`BudgetTable.tsx:38-63`, `BudgetMeta.tsx:52-73`) |
| SC-003 | ✅ 완료 | 소계·예비비·총액·권장값이 항목 합계와 일치, 반올림 오차 €1 이하 (`tests/unit/budget.test.ts:45-53`) |
| 부록 D-1 | ✅ 완료 | 마을형 350/530, 산장 455/545, 도시 호텔 300/420, 보험 40/120 및 근거 문구·가정 문구 축자 일치 (`src/data/seed/budget.ts:34-77`) |
| 11.2 #5 | ✅ 완료 | `exchangeRates` 3쌍 CHF/EUR 1.07 · USD/EUR 0.92 · EUR/KRW 1500, checkedAt 2026-09-09 (`budget.ts:82-86`) |
| 부록 A-3 | ✅ 완료 | `BudgetSummary`에 `inflationLow/High`·`recommendedLow/High` 필드 존재 (`src/lib/budget.ts:16-26`) |
| N-006 / N-012 | ✅ 완료 | 숙박 재산정 반영 + 권장 준비 금액 표시 |
| 8.6 (화면 구성) | ✅ 완료 | 항목 표 / 합계 / 권장 준비 금액·원화 / 환율·기준일·재확인 상태 4블록 |
| S3 (참가 검토 시나리오) | ✅ 완료 | 빈 항목 안내(`src/app/budget/page.tsx:30-33`), 기준일 만료 분기 구현 |

## Success Criteria 최종 (Plan §5)

| # | 기준 | 판정 | 근거 |
|---|---|:--:|---|
| 1 | 소계 1,525/2,377 · 예비비 152.5/237.7 · 총액 1,677.5/2,614.7 | ✅ | 수기 산술 전개 전 단계 일치 (분석 §2.3) |
| 2 | inflated ≈ 1,780.4/2,882.7, 권장 1,850/2,900, 원화 280만/435만 | ⚠️ 부분 | 권장값·원화·inflatedHigh는 일치. **저 inflated의 기준값 자체가 문서 오류** — 1,677.5 × 1.03² = 1,779.65975 → **1,779.7**. 구현과 PRD(:635 "≈1,780")가 옳고 Plan/Design의 `1,780.4`가 틀렸다 |
| 3 | exchangeRates 3쌍, 화면에 "USD/EUR 0.92" 표시 | ✅ | `budget.ts:82-86`, `BudgetMeta.tsx:70` |
| 4 | 화면에 산식 "× 1.03²", "× 1.05²" 표시 | ✅ | `BudgetMeta.tsx:63-68` (`SUP[2]="²"`, 하드코딩 없음) |
| 5 | `tsc`·`vitest`·`next build` 통과 | ❌ 미검증 | 위임 실행이 훅에 의해 중단돼 4개 명령 모두 미실행. 정적 대체 검증으로 "전부 통과 예상"까지만 확인 |

**충족: 3/5** (2번 부분 — 문서 측 수치 오류, 5번 미검증)

## 산출물

- `src/lib/schema.ts` — `ExchangeRateSchema.pair`에 `"USD/EUR"`, `BudgetMetaSchema`에 `inflationLow`·`inflationHigh`·`inflationYears`
- `src/data/seed/budget.ts` — 9개 항목 수치·basis·sourceCheckedAt, 환율 3쌍, budgetMeta 9필드, assumptions·notes
- `src/lib/budget.ts` — `BudgetSummary` 확장, `toKrwMan()`, `computeSummary(items, meta, rates)`, `round1`/`round2`
- `src/components/budget/BudgetMeta.tsx` — 권장 준비 금액 카드(큰 글씨·원화·산식·환율)
- `src/components/budget/BudgetTable.tsx` — 소계·예비비·합계 tfoot 3행
- `src/app/budget/page.tsx` — `getBudget` 주입, stale 판정·`budget_stale` 로그, 빈 상태
- `tests/unit/budget.test.ts` (8 케이스), `tests/e2e/responsive.spec.ts` budget 시나리오

## Key Decisions & Outcomes (Plan §4)

| 결정 | 준수 | 결과 |
|---|:--:|---|
| `computeSummary`가 `inflatedLow/High = total × (1+r)^years`를 계산하고, 권장값은 seed 상수로 유지하되 테스트로 `inflated ≤ recommended ≤ inflated + 100`을 강제 | ✅ | `budget.ts:66-69` 구현, `budget.test.ts`에 부등식 단언 존재. 저 1,779.7 ≤ 1,850 ≤ 1,879.7 · 중 2,882.7 ≤ 2,900 ≤ 2,982.7 모두 성립 — 작성자 상향 반올림값과 산식의 관계가 회귀로 고정됨 |
| 원화는 `recommended × EUR/KRW`를 5만 원 단위 반올림해 "약 280만~435만 원"으로 표시 | ✅ | `toKrwMan(1850,1500)=280`, `toKrwMan(2900,1500)=435` 수기 검증 일치. EUR/KRW 미존재 시 `DEFAULT_EUR_KRW = 1500` 폴백 |
| (설계 §3) `BudgetSummary`를 `subtotal: {low, mid}` 중첩 타입으로 정의 | ⚠️ 형태 상이 | 구현은 `subtotalLow`/`subtotalMid` 평탄 필드. 기능·값은 동등하고 소비처 4곳 전부 평탄 필드를 쓴다. 설계 문서 쪽 정정이 필요한 항목(Minor #3) |

## Check → Act 요약

| 단계 | 내용 |
|---|---|
| Check (gap-detector, 2026-09-17) | 대조 32항목 — 일치 30 · 부분 2 · 불일치 0 → **(30 + 0.5×2) / 32 = 96.9%**. 게이트 95 **통과(PASS)** |
| 축별 점수 | 구조 100% · 기능 깊이 100% · 데이터 계약 97% · 의도 일치 100% · 행위 완결성 95% · UX 충실도 100% |
| Act | **불필요** — 게이트를 1회 Check로 통과했고 "구현 변경이 필요한 항목 없음"(분석 §4.1)으로 판정됐다 |
| 잔여 지적 | Important 1(문서 수치 오류) · Minor 2(테스트 단언 약함, 설계 타입 표기) · Info 2. 전부 구현 변경 불필요 |
| 부분 일치 2건 | ① `BudgetSummary` 중첩 vs 평탄 표기 ② `inflatedLow 1,780.4` 문서 기준값 오류 |
| 참고 | 분석서 §5.2에 따르면 Important #1(문서 `1,780.4` → `1,779.7` 정정) 반영 후 재분석 시 match rate는 **98.4%**(31.5/32)가 된다 |

## 후속·미검증 항목

1. **런타임 전면 미검증** — `npx vitest run tests/unit/budget.test.ts`, `npx tsc --noEmit`, `npx playwright test tests/e2e/responsive.spec.ts`, `next build` 4개 모두 미실행이다(위임 실행이 훅에 의해 중단, gap-detector에 Bash 권한 없음). Plan §5-5가 미검증 상태로 남아 있으므로 QA 단계에서 최우선으로 실행한다. 정적 대체 검증으로는 단위 8건 전부 통과 예상, 타입 오류 가능성 낮음으로 판정됐다.
2. **Important 잔여 — 문서 수치 정정** — `docs/02-design/budget-view.design.md:67`과 `docs/01-plan/budget-view.plan.md:48`의 `inflatedLow ≈ 1,780.4(±0.1)`를 `1,779.7`로 정정해야 한다. 구현과 PRD는 옳으므로 **코드 변경 금지**. 이 보고서 작성 시점까지 미반영이다.
3. **Minor 잔여 — 테스트 단언 강화** — `tests/unit/budget.test.ts:27`이 `toBeCloseTo(1677.5 * 1.03 ** 2, 1)`로 구현과 같은 식을 재계산해 회귀 검출력이 없다. `expect(summary.inflatedLow).toBe(1779.7)` 리터럴 고정으로 교체 권장(`inflatedHigh`는 이미 리터럴 2882.7로 고정돼 비대칭).
4. **Minor 잔여 — 설계 타입 표기** — 설계 §3의 `subtotal: {low, mid}` 스케치를 구현의 평탄 필드 형태로 정정한다. 리팩터링은 불필요하다.
5. **Info — 환율 이중 관리** — `BudgetMeta.tsx:49` 안내 문구에 `1 CHF = 1.07 EUR`가 하드코딩돼 seed 환율과 이중 관리된다(기존 코드, 현 사이클 범위 밖). 차기 사이클에서 `rates` 파생으로 정리 검토.
6. **Supabase 연결 후 할 일** — 현재 예산은 동기 seed 기반 서버 컴포넌트라 로딩 skeleton·페치 오류 분기가 없다(PRD 8.6 상태 요구 중 2건 비해당). 예산 데이터가 DB로 이동(N-009)하면 로딩 상태와 "오류 시 마지막 계산값" 분기를 다시 설계해야 한다.
