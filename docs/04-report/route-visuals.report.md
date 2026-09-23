# Report — route-visuals (PRD v2.0 개정)

> feature: route-visuals · 순서 7/9 · 완료일 2026-09-17 · 최종 match rate **97%** (게이트 95 통과) · 반복 횟수 **1회**(Check → Act-1 + `next build` 실행)
> Plan `docs/01-plan/route-visuals.plan.md` · Design `docs/02-design/route-visuals.design.md` · Analysis `docs/03-analysis/route-visuals.analysis.md`

## Executive Summary

| 관점 | 내용 (실제 결과) |
|---|---|
| Problem | v2.0이 개요 지도 마커를 "숙박 12개 + 부록 C-3 제목의 고개 전부"로 명시했으나 노드에 Col Chécrouit·Col des Posettes가 없었고, 타일 공급자 출처 표기도 없었다. 마커 누락을 잡아낼 장치도 없었다. |
| Solution | pass 노드 2개를 추가하고 Day 4·Day 10 구간 nodeIds를 갱신했다. `TITLE_PASSES`(C-3 제목 고개 12개 원어명) 상수와 `getMarkerSummary()`를 `src/lib/route.ts`에 두어 마커 완전성을 이름 기준으로 테스트한다. `/map`에 라이선스·타일 공급자·기준일 문구를 넣고 범례 카운트를 파생값으로 바꿨다. |
| Function UX Effect | `/map`에서 12구간이 Day별 색으로 이어지고 숙박 12·고개 12 마커가 모두 표시된다. 범례는 "숙박 12 · 고개 12"를 하드코딩 없이 계산해 보여 주고, 출처 섹션이 GPX 확보 전 상태(I-003)를 명시한다. |
| Core Value | 12개 Day의 전체 관계 파악(8.5). 고개가 빠지면 테스트가 실패하므로 마커 완전성이 회귀로 고정됐다. |

### 1.3 Value Delivered

| 관점 | 지표·근거 |
|---|---|
| 마커 완전성(FR-011) | `getMarkerSummary().missingTitlePasses = []` · `passes.length = 12` · 숙박 마커 12(lodging 11 + finish 1). 악센트(`Chécrouit`·`Brévent`)까지 정확 일치 |
| 설계-구현 갭 | **Missing 0건** — 설계 §1~§5의 파일·노드·구간·상수·함수·문구·테스트가 리터럴 값까지 전부 일치 |
| 고도 프로파일(FR-012/SC-009a) | 전 트레킹 Day ≥3점 + role start/via/end 검증, Day 10에 Col des Posettes 1,997 m 삽입(순서·고도·이름 4단언) |
| 라이선스 준수(8.5) | `/map`에 "팀 자체 제작 SVG / 검증 GPX 확보 전 / I-003 / OpenFreeMap·MapTiler Free / 기준일 2026-09-16" 5요소 전부 + Act-1에서 E2E 회귀 단언 추가 |
| 검증 통과 | `tsc --noEmit` 0 오류 · `vitest run` **98/98** · `npx next build` **exit 0**(`/map` Static 프리렌더) |
| 회귀 방어 강화 | 설계 미요구 테스트 4종 추가 — 구간 연결성, 투영 좌표 padding 경계, 고개일 via ≥1,500 m, 12색 중복 0 |

## Context Anchor

| Key | Value |
|---|---|
| WHY | 마커 누락은 Day 연결 이해를 방해 |
| WHO | 방문자 |
| RISK | 좌표는 근사값(GPX 전) — I-003/I-008에 따라 GPX 확보 시 재대조 |
| SUCCESS | 고개 마커 완전성 테스트, 숙박 마커 12, 출처 문구 |
| SCOPE | route-nodes·segments·map page·테스트 |

## FR/SC

