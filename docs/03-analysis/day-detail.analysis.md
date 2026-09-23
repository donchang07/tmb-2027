# Analysis — day-detail (PRD v3.0 델타)

> feature: day-detail · Design: `docs/02-design/day-detail.design.md` · Plan: `docs/01-plan/day-detail.plan.md` §5
> 출처: `docs/PRD.md` v3.0 FR-003, FR-018, SC-014, N-013~N-015, 부록 A-1 RouteSegment/GpxEntry, 부록 C-3 Day 12 숙박 권장
> 분석일: 2026-09-18 · 단계: Check (gap detection) · 소스 수정 없음
> 이전 사이클(v2.0) 분석은 `docs/archive/2026-09-v2.0/day-detail/day-detail.analysis.md`

## 결과

| 지표 | 값 |
|---|---|
| 대조 항목 | 19 |
| matched | 15 |
| partial | 4 |
| missing | 0 |
| **Match Rate** | **(15 + 0.5×4) / 19 = 17 / 19 = 89.5%** |
| 게이트(≥90%) | **미달 (FAIL, -0.5%p)** |

구현(코드·데이터·테스트)은 PRD v3.0 델타 요구를 **전부 충족**한다. 미달분은 전부 **설계 문서(Design §7·§8·§10)의 정본 기술 누락**과 **E2E 런타임 미검증** 때문이며, 소스 변경 없이 Design 문서 3곳만 보정하면 18.5/19 = **97.4%** 로 게이트를 통과한다. 이번 사이클의 목적 자체가 "정본·설계·구현 3자 일치"(Plan Executive Summary)이므로, 문서 결함은 부수적 흠이 아니라 **본 사이클의 핵심 산출물 결함**으로 판정한다.

## 검증 근거

### 실행 결과

| 명령 | 결과 |
|---|---|
| `npx vitest run tests/unit/map-url.test.ts tests/unit/route.test.ts tests/unit/gpx.test.ts tests/unit/lodgings.test.ts` | **4 files / 29 tests 전부 통과** (417 ms, exit 0) |
| `npx tsc --noEmit` | **진단 0건, exit 0** |

### 읽은 파일

- 설계·계획·정본: `docs/02-design/day-detail.design.md`(전 절), `docs/01-plan/day-detail.plan.md` §2~§5, `docs/PRD.md`(FR-003·FR-018·SC-014·N-013~N-015·I-010·부록 A-1·부록 C-3·§12 v3.0 델타)
- 구현: `src/lib/map-url.ts`, `src/lib/route.ts`, `src/lib/gpx.ts`, `src/lib/schema.ts`(RouteSegmentSchema), `src/lib/sw-rules.ts`, `src/data/seed/route-segments.ts`, `src/data/seed/route-nodes.ts`, `src/data/seed/days.ts`, `src/data/seed/lodgings.ts`, `src/data/gpx-manifest.json`, `public/gpx/*.gpx`(12), `public/sw.js`, `scripts/build-gpx.mjs`, `package.json`, `next.config.ts`, `src/components/day/MapLinkCard.tsx`, `src/components/day/LodgingCard.tsx`, `src/components/day/RouteList.tsx`, `src/app/day/[dayId]/page.tsx`, `supabase/migrations/20260917000003_lodgings.sql`
- 테스트: `tests/unit/{map-url,route,gpx,lodgings,sw-rules}.test.ts`, `tests/e2e/day-detail.spec.ts`

### 교차 검사 3건

