# Analysis — budget-view (PRD v2.0 개정)

> feature: budget-view · Check 단계 · gap-detector 실행 2026-09-17 · 게이트 95
> 설계: `docs/02-design/budget-view.design.md` · Plan: `docs/01-plan/budget-view.plan.md` · PRD: `docs/PRD.md` v2.0

## Context Anchor
| Key | Value |
|---|---|
| WHY | 재산정 예산·권장 준비 금액 반영 |
| WHO | 참가 검토자 |
| RISK | 권장값 고정 상수와 산식의 관계 |
| SUCCESS | 1,525/2,377 → 1,677.5/2,614.7 → 권장 1,850~2,900 → 280만~435만 원 |
| SCOPE | seed·lib·BudgetMeta·테스트 |

---

## 1. 결과

| 지표 | 값 |
|---|---|
| 대조 항목 수 | 32 |
| 일치 | 30 |
| 부분 일치 | 2 |
| 불일치 | 0 |
| **Match rate** | **(30 + 0.5×2) / 32 = 31/32 = 96.9%** |
| 게이트 | 95 |
| **판정** | **통과 (PASS)** |

| 축 | 점수 | 근거 |
|---|:--:|---|
| 구조 일치 | 100% | 설계 §1이 지정한 6개 파일이 모두 존재하고 지정 역할을 수행 |
| 기능 깊이 | 100% | placeholder·TODO·하드코딩 더미 없음. 모든 표시값이 `computeSummary` 산출물에서 파생 |
| 데이터 계약 | 97% | seed↔schema↔lib↔화면↔테스트 5계층 필드명·타입 일치. `BudgetSummary` 형태 표기만 설계와 상이 |
| 의도 일치(Intent) | 100% | Plan 성공기준 1~4 충족, 5는 실행 차단으로 미검증 |
| 행위 완결성 | 95% | 빈 항목·기준일 만료 분기 구현. 로딩/오류 상태는 동기 seed라 비해당 |
| UX 충실도 | 100% | 설계 §4가 지정한 4개 블록(큰 글씨·원화·산식·환율) 전부 렌더 |

> 주: 런타임(vitest/tsc/E2E) 미실행이므로 정적 분석 공식을 적용했다. 실행 결과 확보 시 §5를 갱신할 것.

---

## 2. 검증 근거

### 2.1 대조한 문서
| 구분 | 경로 | 참조 지점 |
|---|---|---|
| 설계 | `docs/02-design/budget-view.design.md` | §1 파일 · §2 seed · §3 lib · §4 화면 · §5 테스트 |
| Plan | `docs/01-plan/budget-view.plan.md` | §2 요구사항 델타 · §4 결정 · §5 성공 기준 |
| PRD | `docs/PRD.md` | FR-006(:138) · SC-003(:170) · 11.2 #5(:312) · N-006(:354) · N-012(:360) · 8.6(:255) · A-3(:430) · D-1(:614–638) |

### 2.2 대조한 구현
| 경로 | 확인 내용 |
|---|---|
| `src/data/seed/budget.ts` | 9개 항목 수치·basis·sourceCheckedAt, 환율 3쌍, budgetMeta 9필드 |
| `src/lib/schema.ts` | `ExchangeRateSchema.pair` enum(:127), `BudgetMetaSchema`(:133-144) |
| `src/lib/budget.ts` | `BudgetSummary`(:16), `toKrwMan`(:54), `computeSummary`(:58), `round1/round2` |
| `src/components/budget/BudgetMeta.tsx` | 권장 준비 금액 카드(:52-73), 환율 dl(:31-48) |
| `src/components/budget/BudgetTable.tsx` | 소계·예비비·합계 tfoot 3행(:38-63) |
| `src/app/budget/page.tsx` | `getBudget` 주입(:13), stale 판정·`budget_stale` 로그(:14-15), 빈 상태(:30-33) |
| `tests/unit/budget.test.ts` | 8개 케이스 |
| `tests/e2e/responsive.spec.ts` | budget 시나리오(:34-42) |
| `src/lib/format.ts` | `fmtEur` = ko-KR, maxFractionDigits 2(:3, :13) |

### 2.3 수기 산술 검증 (런타임 대체)

