# Design — trip-journal

> feature: trip-journal · Plan: `docs/01-plan/trip-journal.plan.md` · 의존: booking-tracker(team_members, is_team_member, auth 흐름)
> 작성일: 2026-09-16 · 상태: approved (L4 auto)

## 1. 파일
```
supabase/migrations/20260916000002_journal.sql
src/lib/journal-rules.ts                   순수 함수(상수·스키마·validatePhoto·extFor·authorLabelFrom) — 클라이언트에서도 import
src/lib/journal.ts                         세션·조회·생성 (서버 전용, journal-rules import)
src/app/journal/page.tsx                   Day 목록 + 상태
src/app/journal/login/page.tsx             팀원 magic link
src/app/journal/actions.ts                 sendTeamMagicLinkAction, createEntryAction
src/app/journal/[dayId]/page.tsx           타임라인 + 폼
src/components/journal/TeamLoginForm.tsx   (client)
src/components/journal/JournalForm.tsx     (client) 사진 1장 + 200자
src/components/journal/JournalTimeline.tsx (server) 목록
src/app/day/[dayId]/page.tsx               “팀 기록” 링크 추가
src/middleware.ts                          matcher에 /journal/:path* 추가
next.config.ts                             experimental.serverActions.bodySizeLimit "11mb"
tests/unit/journal.test.ts
tests/e2e/security.spec.ts                 방문자 /journal/[dayId] 로그인 안내 케이스 추가
```

## 2. DB·Storage (`20260916000002_journal.sql`)
```sql
create table public.journal_entries (            -- A-4 JournalEntry
  id uuid primary key default gen_random_uuid(),
  day_id text not null check (day_id ~ '^d\d{4}-\d{2}-\d{2}$'),
  author_id uuid not null references auth.users(id) on delete cascade,
  author_label text not null check (char_length(author_label) <= 40),
  text text not null check (char_length(text) between 1 and 200),
  image_path text check (image_path is null or char_length(image_path) <= 300),
  created_at timestamptz not null default now());
create index journal_entries_day_idx on journal_entries(day_id, created_at desc);
alter table journal_entries enable row level security;
policy select: to authenticated using (is_team_member())
policy insert: to authenticated with check (is_team_member() and author_id = auth.uid())
policy delete: to authenticated using (author_id = auth.uid() or is_admin())
revoke all on journal_entries from anon;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('journal-photos','journal-photos', false, 10485760, array['image/jpeg','image/png','image/webp']) on conflict do nothing;
storage.objects policies (bucket_id='journal-photos'):
  select to authenticated using (is_team_member())
  insert to authenticated with check (is_team_member() and (storage.foldername(name))[1] = auth.uid()::text)
  delete to authenticated using (owner = auth.uid() or is_admin())
```

## 3. `src/lib/journal-rules.ts` (순수) + `src/lib/journal.ts` (서버)
```ts
// journal-rules.ts
export const JOURNAL_MAX_TEXT = 200; export const JOURNAL_MAX_BYTES = 10 * 1024 * 1024;
export const JOURNAL_MIME = ["image/jpeg","image/png","image/webp"] as const;
export const JournalInputSchema = z.object({ dayId: z.enum(<12 trek day ids>), text: z.string().trim().min(1).max(200) });
export function validatePhoto(meta: { type: string; size: number } | null): { ok: true } | { ok: false; message: "JPG·PNG·WebP 10MB 이하만 가능합니다" }
   // null(사진 없음) → ok (사진은 선택, 최대 1장); 형식 불일치 또는 size > 10MB → 거부
export function extFor(mime): "jpg" | "png" | "webp"
export function sniffImageMime(head: Uint8Array): "image/jpeg"|"image/png"|"image/webp"|null   // 매직 바이트(FFD8FF / 89504E47 / RIFF….WEBP)
export function authorLabelFrom(email: string): string                     // "@" 앞부분, 40자 절단
// journal.ts (서버 전용)
export type TeamState = "unconfigured" | "anonymous" | "forbidden" | "member";
export async function getTeamSession(): Promise<{ state: TeamState; email: string | null; userId: string | null }>
   // supabase null → unconfigured; user 없음 → anonymous(admin_auth_required info); team_members 본인 행(enabled) 없음 → forbidden(admin_forbidden security); else member
export type JournalEntry = { id, dayId, authorLabel, text, imageUrl: string | null, createdAt };
export async function listEntries(dayId, knownSession?): Promise<JournalEntry[]>   // member만(세션 재사용 가능); image_path → createSignedUrls 3600s
export async function createEntry(input: { dayId; text; photo: File | null }): Promise<{ ok: true } | { ok: false; reason: "unconfigured"|"unauthorized"|"forbidden"|"invalid"|"upload_failed"|"error"; message }>
   // 검증(스키마 → validatePhoto → 앞 12바이트 sniffImageMime === 신고 MIME) → 업로드 `${userId}/${randomUUID()}.${ext}` → insert(author_label = email local-part 최대 40자) → 실패 시 업로드 객체 삭제
   // 로그에는 이메일 전체 대신 local-part만 기록(개인정보)
```
`sw-rules.ts`/`sw.js` BYPASS_PREFIXES에 `/journal` 추가(팀원 전용 콘텐츠·signed URL 캐시 금지).
비허용 입력은 `logEvent("journal_upload_rejected","warn",{ reason })`.

