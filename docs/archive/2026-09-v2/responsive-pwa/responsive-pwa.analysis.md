# Analysis — responsive-pwa

> feature: responsive-pwa · Check 단계 · gap-detector 실행 2026-09-16
> Design: `docs/02-design/responsive-pwa.design.md` · 게이트 95

## 결과
| 항목 | 값 |
|---|---|
| Match rate (1차, 정적) | **97%** (57.0 / 59) |
| 게이트 | 통과 |
| 반복 | 불필요 (Important 2건은 Act에서 즉시 수정) |
| Missing | 0 |

## 런타임 검증 (Playwright, chromium)
- 1차 실행: 33 케이스 중 22 통과 / 10 실패(tablet-768 프로젝트가 WebKit 디바이스 프리셋 — 브라우저 미설치) / 1 skip(offline은 chromium 전용)
- tablet-768을 Chromium 뷰포트(768×1024, touch)로 변경 후 재실행 결과는 아래 Report 참조
- **offline.spec** 통과(mobile-360, desktop-1440): 방문 페이지 오프라인 재진입 시 h1·숙박 원어명·“오프라인 · 마지막 갱신” 배너 표시, 미방문 페이지 → `/offline` 문구 (SC-006)
- **responsive.spec** 통과(mobile-360, desktop-1440): 4개 페이지 가로 스크롤 0, 터치 44px, axe critical/serious 0, 예산 표 9+3행, 홈 지표 (SC-005)

## 부분 일치와 조치
| # | 지적 | 조치 |
|---|---|---|
| G1 | sw.js 캐시 저장 실패가 네트워크 실패로 오판 | `cache.put`/`recordRoute`를 try/catch로 격리 |
| G2 | MANIFEST_CACHE/KEY 이중 정의 | `sw-rules.ts`에 export, `cache-manifest.ts`가 import, sw.js 주석에 동기화 대상 명시 |
| G3 | 카드 블록 링크·인라인 링크 `.tap` 미적용 | design §8 정정(블록 링크는 실측 높이, 인라인 링크 예외) |
| G4 | `cachedAt` 타입 | design `string \| null`로 정정 |
| G5 | `.card` 규칙 분리 | 통합 |
