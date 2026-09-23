# Report — packing-checklist (PRD v2.0 개정)

> feature: packing-checklist · 순서 8/9 · 완료일 2026-09-17 · 최종 match rate **99%** (64.5/65, 게이트 95 통과) · 반복 횟수 **0회**(Check 1회로 게이트 통과, Act 불필요)
> Plan `docs/01-plan/packing-checklist.plan.md` · Design `docs/02-design/packing-checklist.design.md` · Analysis `docs/03-analysis/packing-checklist.analysis.md`

## Executive Summary

| 관점 | 내용 (실제 결과) |
|---|---|
| Problem | v2.0이 준비물 초기 목록을 부록 E(7개 카테고리·34개 항목)로 확정했는데, 기존 seed는 8개 카테고리·46개 항목의 다른 체계라 PRD 정본과 화면이 어긋났다. |
| Solution | `PACKING_CATEGORIES`를 부록 E와 동일한 7개(docs·pack·clothes·gear·medical·tech·misc)로 재편하고 34개 항목을 부록 E 라벨 원문으로 맞췄다. 기존 세부 정보(현금 전용 산장, Day 12 하강 등)는 삭제하지 않고 `note`로 옮겼다. 테스트 파일에 `APPENDIX_E` 상수를 두어 PRD 정본과 seed를 직접 대조한다. UI와 로컬 저장 로직은 손대지 않았다. |
| Function UX Effect | `/packing`이 PRD 부록 E 표와 같은 카테고리 순서·항목 구성으로 보이며, 항목마다 note가 맥락을 덧붙인다. 체크 상태 로컬 보존·진행률·전체 해제 동작은 그대로다. |
| Core Value | 개인 준비 지원(P2). PRD 부록 E가 seed의 단일 정본이 되어 문서와 화면의 드리프트가 테스트로 막힌다. |

### 1.3 Value Delivered

| 관점 | 지표·근거 |
|---|---|
| 정본 일치 | 카테고리 **7/7**(id·label·order), 부록 E 항목 **34/34** 존재, 누락 0·오배치 0·id 중복 0 |
| 맥락 보존 | note 7건이 설계 §2 원문과 **문자열 단위 일치**(여권 유효기간, SBB 오프라인 저장, 현금 전용 산장 4곳, 카드 2장 분산, 라이너 산장 필수, 폴 Day 12 −1,490 m, 보조배터리 오프라인 캐시용) |
| 범위 준수 | Plan §3 "Out: UI 변경" 완전 준수 — `packing-store.ts`·`PackingList.tsx`·`page.tsx` **무변경** |
| 저장 호환성 | `PACKING_STORAGE_KEY = "tmb2027:packing:v1"` 유지 → 기존 저장값은 그대로 읽히고 제거된 id만 탈락 |
| 회귀 방어 | 설계 §3 요구 3종 + id 유일성 = 테스트 4종. 기존 store 케이스 4종(parseState·round-trip·toggle·progress) 유지 |
| E2E 호환 | `tests/e2e/packing.spec.ts`의 `input[data-item-id='docs-passport']` 셀렉터 잔존, 진행률 단언이 부분 일치라 46→34 변경에 무영향 |

## Context Anchor

| Key | Value |
|---|---|
| WHY | PRD 부록 E가 seed 정본 |
| WHO | 동행 |
| RISK | item id 변경 시 기존 localStorage 체크 상태 손실(출시 전이므로 허용, 가능하면 id 유지) |
| SUCCESS | 카테고리 7개 순서·라벨 일치, 부록 E 항목 전부 존재 |
| SCOPE | packing.ts seed + 테스트 |

## FR/SC

