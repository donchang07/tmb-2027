# Report — today-and-safety (PRD v2.0 개정)

> feature: today-and-safety · 순서 4/9 · 완료일 2026-09-17 · 최종 match rate **100.0%** (24/24, 게이트 95 통과) · 반복 횟수 **1회**(Check → Act-1)
> Plan `docs/01-plan/today-and-safety.plan.md` · Design `docs/02-design/today-and-safety.design.md` · Analysis `docs/03-analysis/today-and-safety.analysis.md`

## Executive Summary

| 관점 | 내용 (실제 결과) |
|---|---|
| Problem | 날짜 판정 기준이 화면 문구로 드러나지 않아 출발 전 한국에서 D-day를 오해할 여지가 있었고, Day 2~11의 우천·피로 대안이 v2 조사분이라 "확인 필요"가 남아 있었다. 또 여행 기간 중에는 홈에 E2E가 찾는 오늘 카드 링크가 없었다. |
| Solution | Day 2~11 fallback 10개를 PRD 부록 C-3(2026-09-16) 대안 문장으로 교체하고 `sourceCheckedAt`을 `RECHECKED`로 올렸다. TodayCard 3상태 문구를 "출발까지 D-N (현지 기준)" / 오늘 Day 강조 / "원정이 종료되었습니다"로 맞추고, Act-1에서 `linkTestId` prop을 도입해 3상태 모두 `data-testid="today-card-link"`를 부착했다. SafetyCard에 `tel:112` 즉시 통화 버튼과 기본값 분기를 두었다. |
| Function UX Effect | 출발 전 홈에서 `출발까지 D-N (현지 기준)`과 `첫 일정: 8월 3일 (화) 인천 출발`이 함께 보이고, 각 Day 안전 카드에 구체적 우회로·버스 노선·만실 대안이 문장으로 노출된다. 비상 시 112 버튼 1탭으로 통화가 가능하다. |
| Core Value | 산행 중 의사결정을 한 화면에서 끝낸다. 시간대 혼동과 대안 부재라는 현장 판단 지연 요인을 둘 다 제거했다. |

### 1.3 Value Delivered

| 관점 | 지표·근거 |
|---|---|
| 대안 완결성(FR-014) | Day 2~11 fallback 10개가 설계 §2 표와 **문자 단위 완전 일치**(스크립트 대조 10/10, 84~200자). 전부 `sourceCheckedAt = 2026-09-16` |
| 미확정 정보 0건(SC-010) | Day 2~11 "확인 필요" 0건 — `tests/unit/seed.test.ts:136` 전수 검사 통과 |
| 시간대 정확성(FR-009) | 모든 판정이 `TRIP_TZ = Europe/Paris`. KST 08:00 = 파리 01:00 경계 포함 4케이스 단위 테스트 통과 |
| 문구 명시성 | "(현지 기준)" + 첫 일정 날짜를 `formatKoDate(state.firstDay.date)` 파생값으로 표시(하드코딩 없음) |
| 비상 대응 | 12개 Day 공통 `EMERGENCY` + `tel:112` 즉시 통화 버튼(`SafetyCard.tsx:8-10`) |
| 검증 통과 | `vitest run tests/unit/dates.test.ts tests/unit/seed.test.ts` 19/19 pass, `tsc --noEmit` exit 0 |

## Context Anchor

| Key | Value |
|---|---|
| WHY | 시간대 혼동·대안 부재는 현장 판단 지연으로 이어진다 |
| WHO | 동행 전원 |
| RISK | days.ts는 itinerary-core가 먼저 수정하므로 순서 의존 |
| SUCCESS | D-N 문구 "(현지 기준)", Day 2~11 대안에 "확인 필요" 0건, 경계 테스트 통과 |
| SCOPE | dates·TodayCard·days.ts fallback·SafetyCard·테스트 |

## FR/SC

