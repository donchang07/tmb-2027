# Plan — route-visuals

> feature: route-visuals · 순서 6/8 · 의존: itinerary-core · 규모: 중
> 출처: `docs/PRD.md` 8.5, FR-011, FR-012, SC-009, I-003, 부록 A-1 ElevationPoint/DayRoute
> 작성일: 2026-09-16 · 상태: approved (L4 auto)

## 1. 목표
12개 Day를 구분한 전체 루트 개요와 주요 고개·숙박 지점을 보여 주고(FR-011), 각 Day 상세에 출발·주요 고개·도착을 포함한 3점 이상 고도 프로파일을 표시한다(FR-012).

## 2. 포함 요구사항
| FR | 요약 | 검증 |
|---|---|---|
| FR-011 | 12구간 색 구분 개요 + 고개·숙박 마커 | 12 세그먼트·마커 수 unit test |
| FR-012 | Day별 고도점 ≥ 3 (출발·고개·도착) | ElevationPoint seed validation |

SC-009: 개요 지도 12구간·주요 마커, Day 고도 3점 이상. PRD 표기대로 **검증된 GPX 없음 → I-003 기본값: 정적 개요 SVG + 지점 마커** (MapLibre는 GPX 승인 후).

## 3. 범위
### In
- `ElevationPoint`: Day `routePoints`에서 파생(`getElevationPoints`) — 별도 seed 파일 대신 단일 소스 유지
- `RouteNode` 개략 좌표 seed (`src/data/seed/route-nodes.ts`): 주요 지점의 **개략 위경도**(출처: 공개 지명 좌표, 표시 목적 한정, ±1km 허용) → SVG 투영
- `/map` 페이지: 정적 SVG 개요(12색 구간 폴리라인, 고개 ▲·숙박 ● 마커, Day 번호 라벨, 국경 표기), 범례, 라이선스·출처·기준일, Day 목록 fallback(링크)
- `ElevationProfile` SVG 컴포넌트 → Day 상세 경로 섹션에 삽입
- unit: 12 세그먼트, 노드 참조 무결성, Day별 고도점 ≥ 3 + 첫/끝이 출발/도착, 마커 수(고개 ≥ 10, 숙박 11 + 도착 샤모니 1)
### Out
- MapLibre/타일 지도, GPX 업로드, 실시간 위치(Non-goal)

## 4. 결정
- 좌표는 지명 공개 좌표 근사값 [추정]이며 UI에 “개략 위치 · 공식 지도 아님” 문구를 고정. 거리·시간은 seed 표 기준.
- SVG는 서버 컴포넌트로 렌더(의존성 0, 오프라인 캐시 가능)

## 5. 성공 기준
1. unit 통과: elevation 12 Day × ≥3점, route-nodes 참조 무결성, 12 세그먼트
2. `/map` 렌더: `<svg>` 안에 `data-segment` 12개, 마커, 범례, 출처·기준일
3. Day 상세에 고도 프로파일 표시(E2E `/day/d2027-08-06`(Day 3, 고개 3개) 내 `svg[aria-label^="고도 프로파일 Day 3"]`)
