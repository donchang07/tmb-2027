# Analysis — packing-checklist (PRD v2.0 개정)

> feature: packing-checklist · Check 단계 · gap-detector 실행 2026-09-17
> Design: `docs/02-design/packing-checklist.design.md` · Plan: `docs/01-plan/packing-checklist.plan.md` · 정본: `docs/PRD.md` 부록 E · 게이트 95

## 결과

| 항목 | 값 |
|---|---|
| Match rate (정적) | **99%** (64.5 / 65 = 64 matched + 1 partial × 0.5) |
| 게이트 | 통과 (정적 기준, 95 이상) |
| 반복 | 불필요 (Minor 1건, Context Anchor RISK 허용 범위) |
| 런타임 | **미실행** — 아래 "런타임 미검증" 참조 |
| 대상 파일 | `src/data/seed/packing.ts`, `tests/unit/packing-store.test.ts` (Design §1 범위와 일치) |
| 무변경 확인 | `src/lib/packing-store.ts`, `src/components/packing/PackingList.tsx`, `src/app/packing/page.tsx` |

### 점수 분해

| 축 | 항목 수 | 일치 | 비고 |
|---|---:|---:|---|
| 카테고리 (id·label·order) | 7 | 7 | 부록 E 표 순서 일치 |
| 부록 E 항목 존재·배치 | 34 | 34 | 누락 0, 오배치 0 |
| Design §2 note 원문 | 7 | 7 | 문자열 완전 일치 |
| id 규칙·기존 id 유지 | 6 | 5.5 | `docs-cash-*` 1건 partial |
| 테스트 (Design §3 3종 + id 유일성) | 4 | 4 | `APPENDIX_E` 상수 포함 |
| 기존 store 테스트 유지 | 4 | 4 | parseState/round-trip/toggle/progress |
| 로컬 저장 동작 불변 | 1 | 1 | store 파일 무변경 |
| UI 무변경 (Out of scope 준수) | 1 | 1 | PackingList·page 무변경 |
| E2E 셀렉터 호환 | 1 | 1 | `docs-passport` 잔존 |
| **합계** | **65** | **64.5** | **99%** |

## 검증 근거