1. **seed ↔ SQL Day 12 문구 동일성** — `src/data/seed/lodgings.ts:261` 과 `supabase/migrations/20260917000003_lodgings.sql:89` 의 `notes` 가 문자 단위로 동일하다: `호텔 미확정 · 다음 날 06:30 에귀 뒤 미디 출발이므로 샤모니 남역(Aiguille du Midi 승강장) 도보 10분 이내 권장 [확정 2026-09-18]`. `tests/unit/lodgings.test.ts` 의 `Day 12 lodging guidance` 블록이 SQL 원문에 seed `notes` 전문이 포함되는지 검사하므로, 한쪽만 바뀌면 테스트가 깨진다(회귀 방지 확보). `season` 도 설계 §9 기술대로 `8월 실당 €200~300 추정 · 리더가 확정 후 입력` 로 유지.
2. **음차(nameKo) 공개 UI 누출** — `nameKo` 를 렌더하는 지점은 전부 **Day 제목** 계열(`day/[dayId]/page.tsx` metadata·h1, `travel/[dayId]`, `journal`, `DayCard`, `TravelDayCard`, `TodayCard`, `DayNav`, `MapLegend`)뿐이다. Design §4 가 허용한 범위와 정확히 일치한다. **경로점**(`RouteList.tsx` → `p.nameOriginal` 단독)과 **숙박 카드**(`LodgingCard.tsx` → `lodging.nameOriginal` + `lodging.location`)에는 누출 0건. `tests/e2e/day-detail.spec.ts` 마지막 케이스가 Day 2 에서 "라 발므 산장" 0건 / "Refuge de la Balme" 가시를 판정한다.
3. **산길 링크 ↔ GPX 경유지 동일성** — `getTrailUrlForDay` 의 `[first, ...(trailViaIds ?? 중간노드), last]` 규칙과 `gpx-manifest.json` 의 `viaNodeIds` 가 12개 Day 전부 일치함을 `gpx.test.ts` 2번 케이스가 직접 대조한다. `scripts/build-gpx.mjs` 도 `route-segments.ts` 를 파싱해 같은 규칙으로 점을 구성하므로 단일 출처가 유지된다.

## 항목별 대조

### A. FR-003 (경유지 좌표 · 산길 경로 링크) — N-013, N-014

| # | 항목 | 판정 | 근거 |
|---|---|---|---|
| A1 | 경유지를 지명이 아닌 **route node 좌표**로 (N-013) | matched | `days.ts` 12개 `mapUrl` 이 `waypoints=45.874%2C6.766` 형태. `map-url.test.ts` 가 TMB 바운딩박스(lat 45.6~46.2, lon 6.6~7.2) 내 여부와 **실제 route node 좌표와 1e-6 이내 일치**까지 검사 |
| A2 | GraphHopper hike 링크 빌더 | matched | `map-url.ts` `TRAIL_ROUTER_BASE` + `buildTrailUrl`(2점 미만이면 `undefined`) + `parseTrailUrl` + `isValidTrailUrl`(base·`profile=hike`·2점 이상). 설계 §7 URL 형태와 일치 |
| A3 | `getTrailUrlForDay(dayId)` 경유 규칙 | matched | `route.ts` — 출발 → `trailViaIds ?? nodeIds.slice(1,-1)` → 도착. `route.test.ts` 가 12개 Day 전부 점 개수·좌표를 노드와 대조, Day 7 은 `point=45.8883%2C7.0756` 포함 확인 |
| A4 | 3·4·7·11·12일 `trailViaIds` (N-014 우회 방지) | matched | `route-segments.ts` — 3일 `col-du-bonhomme`, 4일 `col-de-la-seigne`, 7일 `grand-col-ferret`, 11일 `lac-blanc`, 12일 `le-brevent`. `validateRouteSeed` 가 `trailViaIds` 는 반드시 **중간 노드**여야 한다는 불변식을 강제 |
| A5 | `MapLinkCard` 산길 링크 + 우회 경고 | matched | `data-testid="trail-link"`, Google 링크와 병렬 배치, "Google 걷기 경로는 도로 위주라 고개 구간에서 크게 우회할 수 있습니다" 문구 존재. `day/[dayId]/page.tsx:148` 에서 `trailUrl={getTrailUrlForDay(day.id)}` 주입 |
| A12 | 부록 A-1 `RouteSegment` 계약 | matched | `schema.ts:184` `dayId, trekDayNumber, nodeIds, trailViaIds?, color` — PRD 표기 4필드의 상위집합(`trekDayNumber` 추가). 계약 위반 아님 |

