# Design — booking-tracker

> feature: booking-tracker · Plan: `docs/01-plan/booking-tracker.plan.md` · 의존: itinerary-core
> 작성일: 2026-09-16 · 상태: approved (L4 auto)

## 1. 파일
```
supabase/migrations/20260916000001_bookings.sql
src/lib/bookings/admin.ts            세션 판정·입력 검증·조회·저장 (서버 전용)
src/lib/bookings/public.ts           (기존) bookings_public 조회
src/lib/supabase/server.ts           (기존) + middleware용 클라이언트
src/middleware.ts                    /admin, /api/admin 세션 쿠키 갱신
src/app/admin/page.tsx               로그인·권한 안내 (8.7 인증)
src/app/admin/actions.ts             sendMagicLinkAction
src/app/admin/bookings/page.tsx      12박 편집 + 공개 미리보기 (8.7 편집·미리보기)
src/app/admin/bookings/actions.ts    saveBookingAction
src/components/admin/BookingEditor.tsx   (client) 행 편집 폼, 충돌·이탈 경고
src/components/admin/PublicPreview.tsx   방문자 뷰 미리보기
src/app/auth/callback/route.ts       magic link code → 세션
src/app/auth/signout/route.ts        POST 로그아웃
src/app/api/bookings/route.ts        GET 공개 상태
src/app/api/admin/bookings/[lodgingId]/route.ts   GET 리더 전용 상세
tests/unit/bookings.test.ts
```

## 2. DB (`20260916000001_bookings.sql`)
```sql
create type public.booking_status as enum ('unbooked','inquiry','waitlist','confirmed','alternative');
create type public.member_role as enum ('leader','member');

create table public.team_members (            -- A-4 AdminUser/TeamMember 통합
  email text primary key check (email = lower(email)),
  role public.member_role not null default 'member',
  enabled boolean not null default true,
  created_at timestamptz not null default now());

create table public.bookings (                 -- A-2 Booking
  lodging_id text primary key,
  status public.booking_status not null default 'unbooked',
  confirmation_ref text check (char_length(confirmation_ref) <= 100),   -- private
  private_memo text check (char_length(private_memo) <= 1000),          -- private
  alternative_lodging text check (char_length(alternative_lodging) <= 200),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  version integer not null default 1);

function public.jwt_email() returns text        -- lower(auth.jwt()->>'email')
function public.is_admin() returns boolean      -- exists team_members where email=jwt_email() and role='leader' and enabled
function public.is_team_member() returns boolean -- enabled row exists (P2 journal용)
trigger bookings_touch before update: updated_at=now(), version=old.version+1, updated_by=auth.uid()

alter table bookings enable row level security;  policies: select/insert/update for authenticated using is_admin()
alter table team_members enable row level security; policies: select own row or admin; all for admin
revoke all on bookings, team_members from anon;
create view public.bookings_public as select lodging_id, status, alternative_lodging, updated_at from bookings;  -- 공개 필드만 (I-004)
alter view public.bookings_public set (security_invoker = off);  -- 소유자 권한 실행을 명시. bookings에 FORCE RLS 금지(뷰가 0행이 됨)
grant select on bookings_public to anon, authenticated;
insert 12 lodging_id rows ('gai-soleil', … 'chamonix-hotel') on conflict do nothing;
-- 리더 등록: insert into team_members(email, role) values ('<ADMIN_EMAIL>', 'leader');  (SQL editor에서 1회 실행, 주석으로 안내)
```

