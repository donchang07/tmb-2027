# ui-redesign-forest Analysis Report

> **Analysis Type**: Gap Analysis (정적 비교: 설계서 5.4 체크리스트 · 핸드오프 목업 ↔ 구현)
>
> **Project**: tmb-2027
> **Version**: 0.1.0 (PRD v4.0 + UI 델타)
> **Analyst**: Claude(PDCA Check, 독립 분석)
> **Date**: 2026-09-30
> **Design Doc**: [ui-redesign-forest.design.md](../02-design/ui-redesign-forest.design.md)
> **Plan Doc**: [ui-redesign-forest.plan.md](../01-plan/ui-redesign-forest.plan.md)

### Pipeline References (for verification)

| Phase | Document | Verification Target |
|-------|----------|---------------------|
| Phase 3 | 핸드오프 `docs/02-design/ui-redesign-forest-handoff/design/*.dc.html` | 레이아웃·값 일치 |
| Phase 5 | 설계서 Design Anchor, `src/app/globals.css` `@theme` | 토큰 일치 |
| 계약 | `docs/PRD.md` 5.5 UI 요소 계약 | 문구·id·aria·testid 보존 |

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

## Strategic Alignment Check

### PRD Alignment

| PRD Element | Expected | Implementation Status |
|-------------|----------|:---------------------:|
| Core Problem (WHY) | MVP 수준 시각 품질을 핸드오프 4a 숲길로 교체 | ✅ Addressed. 토큰·서체·반경·사진 레이아웃이 전 화면에 적용됐다. |
| Target User (WHO) | 모바일 한 손 사용, 데스크톱 준비 | ✅ Addressed. 640px 미만 하단 탭, 44px 터치 영역, 16px 입력, lg 다단 그리드가 들어갔다. |
| Value Proposition | 기능·계약 회귀 없이 완성도 향상 | ✅ Delivered(정적). id·testid·href·aria-label·제목 수준은 전부 보존됐다. 홈 버튼 문구 2건은 Act-1에서 PRD SCR-001-EL-16으로 등록됐다. |

### Success Criteria Status

| # | Criteria (from Plan) | Status | Evidence |
|---|---------------------|:------:|----------|
| SC-U1 | 옛 토큰 클래스·색상값 잔존 0건 | ✅ Met | Act-1 후 재실행: 옛 토큰·금지 반경 클래스·옛 hex grep 0건(`safety-heading` id 제외). tsx 임의 hex도 0건(지도·고도 프로필 SVG와 `layout.tsx` themeColor 제외). |
| SC-U2 | 18개 화면이 5.4 체크리스트 충족(match rate 95 이상) | ✅ Met(Overall 98.8) | Act-1 후 57행 중 ✅ 57, ⚠️ 0, ❌ 0. Functional 98(잔여 Minor 4건 감점). Runtime 반영 후 최종 판정은 `[리드 기입]` |
| SC-U3 | `tsc --noEmit` 오류 0건, `vitest` 전부 통과 | ✅ Met | `npx tsc --noEmit --incremental false` 출력 없음, exit 0. vitest 175/175 통과 |
| SC-U4 | Playwright 3개 뷰포트 전부 통과 | ⚠️ Partial | 3차 153/153. Act-1 후 4차는 152/153(외부 사진 서버 지연으로 1건 시간 초과, 재실행 통과). axe 검사 앞에 애니메이션 비활성 1줄을 넣은 spec 수정이 있다 |
| SC-U5 | 빌드 라우트 ○/ƒ 변경 0건 | ✅ Met | 빌드 출력 비교 0건. 정적 참고: `export const dynamic` 선언과 `page.tsx` 파일 목록에 추가·삭제가 없다. `BottomNav`만 클라이언트 컴포넌트로 바뀌었다(Plan 6.2에 명시). |
| SC-U6 | 문구·요소 ID·aria·testid 변경은 허용 제목 2건과 홈 버튼 문구("오늘 구간 보기", "Day 상세", PRD SCR-001-EL-16 등록)뿐 | ✅ Met | Plan `plan.md:108`과 `docs/PRD.md:300`(SCR-001-EL-16)에 등록됐다. id·data-testid·href·aria-label·role 삭제 0건. 오프라인 배너의 구분 기호 " · "(`OfflineBanner.tsx:54`)는 두 계약 문구 자체를 바꾸지 않으므로 Minor 관찰로 남긴다(D3). |

**Success Rate**: 정적으로 판정 가능한 4건(SC-U1, SC-U2 정적분, SC-U3 tsc, SC-U6) 모두 충족. 리드 기입 후 6건 중 5건 Met, SC-U4는 Partial(외부 사진 의존 시간 초과 1건).

Plan 4.2 품질 기준: 액센트 1개(앰버)·반경 12px 체계·라이트 테마 단일은 충족이다. 새 의존성 0건(`package.json` diff 없음), `any` 0건(grep)이다.

### Decision Record Verification

| Source | Decision | Followed? | Deviation |
|--------|----------|:---------:|-----------|
| [Plan] | 토큰 + 소수 공통 클래스 | ✅ | `globals.css`에 설계 5.3의 클래스 17종이 모두 있다. |
| [Plan] | 사진은 목업 URL 직접 연결, 한 파일 관리 | ✅ | `src/lib/photos.ts` 외 URL 0건. 404 사진만 목업과 다른 파일을 쓴다(Minor). |
| [Plan] | 서체 CDN 링크(의존성 없음) | ✅ | `layout.tsx:10,36` cdnjs, URL에 `@` 없음. |
| [Plan] | 분기점 640 + 1024 | ✅ | Act-1 후 열 수는 lg부터 목업과 같다. 홈 h1만 1160px부터 76px이다(설계 v0.2에 명시). |
| [Design] | Option C(토큰 + 공통 클래스 + 마크업 조정), 새 파일 2개 | ✅ | `Photo.tsx`, `photos.ts`만 신규. |
| [Design] | 색은 토큰 클래스만(임의 hex 금지, 지도·고도 프로필 제외) | ✅ | Act-1 후 tsx 임의 hex 0건. |
| [Handoff] | 새 문구는 제목 2건뿐 | ✅ | Plan SC-U6이 홈 버튼 문구 2건을 추가로 허용하도록 고쳐졌고 PRD에 등록됐다. |

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