### B. FR-018 / SC-014 (Day별 GPX) — N-015, I-010

| # | 항목 | 판정 | 근거 |
|---|---|---|---|
| B1 | 12개 정적 GPX + 재생성 스크립트 | matched | `public/gpx/tmb2027-day-01~12.gpx` 12개 존재, `scripts/build-gpx.mjs`, `package.json:13` `"build:gpx": "node scripts/build-gpx.mjs"` (I-010 재생성 절차 충족) |
| B2 | 부록 A-1 `GpxEntry` 9필드 매니페스트 | matched | `gpx.ts` `GpxEntrySchema` 가 `dayId, trekDayNumber, file, lengthKm, ascendM, trackPoints, viaNodeIds, generatedAt, source` 9필드를 regex·범위까지 강제. `gpx-manifest.json` 12행 모두 충족, `source` = `OpenStreetMap (ODbL) · BRouter hiking-mountain` (N-015 일치) |
| B3 | `getGpxForDay` · `gpxLabel` | matched | `gpx.ts` 구현. `gpxLabel` 은 `Day 7 · 10.2 km · +610 m` 형식, `gpx.test.ts` 가 정규식으로 검증 |
| B4 | `MapLinkCard` 다운로드 버튼 + ODbL 출처 | matched | `data-testid="gpx-download"`, `href={gpx.file}`, `download="tmb2027-day-NN.gpx"`, 본문에 "© OpenStreetMap contributors, ODbL" 및 오프라인 사용 안내 |
| B5 | `/gpx` 응답 헤더 | matched | `next.config.ts` `/gpx/:file*` → `Content-Type: application/gpx+xml; charset=utf-8`, `Content-Disposition: attachment`, `Cache-Control: public, max-age=3600` |
| B6 | SW `.gpx` static 캐시 | matched | `src/lib/sw-rules.ts` 와 `public/sw.js` 양쪽 `STATIC_EXT` 에 `gpx` 포함(두 파일 정규식 문자열 동일). `sw-rules.test.ts` 가 `/gpx/tmb2027-day-07.gpx` → `static` 분류 검증 |
| B7 | **SC-014 판정 6기준** | matched | `gpx.test.ts` 가 전부 커버: ① 12개 파일 존재 ② `<trkseg>`·`<trkpt>` 수 = `trackPoints` ③ `<wpt>` 3개 이상 ④ "OpenStreetMap contributors" 출처 ⑤ 길이가 PRD 거리 60~140% ⑥ Day 7 트랙이 Grand Col Ferret(45.8883, 7.0756) **300 m 이내** 통과 |

### C. 부록 C-3 Day 12 숙박 권장 문구 · 음차

| # | 항목 | 판정 | 근거 |
|---|---|---|---|
| C1 | seed `notes` 에 승강장 도보 10분 권장 | matched | `lodgings.ts:261` (위 교차 검사 1) |
| C2 | 마이그레이션 seed 행 동일 문구 | matched | `20260917000003_lodgings.sql:89`, 테스트가 동일성 강제 |
| C3 | N-003 / FR-017 음차 누출 0건 | matched | 위 교차 검사 2 |

### D. 정본 동기화 품질 (Plan §5)