- `src/data/seed/packing.ts` 전문 대조: `PACKING_CATEGORIES` 7개(id `docs`/`pack`/`clothes`/`gear`/`medical`/`tech`/`misc`, label 서류·돈 / 배낭·침구 / 의류 / 장비 / 안전·의료 / 전자 / 기타, order 1~7)가 Design §2, Plan §4, PRD 부록 E 표 순서와 모두 일치.
- `packingItems` 34개 = 부록 E 항목 수(5+5+7+5+5+3+4 = 34)와 일치. 각 항목의 `category` 배치도 부록 E 표와 1:1 일치.
- note 7건(여권 "유효기간 6개월 이상" / 항공권·SBB "오프라인 저장" / 현금 "현금 전용 산장용: Lac Blanc·Bellachat·Bovine·La Peule" / 신용카드 "2장 분산 보관" / 침낭 라이너 "산장 필수" / 트레킹 폴 "Day 12 −1,490 m 하강" / 휴대폰·보조배터리 "오프라인 캐시용")이 Design §2 원문과 문자열 단위로 일치.
- `tests/unit/packing-store.test.ts`에 Design §3이 요구한 `APPENDIX_E: Record<string, string[]>` 상수가 존재하고, 검사 3종이 모두 구현됨: (1) `PACKING_CATEGORIES.map(c => c.label)` `toEqual` `Object.keys(APPENDIX_E)` + order `[1..7]`, (2) 카테고리별 항목 문자열 `labels.some(l => l.includes(entry))`, (3) 모든 `item.category`가 `PACKING_CATEGORIES` id 집합에 존재. 여기에 id 유일성(`ids.size === packingItems.length`)까지 추가.
- 기존 store 케이스 4종 유지: parseState(null / 손상 JSON / version 2 → emptyState), 미지 id 제거 + serialize→parse round-trip, toggle 2회 원상복구 + clearAll, progress 0%/100%/반올림.
- `src/lib/packing-store.ts` 무변경 확인: `PACKING_STORAGE_KEY = "tmb2027:packing:v1"`, `PACKING_STORE_VERSION = 1`, `parseState`가 `validIds`에 없는 id를 제거하는 구조 그대로 → FR-015·SC-011의 로컬 저장 동작 불변. 저장 키가 동일하므로 기존 기기의 저장값은 그대로 읽히되 제거된 id만 탈락한다.
- `src/components/packing/PackingList.tsx`, `src/app/packing/page.tsx` 무변경: `PackingList`는 `categories`/`items` props를 받아 `cat.order` 정렬 후 카테고리별 `<section>` 렌더, 진행률 `data-testid="packing-progress"`, "전체 해제" 버튼, hydration 전 `CardSkeleton`, `saveState` 실패 시 `StatusNote(warn)` — 전부 이전 사이클 설계 그대로. Plan §3 "Out: UI 변경" 준수.
- `tests/e2e/packing.spec.ts`가 참조하는 `input[data-item-id='docs-passport']`가 신규 seed에 잔존하고, 진행률 단언이 `toContainText("1/")` / `toContainText("0/")` 부분 일치라 총 항목 수 46→34 변경의 영향을 받지 않음.
- `vitest.config.mts` 확인: `include: ["tests/unit/**/*.test.ts"]`, `environment: "node"`, alias `@ → src` — 테스트 파일의 `@/data/seed/packing` / `@/lib/packing-store` import 해석 가능.
- 구(舊) seed의 id 목록은 `.next` 빌드 산출물에서 역추출해 대조(46개): `docs-passport`, `docs-insurance`, `docs-tickets`, `docs-lodging-list`, `docs-cash-eur`, `docs-cash-chf`, `docs-cards`, `docs-emergency-card`, `pack-backpack`, `pack-daypack-liner`, `pack-base`, `pack-pants`, `pack-fleece`, `pack-down`, `pack-rain`, `pack-hat`, `pack-gloves`, `pack-socks`, `pack-underwear`, `pack-town`, `feet-boots`, `feet-sandals`, `feet-poles`, `feet-knee`, `feet-gaiters`, `safety-firstaid`, `safety-meds`, `safety-sunscreen`, `safety-sunglasses`, `safety-whistle`, `safety-toiletries`, `safety-tp`, `hut-liner`, `hut-earplugs`, `hut-headlamp`, `hut-bag`, `hut-laundry`, `food-water`, `food-snacks`, `food-electrolyte`, `food-lunch-plan`, `tech-phone`, `tech-battery`, `tech-charger`, `tech-esim`, `tech-watch`.

## 항목별 대조

### 카테고리

| order | 부록 E 카테고리 | seed label | seed id | 판정 |
|---:|---|---|---|:---:|
| 1 | 서류·돈 | 서류·돈 | `docs` | ✅ |
| 2 | 배낭·침구 | 배낭·침구 | `pack` | ✅ |
| 3 | 의류 | 의류 | `clothes` | ✅ |
| 4 | 장비 | 장비 | `gear` | ✅ |
| 5 | 안전·의료 | 안전·의료 | `medical` | ✅ |
| 6 | 전자 | 전자 | `tech` | ✅ |
| 7 | 기타 | 기타 | `misc` | ✅ |

7/7 일치. Design §2 id 목록·Plan §4 결정과도 일치.

### 항목 (부록 E 34건)