설계서 5.4 Page UI Checklist(공통 G-01~G-14, 화면별 001-a~018-a, 총 57행)와 핸드오프 목업의 최종 인라인 값(1200px·390px 카드)을 구현 코드와 정적으로 대조한다. 요소 계약(PRD 5.5) 보존 여부는 `git diff`로 확인한다.

### 1.2 Analysis Scope

- **Design Document**: `docs/02-design/ui-redesign-forest.design.md`, `docs/02-design/ui-redesign-forest-handoff/handoff.md`, `design/*.dc.html` 5개
- **Implementation Path**: `src/app/globals.css`, `src/app/layout.tsx`, `src/app/**/page.tsx`·`loading.tsx`·`not-found.tsx`, `src/components/**`, `src/lib/photos.ts` (변경 72개 파일 + 신규 2개)
- **Analysis Date**: 2026-09-30
- **방법**: 컴포넌트 코드와 목업 섹션을 직접 읽고 px·색·열 수·반경을 대조했다. 실행한 명령은 grep류 검색과 `tsc --noEmit`뿐이다. 빌드·dev 서버·Playwright는 실행하지 않았다.
- **판정 원칙**: 행에 적힌 값이나 목업 기준 폭(1200px·390px)의 레이아웃이 다르면 ⚠️다. 앱에 근거 데이터가 없는 목업 예시 내용의 생략은 차이로 보지 않는다. 앱에 있고 목업에 없는 내용의 유지도 차이로 보지 않는다.

---

## 2. Gap Analysis (Design vs Implementation)

### 2.1 API Endpoints

해당 없음. API·서버 액션 변경이 없다.

### 2.2 Data Model

해당 없음. 단, `src/data/seed/route-segments.ts`의 `SEGMENT_COLORS` 12색이 목업 `COLORS` 배열 값으로 바뀌었다. 표시 색상만 바뀐 것이고 설계 005-a("Day별 12색 선")에 해당한다.

### 2.3 Component Structure

| Design Component (5.3 / 11.1) | Implementation File | Status |
|------------------|---------------------|--------|
| 토큰·공통 클래스 17종 | `src/app/globals.css` | ✅ `.card` `.card-dark` `.tap` `.bleed` `.btn-*` `.ix-tile` `.ix-row` `.ix-link` `.badge` `.photo` `.scrim` `.field` `.seg` `.snap-row` `.skeleton` `.shadow-pop` `data-enter·stagger·pop` 전부 존재 |
| AppHeader · AccountMenu | `src/components/layout/AppHeader.tsx`, `AccountMenu.tsx` | ✅ |
| BottomNav | `src/components/layout/BottomNav.tsx` | ✅ |
| OfflineBanner · BookingStatusBadge | `src/components/pwa/` | ✅ |
| Badge · StatusNote · ExternalLink · Skeleton | `src/components/ui/` | ✅ |
| Photo | `src/components/ui/Photo.tsx` (신규) | ✅ |
| photos.ts | `src/lib/photos.ts` (신규) | ✅ |
| 화면 18개 page·loading·not-found | `src/app/**` | ✅ |
| layout·manifest | `src/app/layout.tsx`, `manifest.ts` | ✅ `viewportFit: "cover"`, `themeColor #EEF1EC` |

### 2.4 Functional Depth Analysis

placeholder, TODO, 목 데이터, 빈 핸들러는 발견되지 않았다. 지어낸 데이터도 없다(목업의 예시 건수·예약번호·요약 수치는 구현에 들어가지 않았다).

| File | Depth Score | Placeholder Indicators | Missing Design Elements |
|------|:----------:|----------------------|------------------------|
| `src/components/home/TodayCard.tsx` | 90 | 없음 | 지표 숫자 크기가 핸드오프 범위보다 작음(M-1 잔여) |
| `src/components/auth/LoginForm.tsx` | 95 | 없음 | 오류 문구 위치(M-6) |
| 그 외 변경 파일 | 95~100 | 없음 | 없음 |

**Shallow File Count**: 0 / 74 files (0%)

### 2.5 Page UI Checklist Verification

줄 번호는 현재 작업 트리 기준이다. `day` = `src/app/day/[dayId]/page.tsx`, `travel` = `src/app/travel/[dayId]/page.tsx`.

#### 공통(G)

