# Report — day-detail

> feature: day-detail (2/8) · 완료일 2026-09-16 · 최종 match rate **98%** (게이트 95 통과)
> Plan `docs/01-plan/day-detail.plan.md` · Design `docs/02-design/day-detail.design.md` · Analysis `docs/03-analysis/day-detail.analysis.md`

## 요약
`/day/[dayId]`에서 핵심 지표·경로·식사·숙박·지도·안전·데이터 상태를 8.3 체크리스트 순서로 제공한다. 숙박 카드는 공개 예약 상태, 공식 예약 링크, 연락 fallback(전화 미검증 → “전화 확인 필요”), 대안 숙소를 보여 준다.

## FR 달성
| FR | 상태 | 근거 |
|---|---|---|
| FR-003 | 완료 | `isValidWalkingMapUrl` 12건 테스트, 새 창 링크 |
| FR-004 | 완료 | LodgingCard 예약 링크 + `getContact` fallback + “전화 확인 필요” |
| FR-014 | 완료 | SafetyCard(대안·112 `tel:`·기준일), 완전성 테스트 |

SC-001 경로: 홈 오늘 카드(1탭) → Day 상세(숙박 원어명·연락 링크 노출). SC-002·SC-010 자동 테스트 통과.

## 산출물
- `src/lib/map-url.ts`, `src/lib/linkify.tsx`, `src/lib/format.ts`(`langFor`)
- `src/components/day/{DayMetrics,RouteList,LodgingCard,MapLinkCard,SafetyCard,DayNav}.tsx`
- `src/app/day/[dayId]/{page,loading}.tsx`
- `tests/unit/map-url.test.ts`

## 이관
- 고도 프로파일 SVG → route-visuals
- 예약 편집 패널 → booking-tracker
- 기록 타임라인 → trip-journal
- 전화번호 12건 전부 미검증 상태(부록 B) — 예약 문의 전 확인 필요
