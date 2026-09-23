# Design — packing-checklist (PRD v2.0 개정)

> feature: packing-checklist · Plan: `docs/01-plan/packing-checklist.plan.md` · 의존: offline-pwa
> 작성일: 2026-09-17 · 상태: approved (L4 auto)

## Context Anchor
| Key | Value |
|---|---|
| WHY | 부록 E가 seed 정본 |
| WHO | 동행 |
| RISK | id 변경 시 로컬 상태 손실(허용) |
| SUCCESS | 카테고리 7개·항목 전부 |
| SCOPE | packing.ts, 테스트 |

## 1. 파일
```
src/data/seed/packing.ts          카테고리·항목 재편
tests/unit/packing-store.test.ts  + seed 검사(APPENDIX_E 상수 대조)
```

## 2. seed
```ts
PACKING_CATEGORIES = [
  { id:"docs", label:"서류·돈", order:1 }, { id:"pack", label:"배낭·침구", order:2 }, { id:"clothes", label:"의류", order:3 },
  { id:"gear", label:"장비", order:4 }, { id:"medical", label:"안전·의료", order:5 }, { id:"tech", label:"전자", order:6 }, { id:"misc", label:"기타", order:7 } ];
packingItems (label은 부록 E 원문, note는 기존 세부):
docs: 여권 (note 유효기간 6개월 이상) · 항공권·SBB 예약 확인 (note 오프라인 저장) · 여행자보험 증서 · 현금 EUR·CHF (note 현금 전용 산장용: Lac Blanc·Bellachat·Bovine·La Peule) · 신용카드 (note 2장 분산 보관)
pack: 30~40L 배낭 · 레인커버 · 침낭 라이너 (note 산장 필수) · 귀마개 · 헤드램프
clothes: 하드셸 재킷·바지 · 경량 다운 · 트레킹 셔츠 2~3 · 트레킹 바지 2 · 양말 3~4 · 모자·장갑 · 산장용 샌들
gear: 트레킹 폴 (note Day 12 −1,490 m 하강) · 등산화(방수) · 선글라스 · 물병·하이드레이션 2L · 정수 알약
medical: 개인 상비약 · 물집 패드 · 자외선 차단제 · 응급 담요 · 호루라기
tech: 휴대폰·보조배터리 (note 오프라인 캐시용) · 유럽 어댑터 · 케이블
misc: 세면도구 소형 · 속건 타월 · 지퍼백 · 도시락 용기
```
id 규칙 `{category}-{slug}`; 기존 id와 같은 의미 항목은 기존 id 유지(docs-passport, docs-insurance, docs-tickets, docs-cash-*, tech-*, feet-poles→gear-poles 등은 새 id).

## 3. 테스트
`APPENDIX_E: Record<label, string[]>` 상수를 테스트 파일에 두고 (1) 카테고리 라벨·순서 일치 (2) 각 항목 문자열이 해당 카테고리 items의 label에 포함(`includes`) (3) 모든 item.category가 카테고리 id에 존재.
