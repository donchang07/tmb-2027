-- TMB 2027 — trip-journal 공개화 (PRD v2.0 FR-016, N-008, N-011, 부록 A-4 TeamMember.displayName)
-- 기록은 모든 방문자가 열람하고, 작성은 팀원만·Day당 1건, 작성자는 표시명으로만 노출한다.

-- 표시명 (이메일 대신 공개되는 라벨)
alter table public.team_members
  add column if not exists display_name text check (display_name is null or char_length(display_name) between 1 and 20);

drop policy if exists "team_members self update display_name" on public.team_members;
create policy "team_members self update display_name" on public.team_members
  for update to authenticated
  using (email = public.jwt_email())
  with check (email = public.jwt_email());

-- 권한 상승 차단: 정책만으로는 컬럼을 제한할 수 없으므로 컬럼 단위 GRANT 로 고정한다.
-- authenticated 는 display_name 외 어떤 컬럼도 update 할 수 없다 (role·enabled 자가 승격 불가).
-- 리더의 role·enabled 변경은 기존 운영 절차대로 Supabase SQL editor(service role)에서 수행한다.
revoke update on public.team_members from authenticated;
grant update (display_name) on public.team_members to authenticated;

-- journal 공개 읽기 (N-008)
drop policy if exists "journal member select" on public.journal_entries;
drop policy if exists "journal public select" on public.journal_entries;
create policy "journal public select" on public.journal_entries
  for select to anon, authenticated using (true);

-- 익명 열람은 공개 컬럼으로만 (author_id = auth.users.id 수집 차단)
revoke select on public.journal_entries from anon;
grant select (id, day_id, author_label, text, image_path, created_at) on public.journal_entries to anon;

-- Day별 팀원 1건 (N-011) — 인덱스 생성 전 이전 사이클의 중복행을 최신 1건만 남기고 정리
delete from public.journal_entries a
  using public.journal_entries b
  where a.day_id = b.day_id and a.author_id = b.author_id and a.created_at < b.created_at;

create unique index if not exists journal_entries_one_per_member_day on public.journal_entries (day_id, author_id);

-- 사진 공개 버킷 (11.2 #1)
update storage.buckets set public = true where id = 'journal-photos';

drop policy if exists "journal photos member read" on storage.objects;
drop policy if exists "journal photos public read" on storage.objects;
create policy "journal photos public read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'journal-photos');
