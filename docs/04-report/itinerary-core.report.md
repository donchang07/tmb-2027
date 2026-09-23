# Report — itinerary-core (PRD v3.1 델타)

> feature: itinerary-core · 순서 1/3 (v3.1 델타) · 완료일 2026-09-18 · 최종 match rate **100%** (37/37, 게이트 95 통과) · 반복 횟수 **1회**(Check 94.6% → Act-1)
> Plan `docs/01-plan/itinerary-core.plan.md` · Design `docs/02-design/itinerary-core.design.md` · Analysis `docs/03-analysis/itinerary-core.analysis.md` · 이전 사이클 `docs/archive/2026-09-v3.0/itinerary-core/` (v3.0 100%)

## Executive Summary

| 관점 | 내용 (실제 결과) |
|---|---|
| Problem | PRD v3.1 D-007이 8/16을 "에귀 뒤 미디 관광 + 샤모니 2박째", 8/17을 "샤모니 → 제네바 공항 → 취리히 공항 직행"으로 재확정했는데, 구현은 v3.0(8/16 취리히 이동 4구간, 8/17 취리히 중앙역 → 공항)에 머물러 있었다. |
| Solution | 8/16을 케이블카 왕복(`leg-0816-0`) + 샤모니 2박째 숙박(`leg-0816-3`) 2구간으로 축소하고 버스·열차 구간을 삭제했다. 8/17을 버스 08:00→09:30 제네바 공항 · 직통 IC 10:15→13:05 취리히 공항 · KE 18:40 3구간으로 신설하고 공유셔틀 fallback을 넣었다. `days.ts` 8/16 제목·`lodgingId: chamonix-hotel-2`·country, 8/17 제목·country·notes를 D-007 기준으로 갱신했다. |
| Function UX Effect | `/travel/d2027-08-16`은 케이블카 1구간과 "샤모니 호텔 2박째" 숙박만 보이고 이동 시각이 사라졌다. `/travel/d2027-08-17`은 08:00 출발 원칙, 직통 IC 13:05 도착, 공항 여유 4시간, 공유셔틀 예비 예약 안내가 한 화면에 보인다. |
| Core Value | 원정 마지막 이틀을 확정 일정으로 공유한다. 미확정 시각(직통 IC·항공)은 `needs_check`로 명시해 확정값처럼 노출하지 않는다. |

### 1.3 Value Delivered

| 관점 | 지표·근거 |
|---|---|
| 정본 일치 | PRD 부록 C-2 8/16(`docs/PRD.md:575~580`)·8/17(`:583~587`)과 seed 값이 1:1 (`src/data/seed/travel-legs.ts:104~192`, `src/data/seed/days.ts:381~405`) |
| 구간 구조 변경 | 8/16 4구간 → **2구간**(cablecar·stay), 8/17 2구간 → **3구간**(bus·train·flight). 구 `leg-0816-1`·`leg-0816-2`·구 `leg-0817-1`(취리히 중앙역) 전역 삭제 |
| 오안내 제거 | Act-1에서 `leg-0816-0` fallback의 v3.0 잔존 문구("09:30 버스 일정으로 이동 … 취리히 15:00")를 제거 — 이동이 없는 8/16 화면에 버스·열차 시각이 뜨던 결함 해소 (`travel-legs.ts:117`) |
| 데이터 신뢰도 | 직통 IC·항공 구간 `verificationStatus: "needs_check"` + "[조사·기준일 2026-09-18, 확인 필요]", 8/17 day status도 Act-1에서 `confirmed` → `researched`로 정합화(`days.ts:405`) |
| 리스크 대비(I-012) | 버스 fallback에 공유셔틀(Alpybus·Mountain Drop-offs, 전날 예비 예약)·07:30 출발 시 여유 +30분, 열차 fallback에 1시간 간격 다음 편(15:30 도착도 18:40 탑승 가능), 항공 fallback에 재예약·공항 인근 1박 |
| 회귀 방어 | `tests/unit/seed.test.ts:130~166` 8/16·8/17 케이스 — Act-1에서 fallback 양성("오후 슬롯"·"Montenvers")·음성("09:30 버스") 쌍 단정 추가 |
| 무변경 확인 | 8/3 3구간·8/4 2구간은 `checkedAt: 2026-09-09` 유지, 시각·sequence 변동 0건 (`travel-legs.ts:12~101`) |

