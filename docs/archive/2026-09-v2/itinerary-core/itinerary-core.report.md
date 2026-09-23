# Report — itinerary-core

> feature: itinerary-core (1/8) · 완료일 2026-09-16 · 최종 match rate **97%** (게이트 95 통과)
> Plan `docs/01-plan/itinerary-core.plan.md` · Design `docs/02-design/itinerary-core.design.md` · Analysis `docs/03-analysis/itinerary-core.analysis.md`

## 요약
15일 일정 seed(travel 3 + trek 12), 12 숙박, 10 이동 구간을 zod 계약으로 고정하고 홈·전체 일정·이동일 상세 3화면을 구현했다. 홈 지표(162.5 km / 9,610 m)는 Day 합계 재계산값과 테스트로 동일성을 보장한다.

## FR 달성
| FR | 상태 | 근거 |
|---|---|---|
| FR-001 | 완료 | seed.test “15 days sorted ascending” |
| FR-002 | 완료 | 8필드 완전성 테스트, 카드 렌더 |
| FR-005 | 완료 | 3 이동일 legs·fallback 테스트, `/travel/[dayId]` 타임라인 |
| FR-008 | 완료 | Hero + TripMetrics, 합계 테스트 |
| FR-009 | 완료 | `resolveTodayState` Europe/Paris 경계 테스트, D-N/종료 안내 |
| FR-017 | 완료 | nameKo/nameOriginal 필수, 병기 렌더 |

SC: SC-002·SC-008·SC-013 자동 테스트 통과. SC-001(2탭·10초)은 홈 → 오늘 카드 → Day 상세 경로로 설계됨(실사용성 테스트는 [가설]).

## 산출물
- `src/lib/{schema,itinerary,dates,log,format,booking-status}.ts`, `src/lib/bookings/public.ts`, `src/lib/supabase/{env,server}.ts`
- `src/data/seed/{trip,days,lodgings,travel-legs}.ts`
- `src/app/{layout,page,loading,not-found,manifest}.tsx|ts`, `itinerary/`, `travel/[dayId]/`
- `src/components/{layout,ui,itinerary,home,travel}/*`
- `tests/unit/{seed,dates,itinerary}.test.ts` (16 통과)

## 결정 사항
- D-001 ① 제네바 1박 채택(seed), 미니버스는 fallback 텍스트
- D-004 ① unlisted + noindex (`robots` metadata + `X-Robots-Tag`)
- D-005 ③ 이미지 없음 → 알파인 그라디언트

## 미해결·이관
- 전화번호 전부 미검증(부록 B) → day-detail에서 “전화 확인 필요” 표시
- 예약 상태는 Supabase 미연결 시 “미예약” 기본 → booking-tracker
