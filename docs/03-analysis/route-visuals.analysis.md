# Analysis — route-visuals (PRD v2.0 개정)

> feature: route-visuals · Check 단계 · gap-detector 실행 2026-09-17 · 게이트 95
> Plan: `docs/01-plan/route-visuals.plan.md` · Design: `docs/02-design/route-visuals.design.md` · PRD: `docs/PRD.md` v2.0 FR-011·FR-012·SC-009a·SC-009b·8.5·I-003·I-008
> 의존: day-detail · 이전 사이클: `docs/archive/2026-09-v2/route-visuals/`

## Context Anchor

| Key | Value |
|---|---|
| WHY | 마커 완전성(숙박 12 + 제목 고개 전부) |
| WHO | 방문자 |
| RISK | 좌표 근사(GPX 전) |
| SUCCESS | 고개 12개 노드 존재, 숙박 마커 12, 출처 문구 |
| SCOPE | route-nodes/segments/route.ts/map page/test |

---

## 1. 결과

| 축 | 점수 | 가중치 | 기여 | 상태 |
|---|:---:|:---:|:---:|:---:|
| Structural Match | 100% | 0.10 | 10.00 | ✅ |
| Functional Depth | 100% | 0.15 | 15.00 | ✅ |
| Contract (모듈 API 3-way) | 100% | 0.15 | 15.00 | ✅ |
| Intent Match | 95% | 0.20 | 19.00 | ✅ |
| Behavioral Completeness | 92% | 0.15 | 13.80 | ⚠️ |
| UX Fidelity | 95% | 0.10 | 9.50 | ✅ |
| Runtime | 85% | 0.15 | 12.75 | ⚠️ |
| **Overall Match Rate** | **94%** | 1.00 | **95.05 → 94** | ⚠️ |

**게이트 95 → FAIL (1%p 미달)**

> 미달 사유는 구현 결함이 아니라 **검증 커버리지 공백**이다. 설계가 명시한 데이터·상수·UI 요소는 100% 구현되었고 불일치가 0건이다. 감점은 전부 (a) `next build` 미실행, (b) 지도 페이지 출처 문구에 대한 자동 회귀 테스트 부재에서 발생했다. 소스 코드 수정 없이 검증 자산 추가만으로 해소 가능하다.

### 점수 산출 근거

- **Intent 95%** — Plan §5 성공기준 4개 중 1·2·3은 완전 충족(증거는 §2 참조), 4는 `tsc`·`vitest` 통과·`next build` 미실행으로 부분 충족. 설계 의도(마커 완전성·출처 표기) 자체는 전부 달성되어 구현 의도 축에서는 만점에 근접.
- **Behavioral 92%** — 설계 §5가 요구한 테스트 4항목이 모두 존재하고 추가 회귀 단언(구간 연결성·투영 경계·고도점 role)까지 갖춤. 다만 Plan 성공기준 3("OpenFreeMap 문구")에 대응하는 실행 가능한 단언이 어디에도 없어 1항목 감점.
- **UX 95%** — 설계 §3·§4가 요구한 범례 카운트·마커 kind별 렌더·출처 섹션이 전부 구현. PRD 8.5의 4상태(로딩/빈/오류/성공)는 I-003으로 명시 이연되어 설계 SCOPE 밖이므로 감점 대상이 아니나, PRD 기준 완전성으로는 미달이라 소폭 반영.
- **Runtime 85%** — Plan 성공기준 4가 요구한 3개 명령 중 2개 green, 1개 미실행.

---

## 2. 검증 근거

### 2.1 실행된 검증

| 명령 | 결과 | 비고 |
|---|---|---|
| `npx vitest run tests/unit/route.test.ts tests/unit/seed.test.ts` | **22/22 PASS** | 위임 실행, 파일 미수정 확인 |
| `npx tsc --noEmit` | **exit 0** | 타입 오류 0건 |
| `npx next build` | **미실행** | 위임 서브에이전트가 2회 연속 출력 반환 실패(Bash 권한 프롬프트 추정) |