| # | Element | 상태 | 근거 | 차이·수정 |
|---|---------|:----:|------|-----------|
| G-01 | 토큰 | ✅ 일치 | `globals.css:3-26` 19색 전부, 옛 토큰 grep 0건 | tsx 임의 hex 3건은 M-2 참조(토큰 자체는 일치) |
| G-02 | 서체 | ✅ 일치 | `layout.tsx:10,35-36`(cdnjs, `@` 없음), `globals.css:24,38` | 없음 |
| G-03 | 줄바꿈 | ✅ 일치 | `globals.css:40-41,58-61` | 없음 |
| G-04 | 반경 | ✅ 일치 | `globals.css:23`. 사용 분포: `rounded-[12px]` 22, `[9px]` 8+3, `[8px]` 2, `[7px]` 1(체크박스), `[50%]` 4(이니셜·타임라인 점·범례), `[4px]` 1(진행 바), `[3px]` 1(색 막대), `rounded-sm` 1(탭 막대) | 금지 클래스 0건 |
| G-05 | 누름·호버 | ✅ 일치 | `globals.css:138-140`(0.97), `187-189`(0.98), `197-199`(0.99), `308-327`(hover 미디어쿼리). tsx의 `hover:` 유틸 0건 | 없음 |
| G-06 | 등장 | ✅ 일치 | `globals.css:344-422`. 목업 `<style>` 값과 동일(420ms, 60ms 간격, 360ms·40ms, 9번째부터 320ms, pop 180ms, reduce 200ms) | 없음 |
| G-07 | 포커스 | ✅ 일치 | `globals.css:82-85` | 없음 |
| G-08 | 모바일 | ✅ 일치 | `globals.css:31,63-74`, `layout.tsx:26`, `BottomNav.tsx:25`(`pb-[env(safe-area-inset-bottom)]`) | 파일 입력만 `text-sm`(A-3) |
| G-09 | 헤더 | ✅ 일치 | `AppHeader.tsx:14-23`(h-14 / sm:h-[68px], 로고 18/20px·800, 슬로건 14px, 링크 15/500, 하단선 sm부터), `AccountMenu.tsx:39` | 슬로건은 768px부터 보인다(640~767px은 폭 부족으로 숨김). 링크 간격은 패딩 방식으로 약 24px(목업 28px) |
| G-10 | 하단 탭 | ✅ 일치 | `BottomNav.tsx:25-39` 5칸, 흰 배경, `border-line-header`, 13px/600, 현재 탭 forest-900/700 + 24×3px 앰버 + `aria-current="page"`, `sm:hidden` | 없음 |
| G-11 | 오프라인 배너 | ✅ 일치 | `layout.tsx:42-45`(헤더 아래), `OfflineBanner.tsx:51-55` | 구분 기호 추가는 2.6 D3 |
| G-12 | 본문 폭 | ✅ 일치 | `layout.tsx:46` `max-w-[1200px] px-4 sm:px-12` | 없음 |
| G-13 | 예약 상태 배지 | ✅ 일치 | `Badge.tsx:3-13`, `BookingStatusBadge.tsx:9-14` | 없음 |
| G-14 | 사진 | ✅ 일치 | `photos.ts:3-43`, `globals.css:212-230`, `Photo.tsx:14-18`. `photos.ts` 밖 URL 0건 | 404 사진 파일은 M-3, 스크림 강도는 A-1 |

#### 화면별

