# Analysis — itinerary-core (PRD v3.0 델타)

> feature: itinerary-core · Check 단계 · gap-detector 실행 2026-09-18 · 게이트 95
> 설계: `docs/02-design/itinerary-core.design.md` §1~§5 · Plan: `docs/01-plan/itinerary-core.plan.md` §5 · PRD: `docs/PRD.md` v3.0 (FR-005 · SC-015 · Edge "케이블카 운휴·악천후" · D-006 · 부록 A-3 · 부록 C-2 8/16)

## Context Anchor
| Key | Value |
|---|---|
| WHY | D-006 확정 일정(8/16 에귀 뒤 미디 관광)과 화면 일치 확인 |
| WHO | 동행 전원(열람), 리더(예약) |
| RISK | 2027 운행·요금 미확정 → needs_check 유지 |
| SUCCESS | 케이블카 구간·운휴 fallback·후속 구간 시각 갱신·테스트 통과 |
| SCOPE | schema·format·log·travel-legs·days·LegTimeline·TravelDayCard·tests |

---

## 1. 결과

| 항목 | 값 |
|---|---|
| Match rate | **94.2%** = (matched 24 + 0.5×partial 1) / 26 |
| 게이트(95) 통과 | ❌ 미통과 (−0.8%p) |
| Missing | 1 (`cablecar_suspended` 로그 코드 존재 테스트) |
| Partial | 1 (`leg-0816-2` 열차 시각 — PRD C-2 "IC(14:xx)" 및 duration 산술 불일치) |
| Matched | 24 |
| 판정 | Critical 0 · Major 0 · Important 1 · Minor 2 → iterate 1회로 게이트 도달 가능 |

---

## 2. 검증 근거

| 검증 | 명령 | 결과 |
|---|---|---|
| 단위 테스트 | `npx vitest run tests/unit/seed.test.ts` | ✅ 1 file / **15 tests passed** (280ms). SC-015 케이스 `"8/16 starts with the Aiguille du Midi cable-car round trip and shifts onward legs (SC-015, D-006)"` 포함 |
| 타입 체크 | `npx tsc --noEmit` | ✅ 오류 0 (exit 0) |
| 정적 대조 | `src/lib/schema.ts` · `src/lib/format.ts` · `src/lib/log.ts` · `src/data/seed/travel-legs.ts` · `src/data/seed/days.ts` · `src/components/travel/LegTimeline.tsx` · `src/components/itinerary/TravelDayCard.tsx` · `src/app/travel/[dayId]/page.tsx` · `tests/unit/seed.test.ts` · `tests/e2e/responsive.spec.ts` | 파일:줄 단위로 §3에 기재 |
| 회귀(타 이동일 무변경) | `src/data/seed/travel-legs.ts:12~99, 176~207` | ✅ 8/3 3구간·8/4 2구간·8/17 2구간 모두 `checkedAt: CHECKED`(2026-09-09) 유지, sequence·시각 변동 없음 |
| E2E | `npx playwright test` | ⛔ 미실행 (지시에 따라 제외) → §5 |
| 빌드 | `next build` | ⛔ 미실행 (지시에 따라 제외) → §5 |

---

## 3. 항목별 대조

