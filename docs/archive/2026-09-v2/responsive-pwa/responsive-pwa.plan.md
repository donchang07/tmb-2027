# Plan — responsive-pwa

> feature: responsive-pwa · 순서 4/8 · 의존: itinerary-core, day-detail · 규모: 중
> 출처: `docs/PRD.md` FR-007, FR-013, SC-005, SC-006, 5.x NFR(성능·접근성·오프라인), 11.2 #8/#9, I-002, 부록 A-4
> 작성일: 2026-09-16 · 상태: approved (L4 auto)

## 1. 목표
360px 모바일·768px 태블릿·1440px 데스크톱에서 가로 스크롤 없이 44×44px 터치 영역을 보장하고, 한 번 열어 본 일정·Day·연락 정보를 오프라인에서 마지막 갱신 시각과 함께 재열람할 수 있게 한다(S5).

## 2. 포함 요구사항
| FR | 요약 | 검증 |
|---|---|---|
| FR-007 | 360/768 이상에서 가로 스크롤 0, 상호작용 영역 ≥ 44×44 | Playwright viewport + axe |
| FR-013 | 방문한 일정·Day·연락 정보 오프라인 재열람 + 마지막 갱신 시각 | Playwright offline E2E |

SC-005(3 viewport 가로 스크롤 0·터치 44px), SC-006(오프라인 재진입 표시 + 갱신 시각 + 온라인 전용 안내).

## 3. 범위
### In
- Service Worker `public/sw.js` (I-002: 정적 자산 cache-first, 페이지 HTML stale-while-revalidate, 저장/관리자/API network-only)
- `CacheManifest`(A-4) — Cache Storage 내 `/__cache-manifest` JSON: version, cachedAt, routes{url→ts}, sourceUpdatedAt
- 클라이언트: `SwRegister`(등록), `OfflineBanner`(온라인 상태·마지막 갱신 시각·온라인 전용 기능 안내)
- `/offline` 페이지(캐시 없음: “인터넷 연결 후 한 번 열어 주세요” + 재시도 + 비상 정보)
- 반응형 보정: 표·이미지 max-width, 44px 규칙 점검
- Playwright E2E 3 viewport + axe + offline 스펙 (실행은 브라우저 설치 가능 시)
### Out
- Lighthouse CI 파이프라인(배포 후), 푸시 알림, 백그라운드 동기화

## 4. 결정
- 페이지 HTML은 cache-first 대신 SWR: 예약 상태(동적)가 있는 페이지의 신선도 확보 + 오프라인 즉시 응답
- `/admin*`, `/api/*`, 비GET 요청은 캐시하지 않음(private 데이터 보호, I-004)
- 개발 서버에서도 SW 등록(사용자가 로컬에서 오프라인 확인) — HMR 경로는 bypass

## 5. 성공 기준
1. `npm run build` 성공, `/offline`·`/manifest.webmanifest` 제공
2. E2E 스펙 작성: 3 viewport 가로 스크롤 0 + 터치 44px + axe critical 0 / offline 재진입 콘텐츠·배너·갱신 시각
3. SW 단위 로직(`shouldBypass`, `isStaticAsset`) unit test
