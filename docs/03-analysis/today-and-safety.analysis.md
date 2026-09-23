# Analysis — today-and-safety (PRD v2.0)

> feature: today-and-safety · Design: `docs/02-design/today-and-safety.design.md` · Plan: `docs/01-plan/today-and-safety.plan.md` §5 · PRD: `docs/PRD.md` v2.0 (FR-009, FR-014, SC-010, 부록 C-3)
> 분석일: 2026-09-17 · phase: Check (PDCA) · 소스 파일 무수정

## 결과

| 항목 | 값 |
|---|---|
| Match rate | **93.8%** (matched 22 + partial 1 × 0.5) / 24 = 22.5 / 24 |
| 게이트 95 통과 여부 | **미통과** (93.8% < 95%) — 부족분 1.2%p (missing 1건 해소 시 97.9%) |
| Missing | 1건 — design §3 `in_trip` 상태의 오늘 Day 카드 링크에 `data-testid="today-card-link"` 부재 |
| Partial | 1건 — design §3 `before` 본문에서 "첫 일정: 8/3 인천 출발"의 날짜(8/3) 미표시 |
| 검증 통과 | vitest 19/19 pass, tsc --noEmit exit 0 |

핵심 산출물인 Day 2~11 fallback 10개 문장은 design §2 표와 **문자 단위 완전 일치**(스크립트 대조)했고, 해당 10개 Day의 `sourceCheckedAt`은 모두 `RECHECKED = "2026-09-16"`, Day 1·12는 `CHECKED = "2026-09-09"`로 현행 유지되었다. 미달의 원인은 seed 데이터가 아니라 TodayCard의 UI 계약(testid·본문 문구) 2건이다.

## 검증 근거

### 1. 실행한 검증

| 명령 | 결과 |
|---|---|
| `npx vitest run tests/unit/dates.test.ts tests/unit/seed.test.ts` | **Test Files 2 passed (2) / Tests 19 passed (19)**, exit 0, 392 ms |
| `npx tsc --noEmit` | 오류 없음, exit 0 |

(playwright E2E·`next build`는 지시에 따라 미실행 — "런타임 미검증" 절 참조)

### 2. fallback 문자열 대조 방법

`docs/02-design/today-and-safety.design.md` §2 표의 Day 2~11 행과 `src/data/seed/days.ts`의 `trekDayNumber` 2~11 객체의 `fallback` 리터럴을 파이썬 스크립트로 정규식 추출해 `==` 비교했다. 결과 10/10 `MATCH` (길이: Day 2=167, 3=148, 4=84, 5=154, 6=131, 7=200, 8=156, 9=195, 10=147, 11=169자). 임시 스크립트는 scratchpad에 두었고 프로젝트에는 파일을 추가하지 않았다.

### 3. seed 매핑 확인 (`src/data/seed/days.ts`)

| 대상 | 라인 | 확인 |
|---|---|---|
| `RECHECKED = "2026-09-16"` 상수 | `src/data/seed/days.ts:4` | 정의 |
| trek Day 2 (sequence 3) | `src/data/seed/days.ts:55` / `:67-68` / `:78` | fallback 일치, `sourceCheckedAt: RECHECKED` |
| trek Day 3~11 (sequence 4~12) | `:86,:108` / `:116,:140` / `:148,:169` / `:177,:199` / `:207,:229` / `:237,:258` / `:266,:287` / `:295,:317` / `:325,:346` | 전부 fallback 일치 + `RECHECKED` |
| trek Day 1 (sequence 2) | `src/data/seed/days.ts:39`, `:47` | fallback 원문 유지, `CHECKED`(2026-09-09) |
| trek Day 12 (sequence 13) | `src/data/seed/days.ts:366`, `:376` | fallback 원문 유지, `CHECKED`(2026-09-09) |
| 12개 Day 공통 비상 | `src/data/seed/days.ts:5` (`EMERGENCY`), 각 Day `emergency: EMERGENCY` | FR-014 "12개 Day 112·숙박 연락 수단" 충족 |

