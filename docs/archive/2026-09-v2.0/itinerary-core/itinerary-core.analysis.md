# Analysis — itinerary-core (v2.0)

> feature: itinerary-core · Check 단계 · gap-detector 실행 2026-09-17 · Design: `docs/02-design/itinerary-core.design.md` · 게이트 95

## 결과

| 항목 | 값 |
|---|---|
| Match rate | **93.3%** (matched 27 + 0.5×partial 2) / 30 |
| 게이트(95) 통과 | ❌ 미통과 (−1.7%p) |
| Missing | 1 |
| Partial | 2 |
| Matched | 27 |
| 판정 | Critical 0 · Important 1 · Minor 2 → iterate 1회로 게이트 도달 가능 |

## 검증 근거

| 검증 | 명령 | 결과 |
|---|---|---|
| 타입 | `npx tsc --noEmit` | exit 0 · 출력 없음 (오류 0) |
| 단위 테스트 | `npx vitest run tests/unit/seed.test.ts tests/unit/phases.test.ts` | exit 0 · 2 files / **15 tests passed** (seed 13 · phases 2) |
| E2E | `tests/e2e/responsive.spec.ts` | 미실행 (이번 Check 범위 밖) |
| 빌드 | `next build` | 미실행 (이번 Check 범위 밖) |

정적 분석 공식(runtime 미포함)으로 산정했다. 아래 "런타임 미검증" 참고.

## 항목별 대조

