# Analysis — itinerary-core (PRD v3.1 델타)

> feature: itinerary-core · Check 단계 · gap-detector 실행 2026-09-18 · 게이트 95%
> 설계: `docs/02-design/itinerary-core.design.md` §1~§4 · Plan: `docs/01-plan/itinerary-core.plan.md` §5
> PRD: `docs/PRD.md` v3.1 FR-005 · SC-015 · Edge 케이블카 운휴 · D-006/D-007 · I-012 · 부록 C-2 8/16·8/17
> 이전 사이클: `docs/archive/2026-09-v3.0/itinerary-core/` (v3.0 100%)

## 결과

| 지표 | 값 |
|---|---|
| 대조 항목 | 37 |
| matched | 34 |
| partial | 2 |
| missing | 1 |
| **Match Rate** | **(34 + 0.5×2) / 37 = 35 / 37 = 94.6%** |
| 게이트(95%) | **FAIL (−0.4%p)** |
| Critical / Major | 0 / 1 |
| Minor | 2 |
| Info | 3 |

8/17 3구간(버스 08:00→09:30 · 직통 IC 10:15→13:05 · KE 18:40)과 8/16 2구간 구조, `days.ts` 8/16·8/17 제목·country·`lodgingId`·notes, 구 `leg-0816-1`·`leg-0816-2`·구 `leg-0817-1`(취리히 중앙역) 삭제는 **설계·Plan·PRD와 전부 일치**한다. 단 **`leg-0816-0`의 `fallback` 문자열만 v3.0 원문이 그대로 남아 있다.** Plan §3 In 범위가 "`leg-0816-0` fallback"을 명시했고 설계 §2 표가 새 문구를 지정했는데 반영되지 않았다. 이 문자열은 8/16 화면에 "09:30 버스 일정으로 이동(제네바 11:30 → 취리히 15:00)"으로 렌더되어, **이동 구간이 하나도 없는 8/16 페이지에서 D-007과 정면으로 모순되는 안내를 사용자에게 노출한다.** 기존 단위 테스트가 이를 잡지 못한 이유는 검증식이 `/오후 슬롯|Montenvers/` 선택지라서 잔존 문구의 "대안 관광: Montenvers 열차"에 걸려 통과하기 때문이다(테스트 민감도 결함).

## 검증 근거

### 1. 명령 실행

```
$ npx vitest run tests/unit/seed.test.ts
  Test Files  1 passed (1)
  Tests      16 passed (16)
  Duration   236ms

$ npx tsc --noEmit
  TSC_EXIT=0   (출력 없음)
```

### 2. 소스 변경 없음

본 Check 단계에서 `src/**`·`tests/**` 파일은 읽기만 했고 수정하지 않았다. 산출물은 본 문서 1개다.

### 3. 회귀 확인(8/3·8/4)

| leg | 값 | 근거 | PRD C-2 |
|---|---|---|---|
| leg-0803-1 | flight ICN 11:05 → ZRH 17:25 | `src/data/seed/travel-legs.ts:12-28` | 일치 |
| leg-0803-2 | train 18:48 → 21:45, fallback 19:08/19:15 | `src/data/seed/travel-legs.ts:30-46` | 일치 |
| leg-0803-3 | stay 제네바 1박 | `src/data/seed/travel-legs.ts:48-64` | 일치 |
| leg-0804-1 | bus 07:30 → 09:30 | `src/data/seed/travel-legs.ts:66-83` | 일치(07:00~08:00대 출발) |
| leg-0804-2 | train 10:00 → 10:25 | `src/data/seed/travel-legs.ts:85-101` | 일치(20~25분) |

`checkedAt`은 모두 `CHECKED = "2026-09-09"`(`travel-legs.ts:3`)로, v3.1 델타가 8/3·8/4를 건드리지 않았음이 확인된다.

## 항목별 대조

### A. `src/data/seed/travel-legs.ts` — 8/16

