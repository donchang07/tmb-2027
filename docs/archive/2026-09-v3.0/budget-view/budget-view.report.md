# Report — budget-view (PRD v3.0 델타)

> feature: budget-view · 순서 2/3 (v3.0 델타) · 완료일 2026-09-18 · 최종 match rate **97.9%** (23.5/24, 게이트 95 통과) · 반복 횟수 **0회**(Check 1회로 게이트 통과, Act 불필요)
> Plan `docs/01-plan/budget-view.plan.md` · Design `docs/02-design/budget-view.design.md` · Analysis `docs/03-analysis/budget-view.analysis.md` · 이전 사이클 `docs/archive/2026-09-v2.0/budget-view/` (v2.0 96.9%)

## Executive Summary

| 관점 | 내용 (실제 결과) |
|---|---|
| Problem | D-006으로 8/16 에귀 뒤 미디 케이블카(성인 왕복 €75~80)가 확정됐는데 예산 표에는 항목이 없어, 참가 검토자가 보는 총액과 권장 준비 금액이 실제 준비 금액보다 낮았다. |
| Solution | `src/data/seed/budget.ts`에 10번째 항목 `aiguille-du-midi`(75/80, basis에 "요금 확인 필요")를 추가하고 `budgetMeta.checkedAt`·가정 문구·notes·권장값(1,950/3,000)을 v3.0 부록 D-1대로 갱신했다. 계산 로직(`src/lib/budget.ts`)과 UI(`BudgetTable.tsx`·`BudgetMeta.tsx`)는 **의도적으로 변경하지 않았다** — 합계·행 수·원화는 seed에서 자동 파생된다. |
| Function UX Effect | `/budget` 표가 10행이 되고 소계 €1,600/€2,457 → 예비비 €160/€245.7 → 총액 **€1,760/€2,702.7** → 권장 **"€1,950 ~ €3,000"**과 "약 295만~450만 원"이 자동 재계산돼 보인다. 산식(× 1.03² / × 1.05²)·환율 3쌍·기준일 2026-09-18도 그대로 노출된다. |
| Core Value | 참가 결정을 위한 정확한 준비 금액. 화면의 모든 숫자가 `computeBudget` 산출물에서 파생돼 하드코딩된 합계가 없다. |

### 1.3 Value Delivered

| 관점 | 지표·근거 |
|---|---|
| 산술 정합성(SC-003) | 10개 항목 합계 → 소계·예비비·총액·인상·권장·원화 전 단계 수기 재계산 일치, **반올림 오차 0** (분석 §"산술 교차 검증" 12행) |
| 자동 파생 검증 | 런타임 덤프 `{subtotalLow:1600, subtotalMid:2457, totalLow:1760, totalMid:2702.7, inflatedLow:1867.2, inflatedHigh:2979.7, recommendedKrwManLow:295, High:450}` |
| 근거 추적성 | 새 항목 basis "성인 왕복 2025 €75, 2027 인상 대비 €80. Compagnie du Mont Blanc 온라인 시간대 예약 [확정 2026-09-18, 요금 확인 필요]" + `sourceCheckedAt: 2026-09-18` |
| 가정 명시 | `assumptions[2]` = "트레킹 구간 리프트·케이블카 비용 없음(전 구간 도보), 8/16 에귀 뒤 미디 관광 케이블카만 포함" — 예산에 들어간 케이블카가 무엇인지 화면에서 구분 가능 |
| 변경 최소화 | `src/lib/budget.ts`·`BudgetTable.tsx`·`BudgetMeta.tsx` 변경 0줄. 케이블카 전용 분기 없음(B1·C1·C2 matched) |
| 회귀 방어 | 단위 8건(`tests/unit/budget.test.ts`) + E2E 3단언(`tbody tr` 10행, "€1,760"·"€2,702.7"·"€1,950 ~ €3,000") |

## Context Anchor

| Key | Value |
|---|---|
| WHY | 관광 비용 누락 방지 — 총액이 실제 준비 금액보다 낮게 보이면 참가 결정이 틀어진다 |
| WHO | 참가 검토자 |
| RISK | 2027 요금 미확정(I-009) → basis에 "확인 필요" 표기 유지 |
| SUCCESS | 소계 1,600/2,457 · 총액 1,760/2,702.7 · 권장 1,950/3,000 · 원화 295만/450만 |
| SCOPE | budget seed·단위 테스트·E2E 문자열. lib 로직·UI 컴포넌트는 변경 없음 |

## FR/SC