| # | 설계 항목 | 상태 | 근거 |
|---|---|:--:|---|
| 1 | `TripSchema.timezone = z.literal("Europe/Paris")` (§2.1, A-1) | ✅ | `src/lib/schema.ts:188` |
| 2 | Trip seed 163.0 / 9750 / 9725 / timezone / checkedAt 2026-09-16 (§2.1) | ✅ | `src/data/seed/trip.ts:10-14` |
| 3 | Day 9 = 16 km · +850 · −1,015 · "6 h" · 2026-09-16 (§2.2) | ✅ | `src/data/seed/days.ts:265-268`, `:282` (`CHECKED_D910 = "2026-09-16"` `:4`) |
| 4 | Day 10 = 13.5 km · +1,100 · −975 · "6 h" · 2026-09-16 (§2.2) | ✅ | `src/data/seed/days.ts:294-297`, `:312` |
| 5 | Day 10 routePoints 5개 · Col des Posettes 1,997 m "콜 데 포제트" 순서 (§2.2) | ✅ | `src/data/seed/days.ts:305-311` (Balme 2191 → Posettes 1997 → Aiguillette 2201) |
| 6 | Day 9 fallback = PRD 부록 C-3 대안 문장 (§2.2) | ✅ | `src/data/seed/days.ts:273-274` ≡ `docs/PRD.md:583` |
| 7 | Day 10 fallback = PRD 부록 C-3 대안 문장 (§2.2) | ✅ | `src/data/seed/days.ts:302-303` ≡ `docs/PRD.md:590` |
| 8 | `EMERGENCY = "112 · 숙박 연락처"` 12개 Day 공통 (§2.2) | ⚠️ | `src/data/seed/days.ts:5` 값이 `"112 · 숙박 연락처 (유럽 공통 긴급번호 · 연락처는 아래 숙박 카드 참고)"` — 12개 Day 공통 적용은 충족, 설계 리터럴과 불일치 |
| 9 | 항공 2구간 `needs_check` + "브리프 기준, 확인 필요" notes (§2.3) | ✅ | `src/data/seed/travel-legs.ts:24-25` (leg-0803-1), `:186-187` (leg-0817-2) |
| 10 | `NavKey` + `RELEASED` 5키 전부 true (§3) | ✅ | `src/lib/phases.ts:3-11` |
| 11 | `QUICK_LINKS` 5개(key/href/label/desc) (§3) | ✅ | `src/lib/phases.ts:13-19` — 일정·예산·지도·준비물·기록 |
| 12 | `visibleQuickLinks(released, log)` 필터 + `nav_hidden_by_phase` info 로그 (§3) | ✅ | `src/lib/phases.ts:23-32` |
| 13 | `LogCode`에 `"nav_hidden_by_phase"` 추가 (§1) | ✅ | `src/lib/log.ts:18` |
| 14 | TripMetrics 타일 5개·순서(기간·인원·트레킹·획득·하강) (§4) | ✅ | `src/components/home/TripMetrics.tsx:14-19` |
| 15 | `fmtKm`(소수 1자리)·`fmtM`(천 단위) 사용, 접두 "약" 제거 (§4) | ⚠️ | `fmtM` 사용 ✅ `TripMetrics.tsx:18-19`, "약" 제거 ✅ (src 전역 0건) / 거리는 `fmtKm` 대신 `totals.distanceKm.toFixed(1)` `:17` — `fmtKm`는 `maximumFractionDigits: 1`이라 163 → "163"이 되어 설계대로 쓰면 "163.0 km"가 깨짐(`src/lib/format.ts:1,5-7`) |
| 16 | TripMetrics 반응형 `grid-cols-2` / `sm:grid-cols-5` (§4) | ✅ | `src/components/home/TripMetrics.tsx:13` |
| 17 | QuickLinks가 `visibleQuickLinks()` 렌더 · `sm:grid-cols-5` (§3) | ✅ | `src/components/home/QuickLinks.tsx:6-12` |
| 18 | Day 상세 header 아래 "아침 이동" 섹션(`aria-labelledby` · `LegTimeline`) (§5) | ✅ | `src/app/day/[dayId]/page.tsx:63-70` (`legs.length > 0` 조건 `:63`) |
| 19 | 기존 "아침 이동 보기" 링크를 섹션 내부 보조 링크로 이동 (§5) | ✅ | `src/app/day/[dayId]/page.tsx:71-76` — 라벨 "이동 상세 보기 (2구간)", href `/travel/{dayId}`; 구 링크 잔존 0건 |
| 20 | seed.test: totals {163, 9750, 9725} = trip (§6) | ✅ | `tests/unit/seed.test.ts:38-47` · pass |
| 21 | seed.test: Day 9/10 필드 + "Col des Posettes" 순서·고도 (§6) | ✅ | `tests/unit/seed.test.ts:53-65` · pass |
| 22 | seed.test: 12 trek `emergency.startsWith("112 · 숙박 연락처")` (§6) | ✅ | `tests/unit/seed.test.ts:67-71` · pass |
| 23 | seed.test: 항공 2구간 needs_check (§6) | ✅ | `tests/unit/seed.test.ts:73-80` · pass |
| 24 | seed.test: `trip.timezone === "Europe/Paris"` (A-1) | ✅ | `tests/unit/seed.test.ts:49-51` · pass |
| 25 | phases.test: 5개 반환 (§6) | ✅ | `tests/unit/phases.test.ts:5-11` · pass |
| 26 | phases.test: `{...RELEASED, journal:false}` → 4개 + spy 1회 (§6) | ✅ | `tests/unit/phases.test.ts:13-20` · pass |
| 27 | responsive.spec: "163.0 km"·"9,750 m"·"9,725 m", "약 162.5" 제거 (§6) | ✅ | `tests/e2e/responsive.spec.ts:53-60`; 리포지토리 전역 "162.5"·"9,610" 0건 |
| 28 | Day 1 상세 "아침 이동" 렌더 검증 (Plan §2 FR-005 "Day 1 상세 렌더 테스트" · Plan SC-6) | ❌ | `/day/d2027-08-04`의 "아침 이동" 제목·2구간을 검증하는 테스트 없음. `tests/` 전역에 `아침 이동`·`morning-heading` 0건. `responsive.spec.ts:4`는 해당 경로를 스크롤·axe 검사용으로만 방문 |
| 29 | `tsc --noEmit` 통과 (§6) | ✅ | exit 0 |
| 30 | `vitest run` 통과 (§6) | ✅ | 15/15 pass |

## 지적과 조치 필요