| # | 설계 §2 / Plan §5 요구 | 구현 근거 | 판정 |
|---|---|---|---|
| A1 | `leg-0816-0` 존재 · sequence 1 · mode `cablecar` | `travel-legs.ts:104-107` | matched |
| A2 | 07:00 → 10:00 | `travel-legs.ts:112-113` | matched |
| A3 | Chamonix Sud → Aiguille du Midi 왕복(3,842 m) | `travel-legs.ts:108-111` | matched |
| A4 | 예약 링크(montblancnaturalresort.com) | `travel-legs.ts:5, 115` | matched |
| A5 | **fallback "오전 흐리면 오후 슬롯(14:00~15:30), 종일 운휴 시 Montenvers 또는 시내 휴식, 이동 영향 없음"** | `travel-legs.ts:116-117` — v3.0 원문 "09:30 버스 일정으로 이동(제네바 11:30 → 취리히 15:00). 지연 시 13:00 버스까지 허용(취리히 19:00)" 잔존 | **missing** |
| A6 | status `needs_check` | `travel-legs.ts:119` | matched |
| A7 | 고도 3,842 m 주의 문구·10인 예약 notes (FR-005, C-2) | `travel-legs.ts:120-121` | matched |
| A8 | `leg-0816-3` sequence 2 · mode `stay` | `travel-legs.ts:124-127` | matched |
| A9 | destinationKo "샤모니 호텔 2박째 (8/15와 같은 호텔)" | `travel-legs.ts:130` | matched |
| A10 | stay fallback = 오후 슬롯 + Montenvers + 이동 영향 없음(D-007) | `travel-legs.ts:136` | matched |
| A11 | status `estimated` | `travel-legs.ts:138` | matched |
| A12 | 구 `leg-0816-1`(버스)·`leg-0816-2`(열차) 삭제 | 파일 전역 부재 | matched |
| A13 | 파일 주석 일관성 | `travel-legs.ts:102` 주석이 삭제된 v3.0 동선 "→ 샤모니 → 제네바 → 취리히" 유지 | **partial** |

### B. `src/data/seed/travel-legs.ts` — 8/17

| # | 요구 | 구현 근거 | 판정 |
|---|---|---|---|
| B1 | `leg-0817-0` seq 1 · bus · 샤모니 → Genève Aéroport | `travel-legs.ts:143-150` | matched |
| B2 | 08:00 → 09:30 · 약 1h 15m~1h 30m | `travel-legs.ts:151-153` | matched |
| B3 | fallback 공유셔틀(Alpybus·Mountain Drop-offs, 전날 예비 예약) · 07:30 이전 출발 시 +30분 | `travel-legs.ts:155` | matched |
| B4 | status `researched` | `travel-legs.ts:157` | matched |
| B5 | notes 08:00 이전 출발 원칙(I-012) | `travel-legs.ts:158` | matched |
| B6 | `leg-0817-1` seq 2 · train · Genève-Aéroport → Zürich Flughafen | `travel-legs.ts:161-168` | matched |
| B7 | 10:15 → 13:05 · 약 2h 50m 직통 IC | `travel-legs.ts:169-171` | matched |
| B8 | fallback 다음 편(1시간 간격, 15:30 도착도 탑승 가능) · 단체권·Supersaver | `travel-legs.ts:173` | matched |
| B9 | status `needs_check` + [조사·기준일 2026-09-18, 확인 필요] | `travel-legs.ts:175-176` | matched |
| B10 | `leg-0817-2` seq 3 · flight ZRH → ICN 18:40 → 익일 14:10 | `travel-legs.ts:179-189` | matched |
| B11 | fallback 결항 시 재예약 · 공항 인근 호텔 1박 | `travel-legs.ts:191` | matched |
| B12 | 구 `leg-0817-1`(취리히 중앙역 → 공항) 삭제 | 전역 부재(`grep "취리히 중앙역" src/` 무결과) | matched |

### C. `src/data/seed/days.ts`

| # | 요구 | 구현 근거 | 판정 |
|---|---|---|---|
| C1 | 8/16 nameKo "에귀 뒤 미디 관광 · 샤모니 2박째" | `days.ts:385` | matched |
| C2 | 8/16 `lodgingId: "chamonix-hotel-2"` | `days.ts:388` | matched |
| C3 | 8/16 country `["FR"]` · type `travel` | `days.ts:384, 387` | matched |
| C4 | 8/16 notes(오후 슬롯·2박째·이동 없음) | `days.ts:390` | matched |
| C5 | 8/17 nameKo "샤모니 → 제네바 공항 → 취리히 공항 → 인천" | `days.ts:399` | matched |
| C6 | 8/17 country `["FR","CH","KR"]` | `days.ts:401` | matched |
| C7 | 8/17 notes(08:00 이전 출발·직통 IC·18:40·I-012) · `lodgingId` 없음 | `days.ts:402-403` | matched |
| C8 | 8/16·8/17 `sourceCheckedAt: "2026-09-18"` | `days.ts:391, 404` | matched |

