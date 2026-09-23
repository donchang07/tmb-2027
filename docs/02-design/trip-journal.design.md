# Design — trip-journal (PRD v2.0 개정)

> feature: trip-journal · Plan: `docs/01-plan/trip-journal.plan.md` · 의존: booking-tracker
> 작성일: 2026-09-17 · 상태: approved (L4 auto)

## Context Anchor
| Key | Value |
|---|---|
| WHY | 기록 공개(N-008), 1일 1건(N-011), 표시명 |
| WHO | 팀원(작성), 방문자(열람) |
| RISK | 이메일 노출 금지 |
| SUCCESS | anon 조회·유니크·displayName·미설정 안내 |
| SCOPE | SQL·journal lib·페이지·폼 |

## 1. 파일
```
supabase/migrations/20260917000004_journal_public.sql
src/lib/journal-rules.ts            validateDisplayName, DUPLICATE_MESSAGE
src/lib/journal.ts                  listEntries(공개), getMemberProfile(displayName), createEntry(1건 제한), setDisplayName
src/app/journal/actions.ts          + setDisplayNameAction
src/app/journal/page.tsx            Day 목록(비로그인 가능)
src/app/journal/[dayId]/page.tsx    타임라인(공개) + 팀원이면 폼/표시명 폼
src/components/journal/DisplayNameForm.tsx (신규, client)
src/components/journal/JournalAccessNote.tsx  문구: "열람은 누구나, 작성은 팀원 로그인"
src/components/journal/JournalTimeline.tsx    authorLabel(표시명)·시각
src/app/day/[dayId]/page.tsx        링크 "팀 기록 보기"
tests/unit/journal.test.ts, tests/e2e/security.spec.ts
```

## 2. SQL
```sql
alter table public.team_members add column display_name text check (display_name is null or char_length(display_name) between 1 and 20);
create policy "team_members self update display_name" on public.team_members for update to authenticated using (email = public.jwt_email()) with check (email = public.jwt_email());
-- journal 공개 읽기
drop policy if exists "journal member select" on public.journal_entries;
create policy "journal public select" on public.journal_entries for select to anon, authenticated using (true);
grant select on public.journal_entries to anon;
create unique index journal_entries_one_per_member_day on public.journal_entries (day_id, author_id);
-- 사진 공개 버킷
update storage.buckets set public = true where id = 'journal-photos';
drop policy if exists "journal photos member read" on storage.objects;
create policy "journal photos public read" on storage.objects for select to anon, authenticated using (bucket_id = 'journal-photos');
```

## 3. `journal.ts`
- `listEntries(dayId)`: anon 클라이언트로 select(미설정 → `[]`, `journalConfigured=false`). 반환 `{ id, dayId, authorLabel, text, imageUrl(public URL), createdAt }` — email 없음.
- `getMemberProfile(session)`: `team_members`에서 `display_name` 조회 → `{ state: "member"|"guest"|"anon", displayName }`.
- `createEntry`: 세션 팀원 검사 → `displayName` 없으면 `{ ok:false, state:"needs_display_name" }` → 기존 검증 → insert(`author_label = displayName`); 유니크 위반(code `23505`) → `{ ok:false, message: DUPLICATE_MESSAGE }` + `journal_upload_rejected` warn.
- `setDisplayName(session, name)`: `validateDisplayName` → `update team_members set display_name where email = session email`.

## 4. `journal-rules.ts`
```ts
export const DUPLICATE_MESSAGE = "이 Day에는 이미 기록을 남겼습니다";
export function validateDisplayName(v: string): { ok: true; value: string } | { ok: false; message: string } // trim 1~20자, /@/ 금지, /\s{2,}/ 정리
```
`authorLabelFrom(email)` 제거(이메일 유래 라벨 금지); 남은 참조 없어야 함.

## 5. 페이지
- `/journal`: Day 12개 카드(각 기록 수는 미설정이면 "—"). 로그인 배너 대신 `JournalAccessNote`: "열람은 누구나 가능합니다. 기록 작성은 팀원 로그인(매직 링크) 후 가능합니다."
- `/journal/[dayId]`: `JournalTimeline entries` (빈 상태 "아직 기록이 없습니다"); 세션이 팀원이면 displayName 없을 때 `DisplayNameForm`, 있으면 `JournalForm`(이미 이 Day에 본인 기록이 있으면 "이미 기록을 남겼습니다" 안내). 비로그인이면 "기록 작성은 팀원 로그인" 링크(`/journal/login`).

## 6. 테스트
- journal.test: `validateDisplayName`(빈·21자·이메일 거부, trim), `DUPLICATE_MESSAGE`; 마이그레이션 텍스트(anon select, unique index, display_name, `public = true`); `authorLabelFrom` 미존재
- security.spec: `/journal/d2027-08-05` HTML에 `@` 이메일 패턴 없음, "팀원 로그인" 안내, `<form` 업로드 폼 없음(비로그인)
