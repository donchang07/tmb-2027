# Analysis — day-detail

> feature: day-detail · Check 단계 · gap-detector 실행 2026-09-16
> Design: `docs/02-design/day-detail.design.md` · 게이트 95

## 결과
| 항목 | 값 |
|---|---|
| Match rate (1차) | **98%** (55 matched + 2 partial × 0.5) / 57 |
| 게이트 | 통과 |
| 반복 | 불필요 |
| Missing | 0 |

## 검증 근거
- `tsc --noEmit` 0 오류, `vitest run` 19/19 (map-url 3 추가), `next build` 성공 (`/day/[dayId]` dynamic)
- 12 Day mapUrl 전부 `api=1&origin&destination&travelmode=walking` (FR-003)
- 12 Day fallback·112 (FR-014, SC-010)

## 부분 일치와 조치
| # | 지적 | 조치 |
|---|---|---|
| 1 | `lang="fr"` 하드코딩 (IT/CH Day 접근성) | `format.ts` `langFor(country)` 추가 → page/RouteList/LodgingCard/DayCard 적용 |
| 2 | MapLinkCard가 ExternalLink 미사용 | 버튼형 외부 링크로 design 갱신(동작 계약 동일) |
| 3 | Plan↔Design `generateStaticParams` 충돌 | Plan §3·성공기준 1 갱신(요청 시 렌더) |