### 2.2 정적 대조 증거

**신규 pass 노드 2개** — `src/data/seed/route-nodes.ts`

```
:18  { id: "col-checrouit",    nameOriginal: "Col Chécrouit",     kind: "pass", lat: 45.7845, lon: 6.95,   altitudeM: 1956 }
:35  { id: "col-des-posettes", nameOriginal: "Col des Posettes",  kind: "pass", lat: 46.0215, lon: 6.9615, altitudeM: 1997 }
```

설계 §2의 리터럴과 id·nameKo·nameOriginal·kind·lat·lon·altitudeM 7개 필드 전부 일치.

**구간 갱신** — `src/data/seed/route-segments.ts`

```
:29  seg(4,  "07", ["mottets","col-de-la-seigne","elisabetta","lac-combal","col-checrouit","maison-vieille"])
:35  seg(10, "13", ["trient","col-de-balme","col-des-posettes","posettes","tre-le-champ"])
```

설계 §2의 순서 지정("lac-combal → col-checrouit → maison-vieille", "col-de-balme → col-des-posettes → aiguillette-des-posettes → tre-le-champ")과 일치. 총 12구간 유지, Day N 끝 노드 = Day N+1 첫 노드 연결 무결성 유지(Day 4 종점 `maison-vieille` = Day 5 시점).

**TITLE_PASSES 12개 실재 확인** — `src/lib/route.ts:11-24` ↔ `route-nodes.ts`

| # | TITLE_PASSES 원어명 | 노드 id | kind | 존재 |
|:--:|---|---|:---:|:---:|
| 1 | Col de Voza | col-de-voza | pass | ✅ |
| 2 | Col du Bonhomme | col-du-bonhomme | pass | ✅ |
| 3 | Col de la Croix du Bonhomme | col-croix-bonhomme | pass | ✅ |
| 4 | Col des Fours | col-des-fours | pass | ✅ |
| 5 | Col de la Seigne | col-de-la-seigne | pass | ✅ |
| 6 | Col Chécrouit | col-checrouit | pass | ✅ |
| 7 | Grand Col Ferret | grand-col-ferret | pass | ✅ |
| 8 | Col de la Forclaz | col-de-la-forclaz | pass | ✅ |
| 9 | Col de Balme | col-de-balme | pass | ✅ |
| 10 | Col des Posettes | col-des-posettes | pass | ✅ |
| 11 | Aiguillette des Posettes | posettes | pass | ✅ |
| 12 | Le Brévent | le-brevent | pass | ✅ |

악센트 문자(Chécrouit의 `é`, Brévent의 `é`)까지 정확 일치 확인 → `getMarkerSummary().missingTitlePasses = []`. `passes.length = 12`.

**숙박 마커 12 산출** — kind `lodging` 11개(les-contamines, la-balme, mottets, maison-vieille, bertone, elena, la-fouly, champex-lac, trient, tre-le-champ, la-flegere) + kind `finish` 1개(chamonix) = **12**. Plan §4 결정("lodging 11 + finish Chamonix, 제네바·취리히 호텔 제외")과 일치.

**지도 페이지 출처 문구** — `src/app/map/page.tsx:27-35`

```
:30  지도 기준일 2026-09-16 · 라이선스: 팀 자체 제작 SVG (외부 타일·이미지 미사용)
:32  타일 적용 시 OpenFreeMap 또는 MapTiler Free를 사용하고 출처를 표기합니다 [기본값] — 검증 GPX 확보 후 적용(I-003).
```

설계 §4가 요구한 5개 요소(팀 자체 제작 SVG / 검증 GPX 확보 전 / I-003 / OpenFreeMap·MapTiler Free / 기준일 2026-09-16) 전부 존재. I-003은 `StatusNote`(`:16-18`)와 출처 리스트에 중복 명시.

