# ui-redesign-forest Design Document

> **Summary**: 핸드오프(4a 숲길) 토큰·레이아웃·인터랙션을 기존 컴포넌트 구조 위에 적용하는 상세 설계
>
> **Project**: tmb-2027
> **Version**: 0.1.0 (PRD v4.0 + UI 델타)
> **Author**: 장동인(작성자) · Claude(PDCA)
> **Date**: 2026-09-30
> **Status**: Approved (작성자 one-shot 지시)
> **Planning Doc**: [ui-redesign-forest.plan.md](../01-plan/ui-redesign-forest.plan.md)
> **Source contract**: `docs/02-design/ui-redesign-forest-handoff/handoff.md` + `design/*.dc.html`

### Pipeline References

| Phase | Document | Status |
|-------|----------|--------|
| Phase 3 | Mockup: 핸드오프 `design/TMB 2027 Screens 1~3.dc.html` | ✅ |
| Phase 5 | Design System: 본 문서 Design Anchor | ✅ |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 디자인 핸드오프가 확정됐다. 기존 화면은 기능은 완성됐지만 시각 품질이 MVP 수준이다. |
| **WHO** | 리더 1명, 팀원 9명, 계정 사용자, 비로그인 방문자. 산행 중 모바일 사용이 기본이고 준비 기간에는 데스크톱을 쓴다. |
| **RISK** | ① 스타일 변경으로 기존 E2E(44px 터치 영역, 가로 스크롤, axe 대비) 회귀 ② 요소 계약(문구·aria·testid) 훼손 ③ 임시 사진이 제3자 서버 직접 연결(허가 없음) ④ 외부 서체 CDN이 오프라인에서 빠짐 ⑤ 라우트 ○/ƒ 변화 |
| **SUCCESS** | 18개 화면이 핸드오프 토큰·레이아웃과 일치(match rate 95 이상), `tsc`·`vitest`·Playwright 기존 건 전부 통과, 라우트 ○/ƒ 변경 0건, 옛 토큰 잔존 0건 |
| **SCOPE** | module-0 공통 → module-1 SCR-001~004 → module-2 SCR-005·006·009·010·011 → module-3 SCR-007·008·012~018 → module-4 회귀 검증 |

---

## Design Anchor

핸드오프 `handoff.md`의 Design Tokens가 정본이다. 코드 위치는 `src/app/globals.css`의 `@theme`.

| Category | Tokens |
|----------|--------|
| **Colors** | `forest-900 #17281F` · `forest-700 #2E5A41` · `forest-600 #4E6B55` · `bone #EEF1EC` · `sage-200 #DCE7DD` · `line #CBD4CA` · `line-soft #E4E9E2` · `line-strong #A9B6AC`(체크박스·점선 테두리) · `line-header #DCE2DA` · `ink-2 #3C4C42` · `ink-3 #5C6B61` · `on-dark-muted #A9BBAE` · `dark-line #2F4538` · `dark-well #223629` · `amber #E3A43B`(위 글자 `amber-ink #1B2A20`) · `warn-bg #F3E3C0` / `warn-fg #4A3408` · `danger #B3412E`(글자 `danger-ink #9A3524`) |
| **Typography** | Pretendard Variable 단일(CDN v1.3.9 dynamic-subset), `tabular-nums`, `word-break: keep-all`, h1·h2 `text-wrap: balance` |
| **Spacing** | 8px 배수. web 본문 좌우 48px·헤더 40px, mobile 16px. 본문 최대 폭 1200px |
| **Radius** | 12px 단일(`--radius-card`). 내부 썸네일 8~9px, 체크박스 7px. 알약 모양 없음 |
| **Elevation** | 카드 그림자 없음. 호버 `0 14px 28px -18px rgba(20,34,26,.55)`, 드롭다운 `.shadow-pop` |
| **Motion** | 누름 scale 0.97/0.98/0.99(160ms `cubic-bezier(0.23,1,0.32,1)`), 등장 `ix-in` 420ms(순서 60ms), 목록 360ms(40ms 간격), 드롭다운 `ix-pop` 180ms, 모션 줄이기 시 200ms 페이드 |

---

## 1. Overview

### 1.1 Design Goals

