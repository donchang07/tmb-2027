# Design — itinerary-core (PRD v3.1 델타)

> feature: itinerary-core · Plan: `docs/01-plan/itinerary-core.plan.md` · 의존: —
> 작성일: 2026-09-18 · 상태: approved (L4 auto)

## Context Anchor
| Key | Value |
|---|---|
| WHY | D-007 반영 |
| WHO | 동행 전원 |
| RISK | I-012 장거리 이동, 열차 시각 미확정 |
| SUCCESS | 8/16 2구간·8/17 3구간 |
| SCOPE | travel-legs·days·tests |

## 1. 파일
```
src/data/seed/travel-legs.ts   8/16: leg-0816-0(cablecar, fallback 갱신) + leg-0816-3(stay) · 8/17: leg-0817-0(bus) + leg-0817-1(train) + leg-0817-2(flight, sequence 3)
src/data/seed/days.ts          d2027-08-16 nameKo "에귀 뒤 미디 관광 · 샤모니 2박째", lodgingId chamonix-hotel-2, country ["FR"] · d2027-08-17 nameKo "샤모니 → 제네바 공항 → 취리히 공항 → 인천", country ["FR","CH","KR"], sourceCheckedAt 2026-09-18
tests/unit/seed.test.ts        SC-015 8/16·8/17 케이스
tests/e2e/responsive.spec.ts   /travel/d2027-08-16 (2 legs, "2박째"), /travel/d2027-08-17 (3 legs)
```

## 2. seed
| leg | seq | mode | 출발 → 도착 | 시각 | fallback | status |
|---|---|---|---|---|---|---|
| leg-0816-0 | 1 | cablecar | Chamonix Sud → Aiguille du Midi 왕복 (2026 실측: 06:10~18:00, €60.20~83 동적, 7~8월 시간대 예약 필수) | 07:00→10:00 | 오전 흐리면 오후 슬롯(14:00~15:30), 종일 운휴 시 Montenvers 또는 시내 휴식, 이동 영향 없음 | needs_check |
| leg-0816-3 | 2 | stay | 샤모니 호텔 2박째(8/15와 같은 호텔) | — | 위와 동일 | estimated |
| leg-0817-0 | 1 | bus | Chamonix → Genève Aéroport | 08:00→09:30 | 지연·결행 시 공유셔틀(Alpybus·Mountain Drop-offs, 전날 예비 예약), 07:30 이전 출발 시 +30분 | researched |
| leg-0817-1 | 2 | train | Genève-Aéroport → Zürich Flughafen 직통 IC1 | 10:02→13:05 (30분 간격 :02·:32, 약 3 h) | 다음 편 10:32→13:35, 15:30 도착도 탑승 가능, 단체권·Supersaver 사전 예매 | researched (2026-09-18 실측, 2027 시간표 재확인) |
| leg-0817-2 | 3 | flight | ZRH → ICN | 18:40→익일 14:10 | 결항 시 재예약·공항 인근 1박 | needs_check |

기존 `leg-0816-1`(버스)·`leg-0816-2`(열차)·구 `leg-0817-1`(취리히 중앙역→공항)은 삭제.

## 3. 표시
`LegTimeline`·`TravelDayCard`는 legs 배열 기반이라 변경 없음. 8/16 숙박 블록은 booking-tracker의 `chamonix-hotel-2`(undecided, 후보 없음) 카드가 렌더된다.

## 4. 테스트
- `seed.test.ts`: 8/16 legs 2(cablecar·stay), fallback `/오후 슬롯|Montenvers/`, stay destinationKo "2박째", day lodgingId `chamonix-hotel-2`; 8/17 legs 3(bus 08:00 Genève Aéroport·fallback "공유셔틀", train Genève-Aéroport→Zürich Flughafen 13:05, flight 18:40), day nameKo "취리히 공항", lodgingId undefined
- `responsive.spec.ts`: 8/16 `leg-timeline > li` 2·"2박째"·케이블카·운휴 문구·예약 링크 1; 8/17 `leg-timeline > li` 3·"Genève Aéroport"·"Zürich Flughafen"·"공유셔틀"·"18:40"
