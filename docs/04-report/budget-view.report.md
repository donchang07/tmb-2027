# Report — budget-view (PRD v3.1 델타)

> feature: budget-view · 순서 3/3 (v3.1 델타) · 완료일 2026-09-18 · 최종 match rate **98.1%** (25.5/26, 게이트 95 통과) · 반복 횟수 **0회**(Check 1회로 게이트 통과, Act 불필요)
> Plan `docs/01-plan/budget-view.plan.md` · Design `docs/02-design/budget-view.design.md` · Analysis `docs/03-analysis/budget-view.analysis.md` · 이전 사이클 `docs/archive/2026-09-v3.0/budget-view/` (v3.0 97.9%)

## Executive Summary

| 관점 | 내용 (실제 결과) |
|---|---|
| Problem | 예산의 호텔 3박 항목이 v3.0 구성(제네바·샤모니·취리히, 300/420) 기준이었다. D-007로 취리히 호텔이 사라지고 제네바 1박 + 샤모니 2박이 되면서, 참가 검토자가 보는 총액과 권장 준비 금액이 실제 구성과 어긋났다. |
| Solution | `src/data/seed/budget.ts`의 `city-hotels` 항목을 **275/390**(제네바 3성 €150~180/실 + 샤모니 €200~300/실 × 2박 = 실당 €550~780 → 2인 분담)으로 재산정하고 항목명·근거·가정·notes·권장값(1,900/3,000)을 v3.1 부록 D-1대로 갱신했다. 계산 로직(`src/lib/budget.ts`)과 UI(`BudgetTable.tsx`·`BudgetMeta.tsx`)는 **의도적으로 한 줄도 바꾸지 않았다**. |
| Function UX Effect | `/budget` 표가 10행을 유지한 채 소계 €1,575/€2,427 → 예비비 €157.5/€242.7 → 총액 **€1,732.5/€2,669.7** → 권장 **"€1,900 ~ €3,000"**·"약 285만~450만 원"으로 자동 재계산돼 보인다. 산식(× 1.03² / × 1.05²)·환율 3쌍·기준일 2026-09-18도 그대로 노출된다. |
| Core Value | 참가 결정을 위한 정확한 준비 금액. 화면의 모든 숫자가 `computeBudget` 산출물에서 파생돼 하드코딩된 합계가 없다. |

### 1.3 Value Delivered

| 관점 | 지표·근거 |
|---|---|
| 산술 정합성(SC-003) | 10항목 합계 → 소계·예비비·총액·인상·권장·원화 전 단계 수기 재계산 일치, **반올림 오차 0** (분석 "수기 재계산" 12행) |
| 독립 검증값 | `subtotal 1,575 / 2,427` · `contingency 157.5 / 242.7` · `total 1,732.5 / 2,669.7` · `inflated 1,838.0 / 2,943.3` · `recommended 1,900 / 3,000` · `toKrwMan 285 / 450` · `toKrw(1732.5) = 2,598,750` |
| 권장값 규칙 | `inflated ≤ recommended ≤ inflated + 100` 양쪽 성립 — 1,838.0 ≤ 1,900 ≤ 1,938.0 · 2,943.3 ≤ 3,000 ≤ 3,043.3 (`budget.test.ts:35~38`) |
| 근거 추적성 | basis "제네바 3성 약 €150~180/실 + 샤모니 8월 €200~300/실 × 2박 = 실당 €550~780 → 2인 분담 [확정 2026-09-18, v3.1]" + `sourceCheckedAt: 2026-09-18` (`budget.ts:54~55`) |
| 일정 정합 | `assumptions[0]` 말미 "8/15~8/16 샤모니 2박(연속) = 총 14박" — 숙박 14박이 예산 가정에서도 D-007과 일치 |
| 변경 최소화 | `src/lib/budget.ts`·`BudgetTable.tsx`·`BudgetMeta.tsx`·`src/app/budget/page.tsx` 변경 **0줄**. 호텔 구성 전용 분기 없음 |
| 회귀 방어 | 단위 8건(`tests/unit/budget.test.ts`) + E2E 4단언(`tbody` 10행, "€1,732.5"·"€2,669.7"·"€1,900 ~ €3,000") |