| ID | 상태 | 근거 |
|---|---|---|
| FR-006 | ✅ 완료 | 10항목 합산 + 통화·환율·기준일 + 권장 준비 금액이 전부 렌더 (`BudgetTable.tsx` `items.map`, `BudgetMeta.tsx` 권장 금액 문단) |
| SC-003 | ✅ 완료 | 소계·예비비·총액·권장이 항목 합계와 일치, 반올림 오차 €1 이하 — `budget.test.ts:50-57` 통과 |
| SC-015 (예산 측) | ✅ 완료 | 예산 표에 케이블카 항목 포함, 합계 재계산 확인 (`budget.test.ts:8-12`, E2E `tbody tr` 10행) |
| 부록 D-1 | ✅ 완료 | 항목·금액(75/80)·basis·가정 문구·notes 권장 금액 문구가 정본과 일치 (`src/data/seed/budget.ts`) |
| 부록 A-3 `BudgetSummary` | ✅ 유지 | `inflationLow/High/Years`·`recommendedLow/High`·`recommendedKrwMan*` 필드 그대로, 스키마 변경 없음 |
| D-006 | ✅ 완료 | 8/16 관광 케이블카만 예산에 포함되고 트레킹 구간 리프트는 제외임을 가정 문구가 명시 |
| I-009 | ⚠️ 미해소(의도) | 2027 요금 미공개 → basis의 "요금 확인 필요" 표기로 리스크 노출. 후속 항목 1번 |
| 11.2 #5 (환율) | ✅ 유지 | CHF/EUR 1.07 · USD/EUR 0.92 · EUR/KRW 1,500 3쌍 변경 없음 |

## Success Criteria 최종 (Plan §5)

| # | 기준 | 판정 | 근거 |
|---|---|:--:|---|
| 1 | items 10개, 마지막 항목 id `aiguille-du-midi` 75/80 | ✅ | `budget.ts` 마지막 항목, `budget.test.ts:8-11` |
| 2 | subtotal 1,600/2,457 · contingency 160/245.7 · total 1,760/2,702.7 | ✅ | 런타임 덤프 및 수기 재계산 일치, `budget.test.ts:18-25` |
| 3 | inflated ≈ 1,867.2/2,979.7 · recommended 1,950/3,000 · KRW 295/450 | ✅ | `budget.test.ts:30-35,43-47`. 권장 규칙 `inflated ≤ recommended ≤ inflated+100` 양쪽 성립 |
| 4 | assumptions에 "에귀 뒤 미디", notes[0]에 "€1,950~3,000"·"295만~450만" | ✅ | `assumptions[2]`·`notes[0]` 문자 단위 일치 |
| 5 | E2E 예산 화면에 "€1,760"·"€2,702.7"·"€1,950 ~ €3,000", tbody 10행 | ✅ | `tests/e2e/responsive.spec.ts:34-42` — 프로덕션 빌드 Playwright 108/108에 포함돼 3 뷰포트 통과 |
| 6 | `tsc`·`vitest` | ✅ | `tsc` 오류 0 · `vitest run` **124/124**(budget 단위 8건 포함) |

**충족: 6/6** (v2.0에서 미검증으로 남았던 5번 E2E·6번 명령까지 이번 QA에서 실행 완료)

## 산출물

- `src/data/seed/budget.ts` — `aiguille-du-midi` 항목 추가, `budgetMeta.checkedAt` `V3_CHECKED`, `assumptions[2]`, `notes[0]`, `recommendedLowEur 1950` / `recommendedHighEur 3000`
- `tests/unit/budget.test.ts` — 항목 수·id·금액·basis 단언 갱신, 합계·인상·권장·원화 수치 v3.0 기준으로 교체
- `tests/e2e/responsive.spec.ts` — 예산 케이스의 행 수 10, tfoot "€1,760"·"€2,702.7", 권장 "€1,950 ~ €3,000"
- 변경 없음(확인만): `src/lib/budget.ts`, `src/components/budget/BudgetTable.tsx`, `src/components/budget/BudgetMeta.tsx`, `src/app/budget/page.tsx`
- 문서: `docs/01-plan/budget-view.plan.md`, `docs/02-design/budget-view.design.md` (v3.0 델타 신규 작성)

## Key Decisions & Outcomes (Plan §4)