## Context Anchor

| Key | Value |
|---|---|
| WHY | D-007 확정 일정과 화면 불일치 방지 |
| WHO | 동행 전원(열람), 리더(예약) |
| RISK | 8/17 장거리 이동(I-012), 직통 열차 시각 미확정 → `needs_check` 유지 |
| SUCCESS | 8/16 2구간·8/17 3구간·fallback·`lodgingId` 연결, 테스트 통과 |
| SCOPE | `travel-legs` 8/16·8/17, `days` 8/16·8/17, 단위·E2E 테스트 |

## FR/SC

| ID | 상태 | 근거 |
|---|---|---|
| FR-005 (8/17 3구간) | ✅ 완료 | `travel-legs.ts:143~192` — bus 08:00→09:30 · train 10:15→13:05 · flight 18:40→익일 14:10, 08:00 이전 출발 원칙 notes |
| SC-015 (8/16·8/17 카드) | ✅ 완료 | `tests/unit/seed.test.ts:130~166` 통과 · `tests/e2e/responsive.spec.ts:66~85` 프로덕션 빌드 3 뷰포트 통과 |
| Edge "케이블카 운휴" | ✅ 완료 | fallback = 오후 슬롯(14:00~15:30) 또는 Montenvers·시내 휴식, "이동 일정 영향 없음(D-007)" (`travel-legs.ts:117,136`) |
| 부록 C-2 8/16 | ✅ 완료 | 07:00→10:00 케이블카 + 샤모니 2박째, 이동 구간 0 |
| 부록 C-2 8/17 | ✅ 완료 | 제네바 공항역 → 취리히 공항역 직통 IC, 13:00~13:30 도착, KE 18:40 |
| D-007 | ✅ 완료 | `days.ts:385` "에귀 뒤 미디 관광 · 샤모니 2박째", `:399` "샤모니 → 제네바 공항 → 취리히 공항 → 인천", `:388` `lodgingId: chamonix-hotel-2` |
| I-012 | ⚠️ 미해소(의도) | 직통 IC 시각·공유셔틀 예비 예약은 항공권 확정 후 재확인 절차 — 후속 항목 2번 |
| I-009 | ⚠️ 미해소(의도) | 에귀 뒤 미디 2027 운행·요금 미공개 → 케이블카 구간 `needs_check` 유지. 후속 항목 1번 |
| 표시(LegTimeline·TravelDayCard) | ✅ 코드 변경 없음 | legs 배열 기반 렌더라 구간 수·mode 라벨이 자동 갱신 (`LegTimeline.tsx:6~50`, `TravelDayCard.tsx:18,36`) |

## Success Criteria 최종 (Plan §5)

| # | 기준 | 판정 | 근거 |
|---|---|:--:|---|
| 1 | 8/16 legs 2개: cablecar(07:00→10:00, fallback "오후 슬롯"·"Montenvers"), stay(destinationKo "2박째") | ✅ | `travel-legs.ts:104~139`. Act-1에서 `leg-0816-0` fallback을 v3.1 문구로 교체(GAP-1) |
| 2 | 8/17 legs 3개: bus 08:00→09:30 Genève Aéroport(fallback 공유셔틀), train → Zürich Flughafen 13:05, flight 18:40 | ✅ | `travel-legs.ts:143~192` |
| 3 | 8/16 day `lodgingId === "chamonix-hotel-2"`·nameKo "에귀 뒤 미디"·"2박째", 8/17 nameKo "취리히 공항"·lodgingId 없음 | ✅ | `days.ts:385,388,399` · `seed.test.ts:147,164` |
| 4 | E2E 8/16 타임라인 2개·"2박째", 8/17 타임라인 3개·"Genève Aéroport"·"Zürich Flughafen"·"공유셔틀"·"18:40" | ✅ | `tests/e2e/responsive.spec.ts:66~85` — Act-1 후 재실행 포함 3 뷰포트 통과 |
| 5 | `tsc`·`vitest`·프로덕션 E2E | ✅ | `tsc` 오류 0 · `vitest run` **126/126** · 프로덕션 빌드 Playwright **111/111** |

