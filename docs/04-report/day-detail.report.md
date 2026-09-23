# Report — day-detail (PRD v3.0 델타)

> feature: day-detail · 순서 3/3 (v3.0 델타) · 완료일 2026-09-18 · 최종 match rate **100%** (19/19, 게이트 95 통과) · 반복 횟수 **1회**(Check 89.5% → Act-1)
> Plan `docs/01-plan/day-detail.plan.md` · Design `docs/02-design/day-detail.design.md` · Analysis `docs/03-analysis/day-detail.analysis.md` · 이전 사이클 `docs/archive/2026-09-v2.0/day-detail/` (v2.0 96%, Act-2~4로 좌표·산길 링크·GPX 구현)

## Executive Summary

| 관점 | 내용 (실제 결과) |
|---|---|
| Problem | FR-003 보완(경유지 좌표·산길 경로 링크)과 FR-018(Day별 GPX)은 v2.0 사이클의 Act-2~4에서 이미 구현됐는데 Plan/Design 정본에는 기술이 없었고, v3.0이 확정한 Day 12 숙박 권장 조건(에귀 뒤 미디 승강장 도보 10분 이내)이 seed·마이그레이션에 반영돼 있지 않았다. |
| Solution | 구현 완료분을 Design §7(산길 링크)·§8(GPX)·§10(구현 상태 매핑표)에 정식 명세로 옮기고, `chamonix-hotel`의 `notes`를 v3.0 문구로 갱신한 뒤 `supabase/migrations/20260917000003_lodgings.sql`의 같은 행을 문자 단위로 맞췄다. 두 문구의 동일성을 `tests/unit/lodgings.test.ts`가 강제한다. |
| Function UX Effect | Day 12(`/day/d2027-08-15`) 숙박 카드에 "다음 날 06:30 에귀 뒤 미디 출발이므로 샤모니 남역(Aiguille du Midi 승강장) 도보 10분 이내 권장"이 보인다. 기존 숙소 미정 표기·산길 링크·GPX 다운로드 동작은 그대로다. |
| Core Value | 정본·설계·구현 3자 일치. 숙소를 확정할 리더가 어떤 조건으로 고를지 화면에서 바로 안다. |

### 1.3 Value Delivered

| 관점 | 지표·근거 |
|---|---|
| seed ↔ SQL 동기화 | `src/data/seed/lodgings.ts:261`과 `supabase/migrations/20260917000003_lodgings.sql:89`의 `notes`가 문자 단위 동일. `lodgings.test.ts:135~142`가 SQL 원문에 seed `notes` 전문 포함을 단정 → 한쪽만 바뀌면 테스트가 깨진다 |
| 정본 커버리지 | Design §10 매핑표가 v3.0 델타 3건(FR-003 · FR-018/SC-014 · 부록 C-3)을 모두 담고, 각 행이 실재하는 구현 파일과 테스트 파일을 가리킨다 |
| FR-003 정확도 | 12개 Day `mapUrl`의 경유지가 route node 좌표와 1e-6 이내 일치, TMB 바운딩박스(lat 45.6~46.2, lon 6.6~7.2) 내 — `map-url.test.ts` |
| FR-018 완결성 | GPX 12개 + 9필드 매니페스트, SC-014 판정 6기준(파일 수·트랙포인트 수·wpt 3개 이상·OSM 출처·거리 60~140%·Day 7 Grand Col Ferret 300 m 이내)을 `gpx.test.ts`가 전부 커버 |
| 음차 누출 | `nameKo` 렌더 지점은 Day 제목 계열뿐, 경로점·숙박 카드 0건(N-003·FR-017 유지) |
| 검증 자산 | 단위 29건(`map-url`·`route`·`gpx`·`lodgings`) + `tests/e2e/day-detail.spec.ts` 5케이스 × 3 뷰포트 |

## Context Anchor

| Key | Value |
|---|---|
| WHY | 정본 동기화 · Day 12 숙박 조건 반영 |
| WHO | 리더(예약), 방문자 |
| RISK | 마이그레이션 seed 행과 TS seed 문구 불일치 |
| SUCCESS | Design이 FR-003/FR-018 구현을 정확히 기술, Day 12 문구 seed↔SQL 일치, 기존 테스트 통과 |
| SCOPE | 설계 문서, lodgings seed·SQL Day 12 문구, 테스트. 코드 로직 변경 없음 |

## FR/SC