## Context Anchor

| Key | Value |
|---|---|
| WHY | D-007 숙박 구성 변경 — 총액이 실제 준비 금액과 다르면 참가 결정이 틀어진다 |
| WHO | 참가 검토자 |
| RISK | 권장값 규칙(`inflated ≤ recommended ≤ inflated + 100`) 이탈 |
| SUCCESS | 1,575/2,427 → 1,732.5/2,669.7 → 1,900/3,000 → 285만/450만 |
| SCOPE | budget seed·단위 테스트·E2E 문자열. lib 로직·UI 컴포넌트는 변경 없음 |

## FR/SC

| ID | 상태 | 근거 |
|---|---|---|
| FR-006 | ✅ 완료 | 10항목 합산 + 통화·환율·기준일 + 권장 준비 금액이 전부 렌더 (`BudgetTable.tsx:26~63` `items.map`·tfoot 3행, `BudgetMeta.tsx` 권장 금액 문단) |
| SC-003 | ✅ 완료 | 소계·예비비·총액·권장이 항목 합계와 일치, 반올림 오차 €1 이하 — `budget.test.ts` 8/8 통과 |
| SC-015 (예산 측) | ✅ 완료 | 호텔 3박 = 제네바 1박 · 샤모니 2박이 항목명·가정 문구에 명시 (`budget.ts:51`, `assumptions[0]`) |
| 부록 D-1 | ✅ 완료 | 항목명·275/390·basis·가정·notes·권장 1,900/3,000·원화 285만~450만이 정본과 글자 단위 일치 |
| 부록 A-3 `BudgetSummary` | ✅ 유지 | `inflationLow 0.03`·`High 0.05`·`Years 2`·`recommended*`·`recommendedKrwMan*` 필드 그대로, 스키마 변경 없음 |
| D-007 | ✅ 완료 | 취리히 호텔 몫이 빠지고 샤모니 2박째가 들어간 재산정(300/420 → 275/390)이 총액·권장값까지 전파 |
| I-009 | ⚠️ 미해소(의도) | `aiguille-du-midi` 75/80은 2025 요금 기준 추정 → basis "요금 확인 필요" 유지. 후속 1번 |
| 11.2 #5 (환율) | ✅ 유지 | CHF/EUR 1.07 · USD/EUR 0.92 · EUR/KRW 1,500 3쌍 변경 없음 |

## Success Criteria 최종 (Plan §5)

| # | 기준 | 판정 | 근거 |
|---|---|:--:|---|
| 1 | items 10개, `city-hotels` 275/390, category에 "샤모니 2박", basis에 "× 2박" | ✅ | `budget.ts:50~55` · `budget.test.ts` `toHaveLength(10)` |
| 2 | subtotal 1,575/2,427 · contingency 157.5/242.7 · total 1,732.5/2,669.7 | ✅ | 수기 재계산 12행 일치 + 단위 테스트 단언 |
| 3 | inflated ≈ 1,837.9/2,943.3 · recommended 1,900/3,000 · KRW 285/450 | ✅ | 실제 저값은 **1,838.0**(1,838.00925). 테스트가 리터럴 대신 `toBeCloseTo(1732.5 * 1.03 ** 2, 1)`로 검증해 통과 — Plan·Design 표기만 오차(후속 3번) |
| 4 | assumptions에 "샤모니 2박(연속)", notes[0]에 "€1,900~3,000"·"285만~450만" | ✅ | `assumptions[0]`·`notes[0]` 문자 단위 일치 (`budget.ts:108`) |
| 5 | E2E 예산 화면 "€1,732.5"·"€2,669.7"·"€1,900 ~ €3,000", tbody 10행 | ✅ | `tests/e2e/responsive.spec.ts:34~42` — 프로덕션 빌드 Playwright **111/111**에 포함돼 3 뷰포트 통과 |
| 6 | `tsc`·`vitest` | ✅ | `tsc` 오류 0 · `vitest run` **126/126**(budget 단위 8건 포함) |