**충족: 5/5**

## 산출물

- `src/data/seed/travel-legs.ts` — 8/16 `leg-0816-0` fallback·주석 갱신, `leg-0816-3`(stay, 2박째) 유지, 구 버스·열차 구간 삭제 / 8/17 `leg-0817-0`(bus)·`leg-0817-1`(train, 직통 IC)·`leg-0817-2`(flight) 재구성, 구 `leg-0817-1`(취리히 중앙역) 삭제
- `src/data/seed/days.ts` — `d2027-08-16` nameKo·country `["FR"]`·`lodgingId`·notes·`sourceCheckedAt`, `d2027-08-17` nameKo·country `["FR","CH","KR"]`·notes·`verificationStatus`
- `tests/unit/seed.test.ts` — 8/16 케이스(legs 2, fallback 양성·음성 쌍), 8/17 케이스(legs 3, 공유셔틀·13:05·18:40, lodgingId undefined)
- `tests/e2e/responsive.spec.ts` — 8/16·8/17 케이스
- 변경 없음(확인만): `src/components/travel/LegTimeline.tsx`, `src/components/itinerary/TravelDayCard.tsx`, `src/app/travel/[dayId]/page.tsx`
- 문서: `docs/PRD.md` D-006 supersede 표기·16.2 비교표 v3.1 열·부록 A-3 TravelLeg fallback 문구(Act-1 정본 정정)

## Key Decisions & Outcomes (Plan §4)

| 결정 | 준수 | 결과 |
|---|:--:|---|
| 8/16은 `leg-0816-0`(cablecar)·`leg-0816-3`(stay)만 남기고 버스·열차 삭제, id 재번호 없음 | ✅ | `grep` 결과 구 id 전역 0건. sequence는 1·2로 연속, 기존 불변식 테스트(`seed.test.ts:117~128`)가 그대로 통과 |
| 8/17은 `leg-0817-0/1/2`로 신설, 구 취리히 중앙역 구간 삭제 | ✅ | "취리히 중앙역" 문자열 `src/` 0건. 3구간 모두 fallback·duration 채워져 불변식 위반 없음 |
| 직통 IC 시각(10:15→13:05)은 `needs_check` + "[조사·기준일 2026-09-18, 확인 필요]" | ✅ | 확정 표기를 피해 I-012 재확인 대상임이 화면에 드러난다. Act-1에서 8/17 day status도 `researched`로 낮춰 구간 배지와 정합 |
| (Act-1 추가) 케이블카 fallback은 이동이 아니라 시간대 변경으로 기술 | ✅ | "오후 슬롯(14:00~15:30) → Montenvers 또는 시내 휴식 → 이동 영향 없음" 3단계. "운휴" 단어를 유지해 기존 E2E 단언이 계속 성립 |

## Check → Act 요약