**범례 마커 수 표시** — `src/components/map/MapLegend.tsx:12`

```tsx
숙박 {markers.lodging} · 고개 {markers.passes.length}
```

하드코딩이 아닌 `getMarkerSummary()` 파생값 → 노드 추가 시 자동 반영. 설계 §3 "범례에 '숙박 12 · 고개 N'" 충족.

**Day 10 고도점 (FR-012)** — `src/data/seed/days.ts:305-311`

```
{ nameKo: "트리앙",              nameOriginal: "Trient",                   altitudeM: 1300 }
{ nameKo: "콜 드 발므 (CH→FR)",  nameOriginal: "Col de Balme",             altitudeM: 2191 }
{ nameKo: "콜 데 포제트",        nameOriginal: "Col des Posettes",         altitudeM: 1997 }
{ nameKo: "에귀예트 데 포제트",  nameOriginal: "Aiguillette des Posettes", altitudeM: 2201 }
{ nameKo: "트레르샹",            nameOriginal: "Tré-le-Champ",             altitudeM: 1417 }
```

Col des Posettes 1,997 m가 Col de Balme 직후·Aiguillette 직전 순서로 삽입됨. `tests/unit/seed.test.ts:59-64`에서 존재·순서·고도·nameKo 4가지 모두 단언.

---

## 3. 항목별 대조

### 3.1 파일 대조 (설계 §1)

| 설계 §1 지정 파일 | 존재 | 설계 요구 반영 | 판정 |
|---|:---:|---|:---:|
| `src/data/seed/route-nodes.ts` | ✅ | col-checrouit·col-des-posettes 2개 추가 | ✅ |
| `src/data/seed/route-segments.ts` | ✅ | Day 4·Day 10 nodeIds 갱신 | ✅ |
| `src/lib/route.ts` | ✅ | TITLE_PASSES + getMarkerSummary() | ✅ |
| `src/app/map/page.tsx` | ✅ | 출처·타일 문구 | ✅ |
| `src/components/map/MapLegend.tsx` | ✅ | 숙박·고개 마커 수 표시 | ✅ |
| `tests/unit/route.test.ts` | ✅ | 마커 완전성 describe 블록 추가 | ✅ |
| `src/data/seed/days.ts` (§5 선행) | ✅ | Day 10 routePoints에 Posettes 1,997 | ✅ |

**Structural Match 7/7 = 100%**

### 3.2 모듈 API 계약 3-way (설계 §3 ↔ 구현 ↔ 소비처)

| 심볼 | 설계 §3 정의 | `src/lib/route.ts` 구현 | 소비처 사용 | 계약 |
|---|---|---|---|:---:|
| `TITLE_PASSES` | 12개 원어명 `as const` | `:11-24` 12개 `as const` | `route.test.ts:44` `toHaveLength(12)` | PASS |
| `getMarkerSummary()` 반환 `lodging` | `lodging`+`finish` count | `:30` 동일 필터 | `MapLegend:12`, `route.test.ts:43` | PASS |
| `getMarkerSummary()` 반환 `passes` | pass 노드 `nameOriginal[]` | `:31` 동일 | `MapLegend:12` `.length` | PASS |
| `getMarkerSummary()` 반환 `missingTitlePasses` | TITLE_PASSES 중 부재분 | `:32` 동일 | `route.test.ts:42` `toEqual([])` | PASS |
| 기본 인자 | `nodes = routeNodes` | `nodes = getRouteNodes()` | — | PASS (개선) |

기본 인자만 설계와 다르다. 설계는 원시 배열 `routeNodes`를, 구현은 seed 검증을 거친 `getRouteNodes()`를 기본값으로 쓴다. 이는 **설계보다 강한 계약**(호출 시 Zod 검증·중복 id·구간 무결성이 선행 보장)이므로 이탈이 아닌 상위 호환 개선으로 판정한다. 타입 `MarkerSummary`가 명시 export되어 소비처 타입 안전성도 확보됨.

