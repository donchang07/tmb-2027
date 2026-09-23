# Design — today-and-safety (PRD v2.0)

> feature: today-and-safety · Plan: `docs/01-plan/today-and-safety.plan.md` · 의존: day-detail
> 작성일: 2026-09-17 · 상태: approved (L4 auto)

## Context Anchor
| Key | Value |
|---|---|
| WHY | Europe/Paris 단일 기준, Day 2~11 대안 완성 |
| WHO | 동행 전원 |
| RISK | days.ts 수정 순서(itinerary-core 이후) |
| SUCCESS | "(현지 기준)" 문구, SC-010 0건, 경계 테스트 |
| SCOPE | days.ts fallback, TodayCard, SafetyCard, dates test |

## 1. 파일
```
src/data/seed/days.ts                 Day 2~11 fallback 교체 (sourceCheckedAt 2026-09-16)
src/components/home/TodayCard.tsx     문구·testid
src/components/day/SafetyCard.tsx     기본 문구
tests/unit/dates.test.ts              경계 케이스 추가
tests/unit/seed.test.ts               SC-010
```

## 2. Day 2~11 fallback (PRD C-3 대안 문장을 표기 정규화하여 사용)
| Day | fallback |
|---|---|
| 2 | 우천 시 로마 가도 구간은 숲길·완경사라 그대로 진행 가능(우비 착용). 피로 시 레 콩타민 마을 셔틀로 Notre-Dame de la Gorge(1,210 m)까지 이동 후 약 5 km·+500 m만 도보. 라 발므 만실 시 Refuge de Nant Borrant 숙박 후 Day 3에 +1 h. |
| 3 | 악천후·피로 시 콜 데 푸르 대신 레 샤피외(Les Chapieux)로 하강, Auberge de la Nova에서 점심(하프보드 €70~91, 포털 예약) 후 도로로 모테까지 +2 h(여름 셔틀 운행 시 이용). 콜 데 푸르 남쪽 하강은 초여름 잔설·급경사 주의. |
| 4 | 우천·피로 시 콩발 호수에서 발 베니 계곡길로 우회(발코니 구간 생략, −250 m 획득). 비상 시 발 베니 버스로 쿠르마예 이동 후 다음 날 조정. |
| 5 | 우천 시 쿠르마예에서 대기 후 오후 출발(베르토네까지 약 2 h·+765 m, 16:00 이전 출발). 피로 시 쿠르마예 시내 호텔 1박 후 Day 6 아침에 베르토네 경유(+2 h)로 보나티까지 진행하거나, 쿠르마예 → 아르누바 버스(여름 운행)로 Day 6 후반부에 합류. |
| 6 | 우천·피로 시 보나티에서 발 페레 계곡길로 하산해 아르누바까지 계곡 버스 이용 후 엘레나까지 1 h 등반. 엘레나 만실 시 보나티 숙박(도미토리 €75·2~4인실 €95, 폼 예약 1건 최대 10명) 후 Day 7을 20 km로 연장. |
| 7 | 강풍·폭풍우 시 콜 통과를 늦추고 엘레나에서 대기(콜까지 약 2 h). 우천 시 콜 통과 후 라 푈에서 라 풀리까지 알프 비포장 도로로 완만하게 하산. 피로 시 페레(Ferret) 마을에서 PostBus(라 풀리–페레 노선)로 라 풀리 이동. 콜 통과가 불가능하면 아르누바 → 쿠르마예 버스 → 샤모니 → 마르티니 → 라 풀리 우회(종일 소요, 리더 판단). |
| 8 | 우천·피로 시 라 풀리 → 오르시에르(Orsières) PostBus → 샹페-락 PostBus로 이동(약 1 h, 예매 불필요). 도중 포기 시 프라 드 포르·이세르 정류장에서 같은 노선 승차. Prayon~Branche 구간 낙석 우회로(2026-07 기준) 현지 표지 확인. |
| 9 | 우천 시 보빈 루트는 숲길이라 진행 가능하되 Plan de l'Au 이후 급경사 진흙 주의. 악천후·피로 시 샹페 → 오르시에르 PostBus → 마르티니 열차 → 콜 드 라 포르클라 PostBus(약 2.5 h)로 우회 후 포르클라 → 트리앙 1 h 도보 또는 PostBus(마르티니–샤틀라르 노선). Fenêtre d'Arpette 변형은 금지. |
| 10 | 우천·강풍 시 에귀예트 데 포제트 능선(노출 암릉) 생략 — 콜 데 포제트에서 바로 트레르샹으로 하산하거나, 옛 TMB 경로로 르 투르(Le Tour)로 하산 후 계곡 버스로 몽트로크·트레르샹 이동. 피로 시 콜 드 발므에서 르 투르 하산(−700 m) 후 버스. |
| 11 | 우천·고소공포 시 사다리 구간 대신 콜 데 몽테(Col des Montets, 1,461 m)에서 오르는 표준 우회로로 라크 블랑 접근. 피로·악천후 시 라크 블랑을 생략하고 그랑 발콩 쉬드(Grand Balcon Sud) 직행으로 라 플레제르까지 약 3 h(+500 m). 플레제르 케이블카는 미사용. |
Day 1·12 fallback은 현행 유지.

## 3. TodayCard
- before: 제목 `출발까지 D-{n} (현지 기준)`, 본문 "현지(Europe/Paris) 날짜 기준입니다. 첫 일정: 8/3 인천 출발" + 링크(첫 Day) `data-testid="today-card-link"`
- in_trip: 오늘 Day 카드(강조) 링크에 `data-testid="today-card-link"`
- after: "원정이 종료되었습니다" + 일정 요약 링크(`data-testid="today-card-link"`)

## 4. SafetyCard
```
우천·피로 대안: fallback ?? "대안 선택 사항 (Day 1·12)"
비상: emergency ?? "112 · 숙박 연락처"
112 긴급 전화 버튼: <a href="tel:112">112 긴급 전화</a> (FR-014 즉시 통화 수단)
확인 기준일: checkedAt
```

## 5. 테스트
- dates: `toLocalDateISO(new Date("2027-08-02T23:00:00Z")) === "2027-08-03"` (KST 08:00 = 파리 01:00), `resolveTodayState`로 8/3 in_trip; `"2027-08-17T21:59:59Z"` → in_trip(8/17), `"2027-08-17T22:00:00Z"` → after
- seed: trek Day 2~11 `fallback` 길이 ≥ 20, `!includes("확인 필요")`, `/우천|악천후|강풍|피로/` 매치, `sourceCheckedAt === "2026-09-16"`