### 4. PRD 대조

- FR-009 (`docs/PRD.md:141`): Europe/Paris 단일 판정 + "(현지 기준)" 문구 → `src/lib/dates.ts:4` (`TRIP_TZ`), `src/lib/dates.ts:6-13` (`toLocalDateISO`), `src/components/home/TodayCard.tsx:27`.
- FR-014 (`docs/PRD.md:146`) / N-005 (`docs/PRD.md:353`): Day 2~11 대안 + 12개 Day 비상 → 위 3절.
- SC-010 (`docs/PRD.md:178`): "확인 필요" 0건 → `tests/unit/seed.test.ts:136`에서 Day 2~11 전수 검사, 통과.
- 부록 C-3 (`docs/PRD.md:518-605`): 10개 "대안" 문장이 design §2로, design §2가 seed로 그대로 전달됨. 단, Day 3만 PRD의 `대안(악천후·피로): 콜 데 푸르 대신 …` 표기를 design에서 `악천후·피로 시 콜 데 푸르 대신 …`으로 정규화했다(의미 동일, design이 정본이므로 구현은 일치).

## 항목별 대조

| # | Design 항목 | 판정 | 구현 근거 (file:line) |
|---|---|---|---|
| 1 | §2 Day 2 fallback 원문 일치 | matched | `src/data/seed/days.ts:67-68` |
| 2 | §2 Day 3 fallback 원문 일치 | matched | `src/data/seed/days.ts:98-99` |
| 3 | §2 Day 4 fallback 원문 일치 | matched | `src/data/seed/days.ts:128-129` |
| 4 | §2 Day 5 fallback 원문 일치 | matched | `src/data/seed/days.ts:160-161` |
| 5 | §2 Day 6 fallback 원문 일치 | matched | `src/data/seed/days.ts:189-190` |
| 6 | §2 Day 7 fallback 원문 일치 | matched | `src/data/seed/days.ts:220-221` |
| 7 | §2 Day 8 fallback 원문 일치 | matched | `src/data/seed/days.ts:249-250` |
| 8 | §2 Day 9 fallback 원문 일치 | matched | `src/data/seed/days.ts:278-279` |
| 9 | §2 Day 10 fallback 원문 일치 | matched | `src/data/seed/days.ts:307-308` |
| 10 | §2 Day 11 fallback 원문 일치 | matched | `src/data/seed/days.ts:337-338` |
| 11 | §1·§2 Day 2~11 `sourceCheckedAt` = 2026-09-16 | matched | `src/data/seed/days.ts:4`, `:78 :108 :140 :169 :199 :229 :258 :287 :317 :346` |
| 12 | §2 Day 1·12 fallback 현행 유지 | matched | `src/data/seed/days.ts:39`, `:366` (문구 미변경, `CHECKED` 유지) |
| 13 | §3 before 제목 `출발까지 D-{n} (현지 기준)` | matched | `src/components/home/TodayCard.tsx:27` |
| 14 | §3 before 본문 "현지(Europe/Paris) 날짜 기준입니다. 첫 일정: 8/3 인천 출발" | **partial** | `src/components/home/TodayCard.tsx:34` (앞 문장만), `:30` (링크가 `첫 일정 보기 · {nameKo}`로 이름만 표기, 날짜 8/3 없음) |
| 15 | §3 before 링크 `data-testid="today-card-link"` | matched | `src/components/home/TodayCard.tsx:29` |
| 16 | §3 in_trip 오늘 Day 카드 강조 | matched | `src/components/home/TodayCard.tsx:59-63` (`isToday` 전달) |
| 17 | §3 in_trip 링크 `data-testid="today-card-link"` | **missing** | `src/components/itinerary/DayCard.tsx:26`, `src/components/itinerary/TravelDayCard.tsx:14` 모두 testid 없음. 전역 grep 결과 testid는 `TodayCard.tsx:29,44` 2곳뿐 |
| 18 | §3 after "원정이 종료되었습니다" + 요약 링크 testid | matched | `src/components/home/TodayCard.tsx:42`, `:44` |
| 19 | §4 SafetyCard fallback 기본값 "대안 선택 사항 (Day 1·12)" | matched | `src/components/day/SafetyCard.tsx:5` |
| 20 | §4 SafetyCard emergency 기본값 "112 · 숙박 연락처" | matched | `src/components/day/SafetyCard.tsx:12` |
| 21 | §4 SafetyCard 확인 기준일 `checkedAt` 표시 | matched | `src/components/day/SafetyCard.tsx:13`, 주입부 `src/app/day/[dayId]/page.tsx:133` |
| 22 | §5 dates 경계 4케이스(KST 08:00, 8/17 21:59:59Z in_trip, 22:00Z after) | matched | `tests/unit/dates.test.ts:14-31` (`:19 :20-22 :24-26 :28-30`) |
| 23 | §5 seed SC-010 3조건(≥20자·"확인 필요" 미포함·/우천\|악천후\|강풍\|피로/) | matched | `tests/unit/seed.test.ts:130-140` (`:135 :136 :137`), `:138`에서 2026-09-16까지 추가 검증 |
| 24 | §1 대상 파일 5개 모두 반영 | matched | `src/data/seed/days.ts`, `src/components/home/TodayCard.tsx`, `src/components/day/SafetyCard.tsx`, `tests/unit/dates.test.ts`, `tests/unit/seed.test.ts` |

