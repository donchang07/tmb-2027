# Handoff: TMB 2027 UI 리디자인 (4a 숲길)

## Overview
TMB 2027 PRD(v4.0, `docs/PRD.md`) 5장 화면 정의의 SCR-001~018 전 화면을 web(1200px)·mobile(390px)로 디자인한 하이파이 목업이다. 기능·데이터·라우트·요소 ID는 PRD 그대로이며, 이 패키지는 **시각 스타일·레이아웃·인터랙션만** 바꾼다. PRD 9장의 시각 시스템(알파인 블루 등)을 이 문서의 토큰으로 대체한다.

## About the Design Files
`design/` 안의 `.dc.html` 파일은 **HTML로 만든 디자인 참고 자료**다. 그대로 배포하는 코드가 아니다. 기존 구현 저장소(Next.js 15.5 App Router + React 19 + TypeScript + Tailwind CSS 4)의 컴포넌트·패턴(`card`, `tap`, `StatusNote`, `DayCard`, `TravelDayCard`, `LodgingCard`, `LegTimeline` 등)을 유지한 채 스타일과 레이아웃을 이 디자인에 맞게 바꾼다. 브라우저에서 파일을 직접 열면 확인할 수 있다(`support.js`가 같은 폴더에 있어야 함). 캔버스는 확대·축소하며 본다.

## Fidelity
**High-fidelity.** 색·서체·간격·모서리·인터랙션은 최종값이다. 예약 상태, 팀 기록 글, 이메일, 예약번호는 **예시값**이고 실제 값은 seed·Supabase에서 온다. 예시 기준일은 원정 중인 2027-08-07(토) Day 4(in_trip)다.

## bkit 적용 가이드
- 권장 feature 슬러그: `ui-redesign-forest` (PRD 14장 feature 분해표에 추가)
- 범위: 스타일·레이아웃 델타만. FR·SC·DATA·RLS·라우트 표(○/ƒ) 변경 0건.
- Design 문서: 이 README를 `docs/02-design/ui-redesign-forest.design.md`의 근거로 사용.
- Check: 17.3 회귀 테스트 전체 + 아래 "검증 체크리스트".
- 스킬: `skills/`의 세 파일을 `.claude/skills/`에 두고 CLAUDE.md에서 참조(요약 적용본, 원본 MIT: Leonxlnx/taste-skill, emilkowalski/skills).
  - `taste-skill`: 다이얼 DESIGN_VARIANCE 5 / MOTION_INTENSITY 3 / VISUAL_DENSITY 4, 액센트 1개·반경 체계 1개·테마 1개 고정, 엠대시 금지
  - `emil-design-eng`: 모션 결정 기준, 이징·시간, 리뷰는 Before/After/Why 표
  - `mobile-native`: safe area, 16px 입력, 탭 하이라이트 제거, `100dvh`, hover 게이팅

## Design Tokens
### Colors
| 토큰 | 값 | 용도 |
|---|---|---|
| `forest-900` | `#17281F` | 기본 글자, 다크 카드(오늘·안전·권장 금액), 주 버튼 배경 |
| `forest-700` | `#2E5A41` | 링크, "확정" 배지, 체크된 체크박스, 보조 강조 |
| `forest-600` | `#4E6B55` | 사진 로딩 전 배경 |
| `bone` | `#EEF1EC` | 페이지 배경, 다크 위 글자 |
| `sage-200` | `#DCE7DD` | 정보 배너(StatusNote info), 필터 탭 트랙, 대안 확정 배지 |
| `line` | `#CBD4CA` | 구분선, 입력 테두리, 보조 버튼 테두리 |
| `line-soft` | `#E4E9E2` / `#DCE2DA` | 카드 내부 구분선 / 헤더 하단선 |
| `ink-2` | `#3C4C42` | 본문 보조 |
| `ink-3` | `#5C6B61` / `#56655B` | 캡션·라벨 |
| `on-dark-muted` | `#A9BBAE` | 다크 카드 위 보조 글자 |
| `dark-line` | `#2F4538` | 다크 카드 내부 구분선 |
| `amber` | `#E3A43B` | **유일한 액센트**: 주 CTA, "오늘" 배지, 진행 바, 현재 탭 막대, 고도선. 위 글자는 `#1B2A20` |
| `warn-bg` / `warn-fg` | `#F3E3C0` / `#4A3408` | 경고 배너, 대기·문의 배지, 오프라인 배너 |
| `danger` | `#B3412E` (글자 `#9A3524`) | 112 버튼, 폼 오류 테두리·문구, 로그아웃 |
| `white` | `#FFFFFF` | 카드 |