1. **회귀 0**: 문구·요소 ID·aria·testid·라우트·데이터 흐름을 바꾸지 않는다.
2. **단일 체계**: 액센트 1개(앰버), 반경 1개(12px), 테마 1개(라이트). 옛 토큰은 남기지 않는다.
3. **목업 일치**: web 1200px·mobile 390px 목업의 레이아웃과 값을 따른다.
4. **교체 쉬운 사진**: 임시 사진 URL은 `src/lib/photos.ts` 한 곳.

### 1.2 Design Principles

- 반복되는 값(버튼, 배지, 모션, 사진 칸)은 `globals.css` 공통 클래스로 두고, 화면 고유 레이아웃은 Tailwind 유틸로 쓴다.
- 기존 컴포넌트 파일과 서버·클라이언트 경계를 유지한다.
- hover는 `(hover: hover) and (pointer: fine)` 안에서만, 애니메이션은 transform·opacity만.

---

## 2. Architecture Options

### 2.0 Architecture Comparison

| Criteria | Option A: 클래스 치환만 | Option B: 디자인 시스템 컴포넌트 신설 | Option C: 토큰 + 공통 클래스 + 화면 마크업 조정 |
|----------|:-:|:-:|:-:|
| **Approach** | 색 클래스만 바꿈 | Button·Card·Field 등 컴포넌트 계층 추가 | `@theme` 토큰, `.btn`·`.badge` 등 소수 클래스, 화면별 마크업 재배치 |
| **New Files** | 0 | 10+ | 2 |
| **Modified Files** | ~60 | ~70 | ~65 |
| **Complexity** | Low | High | Medium |
| **Maintainability** | Low | High | High |
| **Effort** | Low | High | Medium |
| **Risk** | 레이아웃 불일치 | 범위 초과 리팩터링 | 균형 |
| **Recommendation** | 목업과 어긋남 | 과함 | **선택** |

**Selected**: Option C. **Rationale**: 목업은 레이아웃까지 바꾸므로 A로는 부족하고, B는 요청 범위를 넘는 추상화다.

### 2.1 Component Diagram

```
layout.tsx
 ├─ sticky: AppHeader(AccountMenu) + OfflineBanner
 ├─ main (max 1200px, 16/48px 여백)
 │    └─ 화면별 page.tsx → 기존 컴포넌트(DayCard, LodgingCard, LegTimeline, …)
 └─ BottomNav (640px 미만, 현재 탭 표시)
공통: globals.css(@theme, 공통 클래스) · ui/Badge · ui/StatusNote · ui/Photo · lib/photos.ts
```

### 2.2 Data Flow

변경 없음.

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| 전 화면 | `globals.css` 토큰·클래스 | 시각 체계 |
| 사진 칸 | `lib/photos.ts`, `ui/Photo.tsx` | 임시 사진 |
| `layout.tsx` | cdnjs Pretendard CSS | 서체 |

---

## 3. Data Model

변경 없음.

## 4. API Specification

변경 없음. 계약 축은 "화면 요소 계약(PRD 5.5)이 그대로인가"로 검증한다(8장 회귀 테스트).

---

## 5. UI/UX Design

### 5.1 Screen Layout

분기점: 640px 미만은 mobile 목업, 640px 이상은 web 목업. 1200px용 다단 그리드는 1024px(`lg`)부터 쓰고 그 사이는 열 수를 줄인다.

### 5.2 User Flow

변경 없음.

### 5.3 Component List

| Component | Location | Responsibility |
|-----------|----------|----------------|
| 토큰·공통 클래스 | `src/app/globals.css` | `.card`, `.card-dark`, `.tap`, `.bleed`, `.btn-*`, `.ix-tile`, `.ix-row`, `.ix-link`, `.badge`, `.photo`, `.scrim`, `.field`, `.seg`, `.snap-row`, `.skeleton`, `.shadow-pop`, `data-enter`·`data-stagger`·`data-pop` |
| `AppHeader`·`AccountMenu` | `src/components/layout/` | web 68px·mobile 56px 헤더, 로그인 버튼·계정 드롭다운·세션 만료 알림 |
| `BottomNav` | `src/components/layout/` | 5칸 탭, 현재 탭 앰버 막대·`aria-current="page"`, safe area |
| `OfflineBanner` | `src/components/pwa/` | 헤더 아래 warn 색 배너 |
| `Badge`·`StatusNote`·`ExternalLink`·`Skeleton` | `src/components/ui/` | 새 토큰 |
| `Photo` | `src/components/ui/Photo.tsx` | `#4E6B55` 배경 사진 칸 |
| `photos.ts` | `src/lib/photos.ts` | 임시 사진 URL(Day별·화면별) |