## 4. 인증 (`/journal/login`)
- `TeamLoginForm`(client, `useActionState(sendTeamMagicLinkAction)`) — 이메일 + hidden next
- `sendTeamMagicLinkAction`: `signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: `${SITE_URL}/auth/callback?next=${safeNext(next,"/journal")}` } })`; 성공/미등록 모두 동일 메시지 “등록된 팀원이면 로그인 링크를 보냈습니다”
- middleware matcher에 `/journal/:path*` 추가(세션 쿠키 갱신)
- `/auth/callback` 실패 시 `next`가 `/journal`로 시작하면 `/journal/login?error=auth`, 아니면 `/admin?error=auth` (로그인 페이지가 오류 안내 표시)

## 5. 화면
### `/journal` (dynamic)
- h1 “여행 기록”, 부제 “팀원 전용 · Day별 사진 1장 + 200자”
- 상태별 StatusNote: unconfigured “비활성 — Supabase 설정 필요” / anonymous “팀원 로그인이 필요합니다” + `/journal/login` 링크 / forbidden “이 정보에 접근할 수 없습니다” + 홈 링크 + signout / member “{label}님으로 로그인”
- 12 trek Day 링크 목록(`/journal/[dayId]`, 44px)

### `/journal/[dayId]` (dynamic)
- `getDay` trek 아니면 404; 헤더 Day N·nameKo·nameOriginal + `/day/[id]` 링크
- state !== member → 위와 같은 StatusNote(anonymous는 `next=/journal/[dayId]`), 타임라인·폼 미렌더(RSC payload에 private 없음)
- member → `JournalForm` + `JournalTimeline`

### `JournalForm` (client)
- `useActionState(createEntryAction)`; hidden dayId; `<textarea name="text" maxLength=200 required>` + 글자수 카운터 `n/200`; `<input type="file" name="photo" accept="image/jpeg,image/png,image/webp">`; 선택 시 클라이언트 `validatePhoto`(0바이트 파일은 “사진 없음”으로 간주 — 서버와 동일)로 즉시 “JPG·PNG·WebP 10MB 이하만 가능합니다” 표시 + 제출 비활성(파일 재선택 유도); 제출 버튼 44px; 결과 메시지(role status/alert); 성공 시 폼 리셋(key)
### `JournalTimeline` (server)
- 최신순 `<ol>`; 각 항목: 사진(signed URL, `<img alt="Day N 기록 사진">`, lazy), 텍스트, “{authorLabel} · {formatKoDateTime}”; 0건 → “첫 기록을 남겨 보세요”

### Day 상세
경로/안전 섹션 뒤 `Link href="/journal/[dayId]"` “팀 기록 보기 (팀원 로그인)” 44px

## 6. Server Action `createEntryAction(prev, formData)`
FormData → `{ dayId, text, photo: File|null(size 0이면 null) }` → `createEntry` → 성공 `revalidatePath("/journal/[dayId]")`. 반환 `{ status: "idle"|"saved"|"error"|"invalid"|"forbidden"|"unauthorized"|"unconfigured"|"upload_failed"; message }`.

## 7. Edge Case
| 상황 | 구현 |
|---|---|
| 사진 형식·용량 초과 | 클라이언트 즉시 안내 + 서버 재검증 거부 + `journal_upload_rejected` |
| 인증 없음 | “팀원 로그인이 필요합니다” → `/journal/login?next=` |
| 권한 없음(allowlist 외) | “이 정보에 접근할 수 없습니다” + 홈 + `admin_forbidden` |
| Supabase 미설정 | 비활성 안내 |
| 업로드 성공 후 insert 실패 | 업로드 객체 삭제(고아 파일 방지) |

## 8. 테스트
### unit `tests/unit/journal.test.ts`
- JournalInputSchema: 200자 통과, 201자 거부, 빈 문자열 거부, travel dayId 거부
- validatePhoto: jpeg/png/webp 10MB 정확히 통과, 10MB+1 거부, image/gif 거부, null 통과
- authorLabelFrom: local-part, 40자 절단
- 마이그레이션 텍스트: `enable row level security`, `is_team_member`, 버킷 `10485760`, MIME 3종, `storage.foldername`, `revoke all on public.journal_entries from anon`
### e2e `security.spec.ts`
- 방문자 `/journal/d2027-08-04` → “팀원 로그인이 필요합니다” 또는 “비활성”, `<form>` 미렌더