### D. 표시 계층(설계 §3 — "변경 없음"이 정답)

| # | 요구 | 구현 근거 | 판정 |
|---|---|---|---|
| D1 | `LegTimeline`이 legs 배열만 순회(구간 수 하드코딩 없음) | `src/components/travel/LegTimeline.tsx:6-50` | matched |
| D2 | `TravelDayCard`가 `legs.length`·mode 라벨을 파생(stay 제외) | `src/components/itinerary/TravelDayCard.tsx:18, 36` | matched |
| D3 | `/travel/[dayId]`가 `day.lodgingId` 기반 숙박 카드 렌더 → 8/16은 `chamonix-hotel-2`(undecided, 후보 없음) | `src/app/travel/[dayId]/page.tsx:29-30, 52-64` · `src/data/seed/lodgings.ts:264-280` | matched |

### E. 테스트

| # | 요구 | 구현 근거 | 판정 |
|---|---|---|---|
| E1 | `seed.test.ts` 8/16: legs 2 · cablecar 07:00/10:00 · 예약 링크 · needs_check · stay "2박째" · day lodgingId | `tests/unit/seed.test.ts:130-147` | **partial** — fallback 검증이 `/오후 슬롯\|Montenvers/` 선택지라 잔존 v3.0 문구도 통과시킴(`seed.test.ts:137`) |
| E2 | `seed.test.ts` 8/17: legs 3 · bus 08:00 Genève Aéroport · 공유셔틀 · train 13:05 · flight 18:40 · day nameKo · lodgingId undefined | `tests/unit/seed.test.ts:149-166` | matched |
| E3 | `responsive.spec.ts` 8/16: 타임라인 2 · "2박째" · 케이블카 · 운휴 문구 · 예약 링크 1 | `tests/e2e/responsive.spec.ts:66-75` | matched(코드 기준, 실행 미검증) |
| E4 | `responsive.spec.ts` 8/17: 타임라인 3 · Genève Aéroport · Zürich Flughafen · 공유셔틀 · 18:40 | `tests/e2e/responsive.spec.ts:77-85` | matched(코드 기준, 실행 미검증) |
| E5 | 이동일 공통 불변식(구간 ≥1, sequence 연속, duration·fallback 비어있지 않음) | `tests/unit/seed.test.ts:117-128` | matched |
| E6 | 숙박 14개 1:1 매핑에 `chamonix-hotel-2` 포함(zurich-hotel 부재) | `tests/unit/seed.test.ts:107-115` | matched |

### F. 회귀·실행

| # | 요구 | 근거 | 판정 |
|---|---|---|---|
| F1 | 8/3 legs 3개 불변 | `travel-legs.ts:12-64` (checkedAt 2026-09-09) | matched |
| F2 | 8/4 legs 2개 불변 | `travel-legs.ts:66-101` | matched |
| F3 | `npx vitest run tests/unit/seed.test.ts` 통과 | 16/16 pass | matched |
| F4 | `npx tsc --noEmit` 통과 | exit 0, 출력 없음 | matched |

## 지적과 조치 필요

### GAP-1 (Major) — `leg-0816-0` fallback이 v3.0 문구 그대로