| # | 심각도 | 지적 | 권장 조치 |
|---|:--:|---|---|
| 1 | **Important** | Plan SC-6("`/day/d2027-08-04`에 '아침 이동' 제목과 2구간 렌더")을 검증하는 자동 테스트가 없다. 구현(`page.tsx:63-77`)은 정적 판독상 정확하나 회귀를 잡을 장치가 없고, jsdom·testing-library 미설치(`package.json:22-32`)라 단위 렌더 테스트 경로도 막혀 있다. | `tests/e2e/responsive.spec.ts`에 테스트 1개 추가: `/day/d2027-08-04` 이동 후 `getByRole("heading", { name: "아침 이동" })` 가시성과 `LegTimeline` 구간 2개(제네바→샤모니, 샤모니→레주슈), 보조 링크 "이동 상세 보기" 존재를 단언. 설계 §6 테스트 목록에도 이 항목을 추가한다. |
| 2 | Minor | 설계 §4는 거리 포맷에 `fmtKm` 사용을 지정했으나 구현은 `toFixed(1)`을 쓴다. `fmtKm`는 `maximumFractionDigits: 1`이라 163 → "163 km"가 되어 설계대로 쓰면 FR-008의 "163.0 km"가 깨진다. 즉 설계 문구 쪽이 틀렸다. | 둘 중 하나. (a) `format.ts`의 `nf`에 `minimumFractionDigits: 1`을 넣어 `fmtKm(163) === "163.0 km"`로 만들고 `TripMetrics`를 `fmtKm(totals.distanceKm)`로 교체(다른 `fmtKm` 호출부 회귀 확인 필요), (b) 설계 §4 문구를 "거리는 `toFixed(1)` 고정"으로 갱신. 코드가 진실이므로 (b)가 저위험. |
| 3 | Minor | 설계 §2.2의 `EMERGENCY = "112 · 숙박 연락처"`와 구현 상수(`days.ts:5`, 괄호 설명 포함)가 문자열로 불일치. 테스트는 `startsWith` 기준이라 통과하지만 설계 문서가 실제 값과 다르다. | 설계 §2.2를 `EMERGENCY = "112 · 숙박 연락처 (유럽 공통 긴급번호 · 연락처는 아래 숙박 카드 참고)"` 또는 "…로 시작하는 문자열"로 갱신. 코드 변경 불필요. |

## 런타임 미검증

이번 Check는 정적 분석 + 단위 테스트만 수행했다. 아래는 Match rate 분모에서 제외했으며 QA 단계에서 확인해야 한다.

| 범위 | 미검증 항목 | 필요 조치 |
|---|---|---|
| 빌드 | `next build` (설계 §6 "수동/빌드") | QA 단계에서 실행 |
| E2E | `tests/e2e/responsive.spec.ts` 실제 실행 — 홈의 "163.0 km"·"9,750 m"·"9,725 m" 렌더, 6개 페이지 가로 스크롤·44px 탭 타깃·axe(SC-005) | `npx playwright test tests/e2e/responsive.spec.ts` |
| E2E | Day 1 "아침 이동" 섹션의 실제 렌더·탭 타깃·접근성(위 지적 #1 테스트 추가 후) | 테스트 추가 후 실행 |
| 시각 | TripMetrics·QuickLinks 5열 그리드의 모바일(`grid-cols-2`)/데스크톱 1440×900 실제 레이아웃 (FR-007) | QA 단계 스크린샷 |
## Act-1 반영 (2026-09-17, pdca-iterate)
| # | 조치 | 결과 |
|---|---|---|
| 1 (Important) | `tests/e2e/responsive.spec.ts`에 "Day 1 detail shows inline morning-travel timeline with 2 legs (FR-005)" 추가 — 제목·타임라인 2구간·제네바/레주슈·"이동 상세 보기" 링크 단언. 설계 §6 테스트 목록 갱신 | matched |
| 2 (Minor) | 설계 §4를 "거리는 `toFixed(1)` 고정"으로 정정(코드가 진실) | matched |
| 3 (Minor) | 설계 §2.2 EMERGENCY 문자열을 실제 값으로 정정 | matched |

**재계산 Match rate: 30/30 = 100% (정적)** · 게이트 95 통과 · `tsc` 0 오류 · `vitest run` 77/77. E2E 실행은 QA 단계(전체 feature 완료 후 `playwright test`)에서 수행.