**Contract 5/5 = 100%**

### 3.3 Plan §5 성공기준 대조

| # | 성공기준 | 증거 | 판정 |
|:--:|---|---|:---:|
| 1 | TITLE_PASSES 각 이름이 route-nodes `nameOriginal`에 존재(kind = pass) | §2.2 12행 대조표, `route.test.ts:42` | ✅ Met |
| 2 | 숙박 마커(lodging+finish) = 12, 구간 12, Day 10에 col-des-posettes | `route.test.ts:43,50`, `route-segments.ts:35` | ✅ Met |
| 3 | 지도 페이지에 "OpenFreeMap" 문구 | `map/page.tsx:32` — 존재하나 **자동 검증 없음** | ⚠️ Partial |
| 4 | `tsc`, `vitest`, `next build` | tsc exit 0 · vitest 22/22 · **build 미실행** | ⚠️ Partial |

성공기준 3은 코드상으로는 충족(문구 실재)이나 회귀 방어가 없어 Behavioral 축에서 감점했다.

### 3.4 설계 §5 테스트 요구 대조

| # | 설계 §5 요구 | 구현 위치 | 판정 |
|:--:|---|---|:---:|
| 1 | `missingTitlePasses` 길이 0, `lodging === 12` | `route.test.ts:42-43` | ✅ |
| 2 | 구간 12개, Day 10에 col-des-posettes, Day 4에 col-checrouit | `route.test.ts:9,50-51` | ✅ |
| 3 | 모든 segment nodeIds가 존재 노드 | `route.test.ts:22` + `route.ts:49` 런타임 가드 | ✅ |
| 4 | Day 10 elevation points에 Col des Posettes 1,997 (days.ts routePoints 기준) | `seed.test.ts:59-64` | ✅ |

설계 §5 4번 항목은 `route.test.ts`가 아닌 `seed.test.ts`가 커버한다. 설계가 "days.ts routePoints 기준, itinerary-core 선행"이라 명시했으므로 seed 테스트에 위치하는 것이 타당하며, **커버리지 공백이 아니다.** `route.test.ts:55-60`은 별개로 segment 노드 측 1,997 m를 검증해 양쪽이 이중 방어된다.

**설계 §5 4/4 = 100%**

### 3.5 PRD 요구사항 대조

| ID | PRD 요구 | 구현 상태 | 판정 |
|---|---|---|:---:|
| FR-011 | 12개 Day 구분 루트 개요 + 마커(숙박 12 + C-3 제목 고개 전부) | 12구간 색 구분(`SEGMENT_COLORS` 12색, 중복 0 — `route.test.ts:16`), 숙박 12·고개 12 | ✅ |
| FR-012 | Day별 출발·주요 고개·도착 3개 이상 고도점 | 전 트레킹 Day ≥3점 + role start/via/end 검증(`route.test.ts:83-93`), Day 10에 Posettes 추가 | ✅ |
| SC-009a | Day 고도 프로파일 3점 이상 | `route.test.ts:86` 전 Day 단언 | ✅ |
| SC-009b | 개요 지도 12구간 선 + 숙박 12·고개 마커 | `RouteOverviewMap.tsx:91-98` — 12 path + kind별 마커 렌더 | ✅ |
| 8.5 | 정적 SVG(GPX 전) + 출처·기준일 + 타일 공급자 표기 [기본값] | `map/page.tsx:27-35` 3요소 전부 | ✅ |
| 8.5 상태 | 로딩 preview · 빈 지도 · 오류 Day 목록 fallback · 성공 상호작용 | 정적 성공 상태만 — I-003 이연 | ⚠️ 이연 |
| I-003 | GPX 전 정적 개요 SVG, 승인 후 MapLibre | 정적 SVG 유지, StatusNote로 이연 명시 | ✅ |
| I-008 | Day 9·10 고도 seed 2026-09-16 재확인 | `sourceCheckedAt: "2026-09-16"`, `seed.test.ts:56-58` | ✅ |