## 3. `src/lib/bookings/admin.ts`
```ts
export type SessionState = "unconfigured" | "anonymous" | "forbidden" | "admin";
export type AdminSession = { state: SessionState; email: string | null };
export function canEdit(sessionEmail: string | null | undefined, adminEmail: string | null | undefined): boolean  // 둘 다 비어있지 않고 lower 일치
export async function getAdminSession(): Promise<AdminSession>
   // supabase null → unconfigured; ADMIN_EMAIL null → unconfigured; user 없음 → anonymous(logEvent admin_auth_required info); canEdit false → forbidden(logEvent admin_forbidden security); else admin
export const BookingInputSchema = z.object({ lodgingId: enum(12 ids), status: enum(BOOKING_STATUSES), confirmationRef: string.max(100).nullable, privateMemo: string.max(1000).nullable, alternativeLodging: string.max(200).nullable, version: int.min(1) })
export type BookingRow = { lodging_id, status, confirmation_ref, private_memo, alternative_lodging, updated_at, updated_by, version }
export function toPublicBooking(row: BookingRow): PublicBooking     // { lodgingId, status, alternativeLodging, updatedAt } — confirmation_ref/private_memo 제거
export type ListResult = { ok: true; rows: BookingRow[] } | { ok: false; state: SessionState | "error"; message? }
export async function listAdminBookings(): Promise<ListResult>      // DB 오류 → { ok:false, state:"error" } + booking_status_defaulted warn
export async function getAdminBooking(lodgingId): Promise<BookingRow | null>
export async function isLeaderRegistered(email): Promise<boolean | null>   // team_members leader 행 존재 여부 (env↔DB 정합성 배지용)
export async function saveBooking(input: unknown): Promise<SaveResult>
   // SaveResult = { ok: true; row: BookingRow } | { ok: false; reason: "unconfigured"|"unauthorized"|"forbidden"|"invalid"|"conflict"|"error"; message: string; row?: BookingRow | null }
   // update ... eq lodging_id, eq version → 0행이면 최신 행 재조회:
   //   최신 행 없음(RLS 거부) → forbidden("team_members 등록 확인") / version 불일치 → conflict(+booking_conflict warn, row=최신) / 그 외 → error
export function statusForSession(state: SessionState): 200 | 401 | 403 | 503
```
`src/lib/safe-next.ts`: `safeNext(next, fallback="/admin")` — `^\/(?!\/)[^\\]*$` 정규식으로 `//`·`\` 우회(open redirect) 차단. callback/actions/admin page 공용.
```
```

## 4. 인증 흐름 (8.7 “허용 이메일 magic link”)
- `/admin` (dynamic):
  - unconfigured → StatusNote “편집 비활성 — Supabase 연결과 ADMIN_EMAIL 설정이 필요합니다” (D-003 fallback)
  - anonymous → StatusNote(info) “리더 로그인이 필요합니다” + `MagicLinkForm`(이메일 input + 버튼, `sendMagicLinkAction`) + `?next=` 유지
  - forbidden → StatusNote(error) “이 정보에 접근할 수 없습니다” + 홈 링크 + signout 버튼
  - admin → “리더로 로그인됨 {email}” + `/admin/bookings` 링크 + signout
- `sendMagicLinkAction(prev, formData)`: 이메일 소문자화; `canEdit(email, ADMIN_EMAIL)`이 아니면 실제 발송 없이 동일 메시지(“허용된 이메일이면 로그인 링크를 보냈습니다”) → 계정 열거 방지; 허용 시 `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${SITE_URL}/auth/callback?next=...` } })`
- `/auth/callback` GET: `code` → `exchangeCodeForSession`; `next`는 `safeNext`(상대경로, `//`·`\` 차단)만 허용; 실패 → `/admin?error=auth`
- admin 상태 화면: `isLeaderRegistered(email)` 결과로 “DB 리더 등록 확인됨” / “team_members 미등록 — 저장 거부됨” 배지 (env↔DB 이중 소스 정합성)
- `/auth/signout` POST: `signOut()` → redirect `/`
- `middleware.ts` (matcher `/admin/:path*`, `/api/admin/:path*`): Supabase 설정 시 `createServerClient`로 `getUser()` 호출해 쿠키 갱신; 미설정 시 통과

## 5. 편집 화면 `/admin/bookings`
- `getAdminSession()` → admin 아니면 `redirect("/admin?next=/admin/bookings")`
- `listAdminBookings()` 12행(없는 lodging은 기본값 unbooked/version 1로 표시하되 저장 시 upsert 아님 — 마이그레이션이 12행 보장)
- 각 lodging: `BookingEditor`(client) props `{ lodging: { id, nameOriginal, nameKo, dayLabel }, row: BookingRow | null }` — `saveBookingAction`은 컴포넌트가 직접 import
  - `useActionState(saveBookingAction, initial)`; 필드: status `<select>`(5 옵션 한국어 라벨), confirmationRef `<input maxLength=100>`, privateMemo `<textarea maxLength=1000>`, alternativeLodging `<input maxLength=200>`(공개 — 상태 ‘대안 확정’ 시 Day 상세 LodgingCard의 `approvedAlternative`로 표시), hidden `lodgingId`, `version`
  - dirty 추적 → `beforeunload`(`preventDefault` + `returnValue=""`) 경고 “저장되지 않은 변경이 있습니다” + 폼 하단 문구, `logEvent("unsaved_changes","info")`
  - 결과: ok → “저장됨 · {updatedAt}” 및 version 갱신; conflict → “다른 변경이 먼저 저장되었습니다. 최신 값을 불러왔습니다” + 최신 row로 폼 리셋(action이 최신 row 반환; row가 null이면 “페이지를 새로고침하세요” 추가 안내); forbidden/unauthorized → 메시지 + `/admin` 링크; error → “저장 재시도” 버튼(폼 재제출)
- `listAdminBookings` 실패(`ok:false`) → StatusNote(error) “예약 목록을 불러올 수 없습니다” + 원인
  - 모든 컨트롤 44px, `<label>` 연결
- `PublicPreview`: 12행 표 — Day, 숙박 원어명, 방문자에게 보이는 상태 배지, 갱신 시각. (`toPublicBooking` 적용 결과만 사용 → 예약번호·메모 미노출)
- `saveBookingAction(prev, formData)`: FormData → object → `saveBooking` → 성공 시 `revalidatePath("/", "layout")`(홈·일정·Day 상세 5초 내 반영, SC-004)

## 6. API
| 경로 | 인증 | 응답 |
|---|---|---|
| `GET /api/bookings` | 없음 | `{ bookings: PublicBooking[] }` (unconfigured → `{ bookings: [] , configured: false }`), `Cache-Control: no-store` |
| `GET /api/admin/bookings/[lodgingId]` | 리더 | admin → `{ booking: BookingRow }`; anonymous → 401 `{ error: "admin_auth_required" }`; forbidden → 403 `{ error: "admin_forbidden" }`; unconfigured → 503; 없는 id → 404. 401/403 body에 confirmation_ref/private_memo 없음 |

`PublicBooking = { lodgingId, status, alternativeLodging, updatedAt }`. `getPublicBookings`는 Supabase 설정됨 + 오류/0행이면 `booking_status_defaulted` **warn**(무증상 실패 관측), 미설정이면 info.

## 7. Edge Case
| 상황 | 구현 |
|---|---|
| 인증 없음 | `/admin` “리더 로그인이 필요합니다”, `next`로 복귀, `admin_auth_required` |
| 권한 없음 | “이 정보에 접근할 수 없습니다” + 홈 링크, `admin_forbidden` security |
| 동시 편집 | version 불일치 → “다른 변경이 먼저 저장되었습니다” + 최신 값 재적용, `booking_conflict` |
| 저장 중 이탈 | beforeunload + 문구, `unsaved_changes` |
| 예약 상태 없음 | 공개 화면 “미예약”(public.ts 기본) |
| Supabase 미설정 | 편집 비활성 안내, 공개 화면은 미예약 기본 |

## 8. 보안 (SC-007)
- 클라이언트 번들에는 `NEXT_PUBLIC_*`만. `SUPABASE_SERVICE_ROLE_KEY`는 앱 코드에서 읽지 않음(CLI/마이그레이션 전용)
- 비공개 필드는 `bookings` 테이블(RLS admin only)에만; 공개 경로는 `bookings_public` 뷰
- Server Action·Route Handler 모두 `getAdminSession()` 재검사(이중 검사, I-004)

## 9. 테스트
### e2e `tests/e2e/security.spec.ts`
- `GET /api/admin/bookings/mottets` 비인증 → 401/403/503, body에 `confirmation_ref`/`private_memo` 없음, `no-store`
- `GET /api/bookings` → 200, 각 항목 키 정확히 `lodgingId,status,updatedAt`
- `/admin` 방문자 → “리더 로그인이 필요합니다” 또는 “편집 비활성” 안내
- `/admin/bookings` 방문자 → `/admin`으로 redirect
- Day 상세 HTML에 `service_role`·`private_memo` 문자열 없음

### unit `tests/unit/bookings.test.ts`
- `canEdit`: 대소문자 무시 일치 true, null/빈 문자열/불일치 false
- `BookingInputSchema`: 정상 통과, 잘못된 status·101자 ref·version 0·미지 lodgingId 거부
- `toPublicBooking`: 결과 키가 정확히 `lodgingId,status,updatedAt`
- `statusForSession`: anonymous 401, forbidden 403, unconfigured 503, admin 200
- 마이그레이션 텍스트: `enable row level security` 2회 이상, `create view public.bookings_public`, `is_admin`, `revoke all`, 12 lodging id 포함, private 컬럼이 view select 목록에 없음
