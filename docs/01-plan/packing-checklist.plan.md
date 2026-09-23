# Plan — packing-checklist (PRD v2.0 개정)

> feature: packing-checklist · 순서 8/9 · 의존: offline-pwa · 규모: 소
> 출처: `docs/PRD.md` v2.0 FR-015 · SC-011 · S6 · 8.8 · 부록 E
> 이전 사이클: `docs/archive/2026-09-v2/packing-checklist/`
> 작성일: 2026-09-17 · 상태: approved (L4 auto)

## Executive Summary
| 관점 | 내용 |
|---|---|
| Problem | v2.0은 준비물 초기 목록을 부록 E(7개 카테고리·정해진 항목)로 확정했는데 현재 seed는 다른 카테고리 체계다. |
| Solution | 카테고리를 부록 E와 동일하게 재편하고 항목을 부록 E 기준으로 맞춘다(기존 세부 항목은 note로 보존). 로컬 저장 동작은 유지. |
| Function UX Effect | 준비물 화면이 PRD 부록 E 표와 같은 구성으로 보인다. |
| Core Value | 개인 준비 지원(P2). |

## Context Anchor
| Key | Value |
|---|---|
| WHY | PRD 부록 E가 seed 정본 |
| WHO | 동행 |
| RISK | item id 변경 시 기존 localStorage 체크 상태 손실(출시 전이므로 허용, 가능하면 id 유지) |
| SUCCESS | 카테고리 7개 순서·라벨 일치, 부록 E 항목 전부 존재 |
| SCOPE | packing.ts seed + 테스트 |

## 2. 요구사항
| ID | 요구 | 검증 |
|---|---|---|
| FR-015 | 체크 상태 로컬 보존(유지) + 초기 목록 부록 E | 단위·기존 E2E |

## 3. 범위
### In: `src/data/seed/packing.ts`, `tests/unit/packing-store.test.ts`(seed 검사 추가) · Out: UI 변경

## 4. 결정
- 카테고리 id: docs, pack, clothes, gear, medical, tech, misc — 라벨 서류·돈 / 배낭·침구 / 의류 / 장비 / 안전·의료 / 전자 / 기타.
- 부록 E 항목을 1:1 항목으로 두고, 기존 유용한 세부(현금 전용 산장 등)는 note로 이동.

## 5. 성공 기준
1. `PACKING_CATEGORIES` 라벨 순서 = 부록 E
2. 부록 E 각 항목(여권, 항공권·SBB 예약 확인, 여행자보험 증서, 현금 EUR·CHF, 신용카드, 30~40L 배낭, 레인커버, 침낭 라이너, 귀마개, 헤드램프, 하드셸 재킷·바지, 경량 다운, 트레킹 셔츠, 트레킹 바지, 양말, 모자·장갑, 산장용 샌들, 트레킹 폴, 등산화, 선글라스, 물병·하이드레이션, 정수 알약, 개인 상비약, 물집 패드, 자외선 차단제, 응급 담요, 호루라기, 휴대폰·보조배터리, 유럽 어댑터, 케이블, 세면도구, 속건 타월, 지퍼백, 도시락 용기)가 label로 존재
3. 기존 packing-store 테스트·E2E 통과