| ID | 상태 | 근거 |
|---|---|---|
| FR-015 (초기 목록) | ✅ 완료 | `src/data/seed/packing.ts` 카테고리 7 + 항목 34가 PRD 부록 E와 1:1 |
| FR-015 (체크 상태 로컬 보존) | ✅ 유지 | `src/lib/packing-store.ts` 무변경 — 저장 키·버전·`parseState` 미지 id 제거 구조 그대로 |
| SC-011 | ✅ 유지 | 로컬 저장 round-trip·toggle·진행률 테스트 4종 유지, 동작 불변 |
| S6 (개인 준비 시나리오) | ✅ 완료 | 카테고리별 `<section>` 렌더, 진행률 `data-testid="packing-progress"`, "전체 해제", hydration 전 `CardSkeleton`, 저장 실패 시 `StatusNote(warn)` |
| 8.8 (화면 구성) | ✅ 유지 | UI 무변경으로 이전 사이클 설계 그대로 |
| 부록 E | ✅ 완료 | 34항목 라벨 원문 일치, `APPENDIX_E` 상수로 테스트에서 직접 대조 |

## Success Criteria 최종 (Plan §5)

| # | 기준 | 판정 | 근거 |
|---|---|:--:|---|
| 1 | `PACKING_CATEGORIES` 라벨 순서 = 부록 E | ✅ | 서류·돈 / 배낭·침구 / 의류 / 장비 / 안전·의료 / 전자 / 기타, order 1~7 일치 |
| 2 | 부록 E 34개 항목이 전부 label로 존재 | ✅ | 항목 전수 대조표 34/34, 카테고리 배치도 1:1 |
| 3 | 기존 packing-store 테스트·E2E 통과 | ⏸ 미실행 | 정적 트레이싱상 unit 6/6·tsc 0오류·E2E 통과 예상. gap-detector가 read-only라 직접 실행 불가 |

**충족: 2/3** (3번은 런타임 미실행 — 구현 결함 아님)

## 산출물

- `src/data/seed/packing.ts` — `PACKING_CATEGORIES` 7개 재편, `packingItems` 34개(label 부록 E 원문 + note 7건), id 규칙 `{category}-{slug}`
- `tests/unit/packing-store.test.ts` — `APPENDIX_E` 상수 + 검사 3종(라벨·순서 / 항목 포함 / category 유효성) + id 유일성, 기존 store 케이스 4종 유지
- 무변경 확인: `src/lib/packing-store.ts`, `src/components/packing/PackingList.tsx`, `src/app/packing/page.tsx`, `tests/e2e/packing.spec.ts`

## Key Decisions & Outcomes (Plan §4)

| 결정 | 준수 | 결과 |
|---|:--:|---|
| 카테고리 id는 docs·pack·clothes·gear·medical·tech·misc, 라벨은 서류·돈 / 배낭·침구 / 의류 / 장비 / 안전·의료 / 전자 / 기타 | ✅ | 7/7 일치. order 1~7까지 부록 E 표 순서 그대로 |
| 부록 E 항목을 1:1 항목으로 두고, 기존 유용한 세부(현금 전용 산장 등)는 note로 이동 | ✅ | note 7건이 설계 §2 원문과 문자열 단위 일치. 정보 손실 없이 라벨만 정본화 |
| id 규칙 `{category}-{slug}`, 같은 의미 항목은 기존 id 유지 | ⚠️ 1건 예외 | `docs-passport`·`docs-insurance`·`docs-tickets`·`tech-phone`은 유지. **`docs-cash-eur`·`docs-cash-chf` 2건이 단일 "현금 EUR·CHF"로 병합되며 신규 id `docs-cash`가 부여**됨 → 해당 항목 1건의 기존 체크 상태 손실. Context Anchor RISK에 명시된 허용 범위 |
| (Plan §3) UI 변경 없음 | ✅ | 컴포넌트·페이지·store 3개 파일 모두 무변경 확인 |

## Check → Act 요약