| SCR | Element | 상태 | 근거 | 차이·수정 |
|-----|---------|:----:|------|-----------|
| 001-a | 히어로 | ✅ 일치 | `Hero.tsx:7-24` 5fr/7fr(lg), 모바일 사진 위, sage 배지, 설명, h1 `min-[1160px]:text-[76px]`(`Hero.tsx:12`), 앰버 버튼(`Hero.tsx:18-22`) | Act-1 해결. 1200px에서 76px이다. 설계 v0.2 문구(76px는 1160px 이상)와 같다 |
| 001-b | 지표 줄 | ✅ 일치 | `TripMetrics.tsx:13-31` 칸 없는 `dl`, `border-t border-line`, lg `1.5fr repeat(4,1fr)`, 모바일 2열(기간 2칸) | 값 글자는 lg 22px, xl 24px(M-1) |
| 001-c | 오늘 카드 | ✅ 일치 | `TodayCard.tsx:67-124`, `ElevationProfile.tsx:36-50`(dark-well, 앰버 선 2.5) | 지표 숫자 크기는 M-1 |
| 001-d | 오늘 상태 | ✅ 일치 | `TodayCard.tsx:24-56` StatusNote 유지, testid 유지 | 없음 |
| 001-e | 빠른 링크 | ✅ 일치 | `QuickLinks.tsx:16-36` sm 4열×170px, 일정 2×2, 모바일 2열(일정 2칸, 140/110px), `.scrim`, `.ix-tile` | 모바일 스크림 강도는 A-1 |
| 002-a | 제목·필터 | ✅ 일치 | `itinerary/page.tsx:45-48`(32/44px·800), `ItineraryList.tsx:45-57`, `globals.css:249-285` | 없음 |
| 002-b | web 카드 | ✅ 일치 | `DayCard.tsx:31-71`, `ItineraryList.tsx:64`(sm 2열, lg 3열), 사진 150px, 배지 오버레이, line-soft 구분선 | 없음 |
| 002-c | mobile 행 | ✅ 일치 | `DayCard.tsx:36-38` 84px 썸네일(9px 반경) + 본문 | 원어명 줄이 추가로 보인다(앱 보유 내용 유지) |
| 002-d | 오늘 강조 | ✅ 일치 | `DayCard.tsx:30-31`, `TravelDayCard.tsx:23-24` `outline-2 outline-amber`, `aria-current="date"` | 없음 |
| 003-a | 사진 헤더 | ✅ 일치 | `day:65-88` 300/420px, `.scrim`, 날짜·Day 배지·국가, h1 26/36/44px, 원어 | Act-1 해결. 설계 v0.2에서 "오늘 배지"를 제외했다(`design.md:174`) |
| 003-b | 본문 2단 | ✅ 일치 | `day:106` `lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]` | 없음 |
| 003-c | 지표 | ✅ 일치 | `DayMetrics.tsx:12-16` `grid-cols-2 sm:grid-cols-4`, lg에서 패딩 14px·19px·nowrap, xl 24px | Act-1 해결. 1024px 이상에서 4열이다 |
| 003-d | 경로 카드 | ✅ 일치 | `day:124-135`, `RouteList.tsx:8-14`(sm 상단 3px 막대, 최고점 앰버, 모바일 좌측 선), `ElevationProfile.tsx:55-57`, `.snap-row` | 사진 3장은 모든 Day에 같은 임시 사진이다 |
| 003-e | 지도 카드 | ✅ 일치 | `MapLinkCard.tsx:25-64` primary 1 + outline 2 + 안내 문구 | 없음 |
| 003-f | 식사·숙박 카드 | ✅ 일치 | `day:146-161`, `LodgingCard.tsx:41-126` | 링크 버튼이 `.btn`이 아니라 `ExternalLink`(`.ix-link`)라 누름 축소가 없다(사소) |
| 003-g | 안전 카드 | ✅ 일치 | `day:172-177`, `SafetyCard.tsx:4-13` | 없음 |
| 003-h | 데이터 상태·기록 링크·이전/다음 | ✅ 일치 | `day:179-203`(`.scrim-side`), `DayNav.tsx:5-27` | 기록 건수는 근거 데이터 조회가 없어 생략 |
| 004-a | 헤더 | ✅ 일치 | `travel:36-53` lg 1fr/1fr, 사진 190/340px, dark 배지, h1 `lg:text-5xl`(`travel:47`) | Act-1 해결. 1200px에서 48px이다 |
| 004-b | 구간 타임라인 | ✅ 일치 | `LegTimeline.tsx:8-49` | 검증 배지는 기본만 outline이고 확정은 success, 확인 필요는 warn이다(기존 의미 색 유지, M-6) |
| 004-c | 우측 열 | ✅ 일치 | `travel:64-100` | "고도 주의" 카드는 근거 데이터가 없어 생략 |
| 005-a | 지도 | ✅ 일치 | `map/page.tsx:18-20`, `RouteOverviewMap.tsx:75-105`, seed 12색 | 없음 |
| 005-b | 범례·Day 행 | ✅ 일치 | `MapLegend.tsx:12-57` | 없음 |
| 005-c | 출처 | ✅ 일치 | `map/page.tsx:27-39` | 없음 |
| 006-a | 헤더 | ✅ 일치 | `budget/page.tsx:21-35` | 헤더 2단이 sm(640px)부터다(M-5) |
| 006-b | 예산 표 | ✅ 일치 | `BudgetTable.tsx:30-79` tfoot 3행, 합계 forest-900 + 앰버 | 없음 |
| 006-c | 우측 열 | ✅ 일치 | `BudgetMeta.tsx:25-96` | 권장 금액 글자 30/34/38px(목업 32/40px) |
| 009-a | 좌측 열 | ✅ 일치 | `PackingList.tsx:40-41`(`lg:sticky lg:top-[92px]`), `114-130`, `packing/page.tsx:16-21` | sticky 동작은 런타임 확인 필요(R-1) |
| 009-b | 목록 | ✅ 일치 | `PackingList.tsx:135-158` `sm:grid-cols-2`, 행 44px(`label.tap`), 체크 forest-700·7px, 테두리 `border-line-strong` | Act-1 해결. 1024px 이상에서 2열이다 |
| 009-c | 계정 상태 | ✅ 일치 | `PackingList.tsx:222-223,395-417` 문구·testid 유지 | 없음 |
| 010-a | 헤더 | ✅ 일치 | `journal/page.tsx:18-29` | 없음 |
| 010-b | Day 카드 | ✅ 일치 | `journal/page.tsx:30-41` 2/3/4열 | 목업 모바일은 썸네일 행 목록이다. 설계서 문구("mobile 2열") 기준으로는 일치다 |
| 011-a | 좌측 | ✅ 일치 | `journal/[dayId]/page.tsx:37-64`, `JournalForm.tsx:24-65` | 없음 |
| 011-b | 우측 | ✅ 일치 | `JournalTimeline.tsx:9-26` | 사진 열 폭 lg 200px, xl 260px |
| 007-a | 관리자 홈 | ✅ 일치 | `admin/page.tsx:23-89` 상태 배너, 편집·로그아웃, 비로그인 폼, 사진 170/240/380px | Act-1 해결. 설계 v0.2에서 "요약"을 제외했다(`design.md:198`) |
| 008-a | 숙박 표 | ✅ 일치 | `LodgingTable.tsx:72-148` lg 표, 그 미만 카드 목록 | 없음 |
| 008-b | 편집 패널 | ✅ 일치 | `LodgingTable.tsx:150-160`(`border-2 border-amber`, lg 2단), `BookingEditor.tsx:56`, `LodgingFields.tsx:24` | 없음 |
| 012-a | 팀원 로그인 | ✅ 일치 | `journal/login/page.tsx:16-37`, `TeamLoginForm.tsx:13-39` | 없음 |
| 013-a | 오프라인 | ✅ 일치 | `offline/page.tsx:9-37` | 없음 |
| 014-a | 찾을 수 없음 | ✅ 일치 | `not-found.tsx:7-30` | 사진 파일이 목업과 다르다(M-3) |
| 015-a | 로그인 | ✅ 일치 | `login/page.tsx:32-58`(1fr/448px), `LoginForm.tsx:75,96`(`serverError`일 때 `field-error`), 이메일 유지(`LoginForm.tsx:72`) | Act-1 해결. 오류 문구 위치(버튼 뒤, 목업은 앞)는 M-6으로 남는다 |
| 016-a | 회원가입 | ✅ 일치 | `signup/page.tsx:16-36`, `SignupForm.tsx:44-60,132-134` | 없음 |
| 017-a | 콜백 실패 도착 | ✅ 일치 | `journal/login/page.tsx:21-27`, `admin/page.tsx:28-32`, `login/page.tsx:22-24,38-42`, `StatusNote.tsx:6` | 없음 |
| 018-a | 계정 메뉴 | ✅ 일치 | `AccountMenu.tsx:33-66,79-98,113-152` | 없음 |

| 구분 | Design Elements | ✅ | ⚠️ | ❌ | Rate |
|------|:--------------:|:--:|:--:|:--:|:----:|
| 공통 G | 14 | 14 | 0 | 0 | 100% |
| SCR-001~004 | 20 | 20 | 0 | 0 | 100% |
| SCR-005·006·009·010·011 | 13 | 13 | 0 | 0 | 100% |
| SCR-007·008·012~018 | 10 | 10 | 0 | 0 | 100% |
| **합계** | **57** | **57** | **0** | **0** | **100%** |