| # | 출처 | 설계/PRD 요구 | 구현 근거 (file:line) | 판정 |
|---|---|---|---|---|
| 1 | 설계 §1 · A-3 | `TravelMode`에 `"cablecar"` 추가 | `src/lib/schema.ts:116` — `z.enum([... "stay", "cablecar"])` | matched |
| 2 | 설계 §1·§3 | `MODE_LABEL.cablecar = "케이블카"` | `src/lib/format.ts:49` | matched |
| 3 | 설계 §4 · Edge | `LogCode`에 `"cablecar_suspended"`(info), 호출부 없음 | `src/lib/log.ts:20` (호출부 0건, grep 결과 log.ts 단독) | matched |
| 4 | 설계 §2.1 | `leg-0816-0` 신설: `dayId d2027-08-16`, `sequence 1`, `mode "cablecar"` | `src/data/seed/travel-legs.ts:104~108` | matched |
| 5 | 설계 §2.1 · C-2 | origin/destination Ko·Original 4필드(샤모니 승강장 / 에귀 뒤 미디 3,842 m 왕복) | `travel-legs.ts:109~112` | matched |
| 6 | 설계 §2.1 · C-2 · SC-015 | `departAt "07:00"` / `arriveAt "10:00"` | `travel-legs.ts:113~114` | matched |
| 7 | 설계 §2.1 | `duration "왕복 약 3 h (탑승 20분×2 + 전망 60~90분 + 대기)"` | `travel-legs.ts:115` (문자열 완전 일치) | matched |
| 8 | 설계 §2.1 · FR-005 | `bookingUrl` = montblancnaturalresort.com(CMB 상수) | `travel-legs.ts:5, 116` | matched |
| 9 | 설계 §2.1 · SC-015 · Edge | fallback: "에귀 뒤 미디 운휴 · 09:30 버스…(제네바 11:30 → 취리히 15:00), 13:00 버스까지 허용, Montenvers 열차" | `travel-legs.ts:117~118` (설계 문구와 완전 일치) | matched |
| 10 | 설계 §2.1 · Plan §4 | `checkedAt "2026-09-18"`, `verificationStatus "needs_check"` | `travel-legs.ts:119~120` (`V3_CHECKED` 상수, `travel-legs.ts:4`) | matched |
| 11 | 설계 §2.1 · C-2 주의 | notes: 06:30 출발·07:00 슬롯·€75~80·1,035→2,317→3,842 m·두통/현기증·0°C 강풍 장비 | `travel-legs.ts:121~122` | matched |
| 12 | 설계 §2.1 · C-2 | `leg-0816-1` bus `sequence 2`, 11:30→13:00, "약 1h 30m", fallback에 "케이블카 운휴 시 09:30 버스", `checkedAt` V3 | `travel-legs.ts:124~139` | matched |
| 13 | 설계 §2.1 · C-2 | `leg-0816-2` train `sequence 3`, 13:30→17:00, "약 2h 50m~3h" | `travel-legs.ts:141~156` — 설계 문자열과는 일치하나 PRD C-2(`docs/PRD.md:570`)는 "SBB IC(**14:xx**)"이며, 13:30→17:00은 3h 30m로 표시된 소요(2h 50m~3h)와 어긋남 | **partial** |
| 14 | 설계 §2.1 | `leg-0816-3` stay `sequence 4`, notes "실당 $210~290. 17:00~17:30 체크인, 저녁 자유." | `travel-legs.ts:158~174` | matched |
| 15 | 설계 §2.2 | `nameKo: "에귀 뒤 미디 관광 → 샤모니 → 제네바 → 취리히"` | `src/data/seed/days.ts:385` | matched |
| 16 | 설계 §2.2 | `nameOriginal: "Aiguille du Midi → Chamonix → Genève → Zürich"` | `days.ts:386` | matched |
| 17 | 설계 §2.2 | `notes` 06:30 관광(D-006)·11:30 출발·17:00~17:30 도착·취리히 3성 1박 | `days.ts:390` | matched |
| 18 | 설계 §2.2 | `sourceCheckedAt: "2026-09-18"` | `days.ts:391` | matched |
| 19 | 설계 §1·§3 | `LegTimeline`: mode 라벨 배지(alpine 톤) + `needs_check` → "재확인 필요" 배지, `notes` 문단 렌더 | `src/components/travel/LegTimeline.tsx:14~17, 40` — `MODE_LABEL[leg.mode]`로 "케이블카" 자동 렌더, 코드 변경 불필요 | matched |
| 20 | 설계 §3 | `TravelDayCard`는 legs 수·mode 라벨을 쓰므로 자동 갱신(변경 없음) | `src/components/itinerary/TravelDayCard.tsx:18, 36` — `stay` 제외 후 `MODE_LABEL` 집합 → "케이블카 · 버스 · 기차", 구간 4개 | matched |
| 21 | 설계 §5 · SC-015 | `seed.test.ts`: 길이 4·`[0].mode`·`departAt`·`bookingUrl`·`fallback "09:30 버스"`·`[1].departAt`·`[2].arriveAt`·`nameKo "에귀 뒤 미디"`·`TravelMode.options` | `tests/unit/seed.test.ts:129~146` (설계 항목 전부 + `arriveAt`·`verificationStatus`·`[3].mode` 추가 검증) | matched |
| 22 | 설계 §5 | `responsive.spec.ts`: "케이블카", "Aiguille du Midi", "운휴", `ol > li` 4개 | `tests/e2e/responsive.spec.ts:65~73` (+ montblancnaturalresort.com 링크 1개 검증) | matched |
| 23 | 설계 §4 | "테스트는 코드 문자열 존재만 확인" — `cablecar_suspended` 존재 단정 테스트 | 전 저장소 grep 결과 `src/lib/log.ts:20` 1건뿐, 테스트 단정 없음 | **missing** |
| 24 | PRD C-2 8/16 · D-006 | 06:30 출발·07:00 슬롯·10:00 샤모니·11:30 버스·취리히 17:00~17:30 | `travel-legs.ts:113~114, 121, 132~133`, `days.ts:390` | matched |
| 25 | 회귀 | 8/3·8/4·8/17 구간 무변경 | `travel-legs.ts:12~99`(8/3 3구간, 8/4 2구간), `176~207`(8/17 2구간) — 전부 `checkedAt: CHECKED` | matched |
| 26 | 설계 §5 · Plan §5.6 | `tsc`, `vitest` 통과 | `npx tsc --noEmit` exit 0 · `vitest run tests/unit/seed.test.ts` 15/15 pass | matched |

