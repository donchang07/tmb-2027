# Report — itinerary-core (PRD v3.0 델타)

> feature: itinerary-core · 순서 1/3 (v3.0 델타) · 완료일 2026-09-18 · 최종 match rate **100%** (26/26, 게이트 95 통과) · 반복 횟수 **1회**(Check 94.2% → Act-1)
> Plan `docs/01-plan/itinerary-core.plan.md` · Design `docs/02-design/itinerary-core.design.md` · Analysis `docs/03-analysis/itinerary-core.analysis.md` · 이전 사이클 `docs/archive/2026-09-v2.0/itinerary-core/` (v2.0 100%)

## Executive Summary

| 관점 | 내용 (실제 결과) |
|---|---|
| Problem | PRD v3.0이 8/16 아침 에귀 뒤 미디 케이블카 관광을 확정(D-006)했지만, 구현의 8/16 이동일은 여전히 09:30 버스 출발 3구간이었고 `TravelMode`에 케이블카 자체가 없었다. |
| Solution | `TravelMode`에 `cablecar`를 추가하고(`src/lib/schema.ts`) `MODE_LABEL.cablecar = "케이블카"`를 등록했다. `travel-legs.ts` 8/16을 4구간(케이블카 왕복 07:00→10:00 → 버스 11:30→13:00 → IC 14:00→17:00 → 취리히 1박)으로 재구성하고 운휴 fallback·고도 주의 notes·예약 링크를 넣었다. Edge용 `cablecar_suspended` 로그 코드를 등록하고 `days.ts` 8/16 제목·notes를 D-006 기준으로 갱신했다. |
| Function UX Effect | `/travel/d2027-08-16` 첫 구간에 "케이블카 · 재확인 필요" 배지, `Aiguille du Midi (3,842 m) round trip`, 예약 링크(montblancnaturalresort.com), 운휴 시 09:30 버스 fallback, 고도 주의 문구가 보이고 이후 버스·열차 시각이 새 일정으로 갱신됐다. 일정 목록의 8/16 카드는 "케이블카 · 버스 · 기차"·4구간으로 자동 갱신된다. |
| Core Value | 원정 마무리 관광까지 한 화면에서 확정 일정으로 공유한다. 운행·요금이 미확정인 정보는 `needs_check`로 명시해 확정값처럼 노출하지 않는다. |

### 1.3 Value Delivered

| 관점 | 지표·근거 |
|---|---|
| 정본 일치 | PRD 부록 C-2 8/16(06:30 출발·07:00 슬롯·10:00 복귀·11:30 버스·SBB IC 14:xx·취리히 17:00~17:30)이 seed 값과 1:1 (`src/data/seed/travel-legs.ts:104~174`, `src/data/seed/days.ts:385~391`) |
| 데이터 신뢰도 | 케이블카 구간 `verificationStatus: "needs_check"` + `checkedAt: 2026-09-18` + notes "[조사·기준일 2026-09-18, 확인 필요]" → I-009(2027 시즌 미공개)를 화면에 그대로 노출 |
| 안전 정보 | notes에 1,035 → 2,317 → 3,842 m 급상승에 따른 두통·현기증 주의, 정상 0°C 전후·강풍 장비(방풍 재킷·장갑·선글라스) 명시 |
| 운휴 대비 | fallback 한 문장에 09:30 버스(취리히 15:00) · 13:00 버스 허용(19:00) · 대안 관광(Montenvers 왕복 약 €40, 2 h) 3단계 |
| 회귀 방어 | `tests/unit/seed.test.ts` SC-015 케이스 12단언(구간 수·mode·시각·예약 링크·fallback·`LogCode`·`TravelMode.options`) + E2E 1건 |
| 무변경 확인 | 8/3 3구간·8/4 2구간·8/17 2구간은 `checkedAt: 2026-09-09` 유지, sequence·시각 변동 0건 |

## Context Anchor

| Key | Value |
|---|---|
| WHY | D-006 확정 일정과 화면 불일치 방지 |
| WHO | 동행 전원(열람), 리더(예약) |
| RISK | 2027 운행 시간·요금 미확정(I-009) → `needs_check` 라벨과 재확인일 유지 |
| SUCCESS | 8/16 카드에 케이블카 구간·운휴 fallback, 이후 구간 시각 갱신, 테스트 통과 |
| SCOPE | schema `TravelMode`, `travel-legs` 8/16, `days` 8/16 notes, `MODE_LABEL`, `LegTimeline` 주의 문구, log 코드, 테스트 |

## FR/SC

