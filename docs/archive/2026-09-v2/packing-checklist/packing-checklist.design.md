# Design — packing-checklist

> feature: packing-checklist · Plan: `docs/01-plan/packing-checklist.plan.md` · 의존: responsive-pwa
> 작성일: 2026-09-16 · 상태: approved (L4 auto)

## 1. 파일
```
src/data/seed/packing.ts                 PACKING_CATEGORIES(7), packingItems(≥ 40)
src/lib/packing-store.ts                 순수 함수(직렬화·파싱·진행률) + localStorage 어댑터
src/components/packing/PackingList.tsx   (client) 체크리스트 UI
src/app/packing/page.tsx, loading.tsx
tests/unit/packing-store.test.ts
tests/e2e/packing.spec.ts
```

## 2. 데이터 (A-4 ChecklistItem)
```ts
export type PackingCategory = { id: string; label: string; order: number };
export type PackingItem = { id: string; category: string; label: string; note?: string };   // checked 는 store에서
export const PACKING_CATEGORIES: PackingCategory[]  // docs(서류·돈), pack(배낭·의류), feet(신발·스틱), safety(안전·위생), hut(산장 필수), tech(전자기기), food(식량·물)
export const packingItems: PackingItem[]
```
id 규칙 `category-slug`. 중복 없음(unit test). TMB 특화 항목: 여권·유럽 여행자보험 증서, EUR/CHF 현금(현금 전용 산장), 산장용 실내화·침낭 라이너(도미토리), 귀마개, 스틱, 무릎 보호대, 우의·방수 커버, 헤드램프, 보조배터리, 현지 eSIM, 물 1.5L 이상, 행동식, 112 카드·숙박 연락 출력물.

## 3. `src/lib/packing-store.ts`
```ts
export const PACKING_STORAGE_KEY = "tmb2027:packing:v1";
export const PACKING_STORE_VERSION = 1;
export type PackingState = { version: 1; checked: Record<string, true>; updatedAt: string | null };
export function emptyState(): PackingState
export function parseState(raw: string | null, validIds: Set<string>): PackingState   // JSON 오류·version 불일치 → emptyState; 미지 id 제거
export function serializeState(state: PackingState): string
export function toggle(state, id, now: string): PackingState                          // 불변 갱신, updatedAt=now
export function clearAll(now): PackingState
export function progress(state, items): { done: number; total: number; percent: number }
export function loadState(validIds): { state: PackingState; storageOk: boolean }      // window.localStorage 접근, 실패 시 { emptyState, false }
export function saveState(state): boolean                                              // 실패 false (QuotaExceeded 등)
```

## 4. `PackingList` (client)
- props `{ categories, items }`
- 상태: `state`(PackingState), `storageOk`(boolean), `hydrated`(boolean)
- 마운트 시 `useEffect`로 `loadState` (브라우저 저장소 접근 — 데이터 fetching 아님) → hydrated=true. hydration 전에는 `CardSkeleton` 반환(체크 상태 오표시 방지); hydration 후 체크박스 활성
- 변경 시 `toggle` → `saveState`; 실패하면 `storageOk=false` + StatusNote(warn) “저장소에 기록할 수 없어 이 화면에서만 임시 보관됩니다”
- 헤더: 진행률 `done/total (percent%)` + `<progress>` 요소 + “전체 해제” 버튼(confirm 없음, 44px) + 저장 시각(`done > 0`이면 `formatKoDateTime(updatedAt)`, 아니면 “아직 체크한 항목이 없습니다 — 첫 항목을 체크해 보세요”)
- 카테고리별 `<section aria-labelledby>` + `<ul>`; 항목은 `<label className="tap flex …"><input type="checkbox" className="h-6 w-6"> label <small>note</small></label>` (전체 라벨 클릭 영역 ≥ 44px)
- 체크된 항목은 취소선 + rock색

## 5. `/packing` 페이지 (정적)
- h1 “준비물”, 부제 “체크 상태는 이 기기에만 저장됩니다”
- `<PackingList categories={PACKING_CATEGORIES} items={packingItems} />`
- `loading.tsx`: skeleton

## 6. 테스트
### unit `tests/unit/packing-store.test.ts`
- seed: 카테고리 7, 항목 ≥ 40, id 중복 없음, 모든 category가 PACKING_CATEGORIES에 존재
- parseState: null → empty; 손상 JSON → empty; version 2 → empty; 미지 id 제거; 정상 round-trip(serialize→parse)
- toggle 두 번 → 원상복구, updatedAt 갱신; clearAll → checked {}
- progress: 0/N → 0%, 전체 체크 → 100%, 반올림
### e2e `tests/e2e/packing.spec.ts`
- `/packing` 첫 체크박스 체크 → 진행률 “1/N” → `page.reload()` → 여전히 checked, 진행률 유지 (SC-011)
- “전체 해제” → 0/N, reload 후 0/N

## 7. Edge Case
| 상황 | 구현 |
|---|---|
| 빈 첫 항목 안내 | 체크 0개일 때 “첫 항목을 체크해 보세요” 문구 |
| 오류 로컬 임시 보관 | saveState 실패 → 메모리 상태 유지 + StatusNote |
| 오프라인 | 정적 페이지 + SW 캐시(responsive-pwa) |