합계: matched 22 · partial 1 · missing 1 · total 24 → **(22 + 0.5) / 24 = 93.8%**

## 지적과 조치 필요

| # | 심각도 | 지적 | 권장 조치 |
|---|---|---|---|
| 1 | High | `in_trip` 상태에서 `data-testid="today-card-link"`가 DOM에 존재하지 않는다(design §3 위반). `DayCard`/`TravelDayCard`의 `<Link>`에 testid가 없고, `TodayCard`도 감싸지 않는다. 더구나 `tests/e2e/day-detail.spec.ts:11`이 `getByTestId("today-card-link").first()`에 의존하므로, 여행 기간(2027-08-03~08-17) 중이거나 시스템 시각을 그 구간으로 고정해 E2E를 돌리면 해당 스펙이 실패한다. 현재는 실행 시점이 `before` 상태라 우연히 통과한다. | `DayCard`/`TravelDayCard`에 선택적 `linkTestId` prop을 추가해 `TodayCard`의 in_trip 분기에서만 `"today-card-link"`를 넘기거나, `TodayCard`의 in_trip 분기에서 카드를 `data-testid="today-card-link"`를 가진 래퍼로 감싼다. 이후 시각을 여행 기간으로 고정한 E2E 케이스를 추가한다. |
| 2 | Medium | `before` 본문이 design §3의 "현지(Europe/Paris) 날짜 기준입니다. 첫 일정: 8/3 인천 출발" 중 앞 문장만 렌더한다(`TodayCard.tsx:34`). 링크 라벨이 Day 이름은 보여주지만 **날짜(8/3)는 어디에도 없어**, 출발 전 한국에서 "현지 기준 며칠인가"를 확인하려는 Plan의 목적이 절반만 충족된다. | `TodayCard.tsx:34` 본문에 `formatKoDate(state.firstDay.date)`(`src/lib/dates.ts:48`) 또는 `첫 일정: {M}/{D} {nameKo}` 형태를 덧붙인다. 하드코딩 "8/3" 대신 `state.firstDay.date` 파생값을 쓸 것. |
| 3 | Low | design §4 코드블록에는 없는 `112 긴급 전화` `tel:112` 버튼이 `SafetyCard.tsx:8-10`에 추가되어 있다. FR-014 의도에 부합하는 개선이지만 설계 문서에 기록되지 않아 문서-구현 드리프트다. | 구현을 되돌리지 말고 design §4에 tel 링크 1줄을 추가해 문서를 구현에 맞춘다(Act 단계). |
| 4 | Low | PRD C-3 Day 3 원문은 `대안(악천후·피로): 콜 데 푸르 대신 …`인데 design §2·seed는 `악천후·피로 시 콜 데 푸르 대신 …`으로 표기를 정규화했다. 의미는 동일하나 "PRD C-3 문장을 그대로 사용"이라는 design §2 제목과는 어긋난다. | design §2 제목을 "PRD C-3 대안 문장을 표기 정규화하여 사용"으로 수정하거나, Day 3 문장을 PRD 원문 표기로 되돌린다. 화면 문구가 달라지므로 문서 수정을 권장. |
| 5 | Info | `tests/unit/seed.test.ts:138`이 design §5에 없는 `sourceCheckedAt === "2026-09-16"` 검증을 추가로 수행한다. design §1의 의도(재조사 기준일)를 테스트로 고정한 것이라 유익하다. | design §5 테스트 목록에 해당 단언을 명시해 문서화한다. |