**Functional Match Rate**: 행 기준 57 / 57 = 100. 행에 이름이 없는 잔여 값 차이 4건(M-1 TodayCard 지표 숫자, M-3, M-5, M-6)을 건당 0.5 감점해 **98%** (최초 분석 94%)

최초 분석에서 ⚠️였던 7행(001-a, 003-a, 003-c, 004-a, 007-a, 009-b, 015-a)은 코드와 설계 v0.2를 다시 읽어 모두 ✅로 바꿨다.

**Structural Match Rate**: 파일·컴포넌트 12/12 + 체크리스트 요소 존재 57/57 = 69 / 69 = **100%** (최초 분석 97%)

### 2.6 Contract Verification (요소 계약)

API 계약은 해당 없음이다. 대신 PRD 5.5 요소 계약을 `git diff`로 대조했다. 변경된 tsx 67개의 HEAD 기준 계약 속성(`id`·`data-testid`·`href`·`aria-*`·`role`·`htmlFor`·`name`) 265개와 제목 요소 49개를 전후 비교했다.

- 삭제·값 변경된 `id`, `data-testid`, `href`, `aria-label`, `aria-labelledby`, `htmlFor`, `name`: **0건**
- 제목 수준 변경: **0건**. 추가는 h1 2건(허용)뿐이다.
- 추가된 속성: `data-enter` 38건, `aria-hidden="true"` 10건(장식), `aria-current="page"` 1건(설계 G-10), `role="status"` 3건(StatusNote에서 옮김), `role="img"`+`aria-label` 1건(홈 고도 프로필)

| # | 변경 | 위치 | 허용 여부 |
|---|------|------|-----------|
| A1 | h1 "아직 이 기기에 저장되지 않은 화면입니다." 추가 | `offline/page.tsx:18-20` | ✅ 허용(handoff.md) |
| A2 | h1 "길을 벗어났습니다." 추가 | `not-found.tsx:18-20` | ✅ 허용(handoff.md) |
| A3 | 장식 요소 `aria-hidden` 추가, `data-enter` 추가 | 여러 파일 | ✅ 허용 |
| A4 | 하단 탭 `aria-current="page"` 추가 | `BottomNav.tsx:34` | ✅ 허용(설계 G-10) |
| A5 | 모바일 예산 행의 "저"·"중" 라벨(`aria-hidden`) | `BudgetTable.tsx:37-45` | ✅ 허용(장식) |
| A6 | 경로 지점 표기 순서 변경: 역할 배지 → "이름 고도 · 역할" | `RouteList.tsx:16-21` | ✅ 허용(레이아웃, 문구 동일) |
| D1 | 새 링크와 새 문구 "오늘 구간 보기" | `Hero.tsx:18-22`, `app/page.tsx:26` | ✅ Act-1 해결. `docs/PRD.md:300` SCR-001-EL-16, Plan SC-U6(`plan.md:108`), 설계 001-a에 등록됐다 |
| D2 | `today-card-link`가 카드 전체 링크에서 버튼형 링크로 바뀌고 문구 "Day 상세"가 생김 | `TodayCard.tsx:120-122` | ✅ Act-1 해결. PRD SCR-001-EL-16 비고와 Plan SC-U6에 적혔다. testid·href는 유지다 |
| D3 | 오프라인 배너 둘째 문장 앞에 " · " 추가 | `OfflineBanner.tsx:54` | ⚠️ 목업 표기다. 기존 E2E 문구 검사(`offline.spec.ts:18-19`)와는 충돌하지 않는다. 허용 목록 밖이다 |
| D4 | `role="status"` 범위 축소: 제목·본문·버튼 전체에서 배지 문구만으로 | `offline/page.tsx:11-17`, `not-found.tsx:11-17` | ⚠️ 문구는 유지다. 본문과 버튼이 live region 밖으로 나갔다 |
| 기타 | 테스트 파일 2개의 axe 검사 앞에 `animation: none !important` 주입 1줄씩 추가(Act-1에서 애니메이션 종료 대기 방식에서 교체) | `tests/e2e/auth.spec.ts`, `responsive.spec.ts` | 단언 완화는 아니다. 기존 테스트 "무수정 통과"는 아니므로 기록한다 |

**Contract Match Rate**: 100 − 1(D3 구분 기호 미등록) − 1(D4 live region 범위) = **98%** (최초 분석 92%). `handoff.md:101`의 "두 개뿐" 문장은 원본 핸드오프라 그대로이고 Plan SC-U6이 대체한다.

### 2.7 Runtime Verification Results

리드 기입(2026-09-30). 실행 환경은 프로덕션 빌드(`.next-e2e`, 포트 3100), `npx playwright test --workers=1`, 뷰포트 3종(360·768·1440)이다.

| 회차 | 시점 | 결과 | 비고 |
|---|---|---|---|
| E2E 1차 | Do 직후 | 142 통과 / 11 실패 / 24 skip | 실패 원인 2가지: 등장 애니메이션 도중 axe 대비 검사(10건), 서체 CDN 주소의 `@v1.3.9`가 이메일 노출 검사 정규식에 걸림(3건 중 1건 중복) |
| E2E 3차 | 원인 2가지 수정 후 | **153 통과 / 0 실패 / 24 skip** | 서체를 cdnjs 주소로 교체, axe 검사 앞에 `animation: none` 주입 |
| E2E 4차 | Act-1 후 | 152 통과 / 1 실패 / 24 skip | 실패 1건은 `offline.spec.ts`(mobile-360)의 `page.goto("/")` 30초 시간 초과. 외부 사진 서버 응답 지연이 원인이며 같은 spec 재실행은 6/6 통과 |