예약 상태 배지: 확정 `#2E5A41`/흰 글자 · 대안 확정 `#DCE7DD`/`#17281F` · 대기·문의 `#F3E3C0`/`#4A3408` · 미예약 `#EEF1EC`/`#3C4C42` + 1px `#CBD4CA`.

### Typography
- 서체: **Pretendard Variable 단일** (`'Pretendard Variable', Pretendard, sans-serif`), CDN `orioncactus/pretendard@v1.3.9` dynamic-subset. 숫자는 `font-variant-numeric: tabular-nums`.
- 한국어 줄바꿈: `word-break: keep-all; overflow-wrap: break-word`, h1·h2는 `text-wrap: balance`. 배지·버튼·수치는 `white-space: nowrap`.
| 용도 | web | mobile | 굵기 | 자간 |
|---|---|---|---|---|
| 홈 히어로 h1 | 76px/1.0 | 44px/1.0 | 800 | -0.045em |
| 페이지 h1 | 44px | 28~32px | 800 | -0.035em |
| Day 제목(히어로) | 44px/1.15 | 26px/1.25 | 800 | -0.03em |
| 섹션 h2 | 21~26px | 18~21px | 700 | 0 |
| 지표 숫자 | 24~30px | 19~22px | 700 | -0.02em |
| 본문 | 15~19px/1.6 | 14~16px/1.55 | 400 | 0 |
| 캡션·라벨 | 13px | 12px | 400~600 | 0 |
| 버튼 | 15~16px | 14~16px | 600~700 | 0 |
| 입력 | 16px 이상(iOS 확대 방지) | 16px | 400 | 0 |

### Shape · Spacing · Elevation
- 모서리: **12px 단일 체계**(카드, 버튼, 입력, 배지, 사진). 내부 작은 썸네일 8~9px. 체크박스 7px. 알약 모양은 쓰지 않음.
- 간격: 8px 배수. web 좌우 여백 48px, 헤더 좌우 40px, 카드 패딩 18~32px, 그리드 간격 12~16px. mobile 좌우 16px.
- 그림자: 카드 기본 없음. 호버 카드 `0 14px 28px -18px rgba(20,34,26,.55)`, 드롭다운 `0 18px 40px -16px rgba(20,34,26,.45), 0 0 0 1px rgba(23,40,31,.08)`.
- 사진 위 글자: `linear-gradient(180deg, rgba(15,28,20,0) 35~40%, rgba(15,28,20,.82~.88) 100%)` 스크림.

## Interactions & Behavior
emil-design-eng · mobile-native 기준. 각 파일 `<helmet><style>`에 CSS 원본이 있다.
- **누름**: 버튼·탭 `:active { transform: scale(0.97) }`, 카드 0.98, 목록 행 0.99. `transition: transform 160ms cubic-bezier(0.23,1,0.32,1)`.
- **호버**(`@media (hover:hover) and (pointer:fine)` 안에서만): 버튼 `filter: brightness(1.08)`, 사진 카드 `translateY(-3px)` + 호버 그림자, 목록 행 배경 `rgba(23,40,31,.04)`, 헤더 링크 밑줄(1.5px, offset 6px).
- **등장**: `ix-in` = opacity 0·translateY(12px) → 0, 420ms `cubic-bezier(0.23,1,0.32,1)`. 순서(`data-enter` 1~5) 60ms 간격. 사진 `ix-fade` 600ms ease. 목록(`data-stagger`) 자식 360ms, 40ms 간격, 9번째부터 320ms 고정. 첫 로드에만.
- **드롭다운**(SCR-018 계정 메뉴): 트리거 쪽(top right) 기준 scale 0.95→1 + opacity, 180ms. Esc 닫기, 포커스 복귀.
- **모션 줄이기**: `prefers-reduced-motion: reduce`에서 모든 등장은 200ms 페이드만.
- **모바일**: `-webkit-tap-highlight-color: transparent`, 컨트롤에 `touch-action: manipulation`·`user-select: none`, 가로 스크롤은 `scroll-snap-type: x mandatory`, 하단 탭 아래 safe-area 패딩(목업 26px), 터치 영역 44px 이상, `viewport-fit=cover`.
- **포커스**: `:focus-visible { outline: 2px solid currentColor; outline-offset: 3px }`.

