# Analysis — budget-view

> feature: budget-view · Check 단계 · gap-detector 실행 2026-09-16
> Design: `docs/02-design/budget-view.design.md` · 게이트 95

## 결과
| 항목 | 값 |
|---|---|
| Match rate (1차) | **98%** (46 matched + 2 partial × 0.5) / 48 |
| 게이트 | 통과 |
| 반복 | 불필요 |
| Missing | 0 |

## 검증 근거
- `vitest run` 25/25 (budget 6 추가): 소계 1460/2342, 예비비 146/234.2, 총액 1606/2576.2, 재계산 오차 ≤ €1 (SC-003)
- `tsc --noEmit` 0 오류

## 부분 일치와 조치
| # | 지적 | 조치 |
|---|---|---|
| U8 | 모바일 근거 문자열 DOM 2회 출력 | 단일 td + `flex flex-wrap` 행으로 재구성, design §5 갱신 |
| P2 | 화면 렌더 자동 검증 없음 | responsive-pwa의 Playwright 스펙에 `/budget` tbody 9행·tfoot 3행 단언 포함 예정 |
| Info | 빈 상태 분기 런타임 미도달 | 설계 요구 항목이므로 유지 |