## 런타임 미검증

이번 Check에서 확인하지 **못한** 범위는 다음과 같다. 위 match rate는 정적 대조 + 단위 테스트 근거에 한정된다.

| 범위 | 사유 | 남은 위험 |
|---|---|---|
| Playwright E2E (`tests/e2e/day-detail.spec.ts` 등) | 지시에 따라 미실행 | 지적 #1의 in_trip testid 부재가 실제 브라우저에서 스펙을 깨는지 미확인 |
| `next build` / 프로덕션 번들 | 지시에 따라 미실행 | RSC 경계·빌드 타임 오류는 `tsc --noEmit` 통과만으로 담보되지 않음 |
| TodayCard 3상태(before·in_trip·after) 실제 렌더 | 단위 테스트가 `dates`·`seed` 두 파일만 다룸. 컴포넌트 렌더 테스트 없음 | 제목 "출발까지 D-N (현지 기준)" 문자열이 화면에 실제로 나타나는지는 코드 판독 근거뿐(Plan §5.3 미검증) |
| SafetyCard 기본값 분기 | 현재 seed는 Day 1~12 전부 `fallback`·`emergency`가 채워져 있어 `?? "대안 선택 사항 (Day 1·12)"`, `?? "112 · 숙박 연락처"` 분기가 런타임에 도달하지 않음(Plan §4 결정 사항과 일치) | 기본값 문구의 실렌더 미검증. 회귀 시 발견 불가 |
| 실시간 시각 기반 상태 전이 | 분석 시점(2026-09-17)은 항상 `before`. 여행 기간 고정 테스트는 단위 레벨(`resolveTodayState` 직접 호출)에만 존재 | 페이지 레벨에서 Paris 자정 경계가 올바로 동작하는지는 미확인 |

## Act-1 반영 (2026-09-17)

