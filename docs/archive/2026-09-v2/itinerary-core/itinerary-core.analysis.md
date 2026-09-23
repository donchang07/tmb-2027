# Analysis — itinerary-core

> feature: itinerary-core · Check 단계 · gap-detector 실행 2026-09-16
> Design: `docs/02-design/itinerary-core.design.md`
> 게이트: 95 (bkit.config.json `matchRateThreshold`)

## 결과

| 항목 | 값 |
|---|---|
| Match rate (1차) | **97%** (93 matched + 6 partial × 0.5) / 99 |
| 게이트 | 통과 (≥ 95) |
| 반복(iterate) | 불필요 — minor 항목은 Act로 즉시 반영 |
| Missing | 0 |

## 검증 근거
- `npx tsc --noEmit` 0 오류
- `npx vitest run` 16/16 통과 (seed 8, dates 4, itinerary 3 + validate)
- `npx next build` 성공 — `/`, `/itinerary`(dynamic), `/travel/[dayId]` 4건 SSG
- 합계 검산: 162.5 km / +9,610 m / −9,585 m = trip seed와 일치 (SC-008)

## 부분 일치 항목과 조치

| # | 지적 | 조치 |
|---|---|---|
| G-1 | `/manifest.webmanifest` 404 (public 없음) | `src/app/manifest.ts` + `public/icons/icon-192.svg`, `icon-512.svg` 추가 |
| G-2 | ItineraryList props 드리프트 | design §6.2 갱신(코드가 정답) |
| G-3 | 8/17 stay leg 없음 | design §6.3 정정 — 8/3·8/16만 stay |
| G-4 | `arriveAt: "14:10 (+1)"` 포맷 위반 | seed를 `"14:10"`으로, 익일 도착은 notes로 이동 |
| G-5 | validateSeed lazy 실행·Error 타입 | design §3 정정 |
| G-6 | TripSchema literal 미적용 | design §2 정정 (수치는 테스트로 고정) |
| G-7 | emergency 문구 표기 | design §8 실제 상수로 교체 |
| 참고 | `travel/[dayId]/loading.tsx` 없음 | 추가 |

## 잔여 리스크
- 런타임 뷰포트·접근성 검사(Playwright/axe)는 responsive-pwa feature에서 수행.
- `/day/[id]`, `/budget`, `/map`, `/packing`, `/admin` 링크는 후속 feature까지 404.