| 결정 | 준수 | 결과 |
|---|:--:|---|
| 권장값은 v2.0과 같은 방식으로 작성자 고정 상수(1,950/3,000), 테스트가 `inflated ≤ recommended ≤ inflated + 100` 규칙으로 산식과의 관계를 강제 | ✅ | 1,867.2 ≤ 1,950 ≤ 1,967.2 · 2,979.7 ≤ 3,000 ≤ 3,079.7 성립(`budget.test.ts:36-39`). 항목이 늘어 산식값이 움직여도 상수가 규칙 밖으로 벗어나면 즉시 실패한다 |
| `toKrwMan(1950)=295`, `toKrwMan(3000)=450` | ✅ | 5만 원 단위 반올림 수기 검증 일치. 원화 표기는 상수가 아니라 권장값×환율에서 파생 |
| 로직·UI는 손대지 않고 seed만 바꾼다(합계·행 수는 자동 파생) | ✅ | `computeBudget`에 케이블카 특수 분기 0건, `BudgetTable`에 하드코딩 행 0건. 변경 면적이 seed 1파일 + 테스트 2파일로 제한됐다 |
| 새 항목의 미확정 요금은 삭제·추정이 아니라 basis "[확정 2026-09-18, 요금 확인 필요]"로 노출 | ✅ | 예산에는 포함하되 신뢰도를 함께 표시. I-009 재확인 시점에 무엇을 고쳐야 하는지가 문서 없이도 드러난다 |

## Check → Act 요약

| 단계 | 내용 |
|---|---|
| Check (gap-detector, 2026-09-18) | 대조 24항목 — matched 23 · partial 1 · missing 0 → **(23 + 0.5×1)/24 = 97.9%**. 게이트 95 **통과(PASS)** |
| 검증 방식 | `vitest run tests/unit/budget.test.ts` 8/8 · `tsc --noEmit` exit 0 · `getBudget()` 런타임 덤프 1회 추출 후 삭제 · PRD D-1 대비 12행 수기 재계산 |
| Act | **불필요** — Critical/Major 0, 구현 변경이 필요한 항목 없음. Minor 1 · Info 2는 전부 표기·문서 수준 |
| 부분 일치 1건 | `budget.test.ts:6`의 `it()` 제목이 v2.0의 "has 9 items"로 남음(본문은 `toHaveLength(10)`) — 검증 정확성 영향 없음, 리포트 가독성만 저하 |
| Info-1 | seed `notes[0]`이 PRD D-1의 "…1,500원 **가정**)"에서 "가정" 한 단어를 뺀 형태. 설계 §2 지정 문자열과는 동일하므로 설계 대비 gap 아님 |
| Info-2 | seed `basis`가 PRD D-1 표보다 운영사명("Compagnie du Mont Blanc") 1개를 더 담음 — I-009·부록 C-4와 일치하는 정보 보강으로 판단, 조치 불요 |
| QA (2026-09-18) | `tsc` 0 · `vitest run` 124/124 · 프로덕션 빌드 Playwright **108/108**(예산 10행·합계·권장 금액 케이스 포함) |

## 후속·미검증 항목

1. **I-009 — 에귀 뒤 미디 2027 운행·요금 확인** — `lowEur 75`/`midEur 80`은 2025 요금과 인상 대비 추정치다. 2027-03 시즌 오픈 시 Compagnie du Mont Blanc 공식 요금으로 두 값과 `sourceCheckedAt`을 갱신하면 소계·총액·인상·권장·원화가 전부 자동 재계산된다. 이때 권장 상수 1,950/3,000이 `inflated ≤ recommended ≤ inflated+100` 규칙 안에 남는지 테스트가 판정하므로, 실패하면 상수도 함께 조정한다(itinerary-core 후속 5번과 같은 건).
2. **Minor 잔여 — 단위 테스트 제목** — `tests/unit/budget.test.ts:6`의 "seed passes validation and has 9 items"를 "10 items"로 바꾼다. 본문 단언은 이미 10건 기준이라 기능 영향은 없고, 다음 사이클에서 1단어 교체로 처리한다.
3. **Info 잔여 — 환율 이중 관리** — `BudgetMeta.tsx` 안내 문구의 `1 CHF = 1.07 EUR`가 seed 환율과 이중 관리된다(v2.0부터 이어진 기존 코드, 이번 범위 밖). `rates` 파생으로 정리할지 차기 사이클에서 판단한다.
4. **Supabase 미연결 항목** — 예산은 여전히 동기 seed 기반 서버 컴포넌트라 로딩 skeleton·페치 오류 분기가 없다(PRD 8.6 상태 요구 중 2건 비해당). 예산 데이터가 DB로 이동(N-009)하면 로딩 상태와 "오류 시 마지막 계산값" 분기를 다시 설계해야 한다.
5. **`isBudgetStale` 배너 미확인** — 오늘(2026-09-18) 기준 `validUntil` 2027-03-31 이전이라 비표시가 정상이며 화면 확인은 하지 않았다. 2027-04 이후에는 `budget_stale` 로그와 StatusNote가 실제로 뜨는지 1회 확인이 필요하다.
6. **반응형·a11y 회귀** — 10번째 행 추가에 따른 가로 스크롤·탭 타깃 변화는 E2E axe 스캔(6 페이지 × 3 뷰포트, 108/108 통과)으로는 severe 0건이나, 좁은 화면에서 표 가독성에 대한 시각 확인은 별도로 하지 않았다.
