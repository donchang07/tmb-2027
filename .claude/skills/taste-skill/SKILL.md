---
name: design-taste-frontend
source: https://github.com/Leonxlnx/taste-skill (skills/taste-skill/SKILL.md, MIT License, Copyright (c) 2026 Leonxlnx)
note: 이 프로젝트(HTML Design Component 목업) 환경에 맞게 요약·발췌한 사본. React/Tailwind/GSAP/npm 관련 규칙은 이 환경에서 적용 불가하므로 제외.
---

# tasteskill: Anti-Slop Frontend Skill (프로젝트 적용본)

## 0. Brief Inference
- 작업 전 한 줄 "Design Read"를 먼저 선언: "Reading this as: <page kind> for <audience>, with a <vibe> language, leaning toward <aesthetic family>."
- 신호: 페이지 종류, 사용자가 쓴 분위기 단어, 참고 URL/브랜드, 대상 사용자, 기존 브랜드 자산, 조용한 제약(접근성·공공·안전).
- 모호하면 질문은 딱 하나. 추론 가능하면 묻지 말고 진행.
- 기본값 금지: AI 보라 그라디언트, 어두운 메시 위 중앙 히어로, 똑같은 카드 3개, 무차별 글래스모피즘, 무한 루프 마이크로 애니메이션, Inter + slate-900.

## 1. 세 개의 다이얼
- DESIGN_VARIANCE (1 대칭 ~ 10 비대칭), MOTION_INTENSITY (1 정적 ~ 10 시네마틱), VISUAL_DENSITY (1 갤러리 ~ 10 조종석)
- 기본 8/6/4. minimalist·calm·editorial → 5-6/3-4/2-3. trust-first·공공·안전 → 3-4/2-3/4-5.
- TMB 2027 앱 권장: 안전·산행 중 사용(trust-first) + 풍경 감성 → VARIANCE 5 / MOTION 3 / DENSITY 4.

## 4.1 Typography
- 헤드라인은 촘촘한 자간·좁은 행간, 본문 max 65ch.
- Inter 기본 사용 지양. 세리프는 기본값으로 매우 지양: 브랜드가 명시했거나 진짜 에디토리얼/헤리티지일 때만, 이유를 설명할 수 있을 때만.
- Fraunces, Instrument Serif 기본 사용 금지.
- 강조는 같은 패밀리의 bold/italic으로. 산세리프 헤드라인에 세리프 단어 섞기 금지.
- 이탤릭 디스플레이의 디센더(y g j p q) 잘림 주의: 행간 1.1 이상.

## 4.2 Color
- 액센트는 1개, 채도 80% 미만. 페이지 전체에서 같은 액센트 고정(Color Consistency Lock).
- 회색은 따뜻한/차가운 계열 중 하나만.
- 프리미엄 소비재 기본 팔레트(크림/베이지 배경 + 브라스·클레이·옥스블러드 + 에스프레소 텍스트) 기본 사용 금지. 대안: Forest(짙은 녹색+본+앰버), Cobalt+Cream, Terracotta+Slate, Olive+Brick+Paper, 모노크롬+단일 포인트.

## 4.3 Layout
- VARIANCE > 4이면 중앙 정렬 히어로 지양: 좌우 분할, 좌측 텍스트/우측 에셋, 비대칭 여백.

## 4.4 Shape / Cards
- 카드는 위계가 실제로 있을 때만. 아니면 border-top, divide, 여백으로 묶기.
- 그림자는 배경 색조로 틴트. 밝은 배경에 순검정 그림자 금지.
- Shape Consistency Lock: 모서리 반경 체계를 하나로(전부 각짐 / 전부 12-16px / 인터랙티브는 pill). 섞으려면 문서화된 규칙 필요.

## 4.5 States
- 로딩(레이아웃 모양 스켈레톤), 빈 상태, 오류 상태, :active 눌림 피드백까지 설계.
- 버튼·폼 대비 WCAG AA(본문 4.5:1, 18px+ 3:1). 사진 위 고스트 버튼은 스크림/테두리 필수.
- CTA 라벨은 데스크톱에서 한 줄. 같은 의도의 CTA 라벨은 페이지에서 하나로 통일.
- 라벨은 입력 위, 오류는 아래. placeholder를 라벨로 쓰지 않기.

## 4.7 Layout Discipline
- 히어로는 첫 화면 안에: 헤드라인 최대 2줄, 서브 텍스트 20단어 이내, CTA 스크롤 없이 보임.
- 히어로 텍스트 요소 최대 4개(아이브로우 0~1, 헤드라인, 서브, CTA 1+1).
- 내비게이션은 데스크톱 한 줄, 높이 64-80px.
- 같은 섹션 레이아웃 패밀리는 페이지당 1회. 좌우 지그재그는 연속 2개까지.
- 아이브로우(작은 대문자·넓은 자간 라벨)는 3개 섹션당 최대 1개.
- 왼쪽 큰 헤드라인 + 오른쪽 작은 설명 문단 분할 헤더 기본 금지.
- 벤토/그리드 셀 수 = 콘텐츠 수. 빈 칸 금지. 최소 2-3칸은 이미지·틴트 등 시각적 변화.
- 다단 레이아웃은 768px 미만 폴백을 명시.

## 4.8 Images
- 랜딩은 시각 제품. 텍스트만 있는 페이지는 미완성.
- 이미지 생성 도구가 없으면 실제 사진 → 그래도 없으면 라벨 붙은 플레이스홀더 + 사용자에게 요청.
- 손으로 그린 장식 SVG, div로 만든 가짜 스크린샷 금지.

## 4.9 Content
- 섹션당 짧은 헤드라인(8단어 이내) + 짧은 문단(25단어 이내) + 시각 1개 또는 CTA 1개.
- 5개 초과 목록은 그룹화·카드·탭·가로 스크롤 등 다른 컴포넌트로.
- 가짜 정밀 숫자 금지: 실제 데이터이거나 "예시"로 표시.
- 출시 전 모든 문구 자체 점검: 어색하거나 지시 대상이 불분명하거나 AI스러운 말장난은 평범한 기능 문장으로 교체.
- 톤 레지스터는 페이지당 하나.

## 4.10 Quotes
- 인용은 3줄 이내, 이름+역할 표기, 인용문 안 엠대시 금지.

## 4.11 Theme Lock
- 페이지는 라이트/다크 중 하나로 고정. 섹션마다 뒤집지 않기.

## 5. Motion
- 모든 애니메이션은 이유(위계·스토리·피드백·상태 변화)를 한 문장으로 말할 수 있어야 함.
- 마키는 페이지당 최대 1개. transform/opacity만 애니메이트. prefers-reduced-motion 존중.

## 9.G
- 엠대시(—) 사용 금지.

## Pre-Flight Check (출시 전)
- Design Read 선언했는가 / 다이얼과 결과가 일치하는가
- 액센트 1개·반경 체계 1개·테마 1개 유지
- 히어로 규칙, 아이브로우 개수, 레이아웃 반복, CTA 중복·줄바꿈
- 대비 AA, 모바일 폴백, 실제 이미지 여부, 문구 자체 점검, 엠대시 0개
