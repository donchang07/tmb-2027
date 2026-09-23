# Design — route-visuals (PRD v2.0 개정)

> feature: route-visuals · Plan: `docs/01-plan/route-visuals.plan.md` · 의존: day-detail
> 작성일: 2026-09-17 · 상태: approved (L4 auto)

## Context Anchor
| Key | Value |
|---|---|
| WHY | 마커 완전성(숙박 12 + 제목 고개 전부) |
| WHO | 방문자 |
| RISK | 좌표 근사(GPX 전) |
| SUCCESS | 고개 12개 노드 존재, 숙박 마커 12, 출처 문구 |
| SCOPE | route-nodes/segments/route.ts/map page/test |

## 1. 파일
```
src/data/seed/route-nodes.ts     + col-checrouit, col-des-posettes
src/data/seed/route-segments.ts  Day 4·Day 10 nodeIds 갱신
src/lib/route.ts                 TITLE_PASSES, getMarkerSummary()
src/app/map/page.tsx             출처·타일 문구
src/components/map/MapLegend.tsx (필요 시) 마커 수 표시
tests/unit/route.test.ts
```

## 2. 노드
```ts
{ id: "col-checrouit", nameKo: "콜 셰크루이", nameOriginal: "Col Chécrouit", kind: "pass", lat: 45.7845, lon: 6.9500, altitudeM: 1956 }
{ id: "col-des-posettes", nameKo: "콜 데 포제트", nameOriginal: "Col des Posettes", kind: "pass", lat: 46.0215, lon: 6.9615, altitudeM: 1997 }
```
Day 4 segment: … lac-combal → col-checrouit → maison-vieille. Day 10: trient → col-de-balme → col-des-posettes → aiguillette-des-posettes → tre-le-champ.
(RouteList의 nameKo는 렌더하지 않으므로 음차는 seed 메타로만 남는다.)

## 3. `route.ts`
```ts
export const TITLE_PASSES = ["Col de Voza","Col du Bonhomme","Col de la Croix du Bonhomme","Col des Fours","Col de la Seigne","Col Chécrouit","Grand Col Ferret","Col de la Forclaz","Col de Balme","Col des Posettes","Aiguillette des Posettes","Le Brévent"] as const;
export function getMarkerSummary(nodes = routeNodes) { return { lodging: nodes.filter(n => n.kind==="lodging"||n.kind==="finish").length, passes: nodes.filter(n => n.kind==="pass").map(n => n.nameOriginal), missingTitlePasses: TITLE_PASSES.filter(p => !nodes.some(n => n.nameOriginal === p)) }; }
```
`RouteOverviewMap`는 기존처럼 노드 kind별 마커를 렌더(추가 노드 자동 포함). 범례에 "숙박 12 · 고개 N".

## 4. map page 문구
"라이선스·출처: 팀 자체 제작 SVG 개요(검증 GPX 확보 전, I-003). 타일 적용 시 OpenFreeMap 또는 MapTiler Free를 사용하고 출처를 표기한다 [기본값]. 기준일 2026-09-16."

## 5. 테스트
- `getMarkerSummary().missingTitlePasses` 길이 0, `lodging === 12`
- 구간 12개, Day 10 nodeIds에 col-des-posettes, Day 4에 col-checrouit
- 모든 segment nodeIds가 존재 노드(기존)
- 고도점: Day 10 elevation points에 Col des Posettes 1,997 포함(days.ts routePoints 기준, itinerary-core 선행)