| ID | 상태 | 근거 |
|---|---|---|
| FR-003 (경유지 좌표) | ✅ 완료 | `src/data/seed/days.ts` `mapUrl`의 `waypoints=lat%2Clng`, `tests/unit/map-url.test.ts`가 좌표 일치·범위 검사 |
| FR-003 (산길 경로 링크) | ✅ 완료 | `src/lib/map-url.ts` `buildTrailUrl`/`isValidTrailUrl`, `src/lib/route.ts` `getTrailUrlForDay`, `src/data/seed/route-segments.ts` `trailViaIds`(3·4·7·11·12일), `MapLinkCard` `data-testid="trail-link"` + 우회 경고 |
| FR-018 / SC-014 (GPX) | ✅ 완료 | `scripts/build-gpx.mjs`(`npm run build:gpx`), `public/gpx/tmb2027-day-01~12.gpx`, `src/data/gpx-manifest.json`(9필드), `src/lib/gpx.ts`, `MapLinkCard` `gpx-download`, `next.config.ts` `/gpx/:file*` 헤더, SW `STATIC_EXT`에 gpx |
| 부록 C-3 Day 12 | ✅ 완료 | `lodgings.ts:261` notes + SQL 89행 동일 문구 + `lodgings.test.ts` "Day 12 lodging guidance" |
| 부록 A-1 `RouteSegment`·`GpxEntry` | ✅ 완료 | `schema.ts:184` 4필드 상위집합(`trekDayNumber` 추가), `GpxEntrySchema`가 9필드를 regex·범위까지 강제 |
| N-013 ~ N-015 | ✅ 완료 | 지명 문자열 → 좌표(N-013), 고개 우회 방지 `trailViaIds`(N-014), 출처 `OpenStreetMap (ODbL) · BRouter hiking-mountain`(N-015) |
| FR-004 / N-003 / FR-017 | ✅ 유지 | 숙소 미정 표기·음차 0건은 v2.0 상태 그대로, 이번 델타에서 회귀 없음 |
| D-006 연계 | ✅ 완료 | Day 12 숙박 권장 문구가 다음 날 06:30 출발을 근거로 제시 — itinerary-core 8/16 구간과 정본이 같은 시각을 쓴다 |

## Success Criteria 최종 (Plan §5)

| # | 기준 | 판정 | 근거 |
|---|---|:--:|---|
| 1 | Design §7·§8이 `map-url.ts`·`route.ts`·`gpx.ts`·`MapLinkCard`·`build-gpx.mjs` 실제 구현과 일치 | ✅ | Act-1에서 §8에 `trekDayNumber`·`npm run build:gpx`를 추가하고 §7 표현을 "주요 경유지 1곳(고개 또는 대표 지점)"으로 정정, §10에 C-3 행 추가 |
| 2 | `chamonix-hotel` `notes`에 "승강장 도보 10분", seed와 SQL 문구 동일 | ✅ | `lodgings.ts:261` ↔ SQL 89행 문자 단위 동일, `lodgings.test.ts`가 동일성 강제 |
| 3 | `tsc`·`vitest`·E2E day-detail 통과 | ✅ | `tsc` 오류 0 · `vitest run` **124/124** · 프로덕션 빌드 Playwright **108/108**(`day-detail.spec.ts` 3 뷰포트 포함) |

**충족: 3/3** (Check 시점 미검증이던 3번 E2E를 Act-1에서 프로덕션 빌드로 실행해 마감)

## 산출물

- `docs/02-design/day-detail.design.md` — §7 산길 경로 링크, §8 Day별 GPX, §9 v3.0 Day 12 숙박 권장 문구, §10 구현 상태 매핑표(정본 동기화 본체)
- `src/data/seed/lodgings.ts` — `chamonix-hotel` `notes` v3.0 문구, `season` 유지
- `supabase/migrations/20260917000003_lodgings.sql` — chamonix-hotel 행 `notes` 동일 문구
- `tests/unit/lodgings.test.ts` — "Day 12 lodging guidance" 블록(seed·SQL 동일성)
- 변경 없음(정본 기술 대상): `src/lib/map-url.ts`, `src/lib/route.ts`, `src/lib/gpx.ts`, `src/data/seed/route-segments.ts`, `src/data/gpx-manifest.json`, `scripts/build-gpx.mjs`, `src/components/day/MapLinkCard.tsx`, `next.config.ts`
- Act-1 문서 편집: Design §7·§8·§10 + `src/data/seed/route-segments.ts` 주석 문구

## Key Decisions & Outcomes (Plan §4)

| 결정 | 준수 | 결과 |
|---|:--:|---|
| Supabase 미연결 상태이므로 이미 적용되지 않은 마이그레이션 `000003`의 seed 행을 직접 갱신한다(연결 후에는 리더가 8.7 절차로 갱신) | ✅ | SQL 재작성 없이 한 행만 바뀌어 변경 면적이 최소화됐다. 연결 시점에 마이그레이션이 처음부터 v3.0 문구로 적용된다 |
| 코드 로직은 건드리지 않고 문서·데이터·테스트만 손댄다 | ✅ | `src/lib`·컴포넌트 변경 0줄. 이번 사이클의 gap이 전부 문서 측이었음을 Check가 확인해 준 결과와 일치 |
| seed↔SQL 문구 동일성은 주석이나 관례가 아니라 테스트로 강제한다 | ✅ | `lodgings.test.ts`가 SQL 파일을 읽어 seed `notes` 전문 포함을 단정. 한쪽만 고치는 드리프트가 구조적으로 차단됐다 |
| (Act-1 조정) §7의 "주요 고개 1곳" 표현을 사실에 맞게 완화 | ✅ | 11일 `lac-blanc`는 `kind: "waypoint"`(호수), 12일 `le-brevent`는 봉우리다. 문서와 `route-segments.ts` 주석을 "주요 경유지 1곳(고개 또는 대표 지점)"으로 함께 정정해 오해의 근원을 없앴다 |

