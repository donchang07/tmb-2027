# Report — booking-tracker

> feature: booking-tracker (5/8) · 완료일 2026-09-16 · 최종 match rate **96%** (게이트 95 통과) · 보안 지적 전 항목 수정 완료
> Plan `docs/01-plan/booking-tracker.plan.md` · Design `docs/02-design/booking-tracker.design.md` · Analysis `docs/03-analysis/booking-tracker.analysis.md`

## 요약
Supabase `bookings` 테이블(RLS: 리더만)과 `bookings_public` 뷰(상태·대안·갱신시각만)로 공개/비공개를 분리했다(I-004). 리더는 magic link(`ADMIN_EMAIL` 1개, D-003 ①)로 로그인해 `/admin/bookings`에서 12박 상태·예약번호·메모·대안 숙소를 편집하고, version 기반 낙관적 잠금으로 동시 편집을 감지한다. Server Action·Route Handler는 세션을 재검사해 RLS와 이중 방어한다. Supabase 미설정 시 편집은 비활성 안내, 공개 화면은 “미예약” 기본값으로 동작한다.

## FR/SC
| ID | 상태 | 근거 |
|---|---|---|
| FR-010 | 완료(정적) | RLS 정책 + `getAdminSession` 이중 검사, 공개 뷰 컬럼 제한, `toPublicBooking` 테스트 |
| SC-004 | 설계 반영 | `revalidatePath("/", "layout")` + 공개 페이지 `force-dynamic` → 저장 즉시 반영; private 0건은 security.spec |
| SC-007 | 통과(미설정 모드) | admin API 비인증 → 401/403/503, body에 private 필드 없음, HTML에 service_role 없음. `SUPABASE_SERVICE_ROLE_KEY`는 앱 코드에서 읽지 않음 |
| S8 | 완료 | 인증 없음 → “리더 로그인이 필요합니다”, 권한 없음 → “이 정보에 접근할 수 없습니다” + `admin_forbidden` security 로그 |

## 산출물
- `supabase/migrations/20260916000001_bookings.sql`
- `src/lib/bookings/{admin,public}.ts`, `src/lib/safe-next.ts`, `src/middleware.ts`
- `src/app/admin/{page,actions}.tsx|ts`, `src/app/admin/bookings/{page,actions}.tsx|ts`
- `src/components/admin/{BookingEditor,PublicPreview,MagicLinkForm,SignOutButton}.tsx`
- `src/app/auth/{callback,signout}/route.ts`, `src/app/api/bookings/route.ts`, `src/app/api/admin/bookings/[lodgingId]/route.ts`
- `tests/unit/bookings.test.ts`, `tests/e2e/security.spec.ts`

## Supabase 연결 시 해야 할 일 (메인 대화 처리)
1. `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ADMIN_EMAIL`, `NEXT_PUBLIC_SITE_URL`
2. 마이그레이션 적용(`supabase db push` 또는 SQL editor)
3. `insert into public.team_members (email, role) values ('<ADMIN_EMAIL>', 'leader');`
4. Supabase Auth → URL Configuration에 `${SITE_URL}/auth/callback` 추가, Email OTP(magic link) 활성
5. 재검증: 리더 미등록 상태 저장 → forbidden 안내 / anon `bookings_public` 12행 / 두 탭 동시 저장 → conflict / `/auth/callback?next=/\evil.com` → `/admin`으로 고정

## 결정
- 리더 판정 소스: env `ADMIN_EMAIL`(서버) + DB `team_members.role='leader'`(RLS). 정합성은 `/admin` 배지로 노출.
- `alternative_lodging`은 공개 필드(Edge Case “승인된 대안 표시”), 예약번호·메모만 비공개.
