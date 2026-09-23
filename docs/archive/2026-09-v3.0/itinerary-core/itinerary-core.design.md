# Design — itinerary-core (PRD v3.0 델타: 8/16 에귀 뒤 미디 관광)

> feature: itinerary-core · Plan: `docs/01-plan/itinerary-core.plan.md` · 의존: —
> 작성일: 2026-09-18 · 상태: approved (L4 auto)

## Context Anchor
| Key | Value |
|---|---|
| WHY | D-006 확정 일정 반영 |
| WHO | 동행 전원 |
| RISK | 2027 운행·요금 미확정 → needs_check |
| SUCCESS | 8/16 케이블카 구간·fallback·시각 갱신 |
| SCOPE | schema·format·travel-legs·days·LegTimeline·log·tests |

## 1. 파일
```
src/lib/schema.ts                    TravelMode + "cablecar"
src/lib/format.ts                    MODE_LABEL.cablecar = "케이블카"
src/data/seed/travel-legs.ts         leg-0816-0 신설, leg-0816-1/2/3 갱신
src/data/seed/days.ts                d2027-08-16 nameKo/nameOriginal/notes
src/components/travel/LegTimeline.tsx cablecar 배지 톤(alpine) — MODE_LABEL로 자동, notes 렌더 기존 유지
src/lib/log.ts                       + "cablecar_suspended"
tests/unit/seed.test.ts              SC-015
tests/e2e/responsive.spec.ts         /travel/d2027-08-16 케이블카 구간 렌더
```

## 2. seed
### 2.1 `travel-legs.ts` 8/16 (기존 3구간 → 4구간)
```ts
const CMB = "https://www.montblancnaturalresort.com/en/aiguille-du-midi";
{ id: "leg-0816-0", dayId: "d2027-08-16", sequence: 1, mode: "cablecar",
  originKo: "샤모니 (Aiguille du Midi 승강장)", originOriginal: "Chamonix Sud — Aiguille du Midi",
  destinationKo: "에귀 뒤 미디 전망대 (3,842 m) 왕복", destinationOriginal: "Aiguille du Midi (3,842 m) round trip",
  departAt: "07:00", arriveAt: "10:00", duration: "왕복 약 3 h (탑승 20분×2 + 전망 60~90분 + 대기)",
  bookingUrl: CMB,
  fallback: "운휴·악천후 시 에귀 뒤 미디 운휴 · 09:30 버스 일정으로 이동(제네바 11:30 → 취리히 15:00). 지연 시 13:00 버스까지 허용(취리히 19:00). 대안 관광: Montenvers 열차(메르 드 글라스, 왕복 약 €40, 2 h).",
  checkedAt: "2026-09-18", verificationStatus: "needs_check",
  notes: "06:30 호텔 출발 · 07:00 슬롯 온라인 예약(10인, 성인 왕복 약 €75~80) · 1,035 → 2,317 → 3,842 m, 20분 만에 상승하므로 두통·현기증 주의(천천히, 수분) · 정상 0°C 전후·강풍: 방풍 재킷·장갑·선글라스 [조사·기준일 2026-09-18, 확인 필요]" }
leg-0816-1 (bus): sequence 2, departAt "11:30", arriveAt "13:00", duration "약 1h 30m", fallback "12:00 후속 버스 또는 BlaBlaCar Bus. 놓치면 공유셔틀(Alpybus) 예약. 케이블카 운휴 시 09:30 버스.", checkedAt "2026-09-18"
leg-0816-2 (train): sequence 3, departAt "14:00"(PRD C-2 "14:xx"), arriveAt "17:00", duration "약 2h 50m~3h", fallback "SBB IC는 매시 운행. 지연 시 다음 열차(취리히 17:30~18:00), 호텔 체크인 시각만 조정.", checkedAt "2026-09-18"
leg-0816-3 (stay): sequence 4, notes "실당 약 €195~270(USD 210~290 환산). 17:00~17:30 체크인, 저녁 자유."
```
### 2.2 `days.ts` d2027-08-16
`nameKo: "에귀 뒤 미디 관광 → 샤모니 → 제네바 → 취리히"`, `nameOriginal: "Aiguille du Midi → Chamonix → Genève → Zürich"`, `notes: "06:30 에귀 뒤 미디 케이블카 관광(D-006) 후 11:30 샤모니 출발, 취리히 17:00~17:30 도착. 취리히 중앙역 인근 3성 1박, 저녁 자유."`, `sourceCheckedAt: "2026-09-18"`.

## 3. 표시
- `MODE_LABEL.cablecar = "케이블카"`; `LegTimeline` 배지는 기존 로직(mode 라벨 + verificationStatus 배지 "재확인 필요")으로 자동 표시. `notes`는 기존처럼 구간 아래 문단.
- 8/16 `TravelDayCard`(일정 목록·홈)는 legs 수·첫 구간 라벨을 쓰므로 자동 갱신(별도 변경 없음, 렌더 확인).

## 4. 로그
`LogCode` + `"cablecar_suspended"` (info). 앱은 운휴를 판정하지 않으므로 호출부 없음 — Edge Case 표 등록용. 테스트는 코드 문자열 존재만 확인.

## 5. 테스트
- `seed.test.ts` SC-015: `LogCode` 타입에 `"cablecar_suspended"` 존재(타입+문자열 단정), `getTravelLegs("d2027-08-16")` 길이 4, `[2].departAt === "14:00"`, `[0].mode === "cablecar"`, `[0].departAt === "07:00"`, `[0].bookingUrl`에 `montblancnaturalresort.com`, `[0].fallback`에 "09:30 버스", `[1].departAt === "11:30"`, `[2].arriveAt === "17:00"`, 8/16 day nameKo에 "에귀 뒤 미디"; `TravelMode.options`에 "cablecar"
- `responsive.spec.ts`: `/travel/d2027-08-16`에 "케이블카" 배지, "Aiguille du Midi", "운휴" 텍스트, `ol > li` 4개
- `tsc`, `vitest`, `next build`
