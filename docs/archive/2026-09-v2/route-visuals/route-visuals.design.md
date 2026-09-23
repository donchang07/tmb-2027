# Design — route-visuals

> feature: route-visuals · Plan: `docs/01-plan/route-visuals.plan.md` · 의존: itinerary-core
> 작성일: 2026-09-16 · 상태: approved (L4 auto)

## 1. 파일
```
src/lib/schema.ts                 + RouteNodeSchema, RouteSegmentSchema, ElevationPoint 타입
src/data/seed/route-nodes.ts      RouteNode 38건(개략 위경도, 고도)
src/data/seed/route-segments.ts   RouteSegment 12건(dayId, nodeIds, color)
src/lib/route.ts                  getRouteNodes, getRouteSegments, getElevationPoints, projectNodes, validateRouteSeed
src/components/map/RouteOverviewMap.tsx   정적 SVG 개요 (server)
src/components/map/MapLegend.tsx
src/components/map/ElevationProfile.tsx   Day 고도 프로파일 SVG (server)
src/app/map/page.tsx, loading.tsx
src/app/day/[dayId]/page.tsx      경로 섹션에 ElevationProfile 삽입
tests/unit/route.test.ts
tests/e2e/responsive.spec.ts      PAGES에 /map 추가, 세그먼트 12개 단언
```

## 2. 스키마
```ts
export const RouteNodeKind = z.enum(["start", "pass", "lodging", "town", "waypoint", "finish"]);
export const RouteNodeSchema = z.object({ id, nameKo, nameOriginal, kind: RouteNodeKind, lat: number(45~47), lon: number(6~8), altitudeM: number | null });
export const RouteSegmentSchema = z.object({ dayId: /^d\d{4}-\d{2}-\d{2}$/, trekDayNumber: 1..12, nodeIds: string[].min(2), color: /^#[0-9a-f]{6}$/i });
export type ElevationPoint = { dayId: string; sequence: number; label: string; labelOriginal: string; altitudeM: number | null; role: "start" | "via" | "end" };
```
좌표는 공개 지명 좌표 근사 [추정], 표시 전용(±1 km). `DayRoute.routeGeometry`(GeoJSON)는 GPX 확보 후 — 현재 미구현이며 UI에 “정적 개요 · GPX 검증 전” 안내(I-003).

## 3. `src/lib/route.ts`
```ts
export function getRouteNodes(): RouteNode[]
export function getRouteNode(id): RouteNode | undefined
export function getRouteSegments(): RouteSegment[]                 // trekDayNumber 순 12건
export function getSegmentForDay(dayId): RouteSegment | undefined
export function getElevationPoints(day: Day): ElevationPoint[]      // day.routePoints → sequence 1..n, role start/via/end
export type Projected = { id: string; x: number; y: number };
export function projectNodes(nodes, width, height, padding): Projected[]  // 등장방형: x∝lon·cos(meanLat), y∝-lat, bbox fit
export function segmentPath(seg, projectedById): string             // "M x y L x y ..."
export function validateRouteSeed(): { ok: true }                    // zod + nodeIds 참조 무결성 + 12 세그먼트 + dayId가 trek Day
export const SEGMENT_COLORS: string[]                               // 12색(대비 확보)
```

## 4. `RouteOverviewMap` (server, SVG 800×620 viewBox, `role="img"`, `aria-labelledby`)
- 배경 설백, 국경 표기 텍스트(FR / IT / CH) 3곳
- 12 `<path data-segment={trekDayNumber} stroke={color} stroke-width=5 fill=none stroke-linecap=round>`
- 마커: pass ▲(safety색), lodging ●(alpine), start/finish ◆(ink), town ○(rock). 각 `<title>`에 nameKo · nameOriginal · 고도
- Day 번호 라벨: 세그먼트 중간점에 `<text>` “D{n}”
- 하단 `<text>` “개략 위치 · 공식 지도 아님”
- `<desc>`에 12구간 요약 텍스트

## 5. `MapLegend`
색 12개 + Day 구간명(nameKo) 목록, 마커 기호 설명, `/day/[id]` 링크(Day 목록 fallback 겸용, 44px)

## 6. `ElevationProfile` (server SVG 640×220, `role="img"`, `aria-label="고도 프로파일 Day N: 출발 X m · 최고 Y m · 도착 Z m"`)
- x: 균등 간격(point index), y: 고도 선형 스케일(min-100 ~ max+100)
- 폴리라인 alpine + 영역 fill alpine/10, 점 ●, 라벨(nameKo 축약 + `1,653 m`), null 고도는 점 생략 + “고도 확인 필요”
- 아래 `<table className="sr-only">`로 동일 데이터 제공(접근성)
- points < 3 → StatusNote “고도점 확인 필요 (3점 이상 필요)” (Edge: Day 데이터 누락)

## 7. `/map` 페이지 (정적)
- h1 “개요 지도”, 부제 “12개 Day · 주요 고개·숙박 위치 · 반시계 방향”
- StatusNote(info) “정적 개요 지도 — 검증된 GPX 확보 후 상호작용 지도(MapLibre)로 교체 예정 (I-003)”
- `RouteOverviewMap` + `MapLegend`
- 출처 카드: “좌표: 공개 지명 좌표 근사(±1 km) · 고도: 부록 C · 기준일 2026-09-16 · 라이선스: 팀 자체 제작 SVG (외부 타일·이미지 없음)”
- `loading.tsx`: 정적 preview skeleton

## 8. Day 상세 삽입
`RouteList` 아래 `<ElevationProfile day={day} />` (같은 카드 내부)

## 9. 테스트 (`tests/unit/route.test.ts`)
- `validateRouteSeed()` ok; 세그먼트 12건, trekDayNumber 1..12 순, 각 dayId가 trek Day
- 모든 nodeIds가 존재; 연속 세그먼트의 끝 노드 = 다음 세그먼트 시작 노드(연결성)
- 마커 수: pass ≥ 10, lodging = 11 (샤모니 호텔은 finish 노드로 표기), start 1, finish 1
- 12 Day `getElevationPoints` ≥ 3, 첫 role start, 마지막 end; 고개 Day는 세그먼트에 `kind === "pass"` 노드 ≥ 1 + via 고도점 ≥ 1,500 m (Day 2·5·6·8·11 제외 — 회복일·계곡길·발코니 길·사다리/라크 블랑 구간, PRD 표에 고개 없음)
- `projectNodes` 결과가 padding 안에 들어오고 x·y NaN 없음; `segmentPath`가 "M"으로 시작

## 10. Edge Case
| 상황 | 구현 |
|---|---|
| Day 데이터 누락(고도점 < 3) | ElevationProfile StatusNote |
| 지도 준비 중 | `/map` 안내 문구(I-003) |
| 오류 Day 목록 fallback | MapLegend의 Day 링크 목록 |
