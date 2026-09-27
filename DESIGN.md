# DESIGN.md — Apple 스타일 디자인 시스템

TMB 2027 웹 앱과 이 프로젝트에서 만드는 문서·슬라이드에 적용하는 디자인 규칙입니다.
애플 키노트와 제품 페이지의 디자인 방식을 따릅니다. 큰 글자, 넉넉한 여백, 무채색 위주의 화면에 강조색은 블루 하나만 씁니다.
**스타일만 가져옵니다.** Apple 로고·상표·제품 사진·SF 폰트 파일은 쓰지 않습니다.

- 원본 규칙: claude.ai 스킬 `apple-design-system`(PPT·Word용), 디자인 시스템 아티팩트 https://claude.ai/artifact/GyykUE81AcaafZ9GwM9uQs
- 다시 불러오는 법: 이 저장소에서 `/apple-design`을 입력하면(`.claude/skills/apple-design/SKILL.md`) 이 문서를 기준으로 작업합니다.
- 규칙이 서로 부딪히면 **이 문서 → 원본 스킬** 순서로 따릅니다. 웹 앱에만 필요한 조정은 §4에 따로 적었습니다.

---

## 1. 원칙

- **한 화면, 한 메시지.** 내용이 많으면 나눕니다.
- **여백이 곧 디자인입니다.** 화면 면적의 40% 이상을 비웁니다.
- **위계는 크기와 굵기로만 만듭니다.** 밑줄, 장식선, 색 막대는 쓰지 않습니다.
- **강조색은 블루 하나입니다.** 나머지는 검정·회색·흰색으로 처리합니다.
- **깊이는 면으로 표현합니다.** 그림자와 그라데이션 대신 흰 바탕과 Surface(#F5F5F7) 면의 차이로 나눕니다.

## 2. 배경 규칙

| 매체 | 블랙 (`#000000`) | 화이트 (`#FFFFFF`) |
|---|---|---|
| 슬라이드 | 표지(첫 장)와 마지막 장 | 나머지 모든 장 |
| Word 문서 | 커버 페이지 (1셀 표로 만듦) | 본문 전체 |
| 웹 앱 | 홈 첫 화면의 히어로 한 곳 | 페이지 배경 전체 |

- 본문 중간에 다크 화면을 끼워 넣지 않습니다. 사용자가 명시적으로 요청한 경우만 예외입니다.
- 크림·베이지·연한 유채색 배경은 쓰지 않습니다.
- 블랙 위 글자색: 주 텍스트 White, 보조 Gray `#86868B`, 강조 Blue.
- 화이트 위 글자색: 주 텍스트 Ink `#1D1D1F`, 보조 Gray(웹은 §4의 `#6E6E73`), 강조 Blue.

## 3. 색상 토큰

| 토큰 | 값 | 용도 |
|---|---|---|
| Ink | `#1D1D1F` | 화이트·Surface 위 주 텍스트, 표 헤더 채움 |
| Gray | `#86868B` | 보조 텍스트·캡션 (문서·슬라이드). 화이트 위 3.6:1이라 본문 크기에는 부족합니다 |
| Gray Text | `#6E6E73` | 웹 앱 보조 텍스트 (화이트 위 5.1:1, Surface 위 4.7:1) |
| Light | `#D2D2D7` | 꼭 필요한 얇은 구분선 (1px 이하) |
| Card Border | `#E5E5EA` | 카드의 선택적 테두리 |
| Surface | `#F5F5F7` | 화이트 위 카드·콜아웃 면 |
| Blue | `#0071E3` | **유일한 강조색.** 버튼 채움, 대형 숫자, 아이브라우 라벨, 활성 상태 |
| Blue Link | `#0066CC` | 작은 링크 글자 (Surface 위에서도 5.1:1) |
| Black | `#000000` | 표지·마지막 장·히어로 배경 전용 |
| White | `#FFFFFF` | 본문 배경, 블랙·Blue 위 글자 |
| Red (웹 전용 예외) | `#D70015` | 안전·비상·오류 표시에만 씀 (§4 참고) |

**대비 기준 (WCAG 2)**: 본문 글자 4.5:1, 24px 이상 또는 굵은 19px 이상 3:1.

| 조합 | 대비 | 판정 |
|---|---|---|
| Ink / White | 16.8:1 | 통과 |
| Ink / Surface | 15.5:1 | 통과 |
| Gray Text / White | 5.1:1 | 통과 |
| Gray Text / Surface | 4.7:1 | 통과 |
| Gray / White | 3.6:1 | 큰 글자·캡션만 |
| Blue / White | 4.7:1 | 통과 |
| White / Blue (버튼) | 4.7:1 | 통과 |
| Blue / Surface | 4.3:1 | 큰 글자만. 작은 글자는 Blue Link |
| Blue Link / Surface | 5.1:1 | 통과 |
| Blue / Black | 4.5:1 미만 (4.47) | 큰 글자만 |
| Gray / Black | 5.8:1 | 통과 |
| Red / White | 5.4:1 | 통과 |
| White / Red (버튼) | 5.4:1 | 통과 |

## 4. 웹 앱 적용 (TMB 2027)

### 4.1 Tailwind 토큰 매핑

`src/app/globals.css`의 `@theme`는 기존 클래스 이름을 유지하고 값만 바꿉니다. 새 코드도 이 이름을 씁니다.

| Tailwind 토큰 | 값 | 의미 | 쓰는 곳 |
|---|---|---|---|
| `alpine` | `#0071E3` | Blue | `bg-alpine`(주 버튼·활성 탭), 큰 숫자, 아이브라우 |
| `alpine-dark` | `#0066CC` | Blue Link | `text-alpine-dark`(링크, 작은 강조 글자), 성공 메시지 |
| `ink` | `#1D1D1F` | Ink | 주 텍스트, 표 헤더 `bg-ink text-white` |
| `rock` | `#6E6E73` | Gray Text | `text-rock` 보조 텍스트, `border-rock/20` 구분선 |
| `snow` | `#F5F5F7` | Surface | 카드 면, 입력 칸이 아닌 면 |
| `safety` | `#D70015` | Red | 안전·비상·오류에만 |
| `alpine-bright` | `#2997FF` | 블랙 위 Blue (7.0:1) | 히어로 아이브라우 |
| `mist` | `#86868B` | Gray | 블랙 위 보조 텍스트 |
| `--radius-card` | `14px` | 카드 모서리 | `.card` |

- 작은 글자에 `text-alpine`을 쓰지 않습니다. 작은 글자는 `text-alpine-dark`, 큰 숫자·굵은 제목만 `text-alpine`을 씁니다.
- Tailwind 기본 팔레트(`amber-*`, `emerald-*`, `red-*`, `blue-*` 등)는 쓰지 않습니다.

### 4.2 웹 앱에만 있는 조정

원본 규칙은 PPT·Word 문서용입니다. 앱에서는 다음 두 가지를 조정합니다.

- **보조 텍스트는 Gray Text `#6E6E73`을 씁니다.** 원본 Gray `#86868B`는 화이트 위 대비가 3.6:1이라 앱의 작은 글자에 쓰면 접근성 검사(axe)에 걸립니다.
- **안전 표시에는 Red 하나를 예외로 씁니다.** 산악 원정 앱이라 비상 전화, 안전 대안, 오류처럼 놓치면 안 되는 정보가 있습니다.
  - Red는 이 용도에만 씁니다.
  - 색만으로 뜻을 전하지 않습니다. 항상 "비상", "오류" 같은 글자를 함께 씁니다.
  - 주의(warn)와 성공(success)에는 따로 색을 두지 않습니다. 주의는 Ink 굵은 글자, 성공은 Blue Link 글자로 표시하고, 문구가 뜻을 전합니다.
  - 지도의 Day별 경로 색은 데이터를 구분하는 색이라 이 규칙에서 제외합니다.

### 4.3 서체

- `Pretendard Variable`을 씁니다. npm 패키지 `pretendard`의 dynamic-subset CSS를 `src/app/layout.tsx`에서 불러오므로, 화면에 나오는 글자 조각만 내려받습니다.
- 폴백 순서: Pretendard Variable → Pretendard → -apple-system → system-ui → Apple SD Gothic Neo → Noto Sans KR → sans-serif.
- 숫자는 `tabular-nums`(고정폭 숫자)로 표시합니다.

| 역할 | 모바일 / 데스크톱 | 굵기 | 예 |
|---|---|---|---|
| 히어로 | 40px / 56px, 자간 -0.02em | Bold 700 | 홈 슬로건 |
| 페이지 제목 (h1) | 28px / 32px | Bold 700 | 일정, 예산 |
| 섹션 제목 (h2) | 20–22px | Bold 700 | 카드 제목 |
| 본문 | 16–17px, 줄 간격 1.5 | Regular 400 | |
| 보조 | 14px | Regular 400, `text-rock` | 설명 |
| 캡션 | 12px | Regular 400, `text-rock` | 확인 기준일 |
| 아이브라우 | 12–13px, 자간 0.08em, 대문자 | Semibold 600, `text-alpine-dark` | 제목 위 라벨 |

### 4.4 레이아웃

- 본문 폭은 `max-w-3xl`, 좌우 여백 16px(`px-4`)입니다.
- 카드 사이 간격은 16px 이상, 카드 안쪽 여백은 16–24px입니다.
- 터치 대상은 최소 44×44px(`.tap`)입니다.
- 상단 헤더와 하단 탭바는 반투명 흰색(`bg-white/80` + `backdrop-blur`)에 아래쪽·위쪽 구분선 `border-rock/15` 한 줄만 둡니다.

### 4.5 컴포넌트 패턴

- **카드 `.card`**: Surface 면 + `--radius-card`. 테두리와 그림자는 없습니다. 카드 안에 다시 면이 필요하면 `bg-white`를 씁니다.
- **주 버튼**: `bg-alpine text-white rounded-full`, 글자 Semibold.
- **보조 버튼**: `border border-rock/30 text-ink rounded-full`, 또는 글자만 있는 링크 `text-alpine-dark` + "›".
- **링크**: `text-alpine-dark`, 밑줄은 hover·focus 때만.
- **배지 `Badge`**: `rounded-full` 알약형, `bg-white` + `ring-1 ring-rock/20` 윤곽선. 톤은 글자색으로만 구분합니다: neutral `text-rock`, alpine·성공 `text-alpine-dark`, safety `text-safety`, 주의 `text-ink font-semibold`. 색을 깐 배지(`bg-alpine/10` 등)는 Surface 위에서 대비가 4.5:1 아래로 떨어져 쓰지 않습니다.
- **콜아웃·안내 `StatusNote`**: Surface 면에 제목과 본문만 둡니다. 왼쪽 색 막대와 테두리는 쓰지 않습니다. 오류일 때만 제목을 `text-safety`로 씁니다.
- **안전 카드**: 제목 위에 `text-safety` 아이브라우("안전")를 두고, 비상 전화 버튼만 `bg-safety text-white`로 채웁니다.
- **표**: 헤더 행 `bg-ink text-white`, 세로선은 없고 `divide-rock/15` 가로선만 둡니다. 강조할 셀은 글자만 `text-alpine-dark font-semibold`로 씁니다.
- **히어로**: 블랙 면에 흰 대형 제목을 가운데 정렬로 둡니다. 위 아이브라우는 `text-alpine-bright`, 설명은 `text-mist`입니다.
- **헤더 로고**: `TMB 2027`은 `text-ink` Semibold 글자로만 씁니다. 로고 이미지는 없습니다.
- **스켈레톤**: Surface 단색이 천천히 깜박이게 합니다(`animate-pulse`). 그라데이션 줄무늬(shimmer)는 쓰지 않습니다.
- **포커스 링**: `outline: 3px solid #0071E3`, `outline-offset: 2px`. 화이트·Surface 위 모두 3:1 이상입니다.
- **오프라인 배너**: Ink 면에 흰 글자.

## 5. 슬라이드 (PPTX 16:9)

- 레이아웃 `LAYOUT_WIDE`(13.333 × 7.5인치). 좌우 여백 0.9인치 이상, 요소 간격 0.3인치 이상.
- 덱 구조: 블랙 표지 → 화이트 본문(선언 / 카드 / 데이터) → 블랙 클로징.

| 요소 | 크기 | 굵기·색 |
|---|---|---|
| 표지 히어로 | 72–96pt | Bold, 중앙 |
| 한 줄 선언 | 44–54pt | Bold, 중앙 |
| 본문 제목 | 36–40pt | Bold, 좌측 |
| 카드 제목 | 20–24pt | Bold |
| 본문 | 14–16pt | Regular, 좌측 |
| 캡션 | 12–13pt | Regular, Gray |
| 대형 숫자 | 110–130pt | Bold, Blue, 중앙 |
| 아이브라우 | 12–13pt | Bold, Blue, 자간 확대 |

- 카드: `roundRect`, `rectRadius` 0.14–0.16, Surface 채움, 테두리 없음.
- pptxgenjs 색상 값에는 `#`를 붙이지 않습니다(`"0071E3"`). 붙이면 파일이 손상됩니다. 자간은 `letterSpacing`이 아니라 `charSpacing`으로 지정합니다.
- 폰트가 설치되지 않은 PC를 대비해 텍스트 상자 폭에 약 10% 여유를 둡니다.

## 6. Word 문서 (DOCX)

- 여백은 상하좌우 1인치, 줄 간격은 1.5–1.7입니다.
- 텍스트 런은 `name`, `cs`, `eastAsia`, `hAnsi` 네 가지 모두 Pretendard로 지정합니다.

| 요소 | 크기 | 굵기·색 |
|---|---|---|
| 커버 히어로 | 60–66pt | Bold, White |
| H1 (Part/Chapter) | 24pt | Bold |
| H2 (섹션) | 20pt | Bold |
| H3 (하위 섹션) | 11pt | Bold, Blue, 자간 확대 |
| 본문 | 11pt | Regular |
| 캡션 | 9pt | Regular, Gray |

- **블랙 커버**: 첫 페이지를 채우는 1셀 표(행 높이 12500 twip 이상, `atLeast`)에 `000000` 채움을 주고, 표 테두리는 모두 없앱니다.
- **목록은 모두 글머리 기호(•)로 씁니다.** Word 번호 목록은 문서 전체에서 번호가 이어지는 문제가 있어 쓰지 않습니다. 순서가 필요하면 "단계 1·2·3"을 글자로 씁니다. 글머리 기호는 `LevelFormat.BULLET`으로 등록하고 색은 Blue로 합니다. 텍스트 안에 `•` 문자를 직접 넣지 않습니다.
- **표**: 헤더 행 Ink 채움 + White 글자, 짝수 행 Surface, 가로선만 Light.
- 머리글·바닥글은 Gray로 눈에 띄지 않게 둡니다.

## 7. 서체 설치 안내 (문서·슬라이드)

- Pretendard는 시스템 기본 폰트가 아닙니다. 발표 PC와 문서를 여는 사람의 PC에 설치되어 있어야 합니다.
- 공식 배포: https://github.com/orioncactus/pretendard/releases (SIL Open Font License 1.1)
- Windows: `.otf` 파일을 오른쪽 클릭한 뒤 "모든 사용자에 대해 설치"를 누릅니다.
- 파일을 전달할 때 설치 안내를 함께 보냅니다. 설치되지 않은 환경에서 글자가 넘치지 않는지 확인합니다.

## 8. 금지 사항

- 제목 아래 장식선·헤어라인
- 색 막대, 카드 왼쪽 색 줄(`border-l-4` 등)
- Blue 외의 유채색 (웹 앱의 Red 예외와 지도 데이터 색은 §4.2 참고)
- 그라데이션, 큰 그림자(`shadow-md` 이상), 3D 효과
- 크림·베이지 배경
- Apple 로고·상표·제품 사진
- 본문의 가운데 정렬 남용 (히어로·선언·대형 숫자만 가운데 정렬)
- 이모지 장식
- Word 번호 목록

## 9. 검수 체크리스트

**공통**
- [ ] 블랙은 표지·마지막 장·히어로에만 있는가
- [ ] 유채색이 Blue 하나뿐인가 (웹: Red는 안전·오류에만 있는가)
- [ ] 글자 대비가 §3 표 기준을 넘는가
- [ ] 장식선, 색 막대, 그라데이션, 큰 그림자가 없는가
- [ ] Pretendard로 렌더링되는가

**웹 앱**
- [ ] `npm run typecheck`, `npm test` 통과
- [ ] `npm run test:e2e`의 axe 접근성 검사 통과
- [ ] 360px 모바일 폭에서 가로 스크롤이 없는가

**PPTX / DOCX**
- [ ] 슬라이드를 이미지로 렌더링해 넘침과 겹침이 없는지 확인
- [ ] DOCX를 PDF로 변환해 커버 표가 첫 페이지를 덮는지, 헤딩 크기가 24 > 20 > 11pt 순서인지 확인