| ID | 상태 | 근거 |
|---|---|---|
| FR-011 | ✅ 완료 | 12구간 색 구분(`SEGMENT_COLORS` 12색, 중복 0) + 숙박 12·고개 12 마커 (`RouteOverviewMap.tsx:91-98`) |
| FR-012 | ✅ 완료 | Day별 출발·주요 고개·도착 ≥3 고도점, role start/via/end 검증 (`route.test.ts:83-93`), Day 10 Posettes 추가 |
| SC-009a | ✅ 완료 | 전 Day 고도점 ≥3 단언 (`route.test.ts:86`) |
| SC-009b | ✅ 완료 | 개요 지도 12구간 선 + kind별 마커 렌더 |
| 8.5 (출처·타일) | ✅ 완료 | `src/app/map/page.tsx:27-35` 3요소 + Act-1 E2E 단언 |
| 8.5 (4상태) | ⚠️ 이연 | 로딩 preview·빈 지도·오류 fallback은 I-003(MapLibre 도입)으로 명시 이연. Plan §3 Out 항목이라 갭 아님 |
| I-003 | ✅ 완료 | 정적 SVG 유지 + `StatusNote`로 이연 명시 |
| I-008 | ✅ 완료 | Day 9·10 고도 seed `sourceCheckedAt: "2026-09-16"` (`seed.test.ts:56-58`) |
| 부록 A-1 (ElevationPoint/DayRoute) | ✅ 완료 | 타입 계약 유지, `MarkerSummary` 타입 명시 export로 소비처 타입 안전성 향상 |

## Success Criteria 최종 (Plan §5)

| # | 기준 | 판정 | 근거 |
|---|---|:--:|---|
| 1 | `TITLE_PASSES` 각 이름이 route-nodes `nameOriginal`에 존재(kind = pass) | ✅ | 12행 전수 대조표 + `route.test.ts:42` `missingTitlePasses` `toEqual([])` |
| 2 | 숙박 마커(lodging+finish) = 12, 구간 12, Day 10에 col-des-posettes | ✅ | `route.test.ts:43,50` · `route-segments.ts:35` |
| 3 | 지도 페이지에 "OpenFreeMap" 문구 | ✅ | `map/page.tsx:32` 문구 존재 + **Act-1에서 `responsive.spec.ts`에 `/OpenFreeMap 또는 MapTiler Free/` 가시성 단언 추가**(Check 시점 Partial → 해소) |
| 4 | `tsc`·`vitest`·`next build` 통과 | ✅ | `tsc` 0 오류 · `vitest run` 98/98 · **`next build` exit 0, `/map` Static 프리렌더**(Act-1 오케스트레이터 실행) |

**충족: 4/4**

## 산출물

- `src/data/seed/route-nodes.ts` — `col-checrouit`(1,956 m), `col-des-posettes`(1,997 m) pass 노드 2개 추가
- `src/data/seed/route-segments.ts` — Day 4(`…lac-combal → col-checrouit → maison-vieille`), Day 10(`…col-de-balme → col-des-posettes → posettes → tre-le-champ`)
- `src/lib/route.ts` — `TITLE_PASSES`(12개 `as const`), `getMarkerSummary()`, `MarkerSummary` 타입 export
- `src/app/map/page.tsx` — 라이선스·타일 공급자·기준일 출처 섹션 + `StatusNote`
- `src/components/map/MapLegend.tsx` — "숙박 {lodging} · 고개 {passes.length}" 파생 표시
- `src/data/seed/days.ts` — Day 10 routePoints에 Col des Posettes 1,997 m (itinerary-core 선행)
- `tests/unit/route.test.ts` — 마커 완전성 + 연결성·투영·via 고도 회귀 단언
- `tests/unit/seed.test.ts`, `tests/e2e/responsive.spec.ts` (Act-1: 출처 문구 + `g[data-marker='pass']` 12개 카운트)

## Key Decisions & Outcomes (Plan §4)

| 결정 | 준수 | 결과 |
|---|:--:|---|
| 숙박 마커 12 = kind lodging 11 + finish(Chamonix). 제네바·취리히 호텔은 트레킹 개요 밖이므로 지도 마커 제외 | ✅ | `getMarkerSummary().lodging = 12` 산출 확인. booking-tracker가 추가한 `geneva-hotel`·`zurich-hotel`이 지도 노드에 섞이지 않음 |
| `TITLE_PASSES` 12개(Voza·Bonhomme·Croix du Bonhomme·Fours·Seigne·Chécrouit·Grand Col Ferret·Forclaz·Balme·Posettes·Aiguillette·Brévent) | ✅ | 12개 전부 노드 존재·kind pass 확인. 이름 기준 완전성이 `missingTitlePasses` 단언으로 고정 |
| 좌표는 근사값으로 두고 GPX 확보 시 재대조(RISK·I-003·I-008) | ✅ (기록) | `col-checrouit` lon 6.9500이 `maison-vieille`(6.931)보다 동쪽이라 Day 4 폴리라인이 동진 후 서진한다. **설계 리터럴과 정확히 일치하므로 설계-구현 갭은 아니며**, GPX 재대조 목록에 등재됨 |
| (구현 개선) `getMarkerSummary` 기본 인자를 `routeNodes` → `getRouteNodes()` | ✅ 상위 호환 | 호출 시 Zod 검증·중복 id·구간 무결성이 선행 보장되는 **설계보다 강한 계약**. 이탈이 아닌 개선으로 판정 |