- 위치: `src/data/seed/travel-legs.ts:116-117`
- 현재 값: `"운휴·악천후 시 에귀 뒤 미디 운휴 · 09:30 버스 일정으로 이동(제네바 11:30 → 취리히 15:00). 지연 시 13:00 버스까지 허용(취리히 19:00). 대안 관광: Montenvers 열차(메르 드 글라스, 왕복 약 €40, 2 h)."`
- 위반 근거: 설계 §2 표 `leg-0816-0` fallback 열 · Plan §3 In("`leg-0816-0` fallback") · Plan §5-1 · PRD Edge 케이블카 운휴 행(`docs/PRD.md:206` "에귀 뒤 미디 운휴 · 오후 슬롯 재시도 또는 Montenvers 대안") · PRD 부록 C-2 8/16(`docs/PRD.md:580` "fallback: 종일 운휴·악천후 → Montenvers 또는 시내 휴식. 이동 일정에는 영향 없음(D-007)") · D-007
- 영향: `/travel/d2027-08-16` 첫 구간 카드의 "지연 시 대안" 영역(`LegTimeline.tsx:44-46`)에 **8/16에 존재하지 않는 버스·열차 이동 시각**이 표시된다. 8/16은 샤모니 2박째로 이동이 없으므로 동행 전원에게 잘못된 행동 지시가 노출된다.
- 조치(Act): fallback을 `leg-0816-3`(`travel-legs.ts:136`)과 같은 v3.1 문구로 교체. 예: `"오전 슬롯이 흐리면 오후 슬롯(14:00~15:30 상행)으로 변경. 종일 운휴·악천후 시 Montenvers 열차(메르 드 글라스, 왕복 약 €40, 2 h) 또는 시내 휴식. 이동 일정 영향 없음(D-007)."` — "운휴" 단어를 유지해야 E2E(`responsive.spec.ts:72`)가 계속 통과한다.

### GAP-2 (Minor) — 단위 테스트가 GAP-1을 검출하지 못함

- 위치: `tests/unit/seed.test.ts:137` — `expect(legs[0]?.fallback).toMatch(/오후 슬롯|Montenvers/)`
- 문제: 선택지 정규식이라 v3.0 잔존 문구의 "대안 관광: Montenvers"에 걸려 통과한다. 설계 §4의 의도("새 fallback으로 교체되었는가")를 검증하지 못한다.
- 조치: `toContain("오후 슬롯")` + `not.toMatch(/버스 일정으로 이동|취리히/)` 형태의 양성·음성 쌍으로 강화. E2E도 `getByText(/운휴/)` 외에 "오후 슬롯"을 직접 확인하면 잔존 문구를 잡는다.

### GAP-3 (Minor) — 삭제된 동선을 설명하는 주석 잔존

- 위치: `src/data/seed/travel-legs.ts:102` — `// 8/16 에귀 뒤 미디 관광(D-006) → 샤모니 → 제네바 → 취리히`
- 조치: `// 8/16 에귀 뒤 미디 관광 + 샤모니 2박째 (D-006, D-007)` 등으로 갱신. 141행의 8/17 주석은 이미 v3.1 기준으로 정확하다.

### GAP-4 (Info) — PRD 내부 잔존 모순(정본 측 결함, 코드 범위 밖)

- `docs/PRD.md:377` D-006이 "11:30 샤모니 출발(취리히 17:00~17:30 도착) … 운휴 시 09:30 버스 복귀"를 여전히 확정으로 서술한다. D-007(`docs/PRD.md:376`)이 이를 대체했으나 supersede 표기가 없다.
- `docs/PRD.md:438` 16.2 비교표 "8/16 | 09:30 버스 출발 | 에귀 뒤 미디 관광 후 11:30 출발(D-006)" — v3.1 열이 없다.
- `docs/PRD.md:492` 부록 A-3 TravelLeg 행 "케이블카 구간 fallback: 운휴 시 09:30 버스 복귀" — Edge 행(`docs/PRD.md:206`)·C-2와 모순. GAP-1의 근인일 가능성이 높다.
- 조치: D-006에 "D-007로 대체(2026-09-18)" 표기, 438·492행을 v3.1 문구로 갱신. 본 사이클 Act 범위 밖이면 다음 PRD 개정 항목으로 이관.

### GAP-5 (Info) — "08:00 이전 출발"의 문자 그대로의 해석

- FR-005(`docs/PRD.md:137`)·I-012(`:347`)·C-2 8/17(`:585`)는 "08:00 이전 출발 / 07:30~08:00 출발"인데 seed `departAt`은 정확히 `"08:00"`(`travel-legs.ts:151`)이다. 설계 §2·Plan §5-2가 08:00→09:30을 명시했으므로 **설계 대비로는 일치**이며 notes(`:158`)·fallback(`:155`)이 07:30 여유를 보완한다. 다만 정본 문구와 데이터가 경계값에서 어긋나 보이므로, 항공권 확정 후 조사 때 07:45 등으로 확정하거나 C-2 문구를 "08:00 출발 기준"으로 정렬할 것을 권한다.

### GAP-6 (Info) — 8/17 day `verificationStatus: "confirmed"`