| 검증식 | 계산 | 결과 |
|---|---|:--:|
| subtotalLow | 70+40+0+350+455+300+180+90+40 | 1,525 ✅ |
| subtotalMid | 132+80+10+530+545+420+360+180+120 | 2,377 ✅ |
| contingencyLow | round2(1,525×0.1) | 152.5 ✅ |
| contingencyMid | round2(2,377×0.1) = round2(237.70000000000002) | 237.7 ✅ |
| totalLow | round2(1,525+152.5) | 1,677.5 ✅ |
| totalMid | round2(2,377+237.7) | 2,614.7 ✅ |
| inflatedLow | round1(1,677.5 × 1.03²) = round1(1,779.65975) | **1,779.7** ⚠️ |
| inflatedHigh | round1(2,614.7 × 1.05²) = round1(2,882.70675) | 2,882.7 ✅ |
| 부등식(저) | 1,779.7 ≤ 1,850 ≤ 1,879.7 | 성립 ✅ |
| 부등식(중) | 2,882.7 ≤ 2,900 ≤ 2,982.7 | 성립 ✅ |
| toKrwMan(1850,1500) | round(2,775,000/50,000)=round(55.5)=56 → ×5 | 280 ✅ |
| toKrwMan(2900,1500) | round(4,350,000/50,000)=87 → ×5 | 435 ✅ |
| toKrw(1677.5, rates) | round(1,677.5×1,500) | 2,516,250 ✅ |
| round2(10.005) | (10.005+ε)×100 = 1000.5000000000001 → 1001 | 10.01 ✅ |
| round2(1.005) | 1.005+1ulp → ×100 ≈ 100.50000000000001 → 101 | 1.01 ✅ |
| 화면 산식 반올림 | Math.round(1,779.7)=1,780 · Math.round(2,882.7)=2,883 | 설계 문구와 일치 ✅ |
| 단위 테스트 `toBeCloseTo(1677.5*1.03**2, 1)` | \|1,779.7 − 1,779.65975\| = 0.04025 < 0.05 | 통과 예상 ✅ |

---

## 3. 항목별 대조

### 3.1 설계 §1 — 파일 (6항목)
| # | 설계 항목 | 구현 | 판정 |
|:--:|---|---|:--:|
| 1 | `schema.ts` ExchangeRate pair + "USD/EUR" | `schema.ts:127` enum에 "USD/EUR" 포함 | ✅ |
| 2 | `schema.ts` BudgetMeta + inflationLow/High/Years | `schema.ts:141-143` | ✅ |
| 3 | `seed/budget.ts` 항목·근거·환율·가정·notes·권장값 | 전부 존재 | ✅ |
| 4 | `lib/budget.ts` BudgetSummary 확장 + toKrwMan | `budget.ts:16-26`, `:54` | ✅ |
| 5 | `BudgetMeta.tsx` 권장 준비 금액 블록 | `BudgetMeta.tsx:52-73` | ✅ |
| 6 | `tests/unit/budget.test.ts` · `e2e/responsive.spec.ts` | 양쪽 모두 budget 케이스 존재 | ✅ |

### 3.2 설계 §2 — seed (13항목)
| # | 설계 항목 | 구현 | 판정 |
|:--:|---|---|:--:|
| 7 | village-lodging 350/530 | `budget.ts:34-35` | ✅ |
| 8 | village-lodging basis(€349 내역 + €530 + [확정 2026-09-16]) · sourceCheckedAt 2026-09-16 | `:36-38` 축자 일치 | ✅ |
| 9 | refuge-halfboard 455/545 + category "산장 하프보드 7박(도미토리, 전부 프랑스·이탈리아)" | `:42-44` | ✅ |
| 10 | refuge basis "C-3 하한 합계 €453(68+60+75+70+70+60+50) / 상한 합계 €542 [확정 2026-09-16]" · 2026-09-16 | `:45-46` 축자 일치 | ✅ |
| 11 | city-hotels 300/420 + 취리히 USD 환산 근거 | `:51-53` | ✅ |
| 12 | insurance 40/120 + World Nomads 근거 | `:75-77` | ✅ |
| 13 | 나머지 5개 항목 불변 | train/bus/valley/lunch/hotel-meals 5건이 PRD D-1(:622-629)과 축자 일치 | ✅ |
| 14 | exchangeRates CHF/EUR 1.07 · USD/EUR 0.92 · EUR/KRW 1500, checkedAt 2026-09-09 | `:82-86` | ✅ |
| 15 | contingencyRate 0.1 · checkedAt 2026-09-16 · validUntil 2027-03-31 | `:89-91` | ✅ |
| 16 | inflationLow 0.03 · inflationHigh 0.05 · inflationYears 2 | `:107-109` | ✅ |
| 17 | recommendedLowEur 1850 · recommendedHighEur 2900 | `:105-106` | ✅ |
| 18 | assumptions[0] 14박 문구 · assumptions[3] "2027년 물가 인상은 권장 준비 금액에만 반영, 항공권 제외" | `:93`, `:96` 인덱스·문자열 일치 | ✅ |
| 19 | notes[0] 권장 준비 금액 문구 · notes[2] SBB 단체권/제네바 1박 문구 | `:99`, `:101` 인덱스·문자열 일치 | ✅ |