- L1(vitest): 20 파일 175/175 통과(Act-1 후 재실행).
- L2(Playwright 터치 영역·가로 스크롤·axe·요소 수): `responsive.spec.ts` 3개 뷰포트 전부 통과. `/login`·`/signup` 포함.
- L3(Playwright 인증·오프라인·준비물 시나리오): `auth`·`multiuser`·`packing`·`security`·`day-detail` 전부 통과. `offline`은 4차에서 1건이 시간 초과 후 재실행 통과.
- skip 24건은 기존 조건부 skip(자격·환경 조건)이며 이번 주기에서 늘지 않았다.
- 빌드 라우트 표 ○/ƒ 비교: 변경 0건. 정적(○)은 `/_not-found`·`/manifest.webmanifest`·`/map`·`/offline`·`/packing`, 나머지는 동적(ƒ)으로 이전 주기 설계서의 기록과 같다.
- R-1 확인: 1280px·390px에서 700px 스크롤 후 헤더 top 0, 준비물 좌측 열 top 92px로 고정된다. 가로 넘침 0.
- 화면 캡처 확인: 홈(원정 전·원정 중), 일정, Day 상세, 이동일, 지도, 예산, 준비물, 기록, Day 기록, 관리자, 로그인, 회원가입, 오프라인, 404를 1280px·390px로 확인했다.
- **Runtime Match Rate**: 152/153 = **99%**(4차 기준, 재실행 통과분을 실패로 계산).

런타임에서 확인을 권하는 항목(정적으로 확정하지 못함):

- R-1: Act-1에서 `body`가 `overflow-x: clip`으로 바뀌었다(`globals.css:43`, `html`은 `hidden` 유지 `globals.css:30`). 정적으로는 sticky를 막는 조건이 없어졌다. 헤더(`layout.tsx:42`)와 준비물 좌측 열(`PackingList.tsx:41`)의 고정 동작은 런타임에서 한 번 확인한다.

### 2.8 Match Rate Summary

```
┌──────────────────────────────────────────────────┐
│  Structural Match Rate:  100%  (최초 97%)         │
│  Functional Match Rate:   98%  (최초 94%)         │
│  Contract Match Rate:     98%  (최초 92%)         │
│  Runtime Match Rate:      99%                     │
│  ──────────────────────────────────────────────── │
│  Overall = Structural×0.15 + Functional×0.25      │
│          + Contract×0.25 + Runtime×0.35           │
│  정적 합 = 15.0 + 24.5 + 24.5 = 64.0              │
│  Overall = 64.0 + 99.3×0.35 = 98.8 (기준 95 통과) │
├──────────────────────────────────────────────────┤
│  ✅ 일치:    57 items (100%)                      │
│  ⚠️ 부분:     0 items (0%)                        │
│  ❌ 불일치:   0 items (0%)                        │
└──────────────────────────────────────────────────┘
```

Runtime이 100이면 Overall은 99.0이다. Overall 95 이상이 되려면 Runtime이 89 이상이어야 한다.

### 2.9 Act-1 재검증

Act-1 수정 후 코드·문서를 다시 읽어 확인했다(2026-09-30). `npx tsc --noEmit --incremental false`는 출력 없이 exit 0이다.

| 항목 | 상태 | 확인 근거 |
|------|:----:|-----------|
| I-1 / D1 계약 밖 "오늘 구간 보기" | ✅ 해결(문서 등록) | `docs/PRD.md:300` SCR-001-EL-16, `plan.md:108`, `design.md:165` |
| D2 "Day 상세" 버튼형 링크 | ✅ 해결(문서 등록) | `docs/PRD.md:300` 비고, `plan.md:108` |
| I-2 자격 오류 danger 테두리 | ✅ 해결 | `LoginForm.tsx:75,96` |
| I-3 lg 열 수 | ✅ 해결 | `PackingList.tsx:135`, `DayMetrics.tsx:12,14,16` |
| M-1 글자 크기 | ⚠️ 일부 해결 | 해결: `Hero.tsx:12`(1160px부터 76px), `TripMetrics.tsx:31`(lg 24px), `travel:47`(lg 48px). 잔여: `TodayCard.tsx:102` 지표 숫자가 모바일 15px·lg 20px이다(핸드오프 범위 19~22px·24~30px). 단위 문구를 같은 크기로 유지해서 생긴 차이다 |
| M-2 임의 hex | ✅ 해결 | `globals.css:11` `--color-line-strong`, `JournalForm.tsx:55`, `PackingList.tsx:119,158`. tsx 임의 hex grep 0건 |
| A-1 모바일 스크림 | ✅ 해결 | `globals.css:227-231` 639px 이하 20% 시작·0.88 |
| R-1 sticky 위험 | ✅ 정적 해결 | `globals.css:43` `overflow-x: clip`. 동작은 런타임 확인 |
| 설계서 정정(M-8) | ⚠️ 일부 해결 | 해결: 001-a, 003-a, 007-a, 버전 이력 0.2. 잔여: 004-b 검증 배지 표기, 11.2 체크박스 |
| M-3 404 사진 | 잔여(Minor) | `photos.ts:42`가 오프라인 사진과 같다(목업 `chamois-1.jpg`) |
| M-5 예산 헤더 분기점 | 잔여(Minor) | `budget/page.tsx:21-22` `sm:grid-cols-2` |
| M-6 자격 오류 문구 위치 | 잔여(Minor) | `LoginForm.tsx:117-121`이 제출 버튼 뒤다 |
| D3 배너 구분 기호 | 잔여(Minor) | `OfflineBanner.tsx:54`. PRD에 구분 기호 표기가 등록되지 않았다 |
| D4 / M-7 live region 범위 | 잔여(Minor) | `offline/page.tsx:12`, `not-found.tsx:12` |
| 테스트 수정 | 기록 | axe 검사 앞 `animation: none` 주입. 단언은 그대로다 |

**남은 Critical: 0건. 남은 Important: 0건. 남은 Minor: 7건**(M-1 일부, M-3, M-5, M-6, D3, D4, 설계서 004-b·11.2).