**충족: 6/6**

## 산출물

- `src/data/seed/budget.ts` — `city-hotels` category·`lowEur 275`/`midEur 390`·basis·`sourceCheckedAt`, `assumptions[0]`("8/15~8/16 샤모니 2박(연속) = 총 14박"), `notes[0]`, `recommendedLowEur 1900` / `recommendedHighEur 3000`
- `tests/unit/budget.test.ts` — 합계·예비비·총액·인상·권장·원화 수치를 v3.1 기준으로 교체, 권장값 규칙 단언 유지
- `tests/e2e/responsive.spec.ts` — 예산 케이스의 `tbody` 10행, tfoot "€1,732.5"·"€2,669.7", 권장 "€1,900 ~ €3,000"
- 변경 없음(확인만): `src/lib/budget.ts`, `src/components/budget/BudgetTable.tsx`, `src/components/budget/BudgetMeta.tsx`, `src/app/budget/page.tsx`
- 문서: `docs/01-plan/budget-view.plan.md`, `docs/02-design/budget-view.design.md` (v3.1 델타 신규 작성)

## Key Decisions & Outcomes (Plan §4)

| 결정 | 준수 | 결과 |
|---|:--:|---|
| 호텔 항목은 행을 늘리지 않고 기존 `city-hotels` 1행을 재산정(실당 €550~780 → 2인 분담) | ✅ | 표 행 수가 10으로 유지돼 E2E·단위 테스트의 행 수 단언이 그대로 살아 있고, 변경 면적이 seed 1파일로 제한됐다 |
| 권장값은 작성자 고정 상수(1,900/3,000), 테스트가 `inflated ≤ recommended ≤ inflated + 100` 규칙으로 산식과의 관계를 강제 | ✅ | 1,838.0 ≤ 1,900 ≤ 1,938.0 · 2,943.3 ≤ 3,000 ≤ 3,043.3 성립. 항목 금액이 움직여 상수가 규칙 밖으로 나가면 즉시 실패한다 |
| `toKrwMan(1900)=285`, `toKrwMan(3000)=450` | ✅ | 5만 원 단위 반올림 수기 검증 일치. 원화 표기는 상수가 아니라 권장값×환율에서 파생 |
| 로직·UI는 손대지 않고 seed만 바꾼다(합계·행 수는 자동 파생) | ✅ | `computeBudget`에 호텔 특수 분기 0건, `BudgetTable`에 하드코딩 합계 0건. 다음 재산정도 seed 1곳 수정으로 끝난다 |

## Check → Act 요약