### 3.3 설계 §3 — `src/lib/budget.ts` (6항목)
| # | 설계 항목 | 구현 | 판정 |
|:--:|---|---|:--:|
| 20 | `BudgetSummary` = subtotal/contingency/total {low, mid} | `BudgetTotals`를 평탄 필드(`subtotalLow/Mid` 등)로 교차 — 기능 동등, 형태 상이 | ⚠️ 부분 |
| 21 | inflationLow/High/Years 전달 | `budget.ts:63-65` | ✅ |
| 22 | inflatedLow/High = total×(1+r)^y, 소수 1자리 반올림 | `:66-67` `round1(... ** meta.inflationYears)` | ✅ |
| 23 | recommendedLow/High = seed 상수 | `:68-69` | ✅ |
| 24 | recommendedKrwMan Low/High = toKrwMan | `:70-71` | ✅ |
| 25 | `toKrwMan` = Math.round(eur×eurKrw/50000)×5 · `computeSummary(items, meta, rates)` · EUR/KRW 없으면 1500 | `:54-56`, `:58-60` `DEFAULT_EUR_KRW` | ✅ |

### 3.4 설계 §4 — 화면 `BudgetMeta.tsx` (5항목)
| # | 설계 항목 | 구현 | 판정 |
|:--:|---|---|:--:|
| 26 | 큰 글씨 `€1,850 ~ €2,900` | `:56-58` `fmtEur(recommendedLow) ~ fmtEur(recommendedHigh)` | ✅ |
| 27 | `약 280만~435만 원 (1 EUR ≈ 1,500원)` | `:59-62` summary·rates에서 파생 | ✅ |
| 28 | 산식 줄 `저 €1,677.5 × 1.03² ≈ €1,780 → €1,850 · 중 €2,614.7 × 1.05² ≈ €2,883 → €2,900 (반올림 여유)`, 값은 summary 계산 | `:63-68`. `SUP[2]="²"`, JSX 공백 규칙상 `1.03`+`²` 연결. 하드코딩 없음 | ✅ |
| 29 | 환율 줄 `CHF/EUR 1.07 · USD/EUR 0.92 · EUR/KRW 1,500 · 기준일 2026-09-09` | `:69-72` rates 맵 조인 + `rates[0].checkedAt` | ✅ |
| 30 | 기존 기준일·재확인 상태(`budget_stale`) 유지 | `BudgetMeta.tsx:29` Badge, `page.tsx:14-15` 로그, `:24-28` StatusNote | ✅ |

### 3.5 설계 §5 — 테스트 (2항목)
| # | 설계 항목 | 구현 | 판정 |
|:--:|---|---|:--:|
| 31 | subtotal/contingency/total · inflatedHigh 2882.7 · `inflated ≤ recommended ≤ inflated+100` · toKrwMan 280/435 · 반올림 오차 ≤ €1 | `budget.test.ts:12-53`, `:55-65` 전부 존재 | ✅ |
| 32 | inflatedLow ≈ 1780.4(±0.1) | 실제 산출 1,779.7. 테스트는 리터럴 대신 `1677.5*1.03**2` 식으로 검증 | ⚠️ 부분 |