| 단계 | 내용 |
|---|---|
| Check (gap-detector, 2026-09-17) | 대조 65항목 — matched 64 · partial 1 → **64.5/65 = 99%**. 게이트 95 **통과(정적 기준)** |
| 축별 결과 | 카테고리 7/7 · 항목 34/34 · note 7/7 · id 규칙 5.5/6 · 테스트 4/4 · store 테스트 4/4 · 저장 동작 1/1 · UI 무변경 1/1 · E2E 호환 1/1 |
| Act | **불필요** — Minor 1건뿐이고 Context Anchor RISK가 명시적으로 허용한 범위(id 변경 시 로컬 상태 손실). 분석서도 "반복 불필요"로 판정 |
| Minor #1 | `docs-cash` 신규 id. 보존하려면 `docs-cash-eur`로 되돌리면 되고 테스트는 label 기준이라 영향 없음 |
| 참고 #2 | 항목 46 → 34로 축소, 12건 제거(숙소 연락 출력물, 112 카드, 무릎 보호대, 게이터, 응급키트, 휴지, 빨랫감 주머니, 세탁, 행동식, 전해질, eSIM, 시계). Plan §4 "부록 E를 정본으로" 결정에 따른 **의도적 제거** |
| 참고 #3·#4 | note 문자열과 총 항목 수는 회귀 검증 범위 밖. 설계 방침과 일치하며 unit 테스트가 34항목 존재를 보장하므로 중복 방어 불필요 |

## 후속·미검증 항목

1. **런타임 미검증(최우선)** — `npx vitest run tests/unit/packing-store.test.ts`, `npx tsc --noEmit`, `npx playwright test tests/e2e/packing.spec.ts` 3건 모두 미실행이다(gap-detector는 Read/Glob/Grep만 보유). 정적 트레이싱으로는 unit **6/6 통과 예상**, 타입 오류 0 예상, E2E 통과 예상이다. 참고로 같은 날 route-visuals Act-1에서 오케스트레이터가 실행한 프로젝트 전체 `vitest run` **98/98**과 `next build` **exit 0**이 간접 근거가 되나, packing 케이스 단독 결과로 재확인해야 Plan §5-3이 확정된다.
2. **Minor 잔여 — `docs-cash` id** — 기존 `docs-cash-eur` 체크 상태 1건이 초기화된다. 출시 전이라 허용 범위지만, 보존을 원하면 `src/data/seed/packing.ts`의 `docs-cash` → `docs-cash-eur`로 변경한다(테스트는 label 기준이라 무영향).
3. **제거된 안전 항목 12건의 재도입 여부** — 이전 사이클의 TMB 특화 항목(응급키트, 112 카드, 게이터, 행동식, 전해질, eSIM 등)이 부록 E 정본화로 사라졌다. 되살리려면 코드가 아니라 `docs/PRD.md` 부록 E 자체를 개정해야 한다. 리더 판단 필요.
4. **note 회귀 방어(선택)** — `APPENDIX_E` 상수가 label만 다루므로 note가 누락돼도 unit 테스트는 통과한다. 강화하려면 note 존재 단언 1~2건(예: `docs-cash`의 note에 "Lac Blanc" 포함)을 추가한다.
5. **항목 수 회귀(선택)** — `tests/e2e/packing.spec.ts`가 총 항목 수를 하드코딩하지 않아 seed 대량 유실을 잡지 못한다. unit 테스트가 34항목 존재를 보장하므로 현 상태 유지 가능하다.
6. **Supabase 연결 후 할 일** — 준비물은 seed + localStorage만 사용하므로 Supabase 의존이 없다. 향후 체크 상태를 팀 공유로 옮기면 저장 키 마이그레이션(`tmb2027:packing:v1` → 서버)과 `PACKING_STORE_VERSION` 승격 계획이 필요하다.
7. **오프라인 동작 교차 확인** — 이 feature는 offline-pwa에 의존한다. `/packing`이 오프라인 캐시 대상에 포함되고 체크 상태가 오프라인에서도 저장되는지 QA 단계에서 함께 확인한다.