| ID | 상태 | 근거 |
|---|---|---|
| FR-009 (기간 밖 D-N) | ✅ 완료 | `TodayCard.tsx:27` "출발까지 D-{n} (현지 기준)" · `:42` "원정이 종료되었습니다" · 판정은 `src/lib/dates.ts:4-13` Europe/Paris 단일 기준 |
| FR-009 (기간 내 강조) | ✅ 완료 | `TodayCard.tsx:59-63` `isToday` 전달로 오늘 Day 카드 강조 |
| FR-009 (경계 판정) | ✅ 완료 | `tests/unit/dates.test.ts:14-31` — KST 08:00(파리 01:00) → 8/3 in_trip, 8/17 21:59:59Z in_trip, 22:00Z after |
| FR-014 (우천·피로 대안) | ✅ 완료 | `days.ts` Day 2~11 fallback 10개, Day 1·12는 현행 유지(선택 사항) |
| FR-014 (비상 연락) | ✅ 완료 | `days.ts:5` `EMERGENCY` 12개 Day 공통 + `SafetyCard.tsx:8-10` `tel:112` 버튼 |
| SC-010 | ✅ 완료 | Day 2~11 "확인 필요" 0건 + 길이 ≥20 + `/우천\|악천후\|강풍\|피로/` 매치 (`seed.test.ts:130-140`) |
| 부록 C-3 | ✅ 완료 | PRD 10개 대안 문장 → 설계 §2 → seed 전달 확인. Day 3만 표기 정규화(설계 §2 제목에 명시) |
| Edge "여행 기간 밖" | ✅ 완료 | before / after 분기 각각 문구·링크·testid 보유 |
| N-004 / N-005 | ✅ 완료 | Day 2~11 대안 재조사 반영, 기준일 2026-09-16 |

## Success Criteria 최종 (Plan §5)

| # | 기준 | 판정 | 근거 |
|---|---|:--:|---|
| 1 | `resolveTodayState("2027-08-02T23:00:00Z")` → in_trip 8/3, `"2027-08-17T22:00:00Z"` → after | ✅ | `tests/unit/dates.test.ts:19-30` 4케이스 pass |
| 2 | Day 2~11 fallback 길이 ≥20, "확인 필요" 미포함, 우천·피로 어휘 포함 | ✅ | `tests/unit/seed.test.ts:135-138` pass (+ `sourceCheckedAt` 추가 단언) |
| 3 | TodayCard 기간 밖 렌더에 "(현지 기준)" | ⚠️ 부분 | 코드상 `TodayCard.tsx:27`에 존재. 컴포넌트 렌더 테스트가 없어 **실제 화면 출현은 코드 판독 근거뿐** |
| 4 | `tsc`·`vitest`·`next build` 통과 | ⚠️ 부분 | 담당 범위 `tsc` 오류 0 · 담당 단위 테스트 19/19 pass. 전체 `vitest run`의 실패 4건은 booking-tracker 소유. `next build` 미실행 |

**충족: 2/4** (3·4번 부분 충족 — 둘 다 런타임 실행 미수행이 원인, 구현 결함 아님)

## 산출물

- `src/data/seed/days.ts` — Day 2~11 fallback 10개 교체 + `sourceCheckedAt: RECHECKED`(2026-09-16), Day 1·12 현행 유지
- `src/components/home/TodayCard.tsx` — 3상태 문구·`linkTestId` 전달·첫 일정 날짜 표시
- `src/components/day/SafetyCard.tsx` — fallback/emergency 기본값, `tel:112` 버튼, `checkedAt` 표시
- `src/components/itinerary/DayCard.tsx`, `src/components/itinerary/TravelDayCard.tsx` — 선택적 `linkTestId?: string` prop (Act-1, day-detail 사이클과 공유 조치)
- `src/lib/dates.ts` — `TRIP_TZ`·`toLocalDateISO`·`resolveTodayState`·`formatKoDate` (기존, 활용)
- `tests/unit/dates.test.ts` (경계 4케이스), `tests/unit/seed.test.ts` (SC-010)
- 문서: `docs/02-design/today-and-safety.design.md` §2 제목·§4 tel 링크·§5 단언 추가(Act-1)

## Key Decisions & Outcomes (Plan §4)

| 결정 | 준수 | 결과 |
|---|:--:|---|
| "원정이 종료되었습니다"는 Paris 날짜 > endDate(8/18 00:00 CEST 이후)로 판정 — 기존 `resolveTodayState` 유지 | ✅ | 로직 변경 없이 문구만 정비. `"2027-08-17T21:59:59Z"` → in_trip, `"2027-08-17T22:00:00Z"` → after 경계가 테스트로 고정됨 |
| SafetyCard의 "확인 필요" 기본 문구를 "대안 선택 사항"으로 바꾸되, 현재 seed는 Day 1·12도 문장이 있어 화면에는 나타나지 않는다 | ✅ (예상대로) | `SafetyCard.tsx:5` 기본값 구현. Day 1~12 전부 fallback이 채워져 있어 `??` 분기는 런타임에 도달하지 않음 — 결정에 명시된 그대로다 |
| (Act-1 추가) 설계와 구현이 어긋날 때 구현을 정본으로 두고 문서를 맞춘다 | ✅ | 지적 #3(`tel:112` 버튼)·#4(Day 3 표기 정규화)·#5(테스트 단언)를 모두 문서 갱신으로 처리. 화면 문구·동작 변경 0건 |