### 3.6 E2E 문자열 (참고 — §5 내 포함)
| 설계 요구 문자열 | 렌더 경로 | 판정 |
|---|---|:--:|
| `€1,677.5` | `BudgetTable.tsx:59` `fmtEur(1677.5)` | ✅ |
| `€2,614.7` | `BudgetTable.tsx:60` | ✅ |
| `€1,850` / `€2,900` | `BudgetMeta.tsx:57` → `"€1,850 ~ €2,900"` (spec `:40`이 결합 문자열로 단언) | ✅ |
| `USD/EUR` | `BudgetMeta.tsx:34` dt · `:70` 환율 줄 (spec `:41`이 `.first()` 사용) | ✅ |

### 3.7 Plan §5 성공 기준 대조
| # | 기준 | 판정 | 근거 |
|:--:|---|:--:|---|
| 1 | 소계 1,525/2,377 · 예비비 152.5/237.7 · 총액 1,677.5/2,614.7 | ✅ Met | §2.3 수기 검증 |
| 2 | inflated ≈ 1,780.4/2,882.7, 권장 1,850/2,900, 원화 280만/435만 | ⚠️ Partial | 저 inflated 실제 1,779.7 — **기준값 자체가 오류**(§4 #1) |
| 3 | exchangeRates 3쌍, 화면에 "USD/EUR 0.92" 표시 | ✅ Met | `seed:82-86`, `BudgetMeta.tsx:70` |
| 4 | 화면에 "× 1.03²", "× 1.05²" 표시 | ✅ Met | `BudgetMeta.tsx:64-67` |
| 5 | `tsc`, `vitest`, `next build` 통과 | ❔ 미검증 | §5 참조 |

### 3.8 PRD 요구 대조
| ID | 요구 | 판정 |
|---|---|:--:|
| FR-006 | 항목 합산 + 통화·환율·기준일 + 물가 인상 반영 권장 준비 금액 | ✅ |
| SC-003 | 소계·예비비·총액·권장값이 항목 합계와 일치, 반올림 오차 €1 이하 | ✅ (`budget.test.ts:45-53`) |
| 11.2 #5 | CHF/EUR 1.07 · USD/EUR 0.92 · EUR/KRW 1,500, 기준일 2026-09-09 | ✅ |
| A-3 | `BudgetSummary.inflationLow/High, recommendedLow/High` 필드 | ✅ |
| D-1 | 9개 항목 수치·근거 문구, 권장 준비 금액 산식 | ✅ (9행 전부 축자 일치) |
| N-006 / N-012 | 마을 350/530·산장 455/545 재산정, 권장 준비 금액 표시 | ✅ |
| 8.6 | 항목 표 / 합계 / 권장 준비 금액·원화 / 환율·기준일·재확인 상태 | ✅ (상태 항목은 §4 #4) |

---

## 4. 지적과 조치 필요

| # | 심각도 | 위치 | 지적 | 조치 |
|:--:|---|---|---|---|
| 1 | **Important** | `docs/02-design/budget-view.design.md:67`<br>`docs/01-plan/budget-view.plan.md:48` | `inflatedLow ≈ 1,780.4(±0.1)`는 산술 오류. 1,677.5 × 1.03² = 1,779.65975 → round1 **1,779.7**로, 명시된 ±0.1 범위를 0.7 벗어난다. `docs/PRD.md:635`는 "≈1,780"으로 옳고 구현도 옳다 | **문서를 정정**한다(구현 변경 금지). 설계 §5와 Plan §5-2의 `1,780.4` → `1,779.7` |
| 2 | Minor | `tests/unit/budget.test.ts:27` | `toBeCloseTo(1677.5 * 1.03 ** 2, 1)`이 구현과 동일한 식을 테스트 안에서 재계산한다. 산식이 바뀌어도 테스트가 함께 따라가 회귀 검출력이 없다 | 리터럴 고정으로 교체: `expect(summary.inflatedLow).toBe(1779.7)` (inflatedHigh는 이미 리터럴 2882.7로 고정되어 있어 비대칭) |
| 3 | Minor | `src/lib/budget.ts:16-26` vs 설계 §3 | 설계는 `subtotal: {low, mid}` 중첩 표기, 구현은 `subtotalLow/subtotalMid` 평탄 필드. 기능·값은 동등하며 화면·테스트 모두 평탄 필드를 소비한다 | 설계 문서 §3의 타입 스케치를 구현 형태로 정정(코드 리팩터링은 불필요 — 소비처 4곳 전부 평탄 필드 기준) |
| 4 | Info | `src/app/budget/page.tsx` vs `docs/PRD.md:262` | PRD 8.6의 상태 요구 중 "로딩 skeleton"·"오류 시 마지막 계산값"이 없다. 다만 동기 seed 기반 서버 컴포넌트라 비동기 로딩·페치 오류가 발생하지 않는다. "빈 계산 불가 안내"(`:30-33`)와 "성공 자동 합계"는 구현됨 | 조치 불필요. 예산이 DB로 이동(N-009)할 때 재평가 |
| 5 | Info | `src/components/budget/BudgetMeta.tsx:49` | 안내 문구에 `1 CHF = 1.07 EUR`가 하드코딩되어 seed 환율과 이중 관리된다. 현 사이클 범위 밖(기존 코드) | 차기 사이클에서 `rates`에서 파생하도록 정리 검토 |

### 4.1 구현 변경이 필요한 항목
없음. 지적 1·3은 문서 정정, 2는 테스트 강화, 4·5는 정보성이다.

---

## 5. 런타임 미검증

| 대상 | 명령 | 상태 | 비고 |
|---|---|:--:|---|
| 단위 테스트 | `npx vitest run tests/unit/budget.test.ts` | ❌ 실행 차단 | 위임 실행이 훅에 의해 중단("대기 유지, 훅 제안 미실행"). gap-detector는 Bash 권한이 없어 직접 재실행 불가 |
| 타입 검사 | `npx tsc --noEmit` | ❌ 실행 차단 | 동일 |
| E2E | `npx playwright test tests/e2e/responsive.spec.ts` | ❌ 미실행 | dev 서버 미기동 |
| 빌드 | `next build` (Plan 성공기준 5) | ❌ 미실행 | — |

### 5.1 정적 대체 검증으로 확인한 범위
- **단위 테스트 8개 전부 통과 예상.** §2.3에서 각 `expect`를 수기 전개했고, 부동소수점 경계 2건을 명시 확인했다.
  - `round2(1.005)`: 1.005의 배정도 표현은 1.004999999999999893…이나 `Number.EPSILON` 가산이 정확히 1 ulp이므로 다음 double(1.005000000000000115…)로 올라가 `×100 → 100.5000…1 → Math.round = 101 → 1.01`. 통과.
  - `expect(summary.inflatedLow).toBeCloseTo(1677.5 * 1.03 ** 2, 1)`: 오차 0.04025 < 임계 0.05. 통과. (단 §4 #2의 약한 단언 문제는 그대로 남음)
- **타입 오류 가능성 낮음.** `BudgetMetaSchema`의 9필드와 seed 리터럴, `BudgetSummary` 소비처 4곳(`BudgetTable.tsx`, `BudgetMeta.tsx`, `page.tsx`, 테스트)의 필드 접근을 전수 대조했고 미정의 필드 참조가 없다. 인덱스 접근 2곳(`SUP[...]`, `rates[0]`)은 각각 `??`·삼항으로 좁혀져 있어 `noUncheckedIndexedAccess` 환경에서도 안전하다.
- **E2E 기대 문자열 4종은 렌더 경로 추적으로 확인.** `fmtEur`(ko-KR, maxFractionDigits 2)가 `€1,677.5`·`€2,614.7`·`€1,850`을 생성하고, `{fmtEur(low)} ~ {fmtEur(high)}`가 `€1,850 ~ €2,900` 단일 텍스트를 만든다.

### 5.2 재실행 시 갱신할 것
1. 위 4개 명령을 실행하고 본 절의 상태 열을 실제 결과로 교체한다.
2. 실패가 나오면 §1 Match rate를 런타임 포함 공식으로 재계산한다.
3. 지적 1(문서 `1,780.4` 정정)을 반영한 뒤 재분석하면 부분 일치 1건이 해소되어 Match rate는 **98.4%**(31.5/32)가 된다.

---

## 6. 관련 문서
- Plan: `docs/01-plan/budget-view.plan.md`
- Design: `docs/02-design/budget-view.design.md`
- PRD: `docs/PRD.md` (FR-006, SC-003, 8.6, 11.2 #5, A-3, D-1)
- 이전 사이클: `docs/archive/2026-09-v2/budget-view/`