## 공통 컴포넌트
- **TMB Header** (`design/TMB Header.dc.html`, SCR-018 NAV-001·007~012): props `mobile`, `account`(없으면 "로그인"), `offline`. web 68px(좌 "TMB 2027" 20/800 + "걸어야 산다!" 14px, 우 링크 15/500 간격 28px + 로그인 버튼 `#17281F`). mobile 56px(로고 + 로그인). 로그인 상태는 이니셜 원 + 이메일 앞 12자. 오프라인 배너는 헤더 아래 `warn` 색.
- **TMB TabBar** (`design/TMB TabBar.dc.html`, NAV-002~006): 5칸 grid, 흰 배경, 상단 1px `#DCE2DA`, 13px/600. 현재 탭은 `#17281F`/700 + 위에 24×3px 앰버 막대, `aria-current="page"`. 640px 미만만 표시.

## Screens (파일·앵커)
| SCR | 화면 | 파일#앵커 | 핵심 레이아웃 |
|---|---|---|---|
| 001 | 홈 | Screens 1 `#scr-001` | 좌 문구(5fr)/우 사진(7fr) 히어로 → 칸 없는 지표 줄 → 다크 "오늘" 카드(좌 구간·숙박, 우 지표 4 + 고도 프로필) → 사진 벤토 5칸(일정 2×2) |
| 002 | 전체 일정 | Screens 1 `#scr-002` | 제목 + 세그먼트 탭(전체/이동/트레킹) → web 3열 사진 카드 15개 / mobile 썸네일 행. 오늘 카드 앰버 2px 외곽선 |
| 003 | Day 상세 | Screens 1 `#scr-003` | 전면 사진 헤더 → 좌(지표 4·경로 고도+지점 6+사진 3·지도 버튼 3) / 우(식사·숙박·다크 안전+112·데이터 상태·팀 기록 링크·이전/다음) |
| 004 | 이동일 상세 | Screens 1 `#scr-004` | 좌 문구/우 사진 → 세로선 구간 타임라인(모드·검증 배지·출발/도착/소요·예매·fallback) + 숙박 카드·고도 주의·데이터 상태 |
| 005 | 개요 지도 | Screens 2 `#scr-005` | 정보 배너 → 800:620 SVG(Day별 12색 선, 고개 ▲ 앰버, 숙박 ●) + 기호 범례 + 12 Day 행(색 막대·썸네일) → 출처 |
| 006 | 예산 | Screens 2 `#scr-006` | 제목/사진 → 경고 배너 → 좌 예산 표(10항목·소계·예비비·합계 다크 행) / 우 권장 금액(다크)·환율·가정·참고 |
| 007 | 관리자 홈 | Screens 3 `#scr-007` | web 로그인됨(상태 배너·요약 4·편집/로그아웃) · mobile 리더 로그인 폼 |
| 008 | 예약·숙박 편집 | Screens 3 `#scr-008` | 14박 표(썸네일·상태 배지·편집) → 편집 패널(앰버 테두리, 예약 2열 + 숙박 정보 2열) · mobile 카드 목록 |
| 009 | 준비물 | Screens 2 `#scr-009` | web 좌 고정(사진·제목·로그인 안내·다크 진행 카드) + 우 카테고리 7개 2열 · mobile 계정 저장 상태 |
| 010 | 여행 기록 | Screens 2 `#scr-010` | 사진 헤더 → 안내 배너 → 12 Day 4열 사진 카드(기록 건수) |
| 011 | Day 기록 | Screens 2 `#scr-011` | 좌 Day 헤더·로그인 배너·작성 폼(200자·사진·저장) / 우 타임라인(사진+글+작성자·시각) |
| 012 | 팀원 로그인 | Screens 3 `#scr-012` | web 폼 + 발송 완료 문구 · mobile 링크 오류 배너 |
| 013 | 오프라인 | Screens 3 `#scr-013` | 오프라인 헤더 배너 → 안내 → 다시 시도 → 비상 정보(112) |
| 014 | 찾을 수 없음 | Screens 3 `#scr-014` | 전면 사진 + 경고 배지 + "길을 벗어났습니다." + 홈으로 |
| 015 | 로그인 | Screens 3 `#scr-015` | web 사진/폼 448px(next 안내·이메일·비밀번호 표시 토글) · mobile 자격 오류(빨간 테두리, 입력 유지) |
| 016 | 회원가입 | Screens 3 `#scr-016` | web 폼(8자 이상 도움말) · mobile 가입 완료 안내 + 바로 이동 |
| 017 | 인증 콜백 | Screens 3 `#scr-017` | UI 없음. 흐름도(성공 next / 실패 → 012·007·015 error=auth) + 실패 도착 화면 예시 |
| 018 | 공통 메뉴 | Screens 3 `#scr-018` | 비로그인·로그인+드롭다운·세션 만료 알림·오프라인 배너 상태별 |