- `days.ts:405`가 `confirmed`인데 3개 구간 중 2개(train·flight)가 `needs_check`이고 notes에도 "확인 필요"가 남아 있다. 설계가 day status를 지정하지 않아 판정 항목에는 넣지 않았으나, 화면의 "데이터 상태"(`src/app/travel/[dayId]/page.tsx:70-72`)에 "확정"으로 표기되어 구간 배지와 상충한다. 8/16(`researched`)과의 일관성 검토를 권한다.

## 런타임 미검증

다음은 본 Check에서 **정적 대조만** 했고 실제 실행으로 확인하지 않았다.

1. `tests/e2e/responsive.spec.ts:66-85`(8/16·8/17 케이스) 미실행. 프로덕션 빌드 E2E는 Report 또는 QA 단계에서 `--workers=1`로 수행해야 한다. 특히 8/16 "예약 링크 1"(`a[href*="montblancnaturalresort.com"]` 1개) 단언은 stay 구간의 `bookingUrl: null` 렌더 경로(`LegTimeline.tsx:42` "예매 링크 없음")와 함께 실제 DOM에서 확인해야 한다.
2. `/travel/d2027-08-16` 숙박 섹션의 `chamonix-hotel-2` 카드(undecided·후보 없음) 실제 렌더와 `getPublicBookings()` 조회 결과(`src/app/travel/[dayId]/page.tsx:29-30`) — DB 의존 경로라 정적 확인 불가.
3. GAP-1 fallback 문구가 실제 화면에 노출되는 형태(줄바꿈·길이) — 코드 경로(`LegTimeline.tsx:44-46`)로만 추정했다.
4. `cablecar_suspended` Edge 로그의 런타임 발생 경로 — 단위 테스트는 `LogCode` 타입 존재만 확인한다(`tests/unit/seed.test.ts:140-141`).
5. 전체 단위 테스트 스위트(`tests/unit` 전량)·lint는 실행하지 않았다(지시 범위: `seed.test.ts` + `tsc --noEmit`).

## Act-1 반영 (2026-09-18, pdca-iterate)
| # | 심각도 | 조치 | 결과 |
|---|---|---|---|
| GAP-1 | Major | `leg-0816-0` fallback을 v3.1 문구("오전 슬롯이 흐리면 오후 슬롯(14:00~15:30 상행)으로 변경. 종일 운휴·악천후 시 Montenvers … 샤모니 2박째라 이동 일정 영향 없음(D-007)")로 교체 | matched |
| GAP-2 | Minor | `seed.test.ts`: fallback에 "오후 슬롯"·"Montenvers" 포함, "09:30 버스" 미포함을 각각 단정 | matched |
| GAP-3 | Minor | `travel-legs.ts` 8/16 주석을 "에귀 뒤 미디 관광(D-006) · 샤모니 2박째(D-007)"로 정정 | matched |
| GAP-4 | Info | PRD(`tmb2027-v3.1.md`·`docs/PRD.md`) D-006에 D-007 대체 표기, 16.2 비교표 v3.1 열, A-3 TravelLeg fallback 문구 갱신 | 정본 정정 |
| GAP-6 | Info | 8/17 day `verificationStatus` "confirmed" → "researched"(구간 2개가 needs_check), 테스트로 고정 | matched |
| GAP-5 | Info | 08:00 출발은 설계·Plan 명시값과 일치. 항공권 확정 후 재조사 시 07:45 등으로 확정(I-012) | 유지 |

**재계산 Match rate: 37/37 = 100%** · 게이트 95 통과 · `tsc` 0 · `vitest run` 126/126.

## Act-2 반영 (2026-09-18, 외부 사실 실측)
| 항목 | 실측 | 반영 |
|---|---|---|
| 제네바 공항역 → 취리히 공항역 | SBB 직통 IC1, 30분 간격(:02·:32), 약 3 h(취리히 HB 2h45~2h51 + 공항 10분) — SBB·genevatourism.org·Trainline | `leg-0817-1` 10:02→13:05, fallback 10:32→13:35, `researched` |
| 에귀 뒤 미디 | 2026 7/1~8/23 06:10~18:00, 성인 왕복 €60.20~83 동적, 7~8월 시간대 예약 필수, 단체 요금 20인 이상 — aiguilledumidi.montblancnaturalresort.com·chamonix.com·loisirs74.fr | `leg-0816-0` notes 갱신, PRD C-2·B·I-009 |
