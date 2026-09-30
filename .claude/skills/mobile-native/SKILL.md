---
name: mobile-native
source: https://github.com/emilkowalski/skills (skills/mobile-native/SKILL.md, MIT License, Emil Kowalski)
note: 이 프로젝트(모바일 우선 PWA 목업·구현 명세)에 맞춰 요약한 사본.
---

# 모바일에서 네이티브처럼 (프로젝트 적용본)

웹앱이 폰에서 "브라우저 속 웹사이트"로 보이게 만드는 흔적을 하나씩 제거한다. 대부분 CSS 한 줄이나 meta 태그 하나로 해결된다.

## 원칙
1. 모든 수정에는 이유를 붙인다. 이유가 해당되는 곳에만 적용.
2. 기기 추측 대신 미디어쿼리: `(hover: hover)`, `(pointer: fine)`, `env()`, `dvh`.
3. 터치와 마우스는 배타적이지 않다. 기기가 아니라 능력으로 분기.
4. 확대 금지 절대 안 함 (`user-scalable=no`, `maximum-scale=1` 금지). 입력 글자 크기를 고친다.
5. 완료 전 실제 기기에서 테스트. 에뮬레이션은 이 문제들을 재현하지 못한다.

## 증상 → 해결
| 증상 | 해결 |
| --- | --- |
| 탭 후 hover가 남음 | `@media (hover: hover) and (pointer: fine)` 안에서만 hover |
| 탭 시 회색/파란 번쩍임 | `html { -webkit-tap-highlight-color: transparent }` + 모든 탭 요소에 `:active` |
| 높이가 틀림 | 앱 셸·하단 고정 UI는 `100dvh`, 히어로는 `100svh` |
| 입력 시 화면 확대 | input/textarea/select 16px 이상 |
| 탭이 굼뜸 | `touch-action: manipulation` + `:active`/pointerdown 즉시 피드백(100-160ms ease-out, scale 0.97) |
| 당겨서 새로고침이 스크롤을 가로챔 | `html, body { overscroll-behavior: none }`, 내부 스크롤은 `contain` |
| 노치 아래 빈 영역 | `viewport-fit=cover` + `env(safe-area-inset-*)` 패딩 (헤더, 하단 탭, 시트, 토스트) |
| 길게 누르면 버튼 글자 선택 | 컨트롤에만 `user-select: none`, `-webkit-touch-callout: none`. body 금지 |
| 캐러셀이 세로로 흔들림 | 네이티브 스크롤이면 `scroll-snap-type: x mandatory` + `scroll-snap-align: start`, JS 제스처면 `touch-action: pan-y` |
| 상태바 색 불일치 | 라이트/다크 각각 `theme-color`, 페이지 최상단 색과 일치 |

## 입력 키보드
- 코드: `inputmode="numeric"`, 금액: `inputmode="decimal"`, `type="email"`/`type="tel"`
- 아이디·코드: `autocapitalize="none" autocorrect="off"`
- `enterkeyhint="send" | "search" | "done"`

## 기본 바닥 (모바일 앱 시작 시)
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0a0a0a">
```
```css
html { -webkit-tap-highlight-color: transparent; -webkit-text-size-adjust: 100%; overscroll-behavior: none; }
input, textarea, select { font-size: 16px; }
button, a, [role="button"] { touch-action: manipulation; user-select: none; -webkit-user-select: none; }
@media (hover: hover) and (pointer: fine) { /* 모든 :hover 규칙 */ }
```

## TMB 2027 적용 메모
- 하단 탭(NAV-002~006)·오프라인 배너·계정 메뉴: safe-area 패딩 필수.
- 로그인·가입(SCR-015/016) 입력: 16px, email은 `type="email" autocapitalize="none"`.
- 준비물 체크박스·빠른 링크 카드: `:active` scale 0.97, 44px 이상 터치 영역.
- 산장 Wi-Fi·약한 LTE 환경: 실제 기기에서 확인할 항목과 코드로 확인한 항목을 구분해 보고.

## 출력
수정을 적용한 뒤 짧게: 무엇이 문제였나 / 무엇을 바꿨나 / 실제 폰에서 확인해야 할 것.