| # | 카테고리 | 부록 E 항목 | seed label | seed note | seed id | 구 id | 판정 |
|---:|---|---|---|---|---|---|:---:|
| 1 | 서류·돈 | 여권 | 여권 | 유효기간 6개월 이상 | `docs-passport` | `docs-passport` (유지) | ✅ |
| 2 | 서류·돈 | 항공권·SBB 예약 확인 | 항공권·SBB 예약 확인 | 오프라인 저장 | `docs-tickets` | `docs-tickets` (유지) | ✅ |
| 3 | 서류·돈 | 여행자보험 증서 | 여행자보험 증서 | — | `docs-insurance` | `docs-insurance` (유지) | ✅ |
| 4 | 서류·돈 | 현금 EUR·CHF(현금 전용 산장용) | 현금 EUR·CHF | 현금 전용 산장용: Lac Blanc·Bellachat·Bovine·La Peule | `docs-cash` | `docs-cash-eur`·`docs-cash-chf` (병합, **신규 id**) | ⚠️ |
| 5 | 서류·돈 | 신용카드 | 신용카드 | 2장 분산 보관 | `docs-cards` | `docs-cards` (유지) | ✅ |
| 6 | 배낭·침구 | 30~40L 배낭 | 30~40L 배낭 | — | `pack-backpack` | `pack-backpack` (유지) | ✅ |
| 7 | 배낭·침구 | 레인커버 | 레인커버 | — | `pack-raincover` | `pack-rain` (의미 부분 일치, 신규) | ✅ |
| 8 | 배낭·침구 | 침낭 라이너(산장 필수) | 침낭 라이너 | 산장 필수 | `pack-liner` | `hut-liner` (카테고리 변경 → 규칙상 신규) | ✅ |
| 9 | 배낭·침구 | 귀마개 | 귀마개 | — | `pack-earplugs` | `hut-earplugs` (카테고리 변경) | ✅ |
| 10 | 배낭·침구 | 헤드램프 | 헤드램프 | — | `pack-headlamp` | `hut-headlamp` (카테고리 변경) | ✅ |
| 11 | 의류 | 하드셸 재킷·바지 | 하드셸 재킷·바지 | — | `clothes-hardshell` | `pack-rain` 계열 | ✅ |
| 12 | 의류 | 경량 다운 | 경량 다운 | — | `clothes-down` | `pack-down` (카테고리 변경) | ✅ |
| 13 | 의류 | 트레킹 셔츠 2~3 | 트레킹 셔츠 2~3 | — | `clothes-shirts` | `pack-base` | ✅ |
| 14 | 의류 | 트레킹 바지 2 | 트레킹 바지 2 | — | `clothes-pants` | `pack-pants` (카테고리 변경) | ✅ |
| 15 | 의류 | 양말 3~4 | 양말 3~4 | — | `clothes-socks` | `pack-socks` (카테고리 변경) | ✅ |
| 16 | 의류 | 모자·장갑 | 모자·장갑 | — | `clothes-hat-gloves` | `pack-hat`·`pack-gloves` (병합) | ✅ |
| 17 | 의류 | 산장용 샌들 | 산장용 샌들 | — | `clothes-sandals` | `feet-sandals` (카테고리 변경) | ✅ |
| 18 | 장비 | 트레킹 폴 | 트레킹 폴 | Day 12 −1,490 m 하강 | `gear-poles` | `feet-poles` (Design §2에 신규 id 명시) | ✅ |
| 19 | 장비 | 등산화(방수) | 등산화(방수) | — | `gear-boots` | `feet-boots` (카테고리 변경) | ✅ |
| 20 | 장비 | 선글라스 | 선글라스 | — | `gear-sunglasses` | `safety-sunglasses` (카테고리 변경) | ✅ |
| 21 | 장비 | 물병·하이드레이션 2L | 물병·하이드레이션 2L | — | `gear-water` | `food-water` (카테고리 변경) | ✅ |
| 22 | 장비 | 정수 알약 | 정수 알약 | — | `gear-purifier` | 없음 (신규 항목) | ✅ |
| 23 | 안전·의료 | 개인 상비약 | 개인 상비약 | — | `medical-meds` | `safety-meds` (카테고리 변경) | ✅ |
| 24 | 안전·의료 | 물집 패드 | 물집 패드 | — | `medical-blister` | 없음 (신규 항목) | ✅ |
| 25 | 안전·의료 | 자외선 차단제 | 자외선 차단제 | — | `medical-sunscreen` | `safety-sunscreen` (카테고리 변경) | ✅ |
| 26 | 안전·의료 | 응급 담요 | 응급 담요 | — | `medical-blanket` | 없음 (신규 항목) | ✅ |
| 27 | 안전·의료 | 호루라기 | 호루라기 | — | `medical-whistle` | `safety-whistle` (카테고리 변경) | ✅ |
| 28 | 전자 | 휴대폰·보조배터리(오프라인 캐시용) | 휴대폰·보조배터리 | 오프라인 캐시용 | `tech-phone` | `tech-phone`+`tech-battery` (병합, **id 유지**) | ✅ |
| 29 | 전자 | 유럽 어댑터 | 유럽 어댑터 | — | `tech-adapter` | `tech-charger` (의미 부분 일치, 신규) | ✅ |
| 30 | 전자 | 케이블 | 케이블 | — | `tech-cable` | 없음 (신규) | ✅ |
| 31 | 기타 | 세면도구 소형 | 세면도구 소형 | — | `misc-toiletries` | `safety-toiletries` (카테고리 변경) | ✅ |
| 32 | 기타 | 속건 타월 | 속건 타월 | — | `misc-towel` | 없음 (신규) | ✅ |
| 33 | 기타 | 지퍼백 | 지퍼백 | — | `misc-ziplock` | 없음 (신규) | ✅ |
| 34 | 기타 | 도시락 용기 | 도시락 용기 | — | `misc-lunchbox` | `food-lunch-plan` (의미 부분 일치, 신규) | ✅ |