### 5.4 Page UI Checklist

공통(G):

| # | Element | Detail |
|---|---------|--------|
| G-01 | 토큰 | `@theme`에 Design Anchor 색 전부, 옛 토큰(alpine·snow·rock·safety·ink) 0건 |
| G-02 | 서체 | Pretendard CDN 링크(cdnjs, URL에 @ 없음), 폰트 스택 첫 항목, `tabular-nums` |
| G-03 | 줄바꿈 | body `keep-all`·`break-word`, h1·h2 `balance` |
| G-04 | 반경 | 12px 단일. `rounded-lg/xl/full/[16px]` 잔존 0건(이니셜 원·타임라인 점·진행 바 제외) |
| G-05 | 누름·호버 | `.btn` 0.97, `.ix-tile` 0.98, `.ix-row` 0.99, hover는 미디어쿼리 안 |
| G-06 | 등장 | `data-enter`·`data-stagger`·`data-pop`, 모션 줄이기 200ms 페이드 |
| G-07 | 포커스 | `:focus-visible` 2px currentColor, offset 3px |
| G-08 | 모바일 | 탭 하이라이트 제거, `touch-action: manipulation`, 입력 16px, `viewport-fit=cover`, 하단 탭 safe area |
| G-09 | 헤더 | web 68px(로고 20/800 + 슬로건 14px, 링크 15/500, 로그인 버튼 forest-900), mobile 56px(로고 + 로그인), 하단선 web만 |
| G-10 | 하단 탭 | 5칸, 흰 배경, 상단 1px line-header, 13px/600, 현재 탭 forest-900/700 + 24×3px 앰버 막대 + `aria-current`, 640px 미만만 |
| G-11 | 오프라인 배너 | 헤더 아래, warn-bg/warn-fg, 문구 유지 |
| G-12 | 본문 폭 | 최대 1200px, 좌우 16px(mobile)·48px(web) |
| G-13 | 예약 상태 배지 | 확정 forest-700/흰 · 대안 확정 sage-200/forest-900 · 대기·문의 warn · 미예약 bone/ink-2 + line 테두리 |
| G-14 | 사진 | `photos.ts`의 URL만 사용, 로딩 전 `#4E6B55`, 사진 위 글자는 스크림 위 |

화면별:

| SCR | Element | Detail |
|-----|---------|--------|
| 001-a | 히어로 | web 좌 문구(5fr)/우 사진(7fr), mobile 사진 위. 아이브로우 배지(sage), h1 76/44px·800·-0.045em(76px는 1160px 이상, 그 아래 web은 60px), 설명 문단, in_trip일 때 앰버 "오늘 구간 보기" 버튼(PRD SCR-001-EL-16) |
| 001-b | 지표 줄 | 칸 없는 `dl`, 상단 1px line, 5항목(기간 1.5fr), mobile 2열(기간 2칸) |
| 001-c | 오늘 카드 | forest-900 카드. h2 "오늘" + 날짜·Day + 앰버 "오늘" 배지, 구간명, 숙박 + Day 상세 버튼, 지표 4(획득은 앰버), 고도 프로필(dark-well, 앰버 선) |
| 001-d | 오늘 상태 | before·after·empty 상태는 StatusNote 유지 |
| 001-e | 빠른 링크 | 사진 벤토 5칸. web 4열×2행(일정 2×2), mobile 2열(일정 2칸). 스크림 위 제목·설명, `.ix-tile` |
| 002-a | 제목·필터 | h1 44/32px·800, 요약 문장, 세그먼트 탭(sage 트랙, 선택 forest-900) |
| 002-b | web 카드 | 3열 사진 카드: 사진 150px + Day 배지·오늘 배지, 날짜·국가, 이름·원어, 지표 줄(forest-700), 숙박·상태 배지(line-soft 구분선) |
| 002-c | mobile 행 | 84px 썸네일 + 본문 4줄 |
| 002-d | 오늘 강조 | 앰버 2px 외곽선, `aria-current="date"` |
| 003-a | 사진 헤더 | 전면 사진(web 420px·mobile 300px) + 스크림, 날짜·Day 배지·국가, h1 44/26px, 원어(오늘 배지는 Day 화면에 오늘 여부 데이터가 없어 제외) |
| 003-b | 본문 2단 | web 1.6fr/1fr, mobile 1열 |
| 003-c | 지표 | 흰 카드 4개(web 4열, mobile 2열) |
| 003-d | 경로 카드 | 고도 프로필(연한 배경, forest-700 선), 지점 목록(web 열·상단 막대 3px, 고개는 앰버 / mobile 좌측 선), 사진 3장(mobile 스냅 스크롤) |
| 003-e | 지도 카드 | 주 버튼 1(forest-900) + 보조 버튼(line 테두리), 안내 문구 |
| 003-f | 식사·숙박 카드 | 점심, 구분선, 숙소명 + 상태 배지, 요금·연락, 버튼 |
| 003-g | 안전 카드 | forest-900 카드, 강조어 앰버, 112 버튼 danger, 보조 문구 on-dark-muted |
| 003-h | 데이터 상태·기록 링크·이전/다음 | 흰 카드, 사진 타일(좌→우 스크림), 2열 이전/다음 |
| 004-a | 헤더 | web 좌 문구/우 사진 340px, mobile 사진 위. 날짜·"이동일" 배지(dark)·국가, h1 48/28px |
| 004-b | 구간 타임라인 | 세로선 + 점, 모드 배지(sage)·검증 배지(outline)·기준일, 구간명, 출발/도착/소요, 메모, 예매·fallback |
| 004-c | 우측 열 | 숙박 카드(사진 상단), 데이터 상태, "전체 일정" 버튼 |
| 005-a | 지도 | 정보 배너, 흰 카드 안 SVG(Day별 12색 선, 고개 ▲ 앰버, 숙박 ●) |
| 005-b | 범례·Day 행 | 기호 범례, 12 Day 행(색 막대 + 썸네일 + 이름·날짜) |
| 005-c | 출처 | "출처·라이선스" 목록 유지 |
| 006-a | 헤더 | 제목 + 사진, 경고 배너(warn) |
| 006-b | 예산 표 | 10항목, tfoot 3행(소계·예비비·합계), 합계 행 forest-900 |
| 006-c | 우측 열 | 권장 금액 다크 카드, 환율, 가정, 참고 |
| 009-a | 좌측 열 | web 고정: 사진, 제목, 로그인 안내, 다크 진행 카드(앰버 진행 바) |
| 009-b | 목록 | 카테고리 7개 web 2열, 체크 행 44px 이상, 체크됨 forest-700·7px |
| 009-c | 계정 상태 | 저장 상태·이전 안내 문구 유지 |
| 010-a | 헤더 | 사진 헤더 + 스크림, 안내 배너 |
| 010-b | Day 카드 | 12 Day 사진 카드 web 4열·mobile 2열 |
| 011-a | 좌측 | Day 헤더, 로그인 배너, 작성 폼(200자·사진·저장) |
| 011-b | 우측 | 타임라인(사진 + 글 + 작성자·시각) |
| 007-a | 관리자 홈 | 로그인됨: 상태 배너, 편집·로그아웃 / 비로그인: 리더 로그인 폼(목업의 요약 4칸은 이 화면에 집계 데이터가 없어 제외) |
| 008-a | 숙박 표 | 14박 표(상태 배지·편집), mobile은 가로 스크롤 없는 목록 |
| 008-b | 편집 패널 | 앰버 테두리, 예약 필드 + 숙박 정보 필드 2열 |
| 012-a | 팀원 로그인 | 폼 + 발송 완료·링크 오류 상태 |
| 013-a | 오프라인 | 제목 "아직 이 기기에 저장되지 않은 화면입니다.", 안내, 다시 시도, 비상 정보(112) |
| 014-a | 찾을 수 없음 | 사진 + 경고 배지(기존 문구) + "길을 벗어났습니다." + 홈으로 |
| 015-a | 로그인 | web 사진/폼 448px, next 안내, 이메일·비밀번호(표시 토글), 자격 오류(danger 테두리, 입력 유지) |
| 016-a | 회원가입 | 폼(8자 이상 도움말), 가입 완료 안내 |
| 017-a | 콜백 실패 도착 | 012·007·015의 `error=auth` 배너가 새 토큰으로 표시 |
| 018-a | 계정 메뉴 | 비로그인 버튼, 로그인 트리거(이니셜 원 + 이메일 앞부분), 드롭다운(`data-pop`, `.shadow-pop`, Esc·포커스 복귀), 세션 만료 알림 |