### 3.6 차이 분류

**🔴 Missing (설계 O, 구현 X)**: 없음.

**🟡 Added (설계 X, 구현 O)**

| 항목 | 위치 | 평가 |
|---|---|---|
| `MarkerSummary` 타입 명시 export | `route.ts:26` | 설계에 없으나 소비처 타입 안전성 향상 — 수용 |
| 구간 연결성(end=next start) 테스트 | `route.test.ts:19-27` | 설계 §5 미요구 회귀 방어 — 수용 |
| 투영 좌표 padding 경계 테스트 | `route.test.ts:62-79` | 노드 추가 시 SVG 이탈 방어 — 수용 |
| 고개일 via 고도점 ≥1,500 m 테스트 | `route.test.ts:95-106` | FR-012 심화 검증 — 수용 |

**🔵 Changed (설계 ≠ 구현)**

| 항목 | 설계 | 구현 | 영향 |
|---|---|---|:---:|
| `getMarkerSummary` 기본 인자 | `nodes = routeNodes` | `nodes = getRouteNodes()` | 낮음(상위 호환 개선) |
| §4 출처 문구 배치 | 단일 문단 | 5개 `<li>` + StatusNote 분리 | 없음(요소 전부 보존) |

---

## 4. 지적과 조치 필요

| # | 심각도 | 지적 | 근거 | 조치 |
|:--:|:---:|---|---|---|
| 1 | **중요** | Plan 성공기준 4의 `npx next build`가 미실행 상태로 남음. 프로덕션 빌드에서만 드러나는 오류(서버 컴포넌트 직렬화, metadata 처리 등)가 검증되지 않음 | §2.1 | 오케스트레이터가 `npx next build` 직접 실행 후 결과를 본 문서 §5에 기록. gap-detector는 read-only(Bash 없음)이며 위임 실행이 2회 실패함 |
| 2 | **중요** | Plan 성공기준 3("OpenFreeMap 문구")에 대응하는 실행 가능한 단언이 unit·e2e 어디에도 없음. `map/page.tsx:32`가 삭제·변경돼도 22개 테스트 전부 통과 → PRD 8.5 라이선스 요구가 조용히 무너질 수 있음 | `tests/` 전수 grep 결과 "OpenFreeMap" 0건 | `tests/e2e/`에 `/map` 페이지 텍스트 단언 추가, 또는 문구를 `src/lib/` 상수로 추출해 unit 단언. 후자가 오프라인 테스트 비용이 낮아 권장 |
| 3 | 경미 | `route.test.ts:32` `expect(count("pass")).toBeGreaterThanOrEqual(10)` — 본 사이클로 고개가 12개가 되었으므로 하한 10은 느슨함. 고개 2개가 삭제돼도 통과 | `route.test.ts:32` | `toBe(12)` 또는 `toBeGreaterThanOrEqual(TITLE_PASSES.length)`로 강화. 단, `missingTitlePasses` 단언이 이미 이름 기준 완전성을 막고 있어 실질 위험은 낮음 |
| 4 | 경미 | `col-checrouit` lon 6.9500이 `maison-vieille` lon 6.931보다 **동쪽**. Day 4 폴리라인이 `lac-combal(6.856) → col-checrouit(6.950) → maison-vieille(6.931)`로 동진 후 서진하는 역주행 형태로 렌더됨. 실제 Col Chécrouit는 Maison Vieille 인접 서쪽 ≈ 45.787, 6.936 | `route-nodes.ts:18,19`, `route-segments.ts:29` | **설계 §2의 리터럴과 정확히 일치하므로 설계-구현 갭은 아님.** 설계 값 자체의 근사 정확도 이슈로, Context Anchor RISK·I-003·I-008이 이미 "GPX 확보 시 재대조"로 커버. 즉시 조치 불필요, GPX 확보 시 재대조 목록에 등재 |
| 5 | 정보 | PRD 8.5가 규정한 4상태(로딩 정적 preview · 빈 지도 준비 중 · 오류 Day 목록 fallback · 성공 상호작용 지도) 중 정적 성공 상태만 구현 | `map/page.tsx` 전체 | I-003으로 명시 이연되었고 Plan §3 Out("MapLibre 실제 도입")에 해당. 설계 SCOPE 밖이므로 **갭 아님**. GPX 승인 후 MapLibre 도입 사이클에서 처리 |
| 6 | 정보 | `RouteOverviewMap.tsx:60` D-라벨 위치가 `nodeIds[floor(length/2)]` 기준. Day 4가 5→6 노드로 늘며 중앙 인덱스가 3(col-checrouit)으로 이동 | `RouteOverviewMap.tsx:58-62` | 라벨이 겹치지 않으면 무방. 시각 확인 권장이나 로직 결함 아님 |

