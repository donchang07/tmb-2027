# Report — responsive-pwa

> feature: responsive-pwa (4/8) · 완료일 2026-09-16 · 최종 match rate **97%** (게이트 95 통과)
> Plan `docs/01-plan/responsive-pwa.plan.md` · Design `docs/02-design/responsive-pwa.design.md` · Analysis `docs/03-analysis/responsive-pwa.analysis.md`

## 요약
Service Worker(`public/sw.js`)로 정적 자산 cache-first, 페이지 HTML stale-while-revalidate, 관리자·API·비GET network-only(I-002)를 구현했다. 캐시 저장 시 `CacheManifest`(A-4)를 기록해 오프라인 배너가 “마지막 갱신 시각”을 표시하고, 미방문 페이지는 `/offline`으로 fallback한다. 반응형·접근성은 Playwright + axe로 3개 뷰포트에서 검증했다.

## FR/SC
| ID | 상태 | 근거 |
|---|---|---|
| FR-007 | 완료 | responsive.spec: 360/768/1440에서 가로 스크롤 0, 터치 44px, axe critical/serious 0 |
| FR-013 | 완료 | offline.spec: 방문 페이지 오프라인 재진입 + “오프라인 · 마지막 갱신” 배너, 미방문 → `/offline` |
| SC-005 | 통과 | Playwright 3 project × 4 페이지 |
| SC-006 | 통과 | offline.spec (chromium) |

E2E 최종: **33/33 통과** (mobile-360 11, tablet-768 11, desktop-1440 11). unit 29/29.

## 산출물
- `public/sw.js`, `src/lib/{sw-rules,cache-manifest}.ts`
- `src/components/pwa/{SwRegister,OfflineBanner}.tsx`, `src/app/offline/page.tsx`, `src/app/manifest.ts`, `public/icons/*`
- `src/app/layout.tsx`(배너·등록 삽입), `src/app/globals.css`(반응형 보정)
- `tests/unit/sw-rules.test.ts`, `tests/e2e/{responsive,offline}.spec.ts`, `playwright.config.ts`

## 결정
- 페이지 HTML은 SWR(예약 상태 신선도 + 오프라인 즉시 응답)
- 개발 서버에서도 SW 등록(HMR 경로 bypass) — 로컬 오프라인 확인 가능. 캐시 초기화가 필요하면 DevTools → Application → Clear storage.
- tablet-768 E2E는 Chromium 뷰포트(touch) 사용 — WebKit 미설치

## 잔여
- Lighthouse Performance 90+/LCP 2.5s/홈 1MB는 배포 빌드 기준(NFR) — 현재 First Load JS 103~109 kB로 여유 있음, 배포 후 Lighthouse CI에서 확정
