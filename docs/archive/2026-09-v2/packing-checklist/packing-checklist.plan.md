# Plan — packing-checklist

> feature: packing-checklist · 순서 7/8 · 의존: responsive-pwa · 규모: 소
> 출처: `docs/PRD.md` S6, FR-015, SC-011, 8.8 준비물, 부록 A-4 ChecklistItem
> 작성일: 2026-09-16 · 상태: approved (L4 auto)

## 1. 목표
카테고리별 준비물을 체크하면 같은 기기의 localStorage에 보존되어 새로고침·재방문 후에도 유지된다(S6, FR-015).

## 2. 포함 요구사항
| FR | 요약 | 검증 |
|---|---|---|
| FR-015 | 체크 상태 localStorage 보존 | 체크 후 새로고침 유지 E2E |

SC-011: 체크 → 새로고침 → 같은 기기에서 유지.

## 3. 범위
### In
- seed `src/data/seed/packing.ts`: ChecklistItem(id, category, label, note?) — 카테고리: 서류·돈, 배낭·의류, 신발·스틱, 안전·위생, 산장 필수, 전자기기, 식량·물 (TMB 12일·산장 도미토리·현금 전용 산장 반영)
- `src/lib/packing-store.ts`: 저장 키 `tmb2027:packing:v1`, `{ version, checked: Record<id, true>, updatedAt }`, 안전 파싱(손상 시 초기화)
- `/packing` 페이지 + `PackingList`(client): 카테고리 섹션, 진행률(체크/전체), 체크박스 44px, “전체 해제” 버튼, 저장 시각 표시, 오프라인 동작(SW 캐시)
- Edge Case: 빈 첫 항목 안내(항목 0개 카테고리 없음 — seed 보장), 오류 시 로컬 임시 보관(localStorage 실패 → 메모리 상태 유지 + 안내)
### Out
- 서버 동기화·공유 체크리스트(P2 이후)

## 4. 결정
- 체크 상태는 기기 로컬 전용(PRD A-4). 계정 연동 없음.
- 항목 seed는 코드에 고정, 사용자 항목 추가는 범위 외

## 5. 성공 기준
1. unit: 저장/로드 round-trip, 손상 JSON 초기화, 버전 불일치 초기화, 진행률 계산
2. E2E: 항목 체크 → reload → 체크 유지, 진행률 갱신 (SC-011)