| 단계 | 내용 |
|---|---|
| Check (gap-detector, 2026-09-18) | **94.6%** = (matched 34 + 0.5×partial 2) / 37. 게이트 95 **미통과(−0.4%p)**. Critical 0 · Major 1 · Minor 2 · Info 3 |
| GAP-1 (Major) | `leg-0816-0` fallback이 v3.0 원문("09:30 버스 일정으로 이동 … 취리히 15:00") 잔존 → 이동 없는 8/16 화면에 버스·열차 시각 노출. v3.1 문구로 교체 → **matched** |
| GAP-2 (Minor) | 단위 테스트가 `/오후 슬롯\|Montenvers/` 선택지라 잔존 문구를 통과시킴 → "오후 슬롯"·"Montenvers" 포함 + "09:30 버스" 미포함 양성·음성 쌍으로 강화 → **matched** |
| GAP-3 (Minor) | `travel-legs.ts:102` 주석이 삭제된 v3.0 동선 설명 → "에귀 뒤 미디 관광(D-006) · 샤모니 2박째(D-007)"로 정정 → **matched** |
| GAP-4 (Info) | PRD 내부 모순(D-006 본문·16.2 비교표·부록 A-3 TravelLeg) → 정본에 supersede 표기·v3.1 열·fallback 문구 반영 |
| GAP-6 (Info) | 8/17 day `verificationStatus` `confirmed` → `researched`(구간 2개가 `needs_check`), 테스트로 고정 → **matched** |
| GAP-5 (Info) | `departAt "08:00"`은 설계·Plan 명시값과 일치 → 유지. 항공권 확정 후 07:45 등으로 재확정(I-012) |
| Act-1 후 재계산 | **37/37 = 100%** · 게이트 95 통과 |
| QA (2026-09-18) | `tsc` 0 · `vitest run` **126/126** · 프로덕션 빌드 Playwright **111/111**. 8/16·8/17 케이스는 Act-1 직후 재실행해 3 뷰포트 전부 통과 |

## 후속·미검증 항목

1. **I-009 — 에귀 뒤 미디 2027 운행·요금 확인** — 첫 상행 06:30~07:10·성인 왕복 €75~80·10인 시간대 예약은 2025 기준 조사값이다(`checkedAt 2026-09-18`, `needs_check`). 2027-03 시즌 오픈 시 Compagnie du Mont Blanc에서 시간표·요금을 재확인하고 `travel-legs.ts` 시각과 `budget.ts` 금액·`sourceCheckedAt`을 같은 날짜로 함께 갱신한다(budget-view 후속 1번과 같은 건).
2. **I-012 — 8/17 이동 확정** — ① 제네바 공항역 → 취리히 공항역 **직통 IC 시각(10:15→13:05)을 SBB에서 재확인**하고 `needs_check`를 해제한다. ② 버스 지연·결행 대비 **공유셔틀(Alpybus·Mountain Drop-offs) 예비 예약**을 전날 기준으로 잡고, 확정 시 `leg-0817-0` fallback에 예약 번호·연락처를 기록해 동행 전원에게 공유한다. 두 작업 모두 항공권 확정 후·출발 30일 전이 PRD가 정한 시점이다.
3. **8/17 출발 시각 경계값** — seed `departAt`이 정확히 `"08:00"`이라 정본의 "08:00 이전 출발"과 문자 그대로는 어긋나 보인다(GAP-5). 셔틀·버스 편이 확정되면 07:45 등 실제 시각으로 바꾸거나 C-2 문구를 "08:00 출발 기준"으로 정렬한다.
4. **운휴 판정 로직 비구현** — `cablecar_suspended`(`src/lib/log.ts`)에 런타임 발생 경로가 없다. 실시간 운행 상태 조회는 이번 범위 밖이므로 운휴 시 리더가 당일 판단해 오후 슬롯 또는 Montenvers로 전환한다.
5. **Supabase 미연결 항목** — 이번 델타는 정적 seed만 다뤄 DB 의존이 없다. 다만 `/travel/d2027-08-16`의 숙박 카드는 `getPublicBookings()` 경로를 타므로, 마이그레이션 적용 후 `chamonix-hotel-2` 행의 실제 렌더와 RLS 동작을 1회 확인해야 한다(booking-tracker 후속 2·3번과 같은 건).
6. **런타임 미확인 잔여** — 8/16 "예약 링크 1개" 단언이 stay 구간의 `bookingUrl: null` 렌더("예매 링크 없음")와 함께 실제 DOM에서 어떻게 보이는지는 E2E 통과로만 확인했고 시각 확인은 하지 않았다.