- 부록 E 34항목 **34/34 존재**, 라벨 원문 일치, 카테고리 오배치 0건, id 중복 0건, id 규칙 `{category}-{slug}` 전건 준수.
- Design §2가 "기존 id 유지" 대상으로 명시한 5그룹 판정: `docs-passport` ✅ / `docs-insurance` ✅ / `docs-tickets` ✅ / `docs-cash-*` ⚠️(신규 `docs-cash`) / `tech-*` ✅(`tech-phone` 유지).

### Plan §5 성공 기준

| # | 기준 | 판정 | 근거 |
|---:|---|:---:|---|
| 1 | `PACKING_CATEGORIES` 라벨 순서 = 부록 E | ✅ | 위 카테고리 표 7/7 |
| 2 | 부록 E 각 항목이 label로 존재 | ✅ | 위 항목 표 34/34 |
| 3 | 기존 packing-store 테스트·E2E 통과 | ⏸ | 런타임 미실행 — 정적 트레이싱상 통과 예상 |

## 지적과 조치 필요

| # | 심각도 | 지적 | 근거 위치 | 조치 |
|---:|---|---|---|---|
| 1 | Minor | Design §2 id 규칙의 "기존 id와 같은 의미 항목은 기존 id 유지" 목록 중 `docs-cash-*` 미준수. 구 seed의 `docs-cash-eur`·`docs-cash-chf` 2건이 부록 E 단일 항목 "현금 EUR·CHF"로 병합되면서 신규 id `docs-cash`가 부여됨 → 해당 항목에 대한 기존 localStorage 체크 상태 1건 손실. | `src/data/seed/packing.ts:18` vs Design §2 마지막 줄 | 출시 전이고 Context Anchor RISK("id 변경 시 로컬 상태 손실(허용)")에 명시된 범위이므로 **조치 불필요**. id를 보존하려면 `docs-cash` → `docs-cash-eur`로 변경하면 되고, 테스트는 label 기준이라 영향 없음. |
| 2 | 참고 | 항목 수 46 → 34로 축소. 제거 12건: `docs-lodging-list`(숙소 연락 출력물), `docs-emergency-card`(112 카드), `feet-knee`(무릎 보호대), `feet-gaiters`(게이터), `safety-firstaid`(응급키트), `safety-tp`, `hut-bag`, `hut-laundry`, `food-snacks`(행동식), `food-electrolyte`, `tech-esim`, `tech-watch`. 이전 사이클의 TMB 특화 안전 항목이 일부 사라짐. | 구 `.next` 빌드 산출물 대비 | Plan §4 "부록 E를 정본으로" 결정에 따른 **의도적 제거**. 안전 항목을 되살리려면 코드가 아니라 `docs/PRD.md` 부록 E 자체를 개정해야 한다. 현 사이클 범위 밖. |
| 3 | 참고 | 테스트의 `APPENDIX_E` 상수가 PRD 원문의 괄호 주석(현금 전용 산장용 / 산장 필수 / 오프라인 캐시용)을 label에서 제외하고 있어, note 문자열이 회귀 검증 범위 밖에 있다. note가 누락돼도 unit 테스트는 통과한다. | `tests/unit/packing-store.test.ts:9,10,14` | Design §2 "label은 부록 E 원문, note는 기존 세부" 방침과 일치하므로 **정상**. 강화하려면 note 존재 단언(예: `docs-cash`의 note에 "Lac Blanc" 포함)을 1~2건 추가. |
| 4 | 참고 | `tests/e2e/packing.spec.ts`는 총 항목 수를 하드코딩하지 않아(`"1/"`, `"0/"` 부분 일치) 46→34 변경에 영향받지 않으나, 반대로 항목 수 회귀(예: seed 절반 유실)를 잡지 못한다. | `tests/e2e/packing.spec.ts:9,15,18` | 현 상태 유지 가능. unit 테스트가 34항목 존재를 보장하므로 중복 방어는 불필요. |