---

## 3. Code Quality Analysis

### 3.1 Complexity Analysis

해당 없음. 로직 변경이 없다. 새 계산은 `RouteList.tsx:6`의 최고점 판정과 `BottomNav.tsx:14-18`의 현재 탭 판정뿐이다.

### 3.2 Code Smells

| Type | File | Location | Description | Severity |
|------|------|----------|-------------|----------|
| 임의 hex(Act-1 해결) | `JournalForm.tsx` | L55 | 토큰 `border-line-strong`으로 교체됨 | 해결 |
| 임의 hex(Act-1 해결) | `PackingList.tsx` | L119, L158 | 토큰 클래스로 교체됨 | 해결 |
| 분기점 불일치 | `DayMetrics.tsx`, `PackingList.tsx`, `Hero.tsx`, `TripMetrics.tsx`, `TodayCard.tsx`, `travel/[dayId]/page.tsx` | 각 1줄 | 목업 최종값이 `lg`가 아니라 `xl`에서 적용 | 🟡 |

### 3.3 Security Issues

| Severity | File | Location | Issue | Recommendation |
|----------|------|----------|-------|----------------|
| 🟡 Warning | `src/lib/photos.ts` | L3 | 제3자 서버 이미지 직접 연결(상업 이용 허가 없음). Plan·PRD 9장에 기록된 작성자 결정이다 | 팀 소유 사진으로 교체 |
| 🟢 Info | `src/app/layout.tsx` | L10 | 외부 서체 CSS(cdnjs). 읽기 전용 GET이다. `public/sw.js:278`이 교차 출처 요청을 가로채지 않는다 | 없음 |

---

## 4. Performance Analysis

해당 없음. 정적 분석 범위 밖이다.

## 5. Test Coverage

해당 없음. 기존 테스트 회귀만 대상이다. 결과는 2.7 참고.

## 6. Clean Architecture Compliance

기존 계층 유지다. 신규 2개 파일의 위치가 설계 9장과 같다(`src/lib/photos.ts`, `src/components/ui/Photo.tsx`). 의존 방향 위반은 없다.

## 7. Convention Compliance

| 항목 | 결과 |
|------|------|
| `any` | 0건 |
| 새 의존성 | 0건 |
| 옛 토큰 | 0건 |
| 임의 hex(설계 10장) | Act-1 후 0건. 지도·고도 프로필 SVG의 hex는 예외 대상이다 |
| 반경 | 금지 클래스 0건 |
| 새 문구 엠대시 | 새로 추가된 문구 3건에는 없다. diff에 보이는 엠대시는 전부 기존 문구다 |

---

## 8. Overall Score

```
정적 3축(Act-1 후): Structural 100 · Functional 98 · Contract 98 (최초 97 · 94 · 92)
Runtime: 99 (E2E 152/153, vitest 175/175)
Overall: 98.8 (기준 95 통과). Check-0 시점은 96.05
```

---

## 9. Recommended Actions

아래 표는 최초 분석 시점의 목록이다. Act-1 후 상태는 2.9를 따른다. Important 3건(I-1, I-2, I-3)은 모두 해결됐다.

### 9.1 Critical

없음.

### 9.2 Important

| # | 항목 | 위치 | 수정 방법 |
|---|------|------|-----------|
| I-1 | 계약 밖 링크·문구 "오늘 구간 보기" | `src/components/home/Hero.tsx:18-22`, `src/app/page.tsx:26` | (가) 제거: `Hero.tsx` 18~22줄의 `{todayHref ? ... : null}` 블록, 5줄의 `todayHref` prop, 1줄의 `Link` import를 지우고 `page.tsx:26`에서 `todayHref` 전달을 지운다. (나) 유지: PRD 5.5에 SCR-001-EL-16으로 등록하고 handoff 허용 문구와 Plan SC-U6을 고친다. 둘 중 하나를 리드가 정한다 |
| I-2 | 로그인 자격 오류 시 danger 테두리 없음(015-a) | `src/components/auth/LoginForm.tsx:75,96` | 75줄을 `` className={`${INPUT_CLASS}${serverError ? " field-error" : ""}`} ``로, 96줄을 `` className={`${INPUT_CLASS} pr-[68px]${serverError ? " field-error" : ""}`} ``로 바꾼다. `.field-error`는 `globals.css:244-247`에 이미 있다. aria 속성은 건드리지 않는다 |
| I-3 | 1024~1279px에서 열 수가 목업과 다름(003-c, 009-b) | `src/components/day/DayMetrics.tsx:12,14,16`, `src/components/packing/PackingList.tsx:135` | `PackingList.tsx:135`에서 `lg:grid-cols-1 xl:grid-cols-2`를 지운다(`sm:grid-cols-2` 유지, 1024px에서 열 폭 약 264px). `DayMetrics.tsx:12`에서 `lg:grid-cols-2 xl:grid-cols-4`를 지운다. 1024px에서 칸 폭이 약 130px이므로 14줄 카드에 `lg:p-3.5 xl:p-[18px]`, 16줄 `dd`에 `whitespace-nowrap lg:text-[19px]`를 더한다(`xl:text-2xl` 유지) |

### 9.3 Minor