| # | 조치 | 결과 |
|---|---|---|
| 1 (High) | `src/components/itinerary/DayCard.tsx`·`TravelDayCard.tsx`에 선택적 `linkTestId?: string` prop을 추가하고 각각 `/day/:id`·`/travel/:id` `<Link>`의 `data-testid`에 적용. `src/components/home/TodayCard.tsx` in_trip 분기에서 `linkTestId="today-card-link"`를 전달(trek Day는 `DayCard`, 이동일은 `TravelDayCard`). | **해소** — design §3의 3개 상태(before·in_trip·after) 모두 `data-testid="today-card-link"`가 DOM에 존재. 시스템 시각을 2027-08-03~17로 고정해도 `tests/e2e/day-detail.spec.ts:11`의 `getByTestId("today-card-link").first()`가 링크를 찾는다. day-detail 사이클 지적 #3과 동일 조치(공유). |
| 2 (Medium) | `TodayCard` before 분기 본문을 `현지(Europe/Paris) 날짜 기준입니다. 첫 일정: {formatKoDate(state.firstDay.date)} {state.firstDay.nameKo}`로 확장. `formatKoDate`를 `@/lib/dates`에서 import(기존 `import type { TodayState }`를 `import { formatKoDate, type TodayState }`로 병합). 하드코딩 "8/3" 없이 `state.firstDay.date` 파생값 사용. | **해소** — 출발 전 화면에 첫 일정 날짜가 표시된다(`8월 3일 (화) 인천 출발` 형태). design §3 본문 문구의 두 문장이 모두 렌더된다. |
| 3 (Low) | `docs/02-design/today-and-safety.design.md` §4 코드블록에 `112 긴급 전화 버튼: <a href="tel:112">112 긴급 전화</a> (FR-014 즉시 통화 수단)` 1줄 추가. 구현(`SafetyCard.tsx:8-10`)은 무변경. | **해소(문서)** — 문서-구현 드리프트 제거. 구현을 정본으로 두고 설계를 맞췄다. |
| 4 (Low) | design §2 제목을 "Day 2~11 fallback (PRD C-3 대안 문장을 표기 정규화하여 사용)"으로 수정. Day 3 화면 문구(seed)는 무변경. | **해소(문서)** — PRD C-3 원문 `대안(악천후·피로): …` → design/seed `악천후·피로 시 …` 정규화가 제목에 명시되어 §2 제목과 내용의 모순이 사라졌다. |
| 5 (Info) | design §5 seed 테스트 목록에 `sourceCheckedAt === "2026-09-16"` 단언을 추가 명시(`tests/unit/seed.test.ts:138` 문서화). | **해소(문서)** — 재조사 기준일 고정이 설계 테스트 목록에 기록되었다. |

### 항목별 대조 재계산

| # | 판정 변화 | 사유 |
|---|---|---|
| 14 | partial → **matched** | before 본문에 `첫 일정: {formatKoDate(firstDay.date)} {nameKo}` 추가(조치 #2) |
| 17 | missing → **matched** | `linkTestId` prop으로 in_trip 링크에 testid 부착(조치 #1) |
| 23 | matched 유지 | `sourceCheckedAt` 단언이 design §5에도 명시되어 문서-테스트 정합 강화(조치 #5) |
| 그 외 21개 | matched 유지 | 변경 없음 |

**Match rate: (matched 24 + partial 0 × 0.5) / 24 = 100.0%** (Act 전 93.8% → **+6.2%p**)
**게이트 95 통과 여부: 통과 (PASS)** — 100.0% ≥ 95%.

### 검증 결과 (Act 후)

| 검사 | 명령 | 결과 |
|---|---|---|
| 타입 | `npx tsc --noEmit` | **오류 2건 — 모두 today-and-safety 범위 밖**. `tests/unit/bookings.test.ts(8,7) TS2741`, `tests/unit/itinerary.test.ts(29,7) TS2740` 둘 다 booking-tracker 사이클의 lodging/booking 스키마 확장 기인. 이번에 수정한 3개 소스 파일에서 신규 오류 0건 |
| 단위 | `npx vitest run` | **11 files 중 8 passed / 3 failed · 80 tests 중 76 passed / 4 failed**. `tests/unit/dates.test.ts`·`tests/unit/seed.test.ts`의 today-and-safety 담당 케이스(경계 4케이스, SC-010 3조건 + 2026-09-16)는 전부 통과. 실패 4건은 lodging 12→14건·booking 필드 추가로 인한 `bookings.test.ts` 2건·`seed.test.ts:107` 1건·`itinerary.test.ts:63` 1건이며 booking-tracker 소유 |
| E2E | `npx playwright test` | 미실행(지시 유지) — 조치 #1의 in_trip testid 실브라우저 검증은 여전히 미확인 |

편집 파일 3개: `src/components/home/TodayCard.tsx`, `src/components/itinerary/DayCard.tsx`, `src/components/itinerary/TravelDayCard.tsx` (+ 문서 `docs/02-design/today-and-safety.design.md` §2·§4·§5). `src/data/seed/days.ts`·`src/components/day/SafetyCard.tsx`는 무변경 — 지적 #3·#4는 문서 측을 구현에 맞추는 조치였다.