| ID | 상태 | 근거 |
|---|---|---|
| FR-005 (케이블카 구간) | ✅ 완료 | `travel-legs.ts:104~122` `leg-0816-0` — 출발 07:00·도착 10:00·소요·예약 링크·fallback·notes 6요소 전부 |
| SC-015 (8/16 카드) | ✅ 완료 | `tests/unit/seed.test.ts:130~150` SC-015 케이스 통과 · `tests/e2e/responsive.spec.ts:65~73` 프로덕션 빌드에서 3 뷰포트 통과 |
| Edge "케이블카 운휴·악천후" | ✅ 완료 | fallback 문구 + `src/lib/log.ts:20` `cablecar_suspended`(info). 앱은 운휴를 판정하지 않으므로 호출부 없음 — Edge 표 등록용 코드이며 존재를 테스트가 단정 |
| 부록 A-3 `TravelMode` | ✅ 완료 | `src/lib/schema.ts:116` enum에 `"cablecar"` |
| 부록 C-2 8/16 | ✅ 완료 | 버스 11:30→13:00, IC 14:00→17:00, 취리히 체크인 17:00~17:30 (`travel-legs.ts:124~174`) |
| D-006 | ✅ 완료 | `days.ts:385~390` `nameKo "에귀 뒤 미디 관광 → 샤모니 → 제네바 → 취리히"`, notes에 06:30 관광·11:30 출발 |
| I-009 | ⚠️ 미해소(의도) | 2027 시즌 요금·시간표 미공개 → `needs_check` 유지가 정상 상태. 후속 항목 1번 |
| 표시(LegTimeline·TravelDayCard) | ✅ 코드 변경 없음 | `LegTimeline.tsx:14~17,40`이 `MODE_LABEL[leg.mode]`로 자동 렌더, `TravelDayCard.tsx:18,36`이 mode 집합·구간 수를 자동 갱신 |

## Success Criteria 최종 (Plan §5)

| # | 기준 | 판정 | 근거 |
|---|---|:--:|---|
| 1 | `TravelMode.parse("cablecar")` 통과, `MODE_LABEL`에 케이블카 | ✅ | `schema.ts:116` · `format.ts:49` · `seed.test.ts`의 `TravelMode.options` 단언 |
| 2 | 8/16 legs: 1 cablecar(07:00→10:00, 예약 링크, fallback "09:30 버스") · 2 버스 11:30 · 3 IC → 17:00 · 4 stay | ✅ | `travel-legs.ts:104~174`. Act-1에서 IC `departAt`을 13:30 → **14:00**으로 정정(PRD C-2 "SBB IC(14:xx)") |
| 3 | `days` 8/16 `nameKo`에 "에귀 뒤 미디" 포함 | ✅ | `days.ts:385` + 테스트 단언 |
| 4 | `LogCode`에 `cablecar_suspended` | ✅ | `log.ts:20` + Act-1에서 추가한 타입·문자열 단정 |
| 5 | `/travel/d2027-08-16` 렌더에 "케이블카"·"Aiguille du Midi"·"운휴" | ✅ | 프로덕션 빌드 Playwright 통과. 8/16 케이스의 `ol > li` 셀렉터를 `getByTestId("leg-timeline")` 스코프로 좁혀 다른 `ol` 오검출 제거 |
| 6 | `tsc`·`vitest`·`next build` | ✅ | `tsc` 오류 0 · `vitest run` **124/124** · 프로덕션 빌드 E2E **108/108** |

**충족: 6/6** (v2.0 사이클에서 미결이던 빌드·E2E 항목까지 이번 QA에서 마감)

## 산출물

- `src/lib/schema.ts` — `TravelMode`에 `"cablecar"`
- `src/lib/format.ts` — `MODE_LABEL.cablecar = "케이블카"`
- `src/lib/log.ts` — `cablecar_suspended` (info, 호출부 없음)
- `src/data/seed/travel-legs.ts` — `leg-0816-0` 신설, `leg-0816-1/2/3` sequence·시각·fallback·notes 갱신, `V3_CHECKED` 상수
- `src/data/seed/days.ts` — `d2027-08-16` `nameKo`/`nameOriginal`/`notes`/`sourceCheckedAt`
- `src/components/travel/LegTimeline.tsx`, `src/components/itinerary/TravelDayCard.tsx` — 코드 변경 없이 자동 반영(렌더 확인만)
- `tests/unit/seed.test.ts` (SC-015 케이스), `tests/e2e/responsive.spec.ts` (8/16 케이블카 케이스)
- 문서: `docs/02-design/itinerary-core.design.md` §2.1·§5 정정(Act-1)

## Key Decisions & Outcomes (Plan §4)

