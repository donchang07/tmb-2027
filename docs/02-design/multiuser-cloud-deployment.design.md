# multiuser-cloud-deployment Design Document

> **Summary**: 이메일·비밀번호 인증(SCR-015~018), 사용자별 준비물(`packing_checks` + RLS), SW·middleware 사용자별 응답 격리, GitHub public·Vercel production 배포의 상세 설계
>
> **Project**: tmb-2027
> **Version**: 0.1.0 (PRD v4.0 델타)
> **Author**: 장동인(작성자) · Claude(PDCA)
> **Date**: 2026-09-23
> **Status**: Approved (작성자 사전 승인, L4 auto)
> **Planning Doc**: [multiuser-cloud-deployment.plan.md](../01-plan/multiuser-cloud-deployment.plan.md)
> **Source contract**: `docs/00-pm/multiuser-cloud-deployment.prd.md`

### Pipeline References

| Phase | Document | Status |
|-------|----------|--------|
| Phase 1 | Schema — PRD 부록 A DATA-017~019 | N/A(PRD가 대체) |
| Phase 2 | Conventions — 전역 CLAUDE.md + 기존 코드 패턴 | N/A |
| Phase 3 | Mockup — PRD 5.5 SCR-015~018 요소 계약 | N/A(PRD가 대체) |
| Phase 4 | API — 본 문서 §4 | ✅ |

---

## Context Anchor

> Plan에서 복사. Design→Do 인계 시 유지.

| Key | Value |
|-----|-------|
| **WHY** | localhost 전용·기기 전용 저장으로는 팀이 실제로 쓸 수 없다. 인터넷 배포와 계정별 개인 데이터가 필요하다(PRD 0장, S9~S13). |
| **WHO** | 리더 1명(편집·배포 담당, `ADMIN_EMAIL`), 팀원 9명(`team_members`, 기록 작성), 계정 사용자(누구나 가입, 자기 준비물만), 비로그인 방문자(공개 열람·기기 저장). |
| **RISK** | ① 다른 사용자 데이터 노출(RLS 누락) ② 비밀값의 공개 GitHub 커밋 ③ 인증 도입으로 기존 공개 화면·오프라인 회귀 ④ `team_members` 이메일 비밀번호 선점(이메일 인증 OFF) ⑤ SW가 사용자별 응답을 캐시해 로그아웃 후 노출. |
| **SUCCESS** | SC-016~024 통과 + SC-001~015 회귀 유지(`npm test` ≥ 126, Playwright ≥ 111 기존 건 전부 통과), `next build` 기존 라우트 ○/ƒ diff 0건, 저장소 비밀값 0건, Vercel production Ready, match rate ≥ 95. |
| **SCOPE** | module-1 인증(SCR-015~018, FR-019·020·021·029·030) → module-2 사용자별 데이터(FR-022~024, SCR-009-EL-10~13) → module-3 SW·middleware(DATA-012, I-025) → module-4 저장소·배포(FR-025·026·028) → module-5 테스트·회귀(FR-027). |

---

## 1. Overview

### 1.1 Design Goals

1. **회귀 0**: SCR-001~014 요소 계약과 비로그인 코드 경로를 바꾸지 않는다(FR-027). 레이아웃은 쿠키를 읽지 않아 `/packing`·`/map`·`/offline` 정적(○) 유지(FR-029, I-013).
2. **서버 격리**: 사용자별 데이터는 RLS가 유일한 권한 판정자다. 소유자 값은 DB가 `auth.uid()`로 채운다(FR-022·023).
3. **선점 차단**: 이메일 인증 OFF에서 `team_members` 이메일 가입을 Hook으로 거부하고 계정은 배포 전 선생성(FR-030, D-017 ③).
4. **캐시 격리**: 사용자별 HTML은 Cache Storage에 들어가지 않고, 로그인·로그아웃·만료 시 page 캐시를 비운다(DATA-012, I-025).
5. **비밀값 0**: 공개 저장소에 비밀값·개인 작업 기록이 들어가지 않음을 테스트로 강제(FR-025·028).

### 1.2 Design Principles

- 순수 규칙은 `src/lib/*-rules.ts`·`packing-sync.ts`에 두고 단위 테스트한다. 컴포넌트·액션은 얇게.
- 기존 패턴 재사용: `useActionState` + Server Action(`TeamLoginForm`), `StatusNote`·`card`·`tap`·`bg-alpine`, `logEvent`.
- 새 의존성은 `@tanstack/react-query` 1개(D-018 ②). provider는 `PackingList.tsx` 내부 로컬.
- `useEffect`로 데이터를 조회하지 않는다. 세션은 `useSyncExternalStore` 스토어, 계정 준비물은 `useQuery`.

---

## 2. Architecture Options

### 2.0 Architecture Comparison

| Criteria | Option A: Minimal | Option B: Clean | Option C: Pragmatic |
|----------|:-:|:-:|:-:|
| **Approach** | `PackingList`·폼 안에 로직 인라인, 계정 조회는 `useEffect`+fetch, SW는 헤더 미캐시만 추가(network-first 없음), JS에서 조회 후 비교해 upsert | `src/features/auth`·`src/features/packing-sync` 모듈, 레이아웃 전역 `AuthProvider`·`QueryClientProvider`, `/api/packing` REST Route Handler, 저장소·서비스 계층 분리, SW 전략 모듈 재작성 | 17.2 파일 목록을 따르되 순수 규칙 모듈 3개(`auth-rules`·`packing-sync`·`sw-rules`) + 클라이언트 세션 스토어(`auth-client`) + Server Action + Postgres 함수 1개. provider는 `PackingList` 로컬 |
| **New Files** | 12 | 30+ | 21 |
| **Modified Files** | 18 | 25+(layout 포함) | 23 |
| **Complexity** | Low | High | Medium |
| **Maintainability** | Low(규칙 테스트 불가) | High | High |
| **Effort** | Low | High | Medium |
| **Risk** | High — CLAUDE.md `useEffect` 조회 금지 위반, 로그인 후 비로그인 사본 노출(I-025 ③ 미충족), 항목별 최신 우선이 경합에 취약 | Medium — `layout.tsx` 변경으로 정적 라우트·BookingLive 회귀 위험, I-017 위반, 목적 없는 폴더 재구성(비범위) | Low — PRD 결정(D-018 ②, I-013, I-017, I-025)과 1:1 |
| **Recommendation** | 핫픽스 | 장기 멀티테넌트 | **Default choice** |

**Selected**: **Option C (Pragmatic)** — **작성자 사전 승인으로 추천안 채택**(2026-09-23, Checkpoint 3). **Rationale**: PRD 17.2 예상 파일 범위와 일치해 Check 단계 match rate 산정이 명확하고, 규칙을 순수 모듈로 분리해 SC-018~021의 로직을 단위 테스트로 먼저 검증할 수 있으며, 레이아웃·기존 라우트를 건드리지 않아 FR-027 회귀 위험이 가장 낮다.

### 2.1 Component Diagram

```
Browser (PWA)                                     Vercel Functions (Node 24)            Supabase
┌────────────────────────────────────┐            ┌──────────────────────────┐        ┌───────────────────────────┐
│ AppHeader ─ AccountMenu (SCR-018)  │─getSession─▶ (cookie, 로컬 읽기)        │        │ Auth: email+password,     │
│   └ auth-client authStore          │            │                          │        │  magic link, Hook(before  │
│ LoginForm/SignupForm (SCR-015/016) │─action────▶│ login/actions.ts         │─signIn▶│  user created) ─▶ SQL fn  │
│ PackingList (SCR-009)              │            │ packing/actions.ts       │─rpc───▶│ Postgres + RLS            │
│   ├ guest: localStorage (기존)      │            │ auth/callback, signout   │─code──▶│  packing_checks           │
│   └ account: QueryClientProvider   │─select────────────────(RLS, anon key + user JWT)──▶│  team_members (기존)      │
│        useQuery / useMutation      │            │ middleware (세션 갱신,   │        └───────────────────────────┘
│ SignOutButton / AccountMenu logout │─POST──────▶│  x-tmb-user-scoped)      │
│ Service Worker (public/sw.js v3)   │            └──────────────────────────┘
│   network-first /day/*, /packing   │
│   skip x-tmb-user-scoped, clear_pages msg │
└────────────────────────────────────┘
GitHub donchang07/tmb-2027 (main) ──Git 연동──▶ Vercel utmb2027 (team don-changs-projects) → https://utmb2027.vercel.app
```

### 2.2 Data Flow

```
[가입 SCR-016] 입력 → zod(SignupSchema, client+server) → auth.signUp → Hook(team_members?) → 세션 쿠키
              → {status:success, redirectTo} → EL-07 → clearSwPageCache → 1초 후 location.assign(next)
[로그인 SCR-015] 입력 → zod → signInWithPassword → {success, redirectTo} → clearSwPageCache → location.assign
[준비물 계정 SCR-009] mount → authStore(user) → useQuery(["packing_checks", uid]) ← placeholder=기기 사본
              → 첫 로그인이면 unionMigration → 대기열 → savePackingChecksAction → rpc upsert_packing_checks(RLS)
              → 성공: 대기열 ack + 사본 갱신 + invalidate / 실패: 대기열 유지(EL-11) / unauthorized: EL-13
[로그아웃] prepareSignOut(사본·대기열·last-uid·page 캐시 삭제) → POST /auth/signout → 303 /
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| `AccountMenu` | `auth-client`(authStore), `createBrowserClient`, `next/navigation` `usePathname` | 세션 표시·역할 조회·로그아웃 |
| `PackingList` | `@tanstack/react-query`, `packing-sync`, `packing-store`, `auth-client`, `packing/actions` | 계정 모드 조회·저장 |
| `LoginForm`/`SignupForm` | `auth-rules`(zod), `login/actions`, `auth-client` | 폼 검증·제출·캐시 삭제 |
| `login/actions` | `createSupabaseServerClient`, `auth-rules`, `safe-next`, `log` | 서버 인증 |
| `packing/actions` | `createSupabaseServerClient`, `data/seed/packing`(id 목록), `log` | 서버 저장 |
| `middleware` | `@supabase/ssr`, `supabase/env` | 세션 갱신·헤더 |
| `public/sw.js` | `sw-rules.ts`와 상수·규칙 동기화 | 캐시 격리 |
| `scripts/seed-synthetic.mjs` | `@supabase/supabase-js`(기존), `.env.local` | 합성 데이터(로컬 전용) |

---

## 3. Data Model

### 3.1 Entity Definition

```typescript
// DATA-018 PackingCheck (DB row, snake_case)
type PackingCheckRow = { user_id: string; item_id: string; checked: boolean; updated_at: string };