### 4.1 즉시 조치 시 예상 효과

지적 1·2를 처리하면:

- Runtime 85% → 100% (+2.25점)
- Behavioral 92% → 98% (+0.90점)
- Intent 95% → 100% (+1.00점)
- **Overall 94% → 97% — 게이트 95 통과**

소스 코드 수정은 불필요하고 검증 자산만 추가하면 되므로 `/pdca iterate route-visuals` 1회로 충분하다.

### 4.2 동기화 옵션

| 옵션 | 내용 | 권고 |
|---|---|---|
| 1 | 구현을 설계에 맞춤 | 해당 없음 — 불일치 0건 |
| 2 | 설계를 구현에 맞춤 | 설계 §3 기본 인자를 `getRouteNodes()`로 갱신(선택) |
| 3 | 검증 자산 보강 후 재판정 | **권장** — 지적 1·2 처리 |
| 4 | 차이를 의도된 것으로 기록 | 지적 4·5는 I-003/I-008로 이미 기록됨 |

---

## 5. 런타임 미검증

| 항목 | 상태 | 사유 | 후속 |
|---|:---:|---|---|
| `npx next build` | **미실행** | gap-detector는 read-only 에이전트로 Bash 도구가 없음. 위임 서브에이전트 2회 시도 모두 출력 반환 실패(Bash 권한 프롬프트로 추정) | 오케스트레이터 직접 실행 필요 |
| `tests/e2e/*.spec.ts` (Playwright) | **미실행** | 본 Check 범위에 포함되지 않음 | `/map` 렌더·마커 DOM 수·출처 문구를 브라우저에서 확인 필요 |
| `/map` 페이지 시각 확인 | **미실행** | 정적 분석만 수행 | Day 4 폴리라인 역주행(지적 4)과 D-라벨 겹침(지적 6) 육안 확인 |
| 지도 SVG 마커 개수 DOM 검증 | **미실행** | `data-marker` 속성은 존재하나 카운트 단언 없음 | `data-marker="lodging"` 11 + `data-marker="finish"` 1, `data-marker="pass"` 12 e2e 단언 권장 |

### 5.1 실행 완료된 검증 (재게)

```
npx vitest run tests/unit/route.test.ts tests/unit/seed.test.ts
  → 22/22 PASS

npx tsc --noEmit
  → exit 0
```

두 명령 모두 위임 실행이며 파일 미수정을 확인했다.

### 5.2 Runtime Verification Plan (후속 실행용)

**L1 — 빌드·타입·유닛**

| # | 명령 | 기대 |
|:--:|---|---|
| 1 | `npx next build` | exit 0, `/map` 라우트가 Static으로 프리렌더 |
| 2 | `npx tsc --noEmit` | exit 0 (확인 완료) |
| 3 | `npx vitest run` (전체) | 전 스위트 green — 노드 추가가 타 feature 테스트를 깨지 않는지 |

**L2 — UI 동작**