## 런타임 미검증

gap-detector는 읽기 전용 에이전트(Read/Glob/Grep)로 셸 실행 권한이 없어 지시된 명령을 **실행하지 못했다**. 아래 판정은 전부 정적 트레이싱 기반이며, 게이트 최종 확정 전에 상위 오케스트레이터가 직접 실행해야 한다.

| 명령 | 상태 | 정적 근거 / 예상 |
|---|:---:|---|
| `npx vitest run tests/unit/packing-store.test.ts` | 미실행 | `vitest.config.mts`에 `include: ["tests/unit/**/*.test.ts"]`와 alias `@ → src`가 있어 import 해석 가능. 6개 케이스를 수동 트레이싱: ① 카테고리 label 배열이 `Object.keys(APPENDIX_E)`와 일치(모두 비정수 문자열 키라 삽입 순서 보존 → 서류·돈/배낭·침구/의류/장비/안전·의료/전자/기타), order `[1,2,3,4,5,6,7]` 일치 → 통과. ② 34항목 전부 `includes` 참 → 통과. ③ id 34개 유일, `item.category` 전부 유효 → 통과. ④~⑥ parseState/toggle/clearAll/progress는 `packing-store.ts` 무변경이고 `docs-passport` id가 살아 있어 → 통과. **6/6 통과 예상.** |
| `npx tsc --noEmit` | 미실행 | `PackingCategory = {id,label,order}` / `PackingItem = {id,category,label,note?}` 타입 정의와 34개 리터럴이 모두 부합(note는 선택 필드). export 시그니처·소비 측(`packing-store.ts`, `PackingList.tsx`, `page.tsx`) 무변경 → **타입 오류 0 예상.** |
| `npx playwright test tests/e2e/packing.spec.ts` | 미실행 (지시 범위 밖) | 셀렉터 `input[data-item-id='docs-passport']` 잔존, 진행률 단언이 부분 일치라 총 개수 변화 무영향, "전체 해제" 버튼 텍스트 무변경 → **통과 예상.** |

**확정 조건:** 위 3건(최소 vitest·tsc 2건) 실행 후 전부 통과하면 Match rate 99% · 게이트 95 통과가 확정된다. 실패 시 본 문서의 "결과" 표와 "지적과 조치 필요" 표를 갱신해야 한다.

## Act-1 반영 (2026-09-18, 카테고리명)
PRD 부록 E·`packing.ts`·`packing-store.test.ts`의 "배낭·침구"를 **"배낭·산장 취침용품"**으로 변경(침낭 라이너·귀마개·헤드램프의 용도를 명확히). 항목·id 불변.