| 결정 | 준수 | 결과 |
|---|:--:|---|
| 케이블카는 상행·하행을 나누지 않고 왕복 1구간(`mode: cablecar`)으로 표현 | ✅ | 구간 수가 4로 유지돼 카드 가독성과 sequence 규칙이 단순해졌다. duration 문자열이 탑승·전망·대기 내역을 담아 정보 손실도 없다 |
| 운휴 판정은 앱이 하지 않고 fallback 문구로 안내, `cablecar_suspended`는 Edge 표 등록용 info 코드 | ✅ | 호출부 0건이 의도대로 유지. Act-1에서 코드 존재 단정을 테스트에 넣어 "삭제돼도 어떤 테스트도 깨지지 않는" 구멍을 막았다 |
| 시각은 PRD C-2 값을 그대로 seed에 넣고 `verificationStatus: "needs_check"` | ✅ (Act-1에서 완성) | Check 시점의 IC 출발 13:30은 C-2("14:xx")와 어긋나고 표시 소요(2h 50m~3h)와도 3h 30m로 불일치했다. 정본 기준 14:00으로 정정해 출발·도착·소요 3자가 정합 |
| (Act-1 추가) 숙박 금액은 EUR 주 표기로 통일 | ✅ | `leg-0816-3` notes를 "실당 약 €195~270(USD 210~290 환산)"으로 바꿔 부록 D-1(EUR/CHF 기준)과 통화 단위를 맞췄다 |

## Check → Act 요약

| 단계 | 내용 |
|---|---|
| Check (gap-detector, 2026-09-18) | **94.2%** = (matched 24 + 0.5×partial 1) / 26. 게이트 95 미통과(−0.8%p). Critical 0 · Major 0 · Important 1 · Minor 2 |
| Important #1 | `leg-0816-2` 출발 13:30이 PRD C-2 "SBB IC(14:xx)"와 다르고 표시 소요와도 불일치 → `departAt "14:00"`으로 정정, 설계 §2.1·테스트 단언 동반 갱신 → **matched** |
| Minor #2 | `cablecar_suspended` 존재를 확인하는 테스트 부재 → `seed.test.ts`에 `LogCode` 타입+문자열 단정 추가 → **matched** |
| Minor #3 | `leg-0816-3` notes 금액이 달러 단독 표기 → "€195~270(USD 210~290 환산)"으로 통일 → **matched** |
| Act-1 후 재계산 | **26/26 = 100%** · 게이트 95 통과 |
| QA (2026-09-18) | `tsc` 0 · `vitest run` 124/124 · 프로덕션 빌드 Playwright **108/108**. 8/16 E2E는 `ol > li` 셀렉터를 `leg-timeline` testid로 스코프한 뒤 3 뷰포트 전부 통과 |

## 후속·미검증 항목

1. **I-009 — 에귀 뒤 미디 2027 운행·요금 확인** — 첫 상행 06:30~07:10 · 성인 왕복 약 €75~80 · 10인 시간대 예약은 2025 기준 조사값이다(`checkedAt 2026-09-18`, `verificationStatus: "needs_check"`). 2027-03 시즌 오픈 시 Compagnie du Mont Blanc에서 시간표·요금을 재확인하고 `travel-legs.ts` 시각·`budget.ts` 금액·`checkedAt`을 함께 갱신한다. 항공권 확정 직후 온라인 예약이 PRD I-009가 정한 절차다.
2. **운휴 판정 로직은 설계상 비구현** — `cablecar_suspended`에 런타임 발생 경로가 없다. 실시간 운행 상태 조회는 v3.0 비목표이므로 운휴 시에는 리더가 당일 판단해 fallback대로 09:30/13:00 버스로 전환한다. 향후 운행 상태 API를 붙이면 이 코드에 호출부를 연결한다.
3. **Supabase 미연결 항목** — 이번 델타는 정적 seed만 다루므로 DB 의존이 없다. 다만 booking-tracker가 이동일 숙박(취리히·제네바 호텔)을 DB로 옮기면 `leg-0816-3` notes의 금액과 `lodgings` 행의 가격이 이중 관리되므로, 연결 후 단일 출처로 정리할지 판단한다.
4. **GAP-5/6 (day-detail Info) 교차 영향** — `lodgings` seed에 남은 `nameKo`(GAP-5)와 `LodgingCard`의 "후보 숙소" 블록(GAP-6)은 이동일 호텔 표기와도 닿아 있다. 해당 블록의 귀속 feature를 정한 뒤 8/16 취리히 숙소 표기를 함께 점검한다.
5. **케이블카 예산 연동** — 요금이 확정되면 `budget.ts`의 `aiguille-du-midi` 항목(75/80)과 합계·권장 금액이 함께 움직인다. 두 seed의 `sourceCheckedAt`을 같은 날짜로 유지할 것(budget-view 보고서 후속 1번과 같은 건).