모든 문구와 요소 ID는 PRD 5.5 UI 요소 계약과 같다. 목업에 새로 넣은 문구는 SCR-014 제목 "길을 벗어났습니다."와 SCR-013 제목 "아직 이 기기에 저장되지 않은 화면입니다." 두 개뿐이다(PRD 문구는 배지로 유지).

## State Management
PRD 그대로. 목업은 아래 상태를 보여 준다: 오늘 상태 in_trip(001·002), 비로그인/로그인(009 web/mobile), 편집 패널 열림(008), 링크 발송 완료·링크 오류(012), 자격 오류(015), 가입 완료(016), 드롭다운 열림·세션 만료(018), 오프라인(013·018).

## Assets
- 사진: Mont Blanc Treks 갤러리(montblanctreks.com.au/montblancimages)에서 **임시로 직접 연결**. 상업 이용 허가 없음. PRD 9장 규칙에 따라 **팀 소유 사진으로 교체 필수**. Day별 매핑은 `Screens 1` 로직의 `DAYS` 배열과 `Screens 2`의 `DAYN` 배열 참고(D1 비오나세 다리, D4 콜 드 라 세뉴, D10 트리앙 빙하 등). 교체 전까지 사진 칸은 `#4E6B55` 배경.
- 아이콘: 사용하지 않음(텍스트·기호만). 필요 시 Phosphor 한 세트로 통일.
- 지도: 팀 자체 SVG(개략 좌표).

## 검증 체크리스트
- 360px 이상 가로 스크롤 없음, 1440px에서 콘텐츠 폭 유지
- 버튼·탭·체크박스·목록 행 44×44px 이상
- 글자 대비 4.5:1 이상(앰버 위 글자는 `#1B2A20`)
- 배지·버튼·수치 한 줄 유지, 제목 단어 중간 줄바꿈 없음
- hover는 마우스 환경에서만, 모션 줄이기 시 페이드만
- 실제 폰에서 확인: 탭 하이라이트, safe area, 입력 확대, 스냅 스크롤

## Files
- `design/TMB 2027 Screens 1.dc.html` — SCR-001~004
- `design/TMB 2027 Screens 2.dc.html` — SCR-005·006·009·010·011
- `design/TMB 2027 Screens 3.dc.html` — SCR-007·008·012~018
- `design/TMB Header.dc.html`, `design/TMB TabBar.dc.html` — 공통 헤더·하단 탭
- `design/support.js` — 목업 실행용 런타임(구현에는 불필요)
- `skills/` — taste-skill, emil-design-eng, mobile-native 적용본
- `docs/PRD.md` — 기준 PRD v4.0