| # | 항목 | 판정 | 근거 |
|---|---|---|---|
| D1 | Design §7 이 구현과 일치 | **partial** | 파일·함수·testid 는 정확하나 ① "3·4·7·11·12일 `trailViaIds`(**주요 고개 1곳**)" 에서 11일 경유지 `lac-blanc` 는 `kind: "waypoint"` 인 **호수**로 고개가 아님 ② `parseTrailUrl`·`TRAIL_ROUTER_BASE` 미기재 |
| D2 | Design §8 이 구현과 일치 | **partial** | 매니페스트 필드 나열에서 **`trekDayNumber` 누락**(PRD 부록 A-1·`GpxEntrySchema`·`MapLinkCard` 다운로드 파일명 모두가 쓰는 필드). `npm run build:gpx`(I-010) 도 미기재 |
| D3 | Design §10 매핑표 정확·완전 | **partial** | 기재된 2행(FR-003·FR-018)의 파일·테스트 경로는 **전부 실재하며 정확**. 그러나 Plan §2 델타 3행 중 **C-3 Day 12 행이 §10 에 없어** §9 와 §10 이 어긋나고, 유일한 신규 회귀 테스트인 `lodgings.test.ts` 가 매핑표에서 빠졌다 |
| D4 | `tsc` · `vitest` · **E2E** 통과 | **partial** | `tsc` 진단 0, 단위 29건 통과. `tests/e2e/day-detail.spec.ts` 는 **이번 분석에서 미실행**(아래 "런타임 미검증") |

## 지적과 조치 필요

> 전부 **문서 보정**이며 소스 변경은 필요 없다. 이번 Check 에서는 소스를 수정하지 않았다.

| ID | 심각도 | 지적 | 조치 |
|---|---|---|---|
| GAP-1 | **Medium** | `day-detail.design.md` §10 매핑표에 **부록 C-3 Day 12 숙박 문구 행이 없다.** Plan §2 는 델타를 FR-003 / FR-018·SC-014 / C-3 3건으로 규정했는데 §10 은 2건만 담아, "정본 동기화"가 목적인 사이클에서 정작 매핑표가 이번 사이클의 유일한 데이터 변경분을 놓쳤다. 이 사이클에서 추가된 회귀 테스트 `tests/unit/lodgings.test.ts`(`Day 12 lodging guidance`)도 표에 없다 | §10 에 한 행 추가: `부록 C-3 Day 12 숙박 권장` → `src/data/seed/lodgings.ts` chamonix-hotel `notes`, `supabase/migrations/20260917000003_lodgings.sql` → `lodgings.test.ts` |
| GAP-2 | Low | §8 매니페스트 필드 목록에 **`trekDayNumber` 누락**. 실제로는 `GpxEntrySchema` 가 필수(1~12)로 강제하고 `gpxLabel`·`MapLinkCard` 의 `download` 파일명이 이 값을 쓴다. PRD 부록 A-1 GpxEntry 에는 있으므로 **Design 만 한 필드 뒤처진 상태** | §8 필드 나열을 `(dayId, trekDayNumber, file, lengthKm, ascendM, trackPoints, viaNodeIds, generatedAt, source)` 로 정정 |
| GAP-3 | Low | §7 의 "주요 **고개** 1곳" 표현이 Day 11 에서 사실과 다르다. 11일 `trailViaIds` 는 `lac-blanc`(`route-nodes.ts` `kind: "waypoint"`, 2,352 m 호수). 12일 `le-brevent` 는 `kind: "pass"` 로 표기돼 있으나 통상 고개가 아닌 봉우리다. `src/data/seed/route-segments.ts:18-19` 주석도 같은 표현을 쓰고 있어 문서·주석이 함께 오해를 퍼뜨린다 | §7 문구를 "주요 경유지 1곳(고개 또는 대표 지점)" 류로 완화. 주석 수정은 코드 변경이므로 Act 단계에서 판단 |
| GAP-4 | Low | §8 에 재생성 절차(`npm run build:gpx`)가 없다. PRD I-010 이 "노선 변경 시 `npm run build:gpx` → 단위 테스트 통과 후 배포"를 운영 규칙으로 못박았는데 Design 에 진입점이 없어, 노선 수정자가 매니페스트를 손으로 고칠 위험이 있다 | §8 에 `npm run build:gpx`(`package.json` scripts) 한 줄 추가 |
| GAP-5 | Info | `src/data/seed/lodgings.ts` chamonix-hotel 에 `nameKo: "샤모니 시내 호텔 (미정)"` 이 남아 있다. 현재 어떤 공개 UI 도 숙박 `nameKo` 를 렌더하지 않으므로 **N-003 위반은 아니나**, 살아 있는 필드라 향후 컴포넌트가 무심코 참조하면 음차가 되살아난다 | 조치 불요. 다음 정리 사이클에서 숙박 `nameKo` 전량 제거 여부 판단 |
| GAP-6 | Info | `LodgingCard` 에 Design §3 이 기술하지 않은 **"후보 숙소" 블록**(`undecided && candidates.length > 0`)이 있다. chamonix-hotel 은 `candidates: []` 라 Day 12 에는 렌더되지 않고, 이 블록은 부록 C-2(제네바·취리히 호텔) 사이클 산출물로 보인다 | 이번 델타 범위 밖. 해당 feature 의 Design 에 귀속되는지 확인 필요 |