| 단계 | 내용 |
|---|---|
| Check (gap-detector, 2026-09-18) | 대조 26항목 — matched 25 · partial 1 · missing 0 → **(25 + 0.5×1)/26 = 98.1%**. 게이트 95 **통과(PASS)** |
| 검증 방식 | `npx vitest run tests/unit/budget.test.ts` 8/8 · `npx tsc --noEmit` exit 0 · PRD 부록 D-1 대비 12행 수기 재계산 · seed·`computeBudget`·UI 직접 판독 |
| Act | **불필요** — Critical/Major 0, 소스 파일 수정이 필요한 gap 없음. Minor 1 · Info 3은 전부 문서·표기 수준 |
| Minor-1 (문서) | Plan §4·§5-3과 Design §3이 저값 인상 결과를 `1,837.9`로 적었으나 실제는 `1,732.5 × 1.03² = 1,838.00925 → 1,838.0`. PRD D-1(`≈ 1,838`)이 옳아 **Plan·Design ↔ PRD 불일치**. 권장값 규칙 판정에는 영향 없음 → 문구 정정 권고(후속 3번, **미반영 잔여**) |
| Info-1 | `tests/unit/budget.test.ts:6` 제목이 "has 9 items"인데 본문은 `toHaveLength(10)` — v3.0 잔재. 검증 정확성 영향 없음, 실패 메시지만 오도(후속 4번) |
| Info-2 | `assumptions[0]`이 PRD D-1의 "마을형 숙소 4박"을 "마을형 4박"으로 축약 — v3.0 이전부터의 표기 차이, 이번 델타 구간은 정확히 일치 |
| Info-3 | `aiguille-du-midi` basis가 PRD D-1 표보다 운영사명("Compagnie du Mont Blanc")을 더 담음 — v3.0 산출물이며 v3.1 델타 범위 밖 |
| QA (2026-09-18) | `tsc` 0 · `vitest run` **126/126** · 프로덕션 빌드 Playwright **111/111**(예산 10행·합계·권장 금액 케이스 포함, itinerary-core Act-1 이후 재실행분 포함) |

## 후속·미검증 항목

1. **I-009 — 에귀 뒤 미디 2027 운행·요금 확인** — `aiguille-du-midi` 항목의 `lowEur 75`/`midEur 80`은 2025 요금과 인상 대비 추정치다. 2027-03 시즌 오픈 시 Compagnie du Mont Blanc 공식 요금으로 두 값과 `sourceCheckedAt`을 갱신하면 소계·총액·인상·권장·원화가 전부 자동 재계산된다. 이때 권장 상수 1,900/3,000이 `inflated ≤ recommended ≤ inflated + 100` 규칙 안에 남는지 테스트가 판정하므로, 실패하면 상수도 함께 조정한다(itinerary-core 후속 1번과 같은 건).
2. **호텔 금액 단일 출처화** — `city-hotels`의 실당 €200~300(샤모니)은 booking-tracker `chamonix-hotel-2`의 `priceLow 200`/`priceHigh 300`과 이중 관리된다. 숙소가 확정되면 두 seed의 금액과 `checkedAt`·`sourceCheckedAt`을 같은 날짜로 함께 갱신한다(booking-tracker 후속 5번과 같은 건).
3. **Minor 잔여 — Plan·Design의 `1,837.9` 표기(문서)** — `docs/01-plan/budget-view.plan.md` §4·§5-3과 `docs/02-design/budget-view.design.md` §3의 `1,837.9`를 `1,838.0`으로 정정한다. 소스·테스트 수정은 불필요하다.
4. **Info 잔여 — 단위 테스트 제목** — `tests/unit/budget.test.ts:6`의 "seed passes validation and has 9 items"를 "10 items"로 바꾼다. 본문 단언은 이미 10건 기준이라 기능 영향은 없다(v3.0 사이클에서 이월된 건).
5. **Supabase 미연결 항목** — 예산은 여전히 동기 seed 기반 서버 컴포넌트라 로딩 skeleton·페치 오류 분기가 없다(PRD 8.6 상태 요구 중 2건 비해당). 예산 데이터가 DB로 이동(N-009)하면 로딩 상태와 "오류 시 마지막 계산값" 분기를 다시 설계해야 한다.
6. **`BudgetMeta` 렌더 문구 미확인** — "저 €1,732.5 × 1.03² ≈ €1,838 → €1,900" 문구의 `Math.round(summary.inflatedLow)`가 화면에서 **1838**로 표시되는지는 코드 판독으로만 확인했다(Minor-1과 연동). 다음 사이클에서 1회 시각 확인을 권한다.
7. **`isBudgetStale` 배너 미확인** — 오늘 기준 `validUntil` 2027-03-31 이전이라 비표시가 정상이며 화면 확인은 하지 않았다. 2027-04 이후 `budget_stale` 로그와 StatusNote가 실제로 뜨는지 1회 확인이 필요하다.