## Check → Act 요약

| 단계 | 내용 |
|---|---|
| Check (gap-detector, 2026-09-18) | **89.5%** = (matched 15 + 0.5×partial 4) / 19. 게이트 미달. Critical 0 · Major 0 · **구현 결함 0** — 미달분 전부 설계 문서 기술 누락 + E2E 런타임 미검증 |
| 판정 원칙 | 이번 사이클의 목적 자체가 "정본·설계·구현 3자 일치"이므로 문서 결함을 부수적 흠이 아니라 **핵심 산출물 결함**으로 계상했다 |
| GAP-1 (Medium) | §10 매핑표에 부록 C-3 Day 12 행과 `lodgings.test.ts`가 없음 → 한 행 추가 → **matched** |
| GAP-2 (Low) | §8 매니페스트 필드 목록에 `trekDayNumber` 누락(`GpxEntrySchema` 필수, 다운로드 파일명이 사용) → 9필드로 정정 → **matched** |
| GAP-3 (Low) | §7 "주요 고개 1곳"이 Day 11(`lac-blanc`, 호수)에서 사실과 다름 → §7·seed 주석을 "주요 경유지 1곳(고개 또는 대표 지점)"으로 정정 → **matched** |
| GAP-4 (Low) | §8에 재생성 절차 부재(PRD I-010이 운영 규칙으로 규정) → `npm run build:gpx` 명시 → **matched** |
| D4 (E2E 미검증) | 프로덕션 빌드 기준 전체 E2E 실행 → `day-detail.spec.ts` 3 뷰포트 통과(전체 108/108) → **matched** |
| Act-1 후 재계산 | **19/19 = 100%** · 게이트 95 통과. GAP-5·6은 Info(범위 밖, 후속 정리 항목) |
| QA (2026-09-18) | `tsc` 0 · `vitest run` 124/124 · 프로덕션 빌드 Playwright 108/108 |

## 후속·미검증 항목

1. **I-009 — 에귀 뒤 미디 2027 운행·요금 확인** — Day 12 숙박 권장 문구의 근거인 "다음 날 06:30 출발"은 2027 시즌 시간표가 확정되면 바뀔 수 있다. 첫 상행 시각이 조정되면 `lodgings.ts` notes·SQL 89행·`travel-legs.ts` 8/16 구간을 함께 갱신한다(itinerary-core 후속 1번과 같은 건).
2. **Supabase 미연결 항목** — 마이그레이션 `20260917000003_lodgings.sql`은 텍스트 대조로만 검증됐다. 연결 후 PRD 8.7 절차로 적용 결과를 확인하고, `lodging_kind` enum이 앱 `LodgingKind`와 1:1인지, undecided 행이 공개 뷰에서 링크·전화를 노출하지 않는지 함께 점검한다. Day 12 숙소가 확정되면 리더가 DB에서 `notes`·`bookingUrl`·`verifiedPhone`을 갱신하며, 이때 TS seed와의 이중 관리 해소 방침을 정한다.
3. **GAP-5 (Info) — 숙박 `nameKo` 잔존** — `lodgings.ts`의 `chamonix-hotel`에 `nameKo: "샤모니 시내 호텔 (미정)"`이 남아 있다. 현재 어떤 공개 UI도 숙박 `nameKo`를 렌더하지 않아 N-003 위반은 아니지만, 살아 있는 필드라 향후 컴포넌트가 무심코 참조하면 음차가 되살아난다. 다음 정리 사이클에서 숙박 `nameKo` 전량 제거 여부를 판단한다.
4. **GAP-6 (Info) — `LodgingCard` "후보 숙소" 블록** — Design §3이 기술하지 않은 `undecided && candidates.length > 0` 블록이 있다. `chamonix-hotel`은 `candidates: []`라 Day 12에는 렌더되지 않으며, 부록 C-2(제네바·취리히 호텔) 사이클의 산출물로 보인다. 어느 feature의 Design에 귀속되는지 확인해 문서를 붙인다.
5. **`scripts/build-gpx.mjs` 재실행 미수행** — BRouter 공개 서버 호출이 필요해 이번 사이클에서 실행하지 않았다. 저장소의 GPX 12개는 `generatedAt: 2026-09-18` 생성물이 커밋돼 있어 빌드·테스트는 네트워크 없이 통과한다. 노선·경유지를 바꾸면 I-010대로 `npm run build:gpx` → 단위 테스트 통과 후 배포한다.
6. **SW `.gpx` 캐시 실동작** — `sw-rules.ts`와 `public/sw.js`의 `STATIC_EXT` 정규식이 문자열까지 동일함은 확인했으나, 실제 Service Worker 등록은 프로덕션에서만 일어난다. 오프라인 상태에서 GPX 재다운로드가 캐시로 처리되는지는 offline-pwa 사이클의 오프라인 시나리오에서 교차 확인한다.