## 런타임 미검증

| 항목 | 미검증 사유 | 위험 |
|---|---|---|
| `tests/e2e/day-detail.spec.ts` 5개 케이스 | 이번 Check 에서 Playwright 를 실행하지 않았다(프로덕션 빌드 + 서버 기동 필요). Plan §5-3 의 "E2E day-detail 통과"는 **미확인** | 중. 특히 GPX 다운로드 케이스는 `next.config.ts` 헤더(`content-type`·`content-disposition`)를 **런타임에서만** 판정할 수 있어 단위 테스트로 대체 불가 |
| `next.config.ts` `/gpx/:file*` 헤더 실제 적용 | 단위 테스트 없음. 정적 파일 헤더는 빌드·배포 경로에 따라 달라질 수 있다 | 중. E2E 로만 커버 |
| `public/sw.js` 의 `.gpx` 캐시 동작 | `sw-rules.ts` 미러 규칙만 단위 검증. 실제 Service Worker 등록은 프로덕션 빌드에서만 일어난다(`shouldRegisterSw`) | 하. 두 파일의 `STATIC_EXT` 정규식이 문자열까지 동일함은 확인 |
| Supabase 마이그레이션 `20260917000003` 적용 결과 | Supabase 미연결 상태(Plan §4 결정). SQL 은 텍스트 대조로만 검증 | 하. 연결 후 리더가 8.7 절차로 재확인 |
| `scripts/build-gpx.mjs` 재실행 | BRouter 공개 서버 호출이 필요해 실행하지 않았다. 저장소의 GPX 12개는 `generatedAt: 2026-09-18` 기존 생성물 | 하. 생성물이 커밋돼 있어 빌드·테스트는 네트워크 없이 통과 |

### 실행 시 참고

```
npx playwright test tests/e2e/day-detail.spec.ts --workers=1
```

E2E 가 통과하면 D4 는 matched 로 올라가고, GAP-1~4 문서 보정 시 D1~D3 도 matched 가 되어 Match Rate 는 **19/19 = 100%** 가 된다. 문서 보정만 수행할 경우 **18.5/19 = 97.4%** 로 게이트(90%)를 통과한다.

## Act-1 반영 (2026-09-18, pdca-iterate)
| # | 조치 | 결과 |
|---|---|---|
| GAP-1 | Design §10 매핑표에 "부록 C-3 Day 12 숙박 권장 → lodgings.ts·SQL → lodgings.test.ts" 행 추가 | matched |
| GAP-2 | Design §8 매니페스트 필드에 `trekDayNumber` 추가 | matched |
| GAP-3 | Design §7·`route-segments.ts` 주석을 "주요 경유지 1곳(고개 또는 대표 지점)"으로 정정 | matched |
| GAP-4 | Design §8에 `npm run build:gpx` 재생성 절차(I-010) 명시 | matched |
| D4 | 프로덕션 빌드 E2E 전체 실행(2026-09-18): `day-detail.spec.ts` 3 뷰포트 통과(전체 108/108) | matched |

**재계산 Match rate: 19/19 = 100%** · 게이트 95 통과 · GAP-5·6은 Info(범위 밖, 후속 정리 항목).
