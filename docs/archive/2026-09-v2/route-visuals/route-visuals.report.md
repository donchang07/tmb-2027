# Report — route-visuals

> feature: route-visuals (6/8) · 완료일 2026-09-16 · 최종 match rate **99%** (게이트 95 통과)
> Plan `docs/01-plan/route-visuals.plan.md` · Design `docs/02-design/route-visuals.design.md` · Analysis `docs/03-analysis/route-visuals.analysis.md`

## 요약
검증된 GPX가 없으므로 I-003 기본값대로 정적 SVG 개요 지도를 구현했다. 38개 지점(개략 좌표)과 12개 색 구분 세그먼트, 고개▲·숙박●·출발/도착◆·마을○ 마커, Day 라벨, 국경 표기, 출처·라이선스 카드를 제공한다. Day 상세에는 `routePoints`에서 파생한 고도 프로파일 SVG(3점 이상, 접근성용 sr-only 표 포함)를 삽입했다.

## FR/SC
| ID | 상태 | 근거 |
|---|---|---|
| FR-011 | 완료 | 12 세그먼트·연결성·마커 수 unit + E2E `path[data-segment]` 12 |
| FR-012 | 완료 | 12 Day 고도점 ≥ 3, start/end role, 고개 Day는 pass 노드 포함 |
| SC-009 | 부분(PRD 명시 “검증된 GPX 필요”) | 정적 개요·고도점은 통과, GPS 정밀 경로(`routeGeometry`)는 GPX 확보 후 |

## 산출물
- `src/data/seed/{route-nodes,route-segments}.ts`, `src/lib/route.ts`, `src/lib/schema.ts`(+Route 스키마)
- `src/components/map/{RouteOverviewMap,MapLegend,ElevationProfile}.tsx`, `src/app/map/{page,loading}.tsx`
- `src/app/day/[dayId]/page.tsx`(프로파일 삽입), `src/app/globals.css`(`@layer base` 수정)
- `tests/unit/route.test.ts`, `tests/e2e/responsive.spec.ts`(+/map)

## 이관·후속
- GPX 확보 시: `DayRoute.routeGeometry` 추가 → MapLibre 전환(I-003)
- 좌표는 ±1 km 근사 [추정] — UI에 “개략 위치 · 공식 지도 아님” 고정 표기