---

## 6. Error Handling

변경 없음. 오류 표시는 StatusNote error(danger 테두리)와 `.field[aria-invalid]`로 통일한다.

## 7. Security Considerations

- [x] 인증·RLS·서버 액션 변경 없음
- [x] 외부 출처 추가: 서체 CSS(cdnjs), 임시 사진(montblanctreks.com.au). 둘 다 읽기 전용 GET이며 사용자 데이터를 보내지 않는다. SW는 교차 출처 요청을 가로채지 않는다(`public/sw.js`)
- [x] 임시 사진은 상업 이용 허가가 없다. 팀 소유 사진으로 교체해야 한다(PRD 9장)

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Tool | Phase |
|------|--------|------|-------|
| L1 | 해당 없음(API 변경 없음). 기존 단위 테스트 회귀 | vitest | Check |
| L2 | 터치 영역·가로 스크롤·axe·요소 계약 | Playwright(기존 spec) | Check |
| L3 | 인증·오프라인·준비물 시나리오 | Playwright(기존 spec) | Check |

### 8.2 L1

`npm test` 전부 통과.

### 8.3 L2: UI Action Test Scenarios

| # | Page | Action | Expected |
|---|------|--------|----------|
| 1 | `/`, `/itinerary`, `/day/d2027-08-04`, `/budget`, `/map`, `/packing` | 3개 뷰포트 로드 | 가로 스크롤 0, 대상 요소 44×44px 이상 |
| 2 | 같은 6개 | axe | critical·serious 0건 |
| 3 | `/budget`, `/map`, `/day/*`, `/travel/*` | 로드 | 기존 요소 수·문구 유지 |

### 8.4 L3

`auth.spec.ts`, `multiuser.spec.ts`, `offline.spec.ts`, `packing.spec.ts`, `security.spec.ts`, `day-detail.spec.ts` 전부(자격 없는 건의 기존 skip 유지).

### 8.5 Seed Data Requirements

변경 없음.

---

## 9. Clean Architecture

기존 계층 유지. 새 파일 2개: `src/lib/photos.ts`(Infrastructure 성격의 정적 매핑), `src/components/ui/Photo.tsx`(Presentation).

## 10. Coding Convention Reference

전역 CLAUDE.md. 추가 규칙: 색은 토큰 클래스만(임의 hex 금지, SVG 지도의 12색·고도 프로필 채움색 제외), 반경은 `rounded-[12px]`, 새 문구에 엠대시 금지.

---

## 11. Implementation Guide

### 11.1 File Structure

```
src/app/globals.css, layout.tsx, manifest.ts
src/components/layout/{AppHeader,BottomNav,AccountMenu}.tsx
src/components/ui/{Badge,StatusNote,ExternalLink,Skeleton,Photo}.tsx
src/components/pwa/{OfflineBanner,BookingStatusBadge}.tsx
src/lib/photos.ts
src/app/**/page.tsx, loading.tsx · src/components/{home,itinerary,day,travel,map,budget,packing,journal,admin,auth}/*
```

### 11.2 Implementation Order

1. [x] module-0 공통
2. [ ] module-1 SCR-001~004
3. [ ] module-2 SCR-005·006·009·010·011
4. [ ] module-3 SCR-007·008·012~018
5. [ ] module-4 회귀 검증, PRD 9장·14장 갱신

### 11.3 Session Guide

| Module | Scope Key | Description |
|--------|-----------|-------------|
| 공통 | `module-0` | 토큰, 헤더, 탭, 배너, UI 기본, 사진 |
| Screens 1 | `module-1` | 홈·일정·Day·이동일 |
| Screens 2 | `module-2` | 지도·예산·준비물·기록 |
| Screens 3 | `module-3` | 관리자·인증·오프라인·404·계정 메뉴 |
| 회귀 | `module-4` | tsc·vitest·build·Playwright |

module-1~3은 파일이 겹치지 않아 병렬로 진행한다.

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-09-30 | 최초 작성 | Claude(PDCA) |
| 0.2 | 2026-09-30 | Check 반영: 001-a·003-a·007-a 정정, 서체 CDN cdnjs, `line-strong` 토큰 추가 | Claude(PDCA) |
