# Plan — itinerary-core

> feature: itinerary-core · 순서 1/8 · 의존: 없음 · 규모: 중
> 출처: `docs/PRD.md` 14장 feature 분해표, 부록 A/C
> 작성일: 2026-09-16 · 상태: approved (L4 auto)

## 1. 목표

15일 일정(이동일 3 + 트레킹 Day 12) seed를 타입 안전한 데이터 계약으로 고정하고, 홈(8.1)·전체 일정(8.2)·이동일 상세(8.4) 화면에서 정확히 렌더링한다. 이후 모든 feature가 이 seed와 조회 함수를 공유한다.

## 2. 포함 요구사항

| FR | 요약 | 검증 |
|---|---|---|
| FR-001 | 2027-08-03~08-17 15일을 날짜 오름차순으로 표시 | seed 15개, 중복·누락 없음 (unit) |
| FR-002 | 12개 트레킹 Day 카드 필수 필드(거리·획득·하강·시간·점심·숙박·지도·예약 연락) | seed 완전성 unit test |
| FR-005 | 이동일 카드: 항공·기차·버스 구간, 소요시간, 예매 링크, fallback | 3개 이동일 완전성 unit test |
| FR-008 | 홈 히어로: “걸어야 산다!”, 기간, 10명, 약 162.5km, 약 9,610m | 합계 산술 unit test + 렌더 |
| FR-009 | Europe/Paris 현지 날짜 기준 오늘 강조 / 기간 밖 D-N·종료 안내 | 경계 날짜 unit test |
| FR-017 | 한국어 UI + 산장·지명 원어 병기 | nameKo/nameOriginal 필수 unit test |

관련 SC: SC-001(2탭 진입 경로), SC-002(8필드 완전성), SC-008(3+12, 162.5km/9,610m), SC-013(병기).

## 3. 범위

### In
- 데이터 계약(A-1, A-2 Lodging, A-3 TravelLeg) zod 스키마 + TS 타입
- seed: Trip 1, Day 15, Lodging 12, TravelLeg(8/3, 8/4 아침, 8/16, 8/17)
- 조회 계층: `getTrip`, `getDays`, `getDay`, `getLodging`, `getTravelLegs`, 합계 재계산, 오늘 판정
- 화면: 홈 `/`, 전체 일정 `/itinerary`, 이동일 상세 `/travel/[dayId]`
- 공통 레이아웃: 헤더·하단 내비(44px), 한국어 `lang="ko"`, noindex
- 로그 코드: `trip_date_outside`, `day_field_missing`
- 앱 셸 기본 스타일(9장 색상 토큰)

### Out (다른 feature)
- Day 상세 `/day/[dayId]` 전체 → day-detail (여기서는 카드 링크만)
- 예산·지도·오프라인·예약·준비물·기록

## 4. 결정(PRD 12·13장 추천값 채택)
- D-001: 8/3 제네바 1박을 seed로 유지(fallback = 프라이빗 미니버스 안 표기)
- D-005: 히어로 이미지 없음 → 알파인 그라디언트
- 11.2 #4: 날짜 판정 `Europe/Paris`, `Intl.DateTimeFormat` 사용(의존성 없음)
- Day 1(8/4)은 `type: trek`이며 아침 이동 구간(TravelLeg)을 함께 보유. 이동일 3개는 8/3·8/16·8/17.

## 5. 성공 기준 (이 feature)
1. `npm run test` 의 seed 테스트 전부 통과: 15일 정렬, 12 trek + 3 travel, 합계 162.5 / 9610 / 9585, 12 Day 8필드 값 또는 `needs_check` 상태, 3 이동일 legs≥1 + fallback, 모든 Day/Lodging nameKo+nameOriginal.
2. `/` 에서 hero 텍스트·지표·오늘 카드·빠른 링크 4개가 렌더.
3. `/itinerary` 에서 15개 카드, 필터(전체/이동/트레킹), 국가 배지, 오늘 강조.
4. `/travel/[dayId]` 에서 구간 타임라인·fallback·데이터 상태 표시.
5. `npm run typecheck` 0 오류.

## 6. 리스크
- 2027 운행·가격 미확정 → `verificationStatus` + `sourceCheckedAt` 노출, 만료 시 “재확인 필요”.
- Day 12 샤모니 호텔·Day 8 Plein Air 등 원어명·연락 미검증 → `verifiedPhone: null` → “전화 확인 필요”.
