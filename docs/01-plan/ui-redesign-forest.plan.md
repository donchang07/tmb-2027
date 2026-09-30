# ui-redesign-forest Planning Document

> **Summary**: Claude Design 핸드오프(4a 숲길)를 기준으로 SCR-001~018 전 화면의 시각 스타일·레이아웃·인터랙션을 다시 만든다. 기능·데이터·라우트는 바꾸지 않는다.
>
> **Project**: tmb-2027
> **Version**: 0.1.0 (PRD v4.0 + UI 델타)
> **Author**: 장동인(작성자) · Claude(PDCA)
> **Date**: 2026-09-30
> **Status**: Approved (작성자 one-shot 지시, 질문 없이 추천안 선택)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 현재 UI는 알파인 블루 그라디언트와 768px 폭 카드 나열이라 데스크톱에서 비어 보이고, 사진·위계가 없어 화면마다 같은 모양이 반복된다. |
| **Solution** | 핸드오프의 숲 초록·본·앰버 토큰, Pretendard 단일 서체, 12px 단일 반경, 사진 중심 레이아웃을 `globals.css` 토큰과 공통 클래스로 옮기고 18개 화면을 web 1200px·mobile 390px 목업에 맞춘다. |
| **Function/UX Effect** | 홈은 좌우 분할 히어로와 다크 "오늘" 카드, 일정은 사진 카드, Day 상세는 전면 사진 헤더와 2단 구성이 된다. 누름·호버·등장 모션과 safe area, 16px 입력이 들어간다. |
| **Core Value** | 산행 중 한 손으로 읽히는 굵은 숫자와 명확한 위계를 유지하면서, 기존 FR·SC·테스트 회귀 없이 제품 완성도를 올린다. |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 디자인 핸드오프가 확정됐다. 기존 화면은 기능은 완성됐지만 시각 품질이 MVP 수준이다. |
| **WHO** | 리더 1명, 팀원 9명, 계정 사용자, 비로그인 방문자. 산행 중 모바일 사용이 기본이고 준비 기간에는 데스크톱을 쓴다. |
| **RISK** | ① 스타일 변경으로 기존 E2E(44px 터치 영역, 가로 스크롤, axe 대비) 회귀 ② 요소 계약(문구·aria·testid) 훼손 ③ 임시 사진이 제3자 서버 직접 연결(허가 없음) ④ 외부 서체 CDN이 오프라인에서 빠짐 ⑤ 라우트 ○/ƒ 변화 |
| **SUCCESS** | 18개 화면이 핸드오프 토큰·레이아웃과 일치(match rate 95 이상), `tsc`·`vitest`·Playwright 기존 건 전부 통과, 라우트 ○/ƒ 변경 0건, 옛 토큰 잔존 0건 |
| **SCOPE** | module-0 공통(토큰·헤더·탭·배너·UI 기본) → module-1 SCR-001~004 → module-2 SCR-005·006·009·010·011 → module-3 SCR-007·008·012~018 → module-4 회귀 검증 |

---

## 1. Overview

### 1.1 Purpose

`TMB 트래킹 UI 목업 3가지 제안.zip`의 핸드오프(4a 숲길)를 실제 코드에 반영한다. 범위는 스타일·레이아웃 델타다.

### 1.2 Background

PRD v4.0은 "기존 UI 전면 재설계"를 비범위로 뒀다(10장). 이후 작성자가 Claude Design으로 전 화면 목업을 만들었고 2026-09-30에 전체 화면 재구현을 지시했다. 핸드오프 문서는 PRD 9장 시각 시스템을 새 토큰으로 대체한다고 적는다.

### 1.3 Related Documents

- 핸드오프: `docs/02-design/ui-redesign-forest-handoff/handoff.md`, `design/*.dc.html`, `screenshots/`
- PRD: `docs/PRD.md` 5장(화면 계약), 9장(브랜드), 17.3(회귀)
- 스킬: `.claude/skills/taste-skill`, `emil-design-eng`, `mobile-native`

---

## 2. Scope

### 2.1 In Scope

- [x] 디자인 토큰·공통 클래스(`globals.css`), Pretendard 서체, 뷰포트·테마색
- [x] 공통 헤더(SCR-018), 하단 탭(현재 탭 표시), 오프라인 배너, 계정 메뉴
- [x] SCR-001~016 화면 레이아웃·스타일, SCR-017 실패 도착 화면
- [x] 임시 사진 매핑 파일 1개(`src/lib/photos.ts`)
- [x] PRD 9장·14장 갱신

### 2.2 Out of Scope

