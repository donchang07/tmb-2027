# Plan — route-visuals (PRD v2.0 개정)

> feature: route-visuals · 순서 7/9 · 의존: day-detail · 규모: 중
> 출처: `docs/PRD.md` v2.0 FR-011, FR-012 · SC-009a, SC-009b · 8.5 · I-003, I-008 · 부록 A-1 ElevationPoint/DayRoute
> 이전 사이클: `docs/archive/2026-09-v2/route-visuals/`
> 작성일: 2026-09-17 · 상태: approved (L4 auto)

## Executive Summary
| 관점 | 내용 |
|---|---|
| Problem | v2.0은 개요 지도 마커를 "숙박 12개 + C-3 제목의 고개 전부"로 명시하고 타일 출처 표기(OpenFreeMap/MapTiler)를 기본값으로 둔다. 현재 노드에는 Col Chécrouit·Col des Posettes가 없고 출처 문구가 없다. |
| Solution | 누락 고개 2개를 노드·구간에 추가하고, C-3 제목 고개 목록을 상수로 두어 마커 완전성을 테스트한다. 타일 출처 문구를 지도 페이지에 넣는다. |
| Function UX Effect | 개요 지도에서 모든 고개·숙박이 Day별 색으로 이어져 보인다. |
| Core Value | 12개 Day의 전체 관계 파악(8.5). |

## Context Anchor
| Key | Value |
|---|---|
| WHY | 마커 누락은 Day 연결 이해를 방해 |
| WHO | 방문자 |
| RISK | 좌표는 근사값(GPX 전) — I-003/I-008에 따라 GPX 확보 시 재대조 |
| SUCCESS | 고개 마커 완전성 테스트, 숙박 마커 12, 출처 문구 |
| SCOPE | route-nodes·segments·map page·테스트 |

## 2. 포함 요구사항
| ID | 요구 | 검증 |
|---|---|---|
| FR-011 | 12개 구간 + 마커(숙박 12 + C-3 제목 고개 전부) | 노드 수·이름 검사 |
| FR-012 | Day별 고도점 3개 이상(C-3 제목 표기 seed) | 기존 검사 + Day 10 Col des Posettes |
| 8.5 | 정적 SVG(GPX 전) + 출처·기준일 + 타일 공급자 표기 [기본값] | 렌더 |

## 3. 범위
### In
- `src/data/seed/route-nodes.ts`: `col-checrouit`(pass, 1,956 m 부근 Maison Vieille 인접, 약 45.78, 6.95), `col-des-posettes`(pass, 1,997 m, 약 46.02, 6.96)
- `src/data/seed/route-segments.ts`: Day 4 nodeIds에 col-checrouit, Day 10에 col-des-posettes
- `src/lib/route.ts`: `TITLE_PASSES` 상수(C-3 제목 고개 12개 원어명) + `getMarkerSummary()`
- `src/app/map/page.tsx`: 출처 문구 "타일: OpenFreeMap 또는 MapTiler Free(GPX 확보 후 적용, 출처 표기) [기본값]"
- `tests/unit/route.test.ts`
### Out
- MapLibre 실제 도입(GPX 확보 후), 좌표 정밀화

## 4. 결정
- 숙박 마커 12 = kind lodging 11 + finish(Chamonix). 제네바·취리히 호텔은 트레킹 개요 밖이므로 지도 마커 제외.
- `TITLE_PASSES` = Col de Voza, Col du Bonhomme, Col de la Croix du Bonhomme, Col des Fours, Col de la Seigne, Col Chécrouit, Grand Col Ferret, Col de la Forclaz, Col de Balme, Col des Posettes, Aiguillette des Posettes, Le Brévent (12).

## 5. 성공 기준
1. `TITLE_PASSES` 각 이름이 route-nodes `nameOriginal`에 존재(kind pass 또는 waypoint/finish 아님 → pass)
2. 숙박 마커(lodging+finish) = 12, 구간 12, Day 10 구간이 col-des-posettes 포함
3. 지도 페이지에 "OpenFreeMap" 문구
4. `tsc`, `vitest`, `next build`