| # | 항목 | 위치 | 수정 방법 |
|---|------|------|-----------|
| M-1 | lg에서 글자 크기가 목업보다 작음 | `Hero.tsx:12`(60/76px), `travel/[dayId]/page.tsx:47`(40/48px), `TripMetrics.tsx:31`(22/24px), `TodayCard.tsx:102`(lg 20px·모바일 15px, 핸드오프 범위 24~30·19~22px) | `xl:` 접두사를 `lg:`로 바꾼다. TodayCard는 단위(km·m·h)를 작은 `span`으로 분리해야 목업 크기를 쓸 수 있다 |
| M-2 | tsx 임의 hex 3건 | `JournalForm.tsx:55`, `PackingList.tsx:119,158` | `globals.css` `@theme`에 `--color-line-strong: #a9b6ac`, `--color-dark-line-strong: #3e5a48`을 추가하고 `border-line-strong`, `border-dark-line-strong`으로 바꾼다 |
| M-3 | 404 사진이 목업과 다름(오프라인과 같은 사진) | `src/lib/photos.ts:42` | `notFound: u("2013/10/chamois-1.jpg")`로 바꾼다 |
| M-4 | D2·D3 문서 미등록 | `docs/PRD.md` 5.5 SCR-001-EL-10, SCR-018 오프라인 배너 | "Day 상세" 버튼 문구와 배너 구분 기호를 PRD에 적는다. 또는 `OfflineBanner.tsx:54`의 " · "를 빼고 `span`에 `block`을 준다 |
| M-5 | 예산 헤더 2단이 640px부터 | `src/app/budget/page.tsx:21-22` | `sm:grid-cols-2 sm:items-center sm:gap-10`을 `lg:`로, `sm:order-2`를 `lg:order-2`로 바꾼다 |
| M-6 | 자격 오류 문구 위치, 검증 배지 색 | `LoginForm.tsx:117-121`, `LegTimeline.tsx:18` | 오류 `p`를 제출 버튼(114줄) 앞으로 옮긴다. 검증 배지는 기존 의미 색을 유지하고 설계서 004-b 문구를 "기본 outline, 확정 success"로 고친다 |
| M-7 | D4 live region 범위 | `offline/page.tsx:9-26`, `not-found.tsx:10-30` | 필요하면 `role="status"`를 배지 `p`에서 바깥 문구 묶음 `div`로 옮긴다 |
| M-8 | 설계서 정정 | `docs/02-design/ui-redesign-forest.design.md` 5.4 | 003-a "오늘 배지" 삭제, 007-a "요약" 삭제, 010-b 모바일 표기 확인, 11.2 체크박스 갱신 |

범위 밖 관찰: `admin/page.tsx:81`의 "12박 예약 상태 편집"은 PRD SCR-007-EL-11 문구 그대로다. 목업과 SCR-008 제목은 "14박"이다. 이번 주기의 회귀는 아니다.

### 9.4 접근성 위험(정적 관찰)

| # | 위험 | 위치 | 설명·수정 |
|---|------|------|-----------|
| A-1 | 사진 위 글자의 스크림 부족(모바일) | `globals.css:220-224`, `QuickLinks.tsx:31-36`, `day:68-71` | `.scrim`은 35%에서 시작한다. 목업 모바일은 20~25%에서 시작한다. 110px 타일에서 라벨 위쪽은 스크림 불투명도가 약 0.26이다. Day 헤더는 제목이 길면 날짜·배지 줄이 스크림이 옅은 구간에 놓인다. axe는 배경 이미지 위 대비를 판정하지 못하므로 테스트에 잡히지 않는다. 수정: `globals.css`에 `@media (max-width: 639px) { .scrim { background: linear-gradient(180deg, rgba(15,28,20,0) 20%, rgba(15,28,20,.88) 100%); } }`를 추가한다 |
| A-2 | 터치 영역 44px | `nav a`, `main a.tap`, `main button`, `button.tap`, `main label.tap` | 정적으로 미달 요소를 찾지 못했다. 근거: `.tap`·`.btn`·`.seg-item` 모두 `min-height/min-width 44px`(`globals.css:102-105,122-123,263-264`), 하단 탭 `h-[52px]`, 비밀번호 표시 버튼은 50px 입력 안 `inset-y-[3px]`로 44px, 지도 Day 행 48px |
| A-3 | 16px 미만 입력 | `JournalForm.tsx:55` | 파일 입력만 `text-sm`(14px)이다. 파일 입력은 포커스 확대 대상이 아니어서 위험은 낮다. 나머지 `input·select·textarea`는 `.field` 또는 base 규칙으로 16px다 |
| A-4 | 글자 대비(단색 배경) | 전체 | 계산값: ink-3/bone 4.9, ink-3/white 5.6, forest-700/sage-200 6.2, white/danger 5.6, danger-ink/sage-200 5.7, white/forest-700 7.9. 4.5 미만 조합은 찾지 못했다. ink-3을 sage-200 위에 쓰면 4.4가 되지만 현재 그런 사용처는 없다 |

---

## 10. Design Document Updates Needed

- [ ] 5.4 003-a에서 "오늘 배지" 삭제(PRD SCR-003-EL-01에 없음)
- [ ] 5.4 007-a에서 "요약" 삭제(PRD SCR-007에 없음, 새 문구 필요)
- [ ] 5.4 004-b 검증 배지 표기 정정
- [ ] PRD 5.5 SCR-001-EL-10에 "Day 상세" 버튼형 링크 반영, I-1 결정에 따라 EL-16 추가 여부 반영
- [ ] Plan SC-U6·handoff.md의 "새 문구 2건" 문장을 실제 결정에 맞게 갱신
- [ ] 11.2 Implementation Order 체크박스 갱신

## 11. Next Steps

- [ ] 리드: 2.7 Runtime 결과와 SC-U3(vitest)·SC-U4·SC-U5 기입, Overall 산출
- [ ] I-1 결정(제거 또는 문서 등록), I-2·I-3 수정
- [ ] R-1 sticky 동작 확인
- [ ] 설계서·PRD 정정 후 Functional 재산정
- [ ] 완료 보고서 작성(`ui-redesign-forest.report.md`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-09-30 | 정적 분석 최초 작성(Runtime은 리드 기입 대기) | Claude(PDCA Check) |
| 0.2 | 2026-09-30 | Act-1 재검증: ⚠️ 7행을 ✅로 갱신, 정적 점수 100·98·98, 2.9 추가 | Claude(PDCA Check) |