- FR·SC·DATA·RLS·라우트·서버 액션·인증 로직 변경
- 팀 소유 사진 확보(작성자가 나중에 교체)
- 새 npm 의존성, 아이콘 세트 도입
- 실제 기기 확인(탭 하이라이트, safe area, 입력 확대, 스냅 스크롤)은 작성자 확인 항목으로 남김

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| UR-01 | 색·서체·반경·간격·그림자 토큰을 핸드오프 값으로 교체하고 옛 토큰(alpine·snow·rock·safety·ink)을 제거한다 | High | Pending |
| UR-02 | 공통 헤더(web 68px·mobile 56px), 하단 탭(5칸, 현재 탭 앰버 막대·`aria-current`), 오프라인 배너를 목업대로 만든다 | High | Pending |
| UR-03 | SCR-001~004를 Screens 1 목업 레이아웃으로 만든다 | High | Pending |
| UR-04 | SCR-005·006·009·010·011을 Screens 2 목업 레이아웃으로 만든다 | High | Pending |
| UR-05 | SCR-007·008·012~018을 Screens 3 목업 레이아웃으로 만든다 | High | Pending |
| UR-06 | 누름·호버·등장·드롭다운 모션과 모션 줄이기 대응을 넣는다 | Medium | Pending |
| UR-07 | 모바일 기본기: safe area, 16px 입력, 탭 하이라이트 제거, `viewport-fit=cover`, hover 게이팅 | Medium | Pending |
| UR-08 | 사진은 목업의 임시 URL을 한 파일에서 관리하고, 로딩 전 배경은 `#4E6B55`다 | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| 회귀 | 기존 단위·E2E 테스트 전부 통과 | `npm test`, `npx playwright test --workers=1` |
| 접근성 | axe critical·serious 0건, 터치 영역 44px 이상 | `responsive.spec.ts` |
| 반응형 | 360·768·1440px 가로 스크롤 없음 | `responsive.spec.ts` |
| 라우트 | 빌드 라우트 표 ○/ƒ 변경 0건 | `next build` 출력 비교 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] SC-U1: 옛 토큰 클래스·색상값 잔존 0건(grep)
- [ ] SC-U2: 18개 화면이 설계서 5.4 체크리스트를 충족(match rate 95 이상)
- [ ] SC-U3: `tsc --noEmit` 오류 0건, `vitest` 전부 통과
- [ ] SC-U4: Playwright 3개 뷰포트 전부 통과(자격 없는 건의 기존 skip은 유지)
- [ ] SC-U5: 빌드 라우트 ○/ƒ 변경 0건
- [ ] SC-U6: 문구·요소 ID·aria·testid 변경은 핸드오프가 허용한 제목 2건과 목업의 홈 버튼 문구("오늘 구간 보기", "Day 상세", PRD SCR-001-EL-16 등록)뿐

### 4.2 Quality Criteria

- [ ] 액센트 1개(앰버), 반경 체계 1개(12px), 테마 1개(라이트)
- [ ] 새 의존성 0건, `any` 0건

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 터치 영역·대비 회귀 | High | Medium | `.btn`·`.tap` 44px 최소값을 공통 클래스에 넣고 E2E로 확인 |
| 요소 계약 훼손 | High | Medium | 에이전트 지침에 문구·aria·testid 불변 명시, E2E 전체 실행 |
| 임시 사진 허가 없음 | Medium | High | 작성자 지시로 임시 사용. `photos.ts` 한 곳에 모아 교체를 쉽게 하고 보고서에 남김 |
| 서체 CDN 오프라인 | Low | Medium | 시스템 sans-serif로 자연 대체되도록 폰트 스택 구성 |
| 등장 애니메이션 중 axe 대비 오탐 | Low | Low | 발생 시 해당 요소의 등장 효과 제거 |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| `src/app/globals.css` | 스타일 | 토큰·공통 클래스 전면 교체 |
| `src/app/layout.tsx` | 레이아웃 | 서체 링크, 본문 폭 1200px, 헤더·배너 묶음 |
| `src/components/**` | 컴포넌트 | 스타일·마크업 |
| `src/lib/photos.ts`, `src/components/ui/Photo.tsx` | 신규 | 임시 사진 매핑과 사진 칸 |

### 6.2 Current Consumers

| Resource | Operation | Code Path | Impact |
|----------|-----------|-----------|--------|
| `.card`·`.tap` | 클래스 | 전 화면 | 테두리·그림자 제거, 반경 12px |
| `Badge` tone | props | DayCard·LegTimeline·Day/기록 페이지 | `alpine`·`safety` 제거, 새 tone으로 교체 |
| `StatusNote` | 컴포넌트 | 전 화면 | 색만 변경, role 유지 |
| `BottomNav` | 컴포넌트 | layout | 클라이언트 컴포넌트로 전환(`usePathname`), 라우트 정적성 영향 없음 |

### 6.3 Verification

- [ ] 빌드 라우트 표 비교
- [ ] E2E 전체

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

Dynamic(기존 유지).

### 7.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| 스타일 전달 | 인라인 style / Tailwind 유틸만 / 토큰 + 소수 공통 클래스 | 토큰 + 공통 클래스 | 버튼·배지·모션 값이 화면마다 반복되므로 한 곳에 둔다 |
| 사진 | 미사용(단색) / 목업 URL 직접 연결 / 저장소에 복사 | 목업 URL 직접 연결 | 작성자 지시(2026-09-30). 저장소에 허가 없는 이미지를 넣지 않는다 |
| 서체 | npm 패키지 / CDN 링크 | CDN 링크 | 의존성 추가 없음, 핸드오프 지정 |
| 분기점 | 640px 단일 / 640 + 1024 | 640 + 1024 | 640~1023px에서 1200px용 다단이 좁다 |

### 7.3 Clean Architecture Approach

기존 구조 유지(`src/app`, `src/components`, `src/lib`). 새 계층 없음.

---

## 8. Convention Prerequisites

### 8.1 Existing Project Conventions

- [x] 전역 CLAUDE.md 코딩 규칙
- [x] TypeScript strict, Tailwind CSS 4 `@theme`

### 8.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| 디자인 토큰 | alpine 계열 | 핸드오프 토큰(`forest-*`, `bone`, `amber` 등) | High |
| 반경 | 8·16px·알약 혼용 | 12px 단일, 내부 썸네일 8~9px | High |

### 8.3 Environment Variables Needed

없음.

### 8.4 Pipeline Integration

해당 없음(PRD와 핸드오프가 Phase 3·5를 대체).

---

## 9. Next Steps

1. [ ] Design 문서 작성
2. [ ] 구현(module-0~3)
3. [ ] Check(match rate 95 이상) 후 Report

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-09-30 | 최초 작성 | Claude(PDCA) |
