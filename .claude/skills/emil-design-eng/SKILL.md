---
name: emil-design-eng
source: https://github.com/emilkowalski/skills (skills/emil-design-eng/SKILL.md, MIT License, Emil Kowalski)
note: 이 프로젝트(HTML Design Component 목업)에 맞춰 요약한 사본. Framer Motion·React 코드 예시는 원리만 남김.
---

# Design Engineering (프로젝트 적용본)

## 철학
- 보이지 않는 디테일이 쌓여 "제대로 된 느낌"을 만든다. 기능이 사용자가 예상한 대로 동작하면 아무도 의식하지 않는다. 그게 목표.
- 좋은 기본값이 옵션보다 중요하다.

## 리뷰 형식 (필수)
UI를 리뷰할 때는 반드시 하나의 표로: | Before | After | Why |

## 애니메이션 결정 프레임워크
1. 애니메이션을 해야 하나? 빈도로 판단
   - 하루 100회 이상(단축키, 반복 토글): 절대 없음
   - 하루 수십 회(hover, 목록 이동): 제거하거나 크게 줄임
   - 가끔(모달, 드로어, 토스트): 표준 애니메이션
   - 드물게/처음(온보딩, 완료 축하): 즐거움 추가 가능
   - 키보드로 시작한 동작은 애니메이션 금지
2. 목적: 공간 일관성, 상태 표시, 설명, 피드백, 급격한 변화 완화. "멋있어서"는 이유가 아님.
3. 이징
   - 들어오고 나가는 요소: ease-out → `cubic-bezier(0.23, 1, 0.32, 1)`
   - 화면 안에서 이동/변형: ease-in-out → `cubic-bezier(0.77, 0, 0.175, 1)`
   - 드로어/시트(iOS 느낌): `cubic-bezier(0.32, 0.72, 0, 1)`
   - hover/색 변화: ease, 계속 도는 것(진행바): linear
   - UI에 ease-in 금지 (시작이 느려 둔하게 느껴짐)
4. 속도: 버튼 누름 100-160ms, 툴팁 125-200ms, 드롭다운 150-250ms, 모달/드로어 200-500ms. UI 애니메이션은 300ms 이하.

## 컴포넌트 원칙
- 누를 수 있는 모든 요소에 `:active { transform: scale(0.97) }` + `transition: transform 160ms ease-out`. (0.95~0.98)
- scale(0)에서 시작 금지 → `scale(0.95); opacity: 0`에서 시작.
- 팝오버는 트리거 위치에서 커짐(transform-origin). 모달은 예외, 중앙 유지.
- 첫 툴팁 이후 인접 툴팁은 지연·애니메이션 없이 즉시.
- 자주 트리거되는 UI는 keyframes 대신 transition (중간에 끊겨도 자연스럽게 이어짐).
- 크로스페이드가 어색하면 전환 중 `filter: blur(2px)` 이하로 섞기.
- 진입 애니메이션은 `@starting-style` 사용 가능.
- 들어올 때보다 나갈 때를 더 빠르게. 사용자가 결정하는 곳은 느리게, 시스템이 응답하는 곳은 빠르게.
- 여러 요소가 함께 들어오면 30-80ms 간격 stagger. 인터랙션을 막지 않기.
- 어울림: 모션의 성격을 컴포넌트·페이지의 분위기에 맞춘다. 전문적인 화면은 짧고 선명하게.

## 테두리·그림자
- 딱딱한 실선 테두리 대신 반투명 그림자를 고려.

## 성능
- transform과 opacity만 애니메이트. padding/margin/height/width 금지.
- CSS 변수는 자식 전체 재계산을 유발하므로 드래그 중에는 요소의 transform을 직접 갱신.
- 정해진 애니메이션은 CSS, 동적/중단 가능한 것은 JS(WAAPI 권장).

## 제스처
- 임계 거리 대신 속도(>0.11)로도 닫기 허용. 경계 너머 드래그는 감쇠(friction), 딱 멈추지 않기. 드래그 중 포인터 캡처, 멀티터치 무시.

## 접근성
- prefers-reduced-motion: 움직임·위치 애니메이션 제거, opacity·색 전환은 유지.
- hover 효과는 `@media (hover: hover) and (pointer: fine)` 안에서만.

## 리뷰 체크리스트
| 문제 | 해결 |
| --- | --- |
| `transition: all` | 속성 명시 (`transform 200ms ease-out`) |
| scale(0) 진입 | scale(0.95) + opacity 0 |
| UI에 ease-in | ease-out 또는 커스텀 곡선 |
| 팝오버 origin center | 트리거 위치 (모달은 예외) |
| 키보드 동작 애니메이션 | 제거 |
| UI 300ms 초과 | 150-250ms |
| 미디어쿼리 없는 hover | `(hover: hover) and (pointer: fine)` |
| 자주 트리거되는 keyframes | transition |
| 진입/퇴장 같은 속도 | 퇴장을 더 빠르게 |
| 한꺼번에 등장 | 30-80ms stagger |
