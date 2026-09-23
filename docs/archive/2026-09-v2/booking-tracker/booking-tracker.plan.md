# Plan — booking-tracker

> feature: booking-tracker · 순서 5/8 · 의존: itinerary-core · 규모: 중
> 출처: `docs/PRD.md` S2, S8, FR-010, SC-004, SC-007, 8.7, 11.2 #2, I-004, D-003, 부록 A-2 Booking
> 작성일: 2026-09-16 · 상태: approved (L4 auto)

## 1. 목표
리더 1인이 12박 숙박의 공개 상태(미예약/문의/대기/확정/대안 확정)와 비공개 예약 정보(예약번호·메모)를 관리하고, 방문자는 상태만 본다. 비인증 편집·상세 조회는 401/403이며 응답에 비공개 필드가 0건이어야 한다.

## 2. 포함 요구사항
| FR | 요약 | 검증 |
|---|---|---|
| FR-010 | 리더 상태 저장, 방문자 상태만, 예약번호·메모는 인증 리더만 | RLS/API 권한 테스트 + 상태 동기화 |

SC-004(공개 화면 5초 내 반영, 비로그인 응답 private 0건), SC-007(비로그인 예약 상세 API 401/403, bundle에 비밀키·예약번호 없음).

## 3. 범위
### In
- Supabase 마이그레이션 `supabase/migrations/20260916_0001_bookings.sql`: `bookings` 테이블, `bookings_public` 뷰(상태·갱신시각만), RLS(리더 이메일 = `app.admin_email` 설정 또는 `is_admin()` 함수), 12 lodging 초기 행(미예약)
- 인증: Supabase Auth magic link(허용 이메일 `ADMIN_EMAIL` 1개, D-003 ①). `ADMIN_EMAIL` 미설정 시 편집 비활성(fallback)
- 서버: `src/lib/bookings/admin.ts`(리더 검증 + 조회/저장, version 기반 동시 편집 제어), Server Action `saveBooking`, Route Handler `GET /api/bookings`(공개 상태), `GET /api/admin/bookings/[lodgingId]`(리더만, 401/403)
- 화면: `/admin`(로그인·권한 확인), `/admin/bookings`(12박 편집 패널 + 공개 미리보기), `/auth/callback`, `/auth/signout`
- 공개 화면 연동: 이미 `getPublicBookingStatuses`/`getPublicBookings`가 `bookings_public` 조회 → 홈/일정/Day 상세 상태 배지 반영
- Edge Case: 인증 없음(“리더 로그인이 필요합니다” + 원래 화면 복귀), 권한 없음(“이 정보에 접근할 수 없습니다” → 공개 화면), 동시 편집(“다른 변경이 먼저 저장되었습니다”), 저장 중 이탈(“저장되지 않은 변경이 있습니다”), 예약 상태 없음(“미예약”)
### Out
- 예약 API 연동·결제(Non-goal), 팀원 allowlist(trip-journal에서), 실제 Supabase 프로젝트 연결(메인 대화에서 처리)

## 4. 결정
- I-004: RLS + Server Action/Route Handler 서버 검사 이중 적용. 공개 접근은 뷰 `bookings_public`만(테이블 직접 select 권한 없음)
- 리더 판정: `auth.jwt() ->> 'email'` = `current_setting('app.admin_email', true)` 를 DB 함수 `is_admin()`으로 캡슐화; 서버는 `session.user.email === ADMIN_EMAIL` 재검사
- Supabase 미설정 상태에서도 `/admin`은 “편집 비활성 — Supabase·ADMIN_EMAIL 설정 필요” 안내로 렌더

## 5. 성공 기준
1. unit: `canEdit(sessionEmail, adminEmail)`, `validateBookingInput`(status enum, confirmationRef ≤ 100자, memo ≤ 1000자, version int), `toPublicBooking`이 private 필드를 제거
2. 마이그레이션 SQL에 RLS enable + 정책 + 뷰 존재(정적 검사 unit test: 파일 텍스트 포함 여부)
3. 비인증 `GET /api/admin/bookings/x` → 401, 비리더 → 403, 응답 body에 `confirmationRef`/`privateMemo` 없음
4. build 성공, `/admin` 미설정 상태 렌더