## Check → Act 요약

| 단계 | 내용 |
|---|---|
| Check (gap-detector, 2026-09-17) | **94%** — 7축 가중 산출(구조 100 · 기능 100 · 계약 100 · 의도 95 · 행위 92 · UX 95 · 런타임 85). 게이트 95 **FAIL (−1%p)** |
| 미달 원인 | 구현 결함 아님. **Missing 갭 0건**, Changed 2건 모두 무해·개선. 감점은 전부 검증 커버리지 공백 — (a) `next build` 미실행 (b) 출처 문구 회귀 테스트 부재 |
| 중요 #2 | `tests/` 전수 grep에서 "OpenFreeMap" 0건 → 문구가 삭제돼도 22개 테스트 전부 통과 → `responsive.spec.ts`에 `/OpenFreeMap 또는 MapTiler Free/` 가시성 + `g[data-marker='pass']` 12개 단언 추가 → **matched** |
| 중요 #1 | `npx next build` 미실행(gap-detector는 read-only, 위임 실행 2회 실패) → booking-tracker Do 완료 후 오케스트레이터가 직접 실행 → **exit 0, `/map` Static 프리렌더** → 해소 |
| Act-1 후 재계산 | **97%** (런타임 85→100, 행위 92→98, 의도 95→100) · 게이트 95 **통과**. `tsc` 0 오류 · `vitest run` **98/98** |
| 소스 수정 | **0건** — 검증 자산 추가만으로 게이트 통과 |

## 후속·미검증 항목

1. **좌표 정밀화(GPX 확보 후, I-003/I-008)** — `col-checrouit`의 좌표(45.7845, 6.9500)는 근사값으로, 실제 Col Chécrouit는 Maison Vieille 인접 서쪽 ≈ 45.787, 6.936이다. 현재 Day 4 폴리라인이 동진 후 서진하는 형태로 렌더된다. 검증 GPX 확보 시 전 노드 좌표와 함께 재대조한다.
2. **PRD 8.5의 4상태 미구현(이연)** — 로딩 정적 preview·빈 지도 안내·오류 시 Day 목록 fallback은 MapLibre 도입 사이클로 이연됐다(Plan §3 Out, I-003). GPX 승인 후 별도 사이클에서 처리한다.
3. **E2E 런타임 미검증** — Act-1에서 추가한 `/map` 출처 문구·pass 마커 12개 단언은 `npx playwright test` 실제 실행으로 확인되지 않았다. 분석서 §5.2의 L2·L3 계획(마커 DOM 카운트 `lodging` 11 + `finish` 1, 범례 "숙박 12 · 고개 12", 지도→Day 탐색, 오프라인 재열람)을 QA 단계에서 수행한다.
4. **시각 확인 미수행** — Day 4 폴리라인 역주행(항목 1)과 `RouteOverviewMap.tsx:58-62`의 D-라벨 위치(Day 4가 5→6 노드로 늘며 중앙 인덱스가 `col-checrouit`로 이동) 겹침 여부를 육안으로 확인해야 한다. 로직 결함은 아니다.
5. **Minor 잔여 — 테스트 하한 느슨함** — `route.test.ts:32`의 `expect(count("pass")).toBeGreaterThanOrEqual(10)`은 고개가 12개가 된 지금 느슨하다. `toBe(12)` 또는 `toBeGreaterThanOrEqual(TITLE_PASSES.length)`로 강화 권장. 다만 `missingTitlePasses` 단언이 이미 이름 기준 완전성을 막고 있어 실질 위험은 낮다.
6. **Minor 잔여 — 설계 문서 동기화(선택)** — 설계 §3의 `getMarkerSummary` 기본 인자를 구현의 `getRouteNodes()`로 갱신하면 문서-구현이 완전히 정합한다. 기능 영향 없음.
7. **Supabase 연결 후 할 일** — route 데이터는 전부 정적 seed이므로 Supabase 의존이 없다. 다만 lodging이 DB로 이동한 뒤에도 지도 숙박 마커 12(트레킹 구간 한정)가 유지되는지, `geneva-hotel`·`zurich-hotel`이 유입되지 않는지 확인한다.
