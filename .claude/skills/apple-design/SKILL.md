---
name: apple-design
description: 저장소 루트의 DESIGN.md(Apple 스타일 디자인 시스템)를 기준으로 UI·문서·슬라이드를 만들거나 검수합니다. 사용자가 "애플 디자인", "애플 스타일", "DESIGN.md대로", "디자인 시스템 적용", "/apple-design"을 말하거나, TMB 2027 화면·컴포넌트의 색·서체·레이아웃을 새로 만들거나 고칠 때 사용합니다.
---

# Apple 스타일 디자인 시스템

1. 저장소 루트의 `DESIGN.md`를 처음부터 끝까지 읽습니다. 모든 디자인 결정은 이 문서를 따릅니다.
2. 작업 대상에 맞는 절을 적용합니다.
   - 웹 앱(`src/`): §4. Tailwind 토큰(`alpine`, `alpine-dark`, `ink`, `rock`, `snow`, `safety`)과 `.card` 등 전역 클래스만 씁니다. Tailwind 기본 팔레트(`amber-*`, `emerald-*` 등)나 새 hex 값을 추가하지 않습니다.
   - 슬라이드(PPTX): §5. 파일 생성 절차는 pptx 스킬을 따릅니다.
   - Word(DOCX): §6. 파일 생성 절차는 docx 스킬을 따릅니다.
3. 끝나면 §9 검수 체크리스트를 돌리고 결과를 보고합니다. 웹 앱은 `npm run typecheck`와 `npm test`를 실행합니다.
4. 규칙을 바꿔야 한다면 코드보다 `DESIGN.md`를 먼저 고치고, 무엇을 왜 바꿨는지 사용자에게 알립니다.