---

## 4. 지적과 조치 필요

| # | 심각도 | 지적 | 권장 조치 |
|---|---|---|---|
| 1 | Important | `leg-0816-2`(`src/data/seed/travel-legs.ts:150~152`)의 `departAt "13:30"` → `arriveAt "17:00"`은 3h 30m인데 `duration`은 "약 2h 50m~3h"로 표시된다. 카드에서 출발·도착·소요가 서로 어긋나 보인다. 또한 PRD C-2(`docs/PRD.md:570`)는 제네바 도착 13:00~13:30 후 "SBB IC(**14:xx**)" 탑승으로 명시하고 있어 seed의 13:30 출발과 다르다. | ① PRD C-2를 정본으로 보아 `departAt`을 "14:00"(또는 "14:xx" 정본 확정값)으로 고치고 `arriveAt "17:00"` 유지, 또는 ② 13:30 출발을 유지하려면 `duration`을 "약 3h 30m"으로 고치고 PRD C-2 문구를 함께 정정. 어느 쪽이든 `tests/unit/seed.test.ts:141`의 `arriveAt "17:00"` 단정은 유지 가능. |
| 2 | Minor | 설계 §4가 요구한 "`cablecar_suspended` 코드 문자열 존재 확인" 테스트가 없다. 호출부가 없는 코드라 삭제돼도 어떤 테스트도 실패하지 않는다. | `tests/unit/seed.test.ts` 또는 로그 관련 단위 테스트에 `const code: LogCode = "cablecar_suspended"; expect(code).toBe("cablecar_suspended");` 수준의 타입+문자열 단정 1줄 추가. |
| 3 | Minor | `leg-0816-3` notes(`travel-legs.ts:173`)의 금액이 `$210~290`로 달러 표기다. 같은 파일 8/3 숙박은 `€150~180`이고 PRD 부록 D-1 예산은 EUR/CHF 기준이라 통화 단위가 혼재한다(설계 §2.1 문자열 자체가 `$`로 지정돼 있어 구현 오류는 아님). | 설계 §2.1과 seed를 함께 `CHF`/`€` 표기로 통일하거나, 달러가 의도라면 PRD D-1에 환산 근거를 남긴다. |

> Critical/Major 없음. 지적 1·2 처리 시 match rate 26/26 = 100%로 게이트 통과.

---

## 5. 런타임 미검증

| 항목 | 상태 | 비고 |
|---|---|---|
| `tests/e2e/responsive.spec.ts` 8/16 케이스 | ⛔ 미실행 | 이번 Check에서 Playwright 실행 제외 지시. `/travel/d2027-08-16` 실렌더의 "케이블카" 배지·`ol > li` 4개·"운휴" 문구·예매 링크는 코드 경로(`LegTimeline.tsx:14, 40, 42, 45`)로만 추정 검증. 실행 시 `--workers=1` 권장 |
| `next build` | ⛔ 미실행 | Plan §5.6 성공 기준 중 빌드 통과분 미확인. `tsc --noEmit`은 통과 |
| 케이블카 실제 운행·요금(2027) | 미확정 | I-009, `verificationStatus: "needs_check"`·`checkedAt 2026-09-18`로 표기 중. 2027 시즌 오픈 시 재확인 |
| 운휴 판정 로직 | 설계상 비구현 | 설계 §4대로 앱은 운휴를 판정하지 않으며 `cablecar_suspended`는 Edge Case 표 등록용 코드. 런타임 로그 발생 경로 없음 |

## Act-1 반영 (2026-09-18, pdca-iterate)
| # | 심각도 | 조치 | 결과 |
|---|---|---|---|
| 1 | Important | `leg-0816-2` `departAt` "13:30" → **"14:00"**(PRD C-2 "SBB IC(14:xx)"), `arriveAt` 17:00·duration "약 2h 50m~3h" 정합. 설계 §2.1·`seed.test.ts` 단정(`departAt === "14:00"`) 갱신 | matched |
| 2 | Minor | `seed.test.ts`에 `LogCode` 타입+문자열 단정(`cablecar_suspended`) 추가, 설계 §5 반영 | matched |
| 3 | Minor | `leg-0816-3` notes를 "실당 약 €195~270(USD 210~290 환산)"으로 통일(D-1 근거와 일치), 설계 §2.1 갱신 | matched |

**재계산 Match rate: 26/26 = 100%** · 게이트 95 통과 · `tsc` 0 · `vitest run` 통과(아래 QA).