// src/lib/packing-sync.ts
export type CheckChange = { itemId: string; checked: boolean; updatedAt: string };
export type CheckMap = Record<string, { checked: boolean; updatedAt: string }>;
export type AccountCopy = { version: 1; userId: string; rows: CheckMap; syncedAt: string | null };

// DATA-014 계정 키(계정 ID 접미어) — 기존 guest 키 `tmb2027:packing:v1`은 유지·삭제 안 함(D-015, 11.3)
export const ACCOUNT_COPY_PREFIX = "tmb2027:packing:acct:v1:";   // + userId → AccountCopy
export const QUEUE_PREFIX = "tmb2027:packing:queue:v1:";          // + userId → CheckMap(미전송 변경)
export const MIGRATED_PREFIX = "tmb2027:packing:migrated:v1:";    // + userId → "1"(첫 로그인 병합 완료)

// DATA-017 AuthSession (client view, src/lib/auth-client.ts)
export type AuthView =
  | { status: "loading" }
  | { status: "unconfigured" }
  | { status: "guest"; expired: boolean }
  | { status: "user"; userId: string; email: string };
export const LAST_UID_KEY = "tmb2027:auth:last-uid";
```

### 3.2 Entity Relationships

```
auth.users 1 ──── N public.packing_checks   (user_id FK, on delete cascade, PK user_id+item_id)
auth.users.email ─ ─ public.team_members.email   (FK 아님 — Hook가 가입 시 존재 여부만 조회)
src/data/seed/packing.ts(DATA-013, 34 ids) ─ ─ packing_checks.item_id   (zod enum으로만 허용)
```

### 3.3 Database Schema

**`supabase/migrations/20260923000005_packing_checks.sql`** (FR-022·023, DATA-018)

```sql
-- TMB 2027 — multiuser-cloud-deployment: 사용자별 준비물 체크 (FR-022, FR-023, FR-024, DATA-018)
create table public.packing_checks (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_id text not null check (char_length(item_id) between 1 and 64),
  checked boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

alter table public.packing_checks enable row level security;

create policy "packing_checks owner select" on public.packing_checks
  for select to authenticated using (user_id = auth.uid());
create policy "packing_checks owner insert" on public.packing_checks
  for insert to authenticated with check (user_id = auth.uid());
create policy "packing_checks owner update" on public.packing_checks
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "packing_checks owner delete" on public.packing_checks
  for delete to authenticated using (user_id = auth.uid());

revoke all on public.packing_checks from anon;
grant select, insert, update, delete on public.packing_checks to authenticated;

-- 항목별 최신 updated_at 우선 upsert (FR-024). security invoker → RLS 그대로 적용, 소유자는 auth.uid()
create or replace function public.upsert_packing_checks(changes jsonb)
returns setof public.packing_checks
language sql
security invoker
set search_path = ''
as $$
  insert into public.packing_checks as p (user_id, item_id, checked, updated_at)
  select auth.uid(), c.item_id, c.checked, least(c.updated_at, now())
  from jsonb_to_recordset(changes) as c (item_id text, checked boolean, updated_at timestamptz)
  on conflict (user_id, item_id) do update
    set checked = excluded.checked, updated_at = excluded.updated_at
    where p.updated_at < excluded.updated_at
  returning p.*;
$$;

revoke all on function public.upsert_packing_checks(jsonb) from public, anon;
grant execute on function public.upsert_packing_checks(jsonb) to authenticated;
```

규칙: 해제는 행을 지우지 않고 `checked=false`로 upsert(DATA-018). `least(..., now())`로 미래 시각을 막는다. 같은 배치에 같은 `item_id`가 두 번 오면 ON CONFLICT 오류이므로 서버 액션이 항목별 최신 1건으로 정규화한다(§4.2).

**`supabase/migrations/20260923000006_signup_guard_hook.sql`** (FR-030, D-017 ③)

```sql
-- TMB 2027 — multiuser-cloud-deployment: team_members 이메일 신규 가입 거부 (FR-030, D-017 ③)
-- 대시보드 Authentication > Hooks > Before User Created 에서 이 함수를 지정한다(supabase/config.toml 동일).
-- 역할 함수 is_admin()·is_team_member()는 v3.1 정의를 그대로 둔다(재정의 금지).
create or replace function public.hook_before_user_created(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_email text := lower(coalesce(event -> 'user' ->> 'email', ''));
begin
  if v_email <> '' and exists (select 1 from public.team_members m where m.email = v_email) then
    return jsonb_build_object('error', jsonb_build_object('http_code', 403, 'message', 'signup_not_allowed'));
  end if;
  return '{}'::jsonb;
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.hook_before_user_created(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_before_user_created(jsonb) from authenticated, anon, public;

grant select on table public.team_members to supabase_auth_admin;
create policy "team_members auth admin select" on public.team_members
  as permissive for select to supabase_auth_admin using (true);
```

`enabled=false` 행도 거부한다(목록에 있는 이메일 전체). 계정 생성 순서는 "Add user(Auto Confirm) → `team_members` 등록"으로 고정되므로 Hook은 선생성을 막지 않는다(부록 B 추정 항목과 무관).

---

## 4. API Specification

### 4.1 Endpoint List

| Kind | Name / Path | Description | Auth | FR·SCR |
|------|-------------|-------------|------|--------|
| Server Action | `signInAction` (`src/app/login/actions.ts`) | 이메일·비밀번호 로그인 | 비로그인 | FR-020 · SCR-015-EL-05 |
| Server Action | `signUpAction` (`src/app/login/actions.ts`) | 가입 + 즉시 세션 | 비로그인 | FR-019 · FR-030 · SCR-016-EL-05 |
| Server Action | `savePackingChecksAction` (`src/app/packing/actions.ts`) | 계정 체크 upsert(`rpc upsert_packing_checks`) | 세션 필수 | FR-022~024 · SCR-009-EL-09/04/12 |
| Browser query | `fetchPackingChecks(client, validIds)` (`src/lib/packing-sync.ts`) | 본인 행 조회(RLS) — 서버 액션 아님(D-018 ②) | 세션 필수 | FR-024 · SCR-009-EL-11 |
| Browser query | `team_members` self select `role` (AccountMenu) | "관리자 화면" 표시용 | 세션 | SCR-018-EL-03 |
| GET | `/auth/callback` | magic link `code` 교환(기존) | 링크 | SCR-017-EL-01 · FR-021 |
| POST | `/auth/signout` | 세션 삭제 후 303 `/`(기존 + `auth_logout` 로그) | 세션 | SCR-018-EL-04 · FR-020 |
| Page | `/login`, `/signup` | 이미 로그인이면 `safeNext(next, "/")`로 redirect | — | SCR-015 · SCR-016 |

### 4.2 Detailed Specification

#### 공통 스키마 (`src/lib/auth-rules.ts`, 순수 — client·server 공유)

```ts
export const EmailField = z.string().trim().toLowerCase()
  .min(1, "이메일을 입력해 주세요.").max(254, "이메일 형식이 올바르지 않습니다.").email("이메일 형식이 올바르지 않습니다.");
export const LoginSchema = z.object({
  email: EmailField,
  password: z.string().min(1, "비밀번호를 입력해 주세요.").max(72, "이메일 또는 비밀번호가 올바르지 않습니다."),
});
export const SignupSchema = z.object({
  email: EmailField,
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다.").max(72, "비밀번호는 72자 이하여야 합니다."),
  passwordConfirm: z.string(),
}).refine((v) => v.password === v.passwordConfirm, { path: ["passwordConfirm"], message: "비밀번호가 서로 다릅니다." });

export type AuthField = "email" | "password" | "passwordConfirm";
export type AuthFormState =
  | { status: "idle"; email: string }
  | { status: "invalid"; email: string; fieldErrors: Partial<Record<AuthField, string>> }
  | { status: "error"; email: string; error: string }
  | { status: "success"; email: string; redirectTo: string };

export type SignInFailure = "invalid_credentials" | "rate_limited" | "unconfigured" | "error";
export type SignUpFailure = "duplicate" | "hook_rejected" | "rate_limited" | "signup_disabled" | "unconfigured" | "no_session" | "error";
export function classifySignInError(e: { status?: number; code?: string } | null): SignInFailure;
export function classifySignUpError(e: { status?: number; code?: string; message?: string } | null): SignUpFailure;
export const AUTH_MESSAGES: Record<SignInFailure | SignUpFailure, string>;
export function originFromHeaders(host: string | null, proto: string | null, fallback: string): string;
export function callbackFailurePath(next: string): string;
export function detectAuthTransition(prevUid: string | null, nextUid: string | null): "login" | "logout-or-expired" | "switch" | "none";
```

오류 분류·문구(8장 Edge Cases, SCR-015-EL-06, SCR-016-EL-06):

| 분류 | 판정 | 문구 |
|---|---|---|
| `invalid_credentials` | `code === "invalid_credentials"` 또는 status 400 | "이메일 또는 비밀번호가 올바르지 않습니다." |
| `rate_limited` | status 429 또는 `code` ∈ {`over_request_rate_limit`, `over_email_send_rate_limit`} | "요청이 많습니다. 잠시 후 다시 시도해 주세요." |
| `unconfigured` | 서버 클라이언트 null | 로그인 "로그인 기능이 비활성입니다 — Supabase 설정이 필요합니다." / 가입 "회원가입 기능이 비활성입니다 — Supabase 설정이 필요합니다." |
| `duplicate` | `code` ∈ {`user_already_exists`, `email_exists`} | "이 이메일로 가입할 수 없습니다. 이미 계정이 있으면 로그인해 주세요." |
| `hook_rejected` | status 403 또는 message에 `signup_not_allowed` 또는 `code`가 `hook_`로 시작 | (duplicate와 동일 문구, I-029) |
| `signup_disabled` | `code === "signup_disabled"` | "현재 회원가입을 받지 않습니다. 리더에게 문의해 주세요." |
| `no_session` / `error` | 그 외, 또는 가입 응답에 session 없음(Confirm email 설정 오류) | 로그인 "로그인하지 못했습니다. 잠시 후 다시 시도해 주세요." / 가입 "가입하지 못했습니다. 잠시 후 다시 시도해 주세요." |

`code === "email_address_invalid"`는 `fieldErrors.email = "이메일 형식이 올바르지 않습니다."`로 돌린다.

#### `signInAction(prev: AuthFormState, formData: FormData): Promise<AuthFormState>`

1. `LoginSchema.safeParse({ email, password })` 실패 → `{ status: "invalid", fieldErrors }`.
2. `rawNext = formData.get("next")`, `next = safeNext(rawNext, "/", await requestOrigin())`; 거부되면 `auth_next_rejected` security.
3. `supabase = await createSupabaseServerClient()` null → `{ status: "error", error: AUTH_MESSAGES.unconfigured(로그인) }` + `supabase_unconfigured` warn.
4. `signInWithPassword({ email, password })` 오류 → `classifySignInError` → `{ status: "error", email, error }`, `auth_login_failed` warn `{ emailHash, reason }`.
5. 성공 → `auth_login_succeeded` info `{ emailHash }` → `{ status: "success", email, redirectTo: next }`. 쿠키는 `@supabase/ssr`가 액션 응답에 설정.
   - 서버 `redirect()`를 쓰지 않는 이유: 소프트 내비게이션은 레이아웃을 유지해 AccountMenu가 새 쿠키를 모른다. 클라이언트가 page 캐시를 지운 뒤 `window.location.assign(redirectTo)`로 전체 이동한다(결과는 PRD "303 이동"과 동일한 화면 전이).
6. 비밀번호는 반환·로그 금지. 실패 시 반환 `email`만 유지(SCR-015-EL-06 "이메일만 유지").

#### `signUpAction(prev: AuthFormState, formData: FormData): Promise<AuthFormState>`

1. `SignupSchema.safeParse` 실패 → `invalid`.
2. `next = safeNext(formData.get("next"), "/", origin)`.
3. `signUp({ email, password })` — `emailRedirectTo` 미사용(Confirm email OFF).
4. 오류 → `classifySignUpError` → `error`, `auth_signup_failed` warn `{ emailHash, reason }`(reason ∈ duplicate·hook_rejected·rate_limited·signup_disabled·error).
5. `data.session === null` → `no_session`(설정 오류 감지, 가입 실패로 처리).
6. 성공 → `auth_signup_requested` info `{ emailHash }` → `{ status: "success", email, redirectTo: next }`.

`hashEmail(email) = sha256(email).hex.slice(0, 12)` — `node:crypto`를 쓰므로 `login/actions.ts` 내부 함수로 둔다(클라이언트 번들 제외).

#### `savePackingChecksAction(input: unknown): Promise<PackingSyncResult>`

```ts
const PACKING_ITEM_IDS = packingItems.map((i) => i.id) as [string, ...string[]];
const ChangeSchema = z.object({
  itemId: z.enum(PACKING_ITEM_IDS),
  checked: z.boolean(),
  updatedAt: z.string().datetime({ offset: true }),
}).strip();
const SaveSchema = z.object({ changes: z.array(ChangeSchema).min(1).max(PACKING_ITEM_IDS.length) });

export type PackingSyncResult =
  | { ok: true; applied: number }
  | { ok: false; reason: "invalid" | "unauthorized" | "unconfigured" | "error" };
```

1. 원본 객체에 `userId`·`user_id` 키가 있으면 `owner_access_denied` security 로그(값은 무시 — `.strip()`).
2. `SaveSchema.safeParse` 실패 → `invalid`.
3. 클라이언트 null → `unconfigured`. `auth.getUser()` 사용자 없음 → `unauthorized` + `auth_session_expired` info(SCR-009-EL-13 트리거).
4. 항목별 최신 1건으로 정규화 → `supabase.rpc("upsert_packing_checks", { changes: [{ item_id, checked, updated_at }] })`.
5. 오류 → `error` + `packing_sync_failed` warn. 성공 → `{ ok: true, applied: data.length }`(최신이 아니어서 무시된 행은 applied에서 빠짐 — 클라이언트는 조회 무효화로 권위 값을 다시 받는다).

#### `fetchPackingChecks(client, validIds): Promise<CheckMap>`

`client.from("packing_checks").select("item_id, checked, updated_at")` — RLS가 본인 행만 반환. `validIds` 밖 id는 버린다. 오류 시 throw(react-query error 상태).

### 4.3 `safeNext` 강화 (`src/lib/safe-next.ts`, FR-021, I-024)

```ts
export function safeNext(next: unknown, fallback = "/admin", origin = "http://localhost"): string
```

시그니처 호환(기존 1·2번째 인자 동일, 3번째 선택). 규칙(모두 통과해야 허용):
1. `typeof next === "string"`, 길이 1~2048, `/`로 시작.
2. `next`와 `safeDecode(next)`(decodeURIComponent 1회, 실패 시 원문) 모두에 대해: 제어문자 `[\u0000-\u001F\u007F]` 없음, 백슬래시 없음, `//`로 시작하지 않음.
3. `new URL(next, origin).origin === new URL(origin).origin`.

| 입력(쿼리에서 읽힌 값) | 기대 |
|---|---|
| `/admin/bookings`, `/packing`, `/journal/d2027-08-05?x=1` | 그대로 |
| `//evil.com`, `//evil` | fallback |
| `/\evil.com`, `/%5Cevil`, `/%5cevil` | fallback |
| `/%09/evil.com`, `/\t/evil.com` | fallback |
| `/%0A/evil`, `/\n/evil`, `/%0D/evil`, `/\r/evil` | fallback |
| `https://evil`, `http://localhost.evil.com`, `javascript:alert(1)` | fallback |
| `/%2F/evil.com`(디코드 시 `//evil.com`) | fallback |
| `undefined`, `""`, `123` | fallback |

기존 `tests/unit/bookings.test.ts` 벡터 결과는 동일하다. 적용처: `/auth/callback`, `signInAction`, `signUpAction`, `/login`·`/signup` 페이지, 기존 `admin/actions.ts`·`admin/page.tsx`·`journal/actions.ts`·`journal/login/page.tsx`(호출 코드는 그대로, 함수만 강화).

### 4.4 인증 콜백 (`src/app/auth/callback/route.ts`, SCR-017, FR-021)

- `code`만 처리(`token_hash` 분기 없음 — 폐기된 I-026).
- `next = safeNext(rawNext, "/admin", url.origin)` — 기본값은 v3.1과 같게 유지(FR-027). 거부 시 `auth_next_rejected`.
- 실패 경로 `callbackFailurePath(next)`:
  - `next`가 `/journal`로 시작 → `/journal/login?error=auth` (SCR-012-EL-02)
  - `/admin`으로 시작 → `/admin?error=auth` (SCR-007-EL-02)
  - 그 외 → `/login?error=auth&next=<encoded next>` (SCR-015-EL-02, 추가)
- 실패 사유 로그 `auth_callback_failed` warn `{ reason: "unconfigured" | "missing_code" | "exchange_failed" }`.
- **오류 배너 한 문장 추가**: `src/app/admin/page.tsx`(SCR-007-EL-02)와 `src/app/journal/login/page.tsx`(SCR-012-EL-02)의 `StatusNote` 본문 끝에 "다른 기기에서 링크를 열었다면 이 기기에서 다시 요청해 주세요."를 덧붙인다. SCR-015-EL-02 `error=auth` 문구에는 처음부터 포함.

### 4.5 middleware (`src/middleware.ts`, I-013, I-025)

```ts
import { USER_SCOPED_HEADER } from "@/lib/sw-rules";   // 상수 정의는 sw-rules.ts(§7.1), 의존성 없는 순수 모듈
export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/journal/:path*", "/packing", "/login", "/signup", "/day/:path*"],
};
```

- 기존 쿠키 갱신 로직 유지. `const { data } = await supabase.auth.getUser()` 결과로:
  `pathname.startsWith("/day/")` 이고 `data.user?.email?.toLowerCase() === getAdminEmail()`이면 **마지막 `response`**에 `x-tmb-user-scoped: 1`을 설정(`setAll`이 response를 재생성하므로 반환 직전에 설정).
- 일반 사용자·팀원·비로그인의 `/day`에는 헤더 없음(오프라인 재열람 보존). `/packing`은 정적이며 계정 데이터가 HTML에 없어 헤더 대상 아님(D-018 ②).
- `@/lib/bookings/admin`(zod·seed·`next/headers` 의존)은 import하지 않고 이메일 비교를 인라인한다.

### 4.6 magic link `emailRedirectTo` (I-015, SCR-007·SCR-012)

`src/lib/supabase/server.ts`에 추가:

```ts
export async function requestOrigin(): Promise<string> {
  const h = await headers();
  return originFromHeaders(h.get("x-forwarded-host") ?? h.get("host"), h.get("x-forwarded-proto"),
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
}
```

`originFromHeaders`: host가 `^[a-z0-9.-]+(:\d+)?$`(대소문자 무시)일 때만 사용, proto는 `http`/`https`만(없으면 `localhost`·`127.0.0.1`은 http, 그 외 https), 아니면 fallback. `admin/actions.ts`·`journal/actions.ts`의 `siteUrl` 계산 한 줄만 `await requestOrigin()`으로 교체. 위조 host는 Supabase Redirect URLs 허용 목록이 차단(Site URL로 fallback). `NEXT_PUBLIC_SITE_URL`이 빈 문자열이어도 `||`로 fallback.

---

## 5. UI/UX Design

### 5.1 Screen Layout

```
┌───────────────────────────────────────────────┐  SCR-018 (sticky header, 기존 클래스 유지)
│ TMB 2027 걸어야 산다!   일정 예산 지도 준비물 관리자 [로그인|abcdefghijkl… ▾] │ ← NAV-012 = AccountMenu
│ ┌ EL-05 만료 알림(StatusNote, absolute top-full, 헤더 아래 전체 폭) ┐          │
├───────────────────────────────────────────────┤
│ /login  (max-w 28rem 중앙, 360px 1열)            │
│  h1 로그인 · EL-02 안내 · 이메일 · 비밀번호[표시] │
│  [로그인] · EL-06 오류 · 회원가입 링크 · 팀원/리더 링크 │
└───────────────────────────────────────────────┘
/packing: h1 · EL-02(PackingSubtitle) · EL-10|EL-11~13 · 진행률 카드(EL-03~06) · EL-07 · 카테고리(EL-08·09)
```

### 5.2 User Flow

```
S9  SCR-018 로그인 → SCR-015 → 회원가입 → SCR-016 → EL-07(1초) → next(SCR-009)
S10 A·B 각자 SCR-015 → SCR-009 체크 → 새로고침 → 각자 자기 체크
S11 SCR-018 로그아웃 → SCR-001 / 만료 감지 → EL-05 → SCR-015?reason=expired → next
S7  SCR-012 → (메일) SCR-017 → SCR-011 · 메일 불가 → SCR-012-EL-07 → SCR-015
```

### 5.3 Component List

| Component | Location | Kind | Responsibility |
|-----------|----------|------|----------------|
| `LoginPage` | `src/app/login/page.tsx` | Server | 로그인 상태면 redirect, EL-01·02·07·09 렌더, `LoginForm` |
| `SignupPage` | `src/app/signup/page.tsx` | Server | 로그인 상태면 `/`(또는 next) redirect, EL-01·09·08, `SignupForm` |
| `LoginForm` | `src/components/auth/LoginForm.tsx` | Client | EL-03~06, 비밀번호 표시 토글, 클라이언트 zod 선검증 |
| `SignupForm` | `src/components/auth/SignupForm.tsx` | Client | EL-02~07, 성공 시 폼 숨김·1초 이동 |
| `AccountMenu` | `src/components/layout/AccountMenu.tsx` | Client | NAV-012, SCR-018-EL-01~05 |
| `AppHeader` | `src/components/layout/AppHeader.tsx` | Server(수정) | 오른쪽에 `nav`+`AccountMenu` 묶음 |
| `PackingList` | `src/components/packing/PackingList.tsx` | Client(수정) | 로컬 `QueryClientProvider`, guest/account 분기 |
| `PackingSubtitle` | 같은 파일 export | Client | SCR-009-EL-02 문구 분기 |
| `SignOutButton` | `src/components/admin/SignOutButton.tsx` | Client(수정) | 제출 전 `prepareSignOut()` |
| `TeamLoginForm` | `src/components/journal/TeamLoginForm.tsx` | Client(수정) | SCR-012-EL-07 링크 |
| `authStore`·`useAuthUser`·`clearSwPageCache`·`prepareSignOut` | `src/lib/auth-client.ts` | Client lib | 세션 스토어·캐시 삭제 |

#### 5.3.1 `auth-client.ts` 세션 스토어 (FR-029, SCR-018 상태)

- `useAuthUser(): AuthView` = `useSyncExternalStore(authStore.subscribe, authStore.getSnapshot, () => LOADING)`. 서버 스냅샷은 `loading`(정적 HTML에 사용자 정보 없음).
- 첫 구독 시 1회 초기화: `createBrowserClient()` null → `unconfigured`. 아니면 `auth.getSession()`(쿠키 로컬 읽기) → `resolve(session)`, `auth.onAuthStateChange((event, session) => resolve(session))` 구독.
- `resolve(session)`: `prev = localStorage[LAST_UID_KEY]`, `next = session?.user.id ?? null`, `detectAuthTransition(prev, next)`:
  - `login`/`switch`(SIGNED_IN 또는 SCR-017 경유 새 세션) → `clearSwPageCache()`
  - `logout-or-expired`(prev 있음, next 없음) → 사용자가 로그아웃 버튼을 누르면 `prepareSignOut`이 이미 prev를 지웠으므로 여기 도달 = **만료** → `expired: true`, `clearSwPageCache()`
  - `LAST_UID_KEY = next`로 갱신. 스냅샷은 모든 구독자(AccountMenu·PackingList·PackingSubtitle)가 공유하므로 전이 처리는 1회.
- `dismissExpired()`로 EL-05 닫기.
- `clearSwPageCache()`: `navigator.serviceWorker.controller?.postMessage({ type: "clear_pages" })` + `caches.keys()` 중 `pages-` 접두어 삭제(메시지 처리 전 이동해도 삭제 보장).
- `prepareSignOut(): Promise<boolean>`: `navigator.onLine === false`면 false(“연결 후 로그아웃할 수 있습니다.”). 아니면 `clearAccountStorage(lastUid)`(사본·대기열 삭제, 병합 완료 표시는 유지), `LAST_UID_KEY` 삭제, `await clearSwPageCache()`, true.

#### 5.3.2 `AccountMenu` (SCR-018)

| 상태 | 렌더 |
|---|---|
| `loading` | `w-24 h-11` 폭 고정 skeleton(레이아웃 이동 0) |
| `unconfigured` | 렌더 없음(계정 메뉴 숨김, 나머지 NAV 정상) |
| `guest` | EL-01 `Link` "로그인" — href `/login?next=<pathname>`, `onClick`에서 `location.pathname + location.search`로 갱신(`useSearchParams` 미사용 → Suspense 요구·정적 렌더 변경 없음). `/login`·`/signup`에서는 `href="/login"` + `aria-current="page"` |
| `user` | EL-02 `button aria-haspopup="menu" aria-expanded` 라벨 `email.slice(0,12) + "…"`(12자 이하면 원문) + "계정" 아이콘 텍스트(sr-only 포함). EL-03 드롭다운(role=menu): 전체 이메일, "관리자 화면"(조건부), EL-04 로그아웃 |
| `expired` | EL-05 `StatusNote` info(role=status) "로그인 시간이 만료되었습니다. 다시 로그인하면 계정 데이터를 불러옵니다." + "다시 로그인" → `/login?reason=expired&next=<현재 경로>`, 닫기 버튼 |

- "관리자 화면": 드롭다운을 **처음 열 때(onClick)** `client.from("team_members").select("role").maybeSingle()`(RLS self select) 1회 → `role === "leader"`면 `/admin` 링크. 실패 시 항목만 숨김. 표시용이며 권한은 SCR-007 서버가 판정.
- EL-04 로그아웃: `<form action="/auth/signout" method="post">` 제출 핸들러에서 `preventDefault` → `prepareSignOut()` → true면 `form.submit()`("로그아웃 중…" disabled), false면 "연결 후 로그아웃할 수 있습니다." 표시. 네트워크 오류 시 "로그아웃하지 못했습니다. 다시 시도해 주세요."
- 키보드: Esc 닫기 + 버튼으로 포커스 복귀, 바깥 클릭 닫기. 터치 44×44(`tap`).
- 배치(`AppHeader`): 기존 `justify-between` 컨테이너의 오른쪽에 `<div className="flex items-center gap-1">{기존 nav}<AccountMenu /></div>`. 기존 링크·클래스 불변. 모바일은 nav 숨김·AccountMenu만.

#### 5.3.3 `PackingList` 계정 모드 (SCR-009, FR-024, D-018 ②)

```tsx
export function PackingList(props: Props) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: true }, mutations: { retry: 0 } },
  }));
  return <QueryClientProvider client={queryClient}><PackingListBody {...props} /></QueryClientProvider>;
}
function PackingListBody(props: Props) {
  const auth = useAuthUser();
  if (auth.status === "loading") return <CardSkeleton count={4} />;
  if (auth.status === "user") return <AccountChecklist userId={auth.userId} {...props} />;
  return <GuestChecklist {...props} showAccountPrompt={auth.status === "guest"} />;
}
```

- **GuestChecklist**: 기존 코드 그대로(localStorage `loadState`/`saveState`, EL-03~09, EL-06 "이 기기에만 저장됩니다"). 추가는 EL-10(`showAccountPrompt`일 때, 진행률 카드 위): `StatusNote info` "로그인하면 체크 상태가 내 계정에 저장되어 다른 기기에서도 이어집니다." + `/login?next=/packing` "로그인" · `/signup?next=/packing` "회원가입". 기존 `packing.spec.ts` 선택자(`data-item-id`, `packing-progress`, "전체 해제")는 불변.
- **공통 렌더**: 진행률 카드·카테고리 JSX를 `ChecklistBody({ state, hydrated, statusLine, onToggle, onClearAll, notices })`로 추출해 두 모드가 공유(마크업·클래스 동일).
- **AccountChecklist**:
  1. `copy = readAccountCopy(userId, validIds)`; `queue` state 초기값 `readQueue(userId, validIds)`.
  2. `useQuery({ queryKey: ["packing_checks", userId], queryFn: () => fetchPackingChecks(client, validIds), placeholderData: copy?.rows })`. 성공 시 `writeAccountCopy`.
  3. 표시 = `toPackingState(applyQueue(query.data ?? copy?.rows ?? {}, queue))` → 기존 `progress()`·렌더 재사용. 데이터·사본 둘 다 없으면 skeleton(SCR-009 초기 상태).
  4. 체크(EL-09)·전체 해제(EL-04): `change(s)` → `enqueue` → `writeQueue` → 화면 즉시 반영 → `flush()`.
  5. `flush()`: `useMutation(savePackingChecksAction)`. 진행 중이면 새 변경은 대기열에만 쌓고(같은 항목은 최신 1건으로 병합) 완료 후 재호출. 성공 → `ackQueue(queue, sent)`(보낸 `updatedAt` 이하 항목 제거) → `invalidateQueries`. `unauthorized` → 대기열 유지 + EL-13. `error`·throw(네트워크) → 대기열 유지 + EL-11 실패.
  6. 재전송 트리거: 조회 성공 직후 대기열이 비어 있지 않을 때, `window` `online` 이벤트, 로그인 재진입. (구독·쓰기 트리거이며 조회에 `useEffect`를 쓰지 않는다.)
  7. **첫 로그인 병합(EL-12, D-015)**: 조회 성공 시 `isMigrated(userId)`가 false이면 `local = loadState(validIds).state`(guest 키), `changes = unionMigration(local, serverMap, now)`(로컬 checked 중 계정에서 checked가 아닌 항목만 `checked:true`). 0건이면 `markMigrated`만. N건이면 enqueue → flush 성공 시 `markMigrated` + EL-12 "이 기기에 있던 체크 N개를 내 계정으로 옮겼습니다."(닫기 가능). 실패 시 다음 진입에 재시도. guest 키는 지우지 않는다.
  8. EL-11(role=status) `syncStatus` → 문구: `saved` "내 계정에 저장됨 · 마지막 저장 [formatKoDateTime(lastSavedAt)]" · `saving` "저장 중…" · `failed` "저장하지 못했습니다. 연결되면 다시 저장합니다." · `offline`(`navigator.onLine === false`) "오프라인 · 마지막 저장 [시각]". EL-06 대신 표시.
  9. EL-13(warn): "로그인 시간이 만료되었습니다. 다시 로그인하면 계정에 저장합니다." + "다시 로그인" → `/login?reason=expired&next=/packing`.
- **PackingSubtitle(EL-02)**: `packing/page.tsx`의 `<p>` 한 줄을 `<PackingSubtitle />`로 교체. `user` → "체크 상태는 내 계정에 저장됩니다 · 12일 산장 트레킹 기준", 그 외(서버 스냅샷 포함) → 기존 문구. 정적 HTML은 기존 문구 그대로.
- `packing-store.ts`: 기존 함수 불변, `stateFromChecked(checked: Record<string, true>, updatedAt: string | null): PackingState` 1개 추가.

#### 5.3.4 `packing-sync.ts` 순수 함수 (단위 테스트 대상)

| 함수 | 규칙 |
|---|---|
| `rowsToMap(rows, validIds)` | snake_case 행 → CheckMap, 무효 id 제거 |
| `mergeLatest(a, b)` | 항목별 `updatedAt` 큰 쪽, 같으면 b |
| `applyQueue(base, queue)` | `mergeLatest(base, queue)` |
| `enqueue(queue, change)` | 같은 item은 `updatedAt` 최신 1건 |
| `ackQueue(queue, sent)` | 보낸 항목 중 queue의 `updatedAt <= sent.updatedAt`인 것 제거 |
| `queueToChanges(queue)` | CheckMap → CheckChange[] |
| `unionMigration(local, account, now)` | 로컬 checked ∧ 계정 미체크 → `{checked:true, updatedAt: now}` |
| `clearAllChanges(view, now)` | 현재 checked 전부 → `checked:false` |
| `toPackingState(map)` / `lastSavedAt(map)` | 표시용 변환 / 최대 `updatedAt` |
| `readAccountCopy`·`writeAccountCopy`·`readQueue`·`writeQueue`·`isMigrated`·`markMigrated`·`clearAccountStorage` | localStorage try/catch 래퍼, 실패 시 메모리 동작(EL-07과 동일 원칙) |

### 5.4 Page UI Checklist

#### SCR-015 `/login`
- [ ] h1 "로그인" (EL-01)
- [ ] 안내 StatusNote (EL-02): `error=auth` → "로그인 링크가 유효하지 않습니다. 다시 시도해 주세요. 다른 기기에서 링크를 열었다면 이 기기에서 다시 요청해 주세요." > `reason=expired` → "로그인 시간이 만료되었습니다. 다시 로그인해 주세요." > `next` 있음 → "로그인이 필요한 화면입니다. 로그인하면 보던 화면으로 돌아갑니다."
- [ ] 입력 이메일 label "이메일", placeholder "you@example.com", `autocomplete="email"` (EL-03)
- [ ] 입력 비밀번호 label "비밀번호", `autocomplete="current-password"`, 표시/숨김 토글 `aria-pressed` (EL-04)
- [ ] 버튼 "로그인"/"로그인 중…", pending disabled, `aria-busy` (EL-05)
- [ ] 오류 `role=alert` 3+1문구, 포커스 이동, 이메일 유지·비밀번호 비움 (EL-06)
- [ ] 필드 오류 `aria-invalid`·`aria-describedby`, 첫 오류 필드 포커스
- [ ] 링크 "계정이 없으신가요? 회원가입" → `/signup?next=` 유지 (EL-07)
- [ ] 링크 묶음 "팀원 이메일 링크 로그인"(`/journal/login`) · "리더 로그인"(`/admin`) (EL-09) — EL-08 없음
- [ ] 오프라인 제출 시 "오프라인 상태입니다. 연결 후 다시 로그인해 주세요."
- [ ] 폼 최대 28rem 중앙, 360px 1열

#### SCR-016 `/signup`
- [ ] h1 "회원가입" (EL-01), 안내 텍스트 (EL-09 전문)
- [ ] 이메일(EL-02), 비밀번호 + 도움말 "8자 이상" `autocomplete="new-password"`(EL-03), 비밀번호 확인(EL-04)
- [ ] 버튼 "가입하기"/"가입 중…" (EL-05)
- [ ] 오류 `role=alert` 5문구 (EL-06), 이메일 유지
- [ ] 성공 `role=status` "가입이 완료되어 로그인되었습니다. 잠시 후 보던 화면으로 이동합니다." + "바로 이동", 폼 숨김, 1초 후 이동 (EL-07)
- [ ] 링크 "이미 계정이 있으신가요? 로그인" (EL-08)
- [ ] 오프라인 "오프라인 상태입니다. 연결 후 다시 시도해 주세요."

#### SCR-018 공통 헤더
- [ ] NAV-001~011 기존 그대로
- [ ] NAV-012 "로그인" 링크(EL-01) / 계정 버튼 이메일 12자+"…"(EL-02) / 드롭다운 전체 이메일·"관리자 화면"(leader)·"로그아웃"(EL-03·04)
- [ ] 세션 만료 StatusNote + "다시 로그인" + 닫기 (EL-05)
- [ ] skeleton 폭 고정, Supabase 미설정 시 숨김

#### SCR-009 `/packing` (추가분)
- [ ] EL-02 문구 분기(PackingSubtitle)
- [ ] EL-10 로그인·회원가입 안내 카드(비로그인 + 설정됨)
- [ ] EL-11 저장 상태 4문구(role=status)
- [ ] EL-12 이전 알림 N개(1회, 닫기)
- [ ] EL-13 만료 경고 + "다시 로그인"
- [ ] 기존 EL-03~09 선택자·문구 불변

#### SCR-012 `/journal/login`, SCR-007 `/admin` (최소 변경)
- [ ] SCR-012-EL-07 링크 "메일이 오지 않나요? 이메일·비밀번호로 로그인" → `/login?next=<next>`
- [ ] SCR-012-EL-02·SCR-007-EL-02 본문 끝 "다른 기기에서 링크를 열었다면 이 기기에서 다시 요청해 주세요."

---

## 6. Error Handling

### 6.1 Error Code Definition

| Code | Message(사용자) | Cause | Handling | Log |
|------|---------|-------|----------|-----|
| invalid(필드) | 필드별 zod 문구 | 형식·길이·확인 불일치 | 필드 아래 표시, 첫 오류 포커스 | 없음 |
| invalid_credentials | "이메일 또는 비밀번호가 올바르지 않습니다." | 자격 오류 | 이메일 유지 | `auth_login_failed` warn |
| duplicate / hook_rejected | "이 이메일로 가입할 수 없습니다. 이미 계정이 있으면 로그인해 주세요." | 기존 계정 / `team_members` 이메일 | EL-08 로그인 링크 안내 | `auth_signup_failed` warn |
| rate_limited(429) | "요청이 많습니다. 잠시 후 다시 시도해 주세요." | Auth 요청 한도 | 재시도 | `auth_*_failed` warn |
| signup_disabled | "현재 회원가입을 받지 않습니다. 리더에게 문의해 주세요." | 가입 허용 OFF(11.5 ②) | — | `auth_signup_failed` |
| unconfigured | "…기능이 비활성입니다 — Supabase 설정이 필요합니다." | 환경변수 없음 | 계정 메뉴 숨김, 공개·guest 정상 | `supabase_unconfigured` warn |
| unauthorized(저장) | EL-13 만료 경고 | 서버 세션 없음 | 대기열 유지 → 재로그인 후 재전송 | `auth_session_expired` info |
| sync error | EL-11 "저장하지 못했습니다. 연결되면 다시 저장합니다." | 5xx·네트워크 | 대기열 유지 | `packing_sync_failed` warn |
| owner tamper | 화면 문구 없음 | 요청에 `user_id` 주입 | 값 무시(RLS·`auth.uid()`) | `owner_access_denied` security |
| next rejected | 없음 | 오픈 리다이렉트 시도 | 기본 경로로 대체 | `auth_next_rejected` security |
| callback 실패 | "로그인 링크가 유효하지 않습니다…" | code 없음·교환 실패 | 3분기 fallback | `auth_callback_failed` warn |

### 6.2 Error Response Format

Server Action은 예외를 던지지 않고 판별 유니온을 반환한다: `AuthFormState`(§4.2), `PackingSyncResult`. Supabase 원문 오류 메시지는 화면에 노출하지 않는다(기존 `sendMagicLinkAction`의 `로그인 링크 발송 실패: [message]`는 기준선이라 유지).

`src/lib/log.ts` `LogCode`에 추가: `auth_login_succeeded`, `auth_login_failed`, `auth_signup_requested`, `auth_signup_failed`, `auth_callback_failed`, `auth_logout`, `auth_session_expired`, `auth_next_rejected`, `packing_sync_failed`, `packing_local_migrated`, `owner_access_denied`, `supabase_unconfigured`. 메타에는 `emailHash`·`reason`만.

---

## 7. Security Considerations

- [ ] **RLS**: `packing_checks` 4정책 `user_id = auth.uid()`, anon `revoke all`, authenticated 4권한만(FR-023). `upsert_packing_checks`는 security invoker, anon·public 실행 불가.
- [ ] **Hook**: `hook_before_user_created` 실행은 `supabase_auth_admin`만, `authenticated`·`anon`·`public` revoke(FR-030).
- [ ] **service_role**: 앱 코드·Vercel 미사용. `scripts/seed-synthetic.mjs`만 로컬 `.env.local`에서 읽음(번들·배포 대상 아님).
- [ ] **역할 함수 불변**: `is_admin()`·`is_team_member()`·`jwt_email()`는 000001 정의만 존재(텍스트 테스트).
- [ ] **오픈 리다이렉트**: 강화된 `safeNext`(§4.3) 모든 경로.
- [ ] **캐시 격리**(DATA-012, I-025): §7.1.
- [ ] **로그**: 비밀번호·토큰·원문 이메일 금지, `emailHash`만.
- [ ] **비밀값**: `.gitignore`(§7.2), 스캔 테스트(§8.2 #6), GitHub secret scanning·push protection.
- [ ] **쿠키**: `@supabase/ssr` 기본(production `Secure`·`SameSite=Lax`).
- [ ] **Rate limit**: Supabase Auth 기본 한도, 429 문구.

### 7.1 Service Worker 변경 (`src/lib/sw-rules.ts` + `public/sw.js`, 동기화 필수)

| 항목 | 변경 |
|---|---|
| `SW_VERSION` | `"tmb-2027-v2"` → `"tmb-2027-v3"`(activate에서 v2 캐시 삭제 — 기존 관리자 Day 사본 제거) |
| 상수 | `USER_SCOPED_HEADER = "x-tmb-user-scoped"`, `NETWORK_FIRST_TIMEOUT_MS = 3000`, `PAGES_CACHE_PREFIX = "pages-"`, `NETWORK_FIRST_PATTERNS = [/^\/day\//, /^\/packing$/]` |
| `ROUTE_RULES` | + `{ /^\/login$/, "network-only" }`, `{ /^\/signup$/, "network-only" }` |
| `Strategy` | + `"network-only"` — `/login`·`/signup` 내비게이션: fetch만, 실패 시 `/offline`(SCR-015 오프라인 상태), 캐시 저장 없음. `/auth/*`는 기존 bypass 유지 |
| `pageStrategy(pathname)` | `/day/*`·`/packing` → `"network-first"`, 그 외 page → `"cache-first"`(기존 `handlePage`) |
| `isCacheableResponse(res)` | `res.ok && res.type !== "opaqueredirect" && res.headers.get(USER_SCOPED_HEADER) !== "1"` — `Cache-Control: no-store`는 판단에 쓰지 않음 |
| `resolveNetworkFirst(outcome, hasCache)` | `ok`→`network` · `error`→`hasCache ? "cache" : "offline-fallback"` · `timeout`→`hasCache ? "cache" : "wait-network"` |
| `handlePageNetworkFirst` | fetch와 3초 타이머 race. 응답 먼저 → 반환(캐시 가능하면 백그라운드 `cache.put`+`recordRoute`). 타임아웃+사본 → 사본 반환, 응답은 백그라운드 갱신. 네트워크 오류+사본 → 사본 + `offline_cache_served` 알림. 사본 없음 → 응답 대기 또는 `/offline` |
| `handlePage`·`cachePage`·`handleData` | 저장 전 `isCacheableResponse` 검사(첫 방문 `cache_page` 메시지 경로 포함) |
| message `clear_pages` | `caches.delete(PAGES_CACHE)` + manifest `routes = {}`, `cachedAt = null`(`lastBookingSnapshot`은 공개 데이터라 유지) |
| 준비물 저장 | Server Action POST → 기존 `method !== "GET"` bypass(캐시 없음) |

### 7.2 `.gitignore` / `.env.example` 최종 내용 (FR-025, DATA-019)

```gitignore
node_modules
.next
.next-e2e
.next*/
out
.env
.env.*
!.env.example
.env*.local
.vercel
supabase/.temp
test-results
playwright-report
*.tsbuildinfo
next-env.d.ts
.claude/settings.local.json
.claude/agent-memory/
.bkit/audit/
.bkit/runtime/
.bkit/checkpoints/
```

```dotenv
# Supabase (public — bundled to client; anon/publishable key only, never service_role/secret)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Magic-link redirect fallback (local: http://localhost:3000). Request origin is used first.
NEXT_PUBLIC_SITE_URL=

# Leader account (server only). Editing is disabled when empty.
ADMIN_EMAIL=

# Security alert mail (server only, optional)
RESEND_API_KEY=
SECURITY_MAIL_FROM=
```

`SUPABASE_SERVICE_ROLE_KEY` 행은 삭제(11.4). `.env.test.local`(E2E 계정)은 `.env.*`·`.env*.local`로 제외.

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Tool | Phase |
|------|--------|------|-------|
| L1: Unit/규칙 | `safe-next`, `auth-rules`, `packing-sync`, `sw-rules`(6건+), 비밀값 스캔, 마이그레이션 텍스트 | Vitest(`tests/unit/**`) | Do |
| L2: UI Action | `/login`·`/signup` 폼 검증·문구·접근성, SCR-018 메뉴, SCR-009 계정 요소 | Playwright | Do |
| L3: E2E | 가입→즉시 로그인→준비물, 두 계정 격리, 만료, 로그아웃 캐시, Hook 거부 | Playwright(두 context) | Do |
| 회귀 | 기존 15 unit 파일·5 E2E 스펙 무수정 | Vitest·Playwright `--workers=1` | Do·Check |

### 8.2 L1: Unit Test Scenarios

| # | File | Test | Expected | SC·FR |
|---|------|------|----------|-------|
| 1 | `tests/unit/auth-rules.test.ts` | `safeNext` §4.3 표 전체(쿼리 디코드 전·후 두 형태) + origin 인자 | 허용 3종 그대로, 나머지 fallback | FR-021 · SC-020 |
| 2 | 〃 | `LoginSchema`/`SignupSchema`: 빈 값·형식·7자·73자·확인 불일치·대문자 이메일 소문자화 | 문구 일치 | FR-019·020 |
| 3 | 〃 | `classifySignInError`/`classifySignUpError` 분류표 전 행, `AUTH_MESSAGES` 문구 | §4.2 표 | FR-019·020 · I-029 |
| 4 | 〃 | `originFromHeaders`(정상 host, 포트, 위조 host `evil.com/x`, proto 누락 localhost) · `callbackFailurePath` 3분기 · `detectAuthTransition` 4결과 | 일치 | FR-021 · I-015 |
| 5 | `tests/unit/packing-sync.test.ts` | `mergeLatest`·`enqueue` 최신 우선, `ackQueue` 부분 확인, `unionMigration`(로컬 3·계정 2·겹침 1 → 2건), `clearAllChanges`, 무효 id 제거, 저장소 예외 시 메모리 동작 | 규칙표 | FR-024 · SC-018 |
| 6 | `tests/unit/secrets.test.ts` | 대상: `git ls-files --cached --others --exclude-standard`(git 없으면 `.gitignore` 규칙을 흉내 낸 디렉터리 순회: `node_modules`·`.next*`·`.git`·`test-results`·`playwright-report`·`.env*`(example 제외)·`.bkit/{audit,runtime,checkpoints}`·`.claude/{settings.local.json,agent-memory}` 제외), 1MB 이하 텍스트만. 패턴: `sb_secret_[A-Za-z0-9_-]{10,}`, payload `role`이 `service_role`인 JWT(`eyJ…` 3분절 디코드), `sk-(proj-)?[A-Za-z0-9_-]{20,}`, `re_[A-Za-z0-9_]{16,}`, `postgres(ql)?://[^:\s]+:[^@\s]+@`. `.env.local`이 있으면 그 파일의 16자 이상 값이 어떤 대상 파일에도 없음 | 0건 | FR-028 · SC-023 |
| 7 | 〃 | `.env.example` 키 = {`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`, `ADMIN_EMAIL`, `RESEND_API_KEY`, `SECURITY_MAIL_FROM`}, 모든 값 비어 있음, `SERVICE_ROLE` 없음. `.gitignore`에 §7.2 규칙 전부. git 있으면 `git check-ignore -q` `.env.local`·`.env.test.local`·`.vercel/x`·`supabase/.temp/x`·`.bkit/audit/x`·`.claude/agent-memory/x` | 통과 | FR-025 · SC-023 |
| 8 | `tests/unit/migrations-v4.test.ts` | 000005: `not null default auth.uid() references auth.users (id) on delete cascade`, `primary key (user_id, item_id)`, `char_length(item_id) between 1 and 64`, `checked boolean not null default true`, RLS enable, 4정책(select/delete `using`, insert `with check`, update 둘 다) `user_id = auth.uid()`, `revoke all on public.packing_checks from anon`, grant 4권한, 함수 `security invoker`·`where p.updated_at < excluded.updated_at` | 정규식 일치 | FR-022·023 |
| 9 | 〃 | 000006: `team_members` 조회, `http_code', 403`, `grant execute … to supabase_auth_admin`, `revoke execute … from authenticated, anon, public`, `grant select on table public.team_members to supabase_auth_admin`. 모든 마이그레이션에서 `function public.is_admin`·`is_team_member` 정의가 000001에만 존재 | 일치 | FR-030 · SC-020 |
| 10 | `tests/unit/sw-rules-v4.test.ts` | ① 헤더 `x-tmb-user-scoped: 1`인 `/day` 응답 `isCacheableResponse=false` ② 헤더 없는 `Cache-Control: no-store` `/day` 응답 true ③ `classify(/api/bookings, GET)`=`swr` 유지 ④ `pageStrategy("/day/d2027-08-04")`=`network-first` & `resolveNetworkFirst("ok", true)`=`network` ⑤ 오프라인 `resolveNetworkFirst("error", true)`=`cache` ⑥ 3초 초과 `resolveNetworkFirst("timeout", true)`=`cache`, `NETWORK_FIRST_TIMEOUT_MS=3000`. 추가: `/login`·`/signup` 내비게이션 `network-only`, `/packing` network-first, `public/sw.js`에 `USER_SCOPED_HEADER`·`clear_pages`·`tmb-2027-v3` 문자열 존재 | 일치 | DATA-012 · I-025 · SC-006·020 |
| 11 | `tests/unit/packing-store.test.ts`(기존, 무수정) + 신규 케이스는 `packing-sync.test.ts`에 `stateFromChecked` | 기존 통과 | FR-015·027 |

### 8.3 L2: UI Action Test Scenarios (`tests/e2e/auth.spec.ts`, Supabase 불필요 부분)

| # | Page | Action | Expected | SC |
|---|------|--------|----------|----|
| 1 | `/login` | 로드 | §5.4 SCR-015 요소 전부, EL-08 없음 | SC-016 |
| 2 | `/login` | 빈 제출 | "이메일을 입력해 주세요." `aria-invalid`, 이메일 포커스 | FR-020 |
| 3 | `/login?reason=expired&next=/packing` | 로드 | 만료 문구 | SC-021 |
| 4 | `/signup` | 7자 비밀번호 / 확인 불일치 | "비밀번호는 8자 이상이어야 합니다." / "비밀번호가 서로 다릅니다." | FR-019 |
| 5 | `/auth/callback?next=/packing` (code 없음) | 이동 | `/login?error=auth…` + "다른 기기에서…" 문장. `next=/journal` → `/journal/login?error=auth`, `next=/admin/bookings` → `/admin?error=auth` | SCR-017 |
| 6 | `/login`·`/signup`·임의 화면 | 360/768/1440 axe·가로 스크롤 0·터치 44px, 헤더 "로그인" 링크(`/login`에서 `aria-current="page"`) | 위반 0 | SC-005 · FR-029 |
| 7 | `/packing`(비로그인) | 로드 | EL-10 링크 `next=/packing`, 기존 부제 문구 | SCR-009 |

### 8.4 L3: E2E Scenario Test Scenarios

게이트: `.env.test.local`의 `E2E_USER_A_EMAIL`·`E2E_USER_B_EMAIL`(+ 비밀번호)이 없으면 `test.skip`. 가입·다중 계정 스펙은 `desktop-1440` 프로젝트에서만 실행(Auth 한도). `playwright.config.ts` 최상단에 `.env.test.local`이 있으면 `process.loadEnvFile(".env.test.local")`(Node 24) — 조건부 수정 1줄.

| # | Spec | Scenario | Steps | Success Criteria | SC |
|---|------|----------|-------|------------------|----|
| 1 | `auth.spec.ts` | 가입 즉시 로그인 | `/signup?next=/packing`에 `e2e-<timestamp>@<E2E_EMAIL_DOMAIN>` 가입 | EL-07 → `/packing`, 계정 버튼에 이메일 앞 12자, EL-02 "내 계정" 문구 | SC-016 |
| 2 | 〃 | 중복 가입·재로그인 | 로그아웃 → 같은 이메일 가입 → 오류 → `/login` 로그인 | duplicate 문구, 로그인 성공 | SC-016 |
| 3 | 〃 | 잘못된 비밀번호 | A 이메일 + 틀린 비밀번호 | invalid 문구, 이메일 유지 | FR-020 |
| 4 | 〃 | Hook 거부 | `E2E_MEMBER_1_EMAIL`로 `/signup` | 같은 가입 불가 문구 | SC-020 · FR-030 |
| 5 | 〃 | 첫 로그인 병합 | 새 context 비로그인 2개 체크 → 새 가입 계정 로그인 → `/packing` | EL-12 "…2개를…", 새로고침 후 2개 유지, 재방문 시 EL-12 없음 | FR-024 |
| 6 | 〃 | 오픈 리다이렉트 | `/login?next=//evil.com`으로 A 로그인 | `/`로 이동, 외부 origin 0 | FR-021 |
| 7 | 〃 | 만료 | A 로그인 후 `context.clearCookies()` → 이동 | EL-05 → "다시 로그인" → `/login?reason=expired&next=…` → 로그인 후 원래 화면 | SC-021 |
| 8 | `multiuser.spec.ts` | 두 계정 격리 | beforeAll: A·B 각자 JWT로 본인 행 delete. ctxA·ctxB 로그인 → A 3개·B 5개 체크 → 둘 다 reload | A 3/34·B 5/34, 서로의 항목 미체크. supabase-js(anon 키+각자 로그인)로 `checked=true` A 3행·B 5행 | SC-017·018 |
| 9 | 〃 | 교차 접근 | A 클라이언트로 `select/update/delete … eq("user_id", B.id)` | 0행·0행·0행, B 5행 불변. anon 클라이언트 select → 0행 또는 오류, `bookings` select 거부 | SC-019·020 |
| 10 | 〃 | 세션 독립·영속 | ctxA 로그아웃 → ctxB reload; ctxB storageState로 새 context | B 로그인 유지·체크 유지, A 메뉴 "로그인" | SC-017·021 |
| 11 | 〃 | 로그아웃 캐시 | 리더 제외 A로 `/day/d2027-08-04` 방문 후 로그아웃 → `caches.keys()`·`pages-*` 항목 조회 | page 캐시 비어 있음, 계정 사본·대기열 키 0 | SC-020 |
| 12 | 〃 | 오프라인 재전송 | ctxA `setOffline(true)` → 체크 → EL-11 실패/오프라인 문구 → `setOffline(false)` | "내 계정에 저장됨", reload 후 유지 | FR-024 |
| 13 | 기존 `offline.spec.ts`·`packing.spec.ts`·`security.spec.ts`·`day-detail.spec.ts`·`responsive.spec.ts` | 무수정 실행 | — | 전부 통과(≥111) | SC-022 |
| 14 | production 스모크(`PLAYWRIGHT_BASE_URL=https://utmb2027.vercel.app`) | 1·2·8 + SCR-001·006·009·015 200·콘솔 오류 0 | — | 통과 | SC-016·024 |

### 8.5 Seed Data Requirements — 합성 데이터 (`scripts/seed-synthetic.mjs`)

| Entity | Count | Key Fields |
|--------|:-----:|------------|
| 리더 auth user | 1 | `ADMIN_EMAIL`, `email_confirm: true`, 비밀번호 없음(magic link 또는 대시보드에서 직접 설정) |
| `team_members` 리더 | 1 | role `leader`, enabled, display_name "리더" — 계정 생성 **후** 등록 |
| 합성 팀원 auth user | 3 | `member1~3@<E2E_EMAIL_DOMAIN>`(기본 `tmb2027.test`), auto-confirm, 무작위 비밀번호(`crypto.randomBytes(18).toString("base64url")`) |
| `team_members` 팀원 | 3 | role `member`, display_name "팀원1~3" — 계정 생성 **후** 등록(D-017 순서) |
| E2E 사용자 | 2 | `e2e-a@`·`e2e-b@<도메인>`, auto-confirm, 무작위 비밀번호, `team_members` 미등록 |
| `packing_checks` 샘플 | 팀원1 3행·팀원2 5행 | `upsert` onConflict `user_id,item_id` (E2E A·B는 비워 둠 — SC-018 계수 보존) |
| `journal_entries` 샘플 | 3 | 텍스트만(이미지 없음), 팀원1 `d2027-08-04`·`d2027-08-05`, 팀원2 `d2027-08-05`, upsert onConflict `day_id,author_id` |

동작 규칙:
- 실행: `node --env-file=.env.local scripts/seed-synthetic.mjs`(로컬 전용). `process.env.VERCEL` 또는 `CI`가 있으면 즉시 종료. 필수: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`.
- 멱등: `auth.admin.listUsers`(페이지 순회)로 이메일 존재 확인 → 없으면 `createUser`, 있으면 건너뜀. `.env.test.local`에 비밀번호가 이미 있으면 재사용, 계정은 있는데 비밀번호가 없으면 `updateUserById`로 새 비밀번호 설정. 모든 쓰기는 upsert.
- `.env.test.local` 갱신: `E2E_USER_A_EMAIL/PASSWORD`, `E2E_USER_B_EMAIL/PASSWORD`, `E2E_MEMBER_1..3_EMAIL/PASSWORD`, `E2E_EMAIL_DOMAIN` — 기존 다른 키 보존, 파일은 `.gitignore` 대상.
- 비밀번호·키는 stdout에 출력하지 않는다(생성/건너뜀 개수만). 스크립트 파일에는 비밀값이 없으며 `secrets.test.ts` 대상이다.
- 실제 팀원 계정은 이 스크립트가 아니라 대시보드 "Add user"로 만든다(11.5 ④). 스크립트의 합성 팀원은 테스트용이며 production 공개 전 삭제 여부를 작성자가 결정한다.

---

## 9. Clean Architecture

### 9.1 Layer Structure

| Layer | Responsibility | Location |
|-------|---------------|----------|
| Presentation | 페이지·폼·메뉴·체크리스트 | `src/app/login|signup/page.tsx`, `src/components/auth/*`, `src/components/layout/AccountMenu.tsx`, `src/components/packing/PackingList.tsx` |
| Application | Server Action(검증·호출·로그) | `src/app/login/actions.ts`, `src/app/packing/actions.ts`, `src/app/auth/*/route.ts`, `src/middleware.ts` |
| Domain | 순수 규칙 | `src/lib/auth-rules.ts`, `src/lib/safe-next.ts`, `src/lib/packing-sync.ts`(순수부), `src/lib/packing-store.ts`, `src/lib/sw-rules.ts` |
| Infrastructure | Supabase·브라우저 저장소·SW | `src/lib/supabase/*`, `src/lib/auth-client.ts`, `public/sw.js`, `supabase/migrations/*` |

### 9.2 Dependency Rules

Domain 모듈은 `react`·`next`·Supabase를 import하지 않는다(`packing-sync.ts`의 localStorage 래퍼는 `window` 접근을 try/catch로 감싼 얇은 함수로 같은 파일에 두되 순수 함수와 분리 export). Presentation은 Application(액션)과 Domain을 사용하고, Supabase 브라우저 클라이언트는 `auth-client`·`packing-sync.fetchPackingChecks`를 통해서만 쓴다.

### 9.3 This Feature's Layer Assignment

| Component | Layer | Location |
|-----------|-------|----------|
| LoginForm·SignupForm·AccountMenu·PackingList | Presentation | `src/components/**` |
| signInAction·signUpAction·savePackingChecksAction | Application | `src/app/**/actions.ts` |
| LoginSchema·classify*·safeNext·mergeLatest·pageStrategy | Domain | `src/lib/*.ts` |
| authStore·clearSwPageCache·requestOrigin·migrations | Infrastructure | `src/lib/auth-client.ts`, `src/lib/supabase/server.ts`, `supabase/` |

---

## 10. Coding Convention Reference

| Item | Convention Applied |
|------|-------------------|
| Component naming | PascalCase 파일·export(`AccountMenu.tsx`), 기존 named export 패턴 |
| File organization | 기존 `src/app`·`src/components/<domain>`·`src/lib` 유지, 새 폴더는 `src/components/auth/`·`src/app/login|signup/`만 |
| Client boundary | `'use client'`는 폼·AccountMenu·PackingList·SignOutButton·auth-client만 |
| State | 세션 = `useSyncExternalStore`, 서버 데이터 = react-query(로컬 provider), 폼 = `useActionState` |
| Types | strict, `any` 금지 — Supabase 오류는 `{ status?: number; code?: string; message?: string }`로 좁힘 |
| Styling | 기존 `card`·`tap`·`StatusNote`·`bg-alpine`·`text-rock`, 조건부 클래스는 `cn()`(없으면 템플릿 문자열 — 기존 파일 패턴 유지) |
| Comments | 코드 주석 추가 없음(마이그레이션 헤더 주석은 기존 SQL 관례) |
| Env | §7.2 목록, `NEXT_PUBLIC_*`는 공개 가능한 값만 |

---

## 11. Implementation Guide

### 11.1 File Structure

```
신규 (21)
  src/app/login/page.tsx                      SCR-015
  src/app/login/actions.ts                    signInAction · signUpAction (FR-019·020)
  src/app/signup/page.tsx                     SCR-016
  src/app/packing/actions.ts                  savePackingChecksAction (FR-022~024)
  src/components/auth/LoginForm.tsx           SCR-015-EL-03~06
  src/components/auth/SignupForm.tsx          SCR-016-EL-02~07
  src/components/layout/AccountMenu.tsx       SCR-018-EL-01~05 (NAV-012)
  src/lib/auth-rules.ts                       zod·오류 분류·origin·전이 (순수)
  src/lib/auth-client.ts                      authStore·useAuthUser·clearSwPageCache·prepareSignOut
  src/lib/packing-sync.ts                     병합·대기열·계정 사본 (DATA-014·018)
  supabase/migrations/20260923000005_packing_checks.sql
  supabase/migrations/20260923000006_signup_guard_hook.sql
  supabase/config.toml                        auth 섹션(§12.1)
  scripts/seed-synthetic.mjs                  합성 seed (로컬 전용)
  tests/unit/auth-rules.test.ts · packing-sync.test.ts · secrets.test.ts · migrations-v4.test.ts · sw-rules-v4.test.ts
  tests/e2e/auth.spec.ts · multiuser.spec.ts
수정 (23)
  src/components/layout/AppHeader.tsx · src/components/packing/PackingList.tsx · src/app/packing/page.tsx(부제 1줄)
  src/lib/packing-store.ts(함수 1개 추가) · src/app/auth/callback/route.ts · src/app/auth/signout/route.ts(로그 1줄)
  src/lib/safe-next.ts · src/components/journal/TeamLoginForm.tsx · src/app/admin/actions.ts · src/app/journal/actions.ts
  src/app/admin/page.tsx · src/app/journal/login/page.tsx(배너 문장) · src/middleware.ts · src/lib/sw-rules.ts · public/sw.js
  src/components/admin/SignOutButton.tsx · src/lib/supabase/server.ts(requestOrigin) · src/lib/log.ts(LogCode)
  .gitignore · .env.example · playwright.config.ts(조건부 1줄) · package.json · package-lock.json
불변 (명시)
  src/app/layout.tsx · 기존 tests/unit/*·tests/e2e/* · 기존 마이그레이션 000001~000004
```

### 11.2 Implementation Order

1. [ ] **I-014 선행 확인**: `supabase link`·`supabase migration list`(작성자 지시 후 원격). 로컬 코드 작업은 병행 가능
2. [ ] `npm install @tanstack/react-query`(D-018 ②) → verify: `package.json` dependencies 1개 증가
3. [ ] `safe-next.ts` 강화 + `auth-rules.ts` + `auth-rules.test.ts` → verify: 기존 `bookings.test.ts` + 신규 통과
4. [ ] `log.ts` LogCode, `supabase/server.ts` `requestOrigin`, admin·journal actions origin 교체 → verify: typecheck
5. [ ] `login/actions.ts`, `LoginForm`, `SignupForm`, `/login`·`/signup` 페이지 → verify: auth.spec L2 1~4
6. [ ] `auth-client.ts`, `AccountMenu`, `AppHeader` 배치, `SignOutButton` client 전환, signout 로그 → verify: L2 6, responsive.spec
7. [ ] callback 실패 3분기, 배너 문장, `TeamLoginForm` EL-07 → verify: L2 5, security.spec
8. [ ] 마이그레이션 000005·000006 + `migrations-v4.test.ts` → verify: 텍스트 테스트
9. [ ] `packing-sync.ts` + 테스트, `packing-store.stateFromChecked`, `packing/actions.ts`, `PackingList` 계정 모드, `PackingSubtitle` → verify: packing.spec(무수정) + packing-sync 테스트
10. [ ] `middleware` matcher·헤더, `sw-rules`·`sw.js` v3 + `sw-rules-v4.test.ts` → verify: offline.spec(무수정) + 6건
11. [ ] `.gitignore`·`.env.example`·`secrets.test.ts` → verify: 스캔 0건
12. [ ] `supabase/config.toml`, `scripts/seed-synthetic.mjs`, `playwright.config.ts` env 로드 → verify: seed 2회 실행 멱등(작성자 지시 후, 원격 적용 뒤)
13. [ ] `auth.spec.ts`·`multiuser.spec.ts` L3 → verify: 게이트 on/off 모두 통과
14. [ ] 전체 회귀: `npm run typecheck`·`npm test`·`npx playwright test --workers=1`·`npm run build` 라우트 표 비교 → SC-022
15. [ ] 작성자 지시 후 운영 롤아웃 §12.2 → production 체크리스트 → SC-016·024

### 11.3 Session Guide

#### Module Map

| Module | Scope Key | Description | 파일 | 주요 ID | Estimated Turns |
|--------|-----------|-------------|------|---------|:---------------:|
| 인증 | `module-1` | safeNext 강화, auth-rules, 로그인·가입 액션·화면, AccountMenu·auth-client, SignOutButton, callback 실패 경로, 배너 문장, SCR-012-EL-07, origin 기반 magic link, Hook 마이그레이션 | 11.2 #2~7, 000006 | SCR-015~018 · FR-019·020·021·029·030 | 40-50 |
| 준비물 동기화 | `module-2` | 000005 마이그레이션·RPC, packing-sync, packing 액션, PackingList 계정 모드·로컬 provider, 병합·대기열 | 11.2 #8~9 | SCR-009-EL-02·10~13 · FR-022~024 · DATA-014·018 | 35-45 |
| SW·middleware | `module-3` | matcher·`x-tmb-user-scoped`, sw-rules·sw.js v3, network-first 3초, clear_pages | 11.2 #10 | DATA-012 · I-025 · SC-006·020 | 20-30 |
| 저장소·배포 | `module-4` | .gitignore·.env.example, config.toml, seed 스크립트, GitHub·Vercel·Supabase 롤아웃(작성자 지시 후) | 11.2 #11·12·15 | FR-025·026·028 · DATA-019 · SC-023·024 | 20-30 |
| 테스트·회귀 | `module-5` | 비밀값 스캔·마이그레이션·sw 단위, auth·multiuser E2E, 전체 회귀·라우트 표 | 11.2 #13·14 | FR-027 · SC-016~022 | 30-40 |

#### Recommended Session Plan

| Session | Phase | Scope | Turns |
|---------|-------|-------|:-----:|
| Session 1 | Plan + Design | 전체(본 문서) | 완료 |
| Session 2 | Do | `--scope module-1` | 40-50 |
| Session 3 | Do | `--scope module-2,module-3` | 50-60 |
| Session 4 | Do | `--scope module-4,module-5` | 40-50 |
| Session 5 | Check + Act + Report | 전체(general-purpose 에이전트, `--workers=1`) | 30-40 |

---

## 12. Operations — Supabase·GitHub·Vercel

### 12.1 `supabase/config.toml` (최종 상태 기록)

```toml
[auth]
enabled = true
site_url = "https://utmb2027.vercel.app"
additional_redirect_urls = [
  "http://localhost:3000/**",
  "https://utmb2027.vercel.app/**",
  "https://*-don-changs-projects.vercel.app/**",
]
enable_signup = true
minimum_password_length = 8

[auth.email]
enable_signup = true
enable_confirmations = false

[auth.hook.before_user_created]
enabled = true
uri = "pg-functions://postgres/public/hook_before_user_created"
```

원격 반영의 기준은 대시보드이며 11.5 순서를 따른다. 이 파일은 `enable_signup = true`인 **최종 상태**이므로 `supabase config push`는 §12.2 R9(⑦) 이후에만 허용한다. SMTP는 D-011 Open → 기본 SMTP(설정 없음).

### 12.2 순서 고정 롤아웃 (PRD 11.5, 모든 원격 작업은 작성자 지시 후)

| # | 단계 | 작업 | 확인 |
|---|---|---|---|
| R0 | 로컬 완료 | module-1~5, `typecheck`·`test`·`playwright --workers=1`·`build` | SC-022 |
| R1 | ① 원격 연결 | `supabase login` → `supabase link --project-ref <ref>` → `supabase migration list`, 000001~000004 미적용분 순서 적용 | I-014 |
| R2 | ② 가입 차단 | 대시보드 "Allow new users to sign up" **OFF** | 가입 API 거부 |
| R3 | ③ 마이그레이션·Hook | `supabase db push`(000005·000006) → Auth Hooks "Before User Created" = `public.hook_before_user_created` 활성 | 함수·정책 존재 |
| R4 | ④ 계정 선생성 | `team_members` 전 이메일·`ADMIN_EMAIL`의 기존 `auth.users` 확인 → 본인 생성이 아닌 계정 삭제 → 대시보드 "Add user"(Auto Confirm, 초기 비밀번호 오프라인 전달) → 그다음 `team_members` insert(역순 금지). 합성 데이터는 `node --env-file=.env.local scripts/seed-synthetic.mjs` | 모든 `team_members` 이메일에 계정 존재 |
| R5 | ⑤ Auth 설정 | Confirm email OFF, 최소 비밀번호 8, Site URL `https://utmb2027.vercel.app`, Redirect URLs(§12.1 3개), SMTP 기본(D-011) | 대시보드 값 |
| R6 | ⑥ 검증 | `team_members` 이메일로 `auth/v1/signup` 직접 호출 → 403, 선생성 계정 목록 대조 | D-017 체크리스트 |
| R7 | GitHub | `git init -b main` → `.gitignore` 확인(`git check-ignore -v .env.local`) → I-028 공개 범위 점검(`git ls-files` 목록·실제 이메일·전화·예약번호 0) → `npm test`(비밀값 스캔) → 최초 커밋 `feat: add multiuser auth and cloud deployment` → GitHub public `donchang07/tmb-2027` 생성 → **push 전** secret scanning·push protection 활성 → `git push -u origin main`. 이후 변경은 `feat/multiuser-cloud-deployment` 브랜치 → PR → `main` | SC-023 |
| R8 | Vercel | team `don-changs-projects`에 프로젝트 `utmb2027` 생성·Git 연동(Framework Next.js, `next build`, Node 24) → 함수 리전을 Supabase 리전 권역으로(I-022) → 환경변수(§12.3) → `main` Production 배포 → Ready | SC-024 |
| R9 | ⑦ 공개 | "Allow new users to sign up" **ON**(또는 `supabase config push`) → 즉시 R6 재실행 + 새 이메일 가입 즉시 로그인 확인 → production 체크리스트(11.5 #6: 가입→준비물→시크릿 창 두 번째 계정→새로고침→로그아웃→`team_members` 이메일 가입 거부, 콘솔 오류 0) 통과 후에만 URL 공유 | SC-016~021·024 |

중단 조건(PRD 15장): Hook 미활성 또는 선생성 미완료 상태에서 공개가 필요한 경우, 비밀값 커밋 발견(push 중단·키 교체), 타인 데이터 노출.

### 12.3 Vercel 환경변수 (FR-026, DATA-019)

| 변수 | Development(`.env.local`) | Preview | Production | 비고 |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 필요 | 등록 | 등록 | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 필요 | 등록 | 등록 | anon/publishable만 |
| `ADMIN_EMAIL` | 필요 | 등록 | 등록 | 서버 전용 |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | 미등록(요청 origin) | `https://utmb2027.vercel.app` | fallback 전용 |
| `RESEND_API_KEY`·`SECURITY_MAIL_FROM` | 선택 | 미등록 | 선택 | security 메일(11.4) |
| `SUPABASE_SERVICE_ROLE_KEY`·`SUPABASE_SECRET_KEY`·`OPENAI_API_KEY` | seed 전용 로컬 | **금지** | **금지** | |

Preview는 Vercel 배포 보호(로그인 필요) 유지, 모든 환경 `noindex`(기존 metadata).

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-09-23 | 최초 Design — Option C 채택(작성자 사전 승인), 마이그레이션 2개·API·컴포넌트·SW·테스트·롤아웃 | Claude(PDCA) |
