# Analysis — route-visuals

> feature: route-visuals · Check 단계 · gap-detector 실행 2026-09-16
> Design: `docs/02-design/route-visuals.design.md` · 게이트 95

## 결과
| 항목 | 값 |
|---|---|
| Match rate (1차) | **99%** (51 matched + 1 partial × 0.5) / 52 |
| 게이트 | 통과 |
| 반복 | 불필요 |
| Missing | 0 |

## 검증 근거
- `vitest run` 43/43 (route 6 추가), `tsc` 0 오류, `next build` 성공(`/map` 정적)
- E2E: `/map` 세그먼트 12개·pass 마커·출처 카드, Day 3 고도 프로파일 SVG 존재 (mobile-360·desktop-1440)
- E2E 회귀 1건 발견: 데스크톱 `/day/*` 가로 스크롤 368px — 원인은 전역 `table { width:100% }`가 Tailwind 레이어 밖에 있어 ElevationProfile의 `sr-only` 표 폭을 덮어씀 → `@layer base`로 이동해 해결

## 지적과 조치
| # | 지적 | 조치 |
|---|---|---|
| 1 | 고개 포함 단언이 고도 1,500 m 프록시 | `getSegmentForDay` + `kind === "pass"` 노드 단언 추가 (dead export 해소) |
| 2 | Plan 성공기준 3 Day 1 ↔ E2E Day 3 | Plan을 Day 3(고개 3개)로 정정 |
| 4 | Plan↔Design: elevation seed 파일·숙박 12 | Plan §3·§5를 Design 기준으로 정정 |