## Check → Act 요약

| 단계 | 내용 |
|---|---|
| Check (2026-09-17) | **93.8%** — matched 22 · partial 1 · missing 1 / 24. 게이트 95 미통과(−1.2%p). `vitest` 19/19 pass, `tsc` exit 0 |
| 핵심 진단 | 미달 원인은 seed 데이터가 아니라 TodayCard의 UI 계약 2건. fallback 10개는 설계와 문자 단위 완전 일치 |
| High #1 | in_trip 상태에 `data-testid="today-card-link"` 부재 → `DayCard`/`TravelDayCard`에 `linkTestId?` prop 추가, TodayCard in_trip 분기에서 전달 → **해소** (missing → matched) |
| Medium #2 | before 본문에 첫 일정 날짜(8/3) 미표시 → `formatKoDate(state.firstDay.date)` 파생값으로 본문 확장 → **해소** (partial → matched) |
| Low #3 | 설계에 없는 `tel:112` 버튼(구현이 FR-014에 더 부합) → 설계 §4에 1줄 추가 → **해소(문서)** |
| Low #4 | PRD C-3 Day 3 표기와 설계·seed 정규화 문구 불일치 → 설계 §2 제목을 "표기 정규화하여 사용"으로 수정 → **해소(문서)** |
| Info #5 | 테스트의 `sourceCheckedAt` 단언이 설계 §5에 미기재 → 설계 §5에 명시 → **해소(문서)** |
| Act-1 후 재계산 | **24/24 = 100.0%** (+6.2%p) · 게이트 95 **통과**. 담당 3개 소스 파일에서 신규 타입 오류 0건 |

## 후속·미검증 항목

1. **런타임 미검증(E2E)** — `npx playwright test` 미실행. Act-1 조치 #1의 in_trip testid가 실제 브라우저 DOM에 나타나는지, 그리고 여행 기간 중 `tests/e2e/day-detail.spec.ts:11`의 `getByTestId("today-card-link").first()`가 링크를 찾는지 확인해야 한다.
2. **시각 고정 테스트 부재** — 분석·구현 시점(2026-09-17)은 항상 `before` 상태다. 페이지 레벨에서 Paris 자정 경계 전이가 올바로 동작하는지는 단위(`resolveTodayState` 직접 호출)로만 검증됐다. QA 단계에서 시스템 시각을 2027-08-03~17로 고정한 E2E 케이스를 추가한다(Plan §5-3 마감 조건).
3. **컴포넌트 렌더 공백** — TodayCard 3상태의 실제 렌더 테스트가 없어 "출발까지 D-N (현지 기준)" 문자열의 화면 출현이 코드 판독 근거뿐이다. jsdom/testing-library 미설치가 근본 원인이므로 도입 여부를 QA에서 결정한다.
4. **SafetyCard 기본값 분기 미도달** — 현재 seed가 12개 Day 전부 `fallback`·`emergency`를 채우므로 `?? "대안 선택 사항 (Day 1·12)"`, `?? "112 · 숙박 연락처"` 분기가 런타임에 도달하지 않는다. 회귀 시 발견이 불가하므로 단위 렌더 테스트가 생기면 기본값 케이스를 명시적으로 덮는다.
5. **빌드 미검증** — `next build` 미실행. RSC 경계·빌드 타임 오류는 `tsc --noEmit` 통과만으로 담보되지 않는다.
6. **Supabase 연결 후 할 일** — 이 feature는 seed 정적 데이터와 클라이언트 날짜 판정만 다루므로 Supabase 의존이 없다. 다만 `days.ts`는 itinerary-core와 공유 파일이므로, 다른 사이클이 Day 수치를 DB로 옮길 경우 fallback 10개와 `sourceCheckedAt` 이관 여부를 확인한다.
7. **Minor 잔여** — 없음(Low 2건·Info 1건 모두 Act-1에서 문서 정정으로 해소). 전체 `vitest run`의 실패 4건은 booking-tracker 소유 항목으로 이 feature 범위 밖이다.
