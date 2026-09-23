# Analysis — booking-tracker

> feature: booking-tracker · Check 단계 · gap-detector 실행 2026-09-16
> Design: `docs/02-design/booking-tracker.design.md` · 게이트 95

## 결과
| 항목 | 값 |
|---|---|
| Match rate (1차, 정적) | **96%** (60 matched + 5 partial × 0.5) / 65 |
| 게이트 | 통과 |
| 보안 지적 | G1 open redirect(`next` 파라미터 `\` 우회) — **완료 조건 “critical 보안 결함 0건”에 따라 Act에서 즉시 수정** |
| Missing | 0 |

## 검증 근거
- `tsc --noEmit` 0 오류, `vitest run` 37/37 (bookings 8), `next build` 성공(Middleware 포함)
- E2E `security.spec.ts` 5/5 (desktop-1440): 비인증 admin API 503(미설정)·private 필드 없음·no-store, 공개 API 키 제한, `/admin` 안내, `/admin/bookings` redirect, HTML에 service_role/private_memo 없음
- private 필드 유출 경로 재확인: 0건 (anon revoke + RLS / 비리더 RLS 0행 / 공개 경로는 쿠키 없는 anon 클라이언트로 뷰만 / admin API는 DB 조회 전 세션 판정 / 편집 페이지 redirect 선행)

## 지적과 조치
| # | 심각도 | 지적 | 조치 |
|---|---|---|---|
| G1 | Security | `safeNext`가 `\` 미차단 → `/\evil.com` open redirect | `src/lib/safe-next.ts` 공용 헬퍼(`^\/(?!\/)[^\\]*$`) + unit test 5케이스 |
| G2 | Security/robustness | 뷰 RLS 우회가 암묵적, 0행 시 무증상 “미예약” | `alter view ... set (security_invoker = off)` 명시 + FORCE RLS 금지 주석 + `getPublicBookings` 0행/오류 warn 로그 + 마이그레이션 텍스트 테스트 |
| G3 | Important | RLS 거부가 conflict로 오표시 | 0행 시 최신 행 재조회 → 없음=forbidden(team_members 안내) / version 불일치=conflict / 그 외=error |
| G4 | Important | `listAdminBookings` DB 오류를 성공으로 반환 | `{ ok:false, state:"error" }` + warn 로그 + 편집 페이지 오류 StatusNote |
| G5 | Minor | conflict row null 시 무한 conflict | “페이지를 새로고침하세요” 안내 |
| G6 | Minor | `alternative_lodging` write-only | 뷰·PublicBooking·toPublicBooking·Day 상세 LodgingCard(`approvedAlternative`)까지 공개 경로 연결 (PRD Edge Case “승인된 대안 표시”) |
| G7 | Minor | beforeunload `returnValue` 누락 | 추가 |
| G8 | Drift | BookingEditor action prop | design 갱신(직접 import) |
| G9 | Info | env↔DB 리더 소스 이중화 | `isLeaderRegistered` + `/admin` 배지 |

## 런타임 미검증(Supabase 미연결)
RLS 실제 동작, magic link 발송, version conflict 재현은 Supabase 연결 후 확인 필요(Report 참조).