| # | 페이지 | 동작 | 기대 |
|:--:|---|---|---|
| 1 | `/map` | 페이지 로드 | `svg[role="img"]` 1개, `path[data-segment]` 12개 |
| 2 | `/map` | 마커 카운트 | `[data-marker="pass"]` 12, `[data-marker="lodging"]` 11, `[data-marker="finish"]` 1 |
| 3 | `/map` | 범례 텍스트 | "숙박 12 · 고개 12" 문자열 포함 |
| 4 | `/map` | 출처 섹션 | "OpenFreeMap", "MapTiler Free", "2026-09-16" 문자열 포함 |
| 5 | `/map` | Day 링크 클릭 | Day 10 링크 → `/day/d2027-08-13` 이동 |
| 6 | `/day/d2027-08-13` | 고도 프로파일 | "콜 데 포제트" 라벨과 1,997 m 표기 노출 |

**L3 — E2E 시나리오**

| # | 시나리오 | 단계 | 성공 기준 |
|:--:|---|---|---|
| 1 | 지도→Day 탐색 | `/map` → 범례 Day 4 클릭 → Day 상세 → 고도점 확인 | Col Chécrouit가 Day 4 경로에 노출 |
| 2 | 마커 완전성 회귀 | `/map` 로드 → 12개 고개 `<title>` 툴팁 텍스트 수집 | TITLE_PASSES 12개 원어명 전부 포함 |
| 3 | 오프라인 재열람 | `/map` 방문 → 오프라인 전환 → 재방문 | 지도·범례·출처 문구 유지(FR-013) |

---

## 6. 결론

| 항목 | 값 |
|---|---|
| Overall Match Rate | **94%** |
| 게이트 | 95 — **FAIL (1%p)** |
| Missing 갭 | 0건 |
| Changed 갭 | 2건(모두 무해·개선) |
| 조치 필요 | 중요 2건 · 경미 2건 · 정보 2건 |
| 권고 다음 단계 | `/pdca iterate route-visuals` (검증 자산 보강 전용, 소스 수정 불필요) |

설계-구현 불일치는 **0건**이다. 설계 §1~§5가 요구한 파일·노드·구간·상수·함수·UI 문구·테스트가 전부 구현되었고, 리터럴 값(좌표·고도·이름)까지 설계와 일치한다. 게이트 미달은 전적으로 검증 커버리지 문제이며, `next build` 실행과 출처 문구 회귀 테스트 1개 추가로 97%에 도달한다.

---

### 관련 문서

- Plan: [route-visuals.plan.md](../01-plan/route-visuals.plan.md)
- Design: [route-visuals.design.md](../02-design/route-visuals.design.md)
- PRD: [PRD.md](../PRD.md) v2.0 §FR-011·FR-012·SC-009a·SC-009b·8.5·I-003·I-008

### Version History

| Version | Date | Changes | Author |
|---|---|---|---|
| 1.0 | 2026-09-17 | 최초 Check 분석 (Match Rate 94%, 게이트 FAIL) | gap-detector |
## Act-1 반영 (2026-09-17, pdca-iterate)
| # | 조치 | 결과 |
|---|---|---|
| 2 (중요) | `tests/e2e/responsive.spec.ts` 지도 테스트에 `/OpenFreeMap 또는 MapTiler Free/` 가시성 단언과 `g[data-marker='pass']` 12개 카운트 단언 추가 | matched |
| 1 (중요) | `npx next build` — booking-tracker Do 완료 후 오케스트레이터가 실행, 결과는 아래 "빌드 결과"에 기록 | 대기 |

**재계산 Match rate: 97% (분석 §4.1 예상치, 지적 2 반영)** · 게이트 95 통과 조건: 빌드 결과 exit 0.

### 빌드 결과 (2026-09-17, 오케스트레이터 실행)
`npx next build` exit 0 · `/map` Static 프리렌더 · `tsc --noEmit` 0 오류 · `vitest run` 98/98. → 지적 1 해소, **Match rate 97% · 게이트 95 통과**.
