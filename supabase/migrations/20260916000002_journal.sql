-- TMB 2027 — trip-journal (FR-016, 부록 A-4 JournalEntry). 팀원(team_members enabled) 전용.

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  day_id text not null check (day_id ~ '^d\d{4}-\d{2}-\d{2}$'),
  author_id uuid not null references auth.users (id) on delete cascade,
  author_label text not null check (char_length(author_label) <= 40),
  text text not null check (char_length(text) between 1 and 200),
  image_path text check (image_path is null or char_length(image_path) <= 300),
  created_at timestamptz not null default now()
);

create index journal_entries_day_idx on public.journal_entries (day_id, created_at desc);

alter table public.journal_entries enable row level security;

create policy "journal member select" on public.journal_entries
  for select to authenticated using (public.is_team_member());
create policy "journal member insert" on public.journal_entries
  for insert to authenticated with check (public.is_team_member() and author_id = auth.uid());
create policy "journal own or admin delete" on public.journal_entries
  for delete to authenticated using (author_id = auth.uid() or public.is_admin());

revoke all on public.journal_entries from anon;

-- Storage: private 버킷, 10MB, JPG/PNG/WebP
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('journal-photos', 'journal-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "journal photos member read" on storage.objects
  for select to authenticated
  using (bucket_id = 'journal-photos' and public.is_team_member());

create policy "journal photos own folder upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'journal-photos'
    and public.is_team_member()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "journal photos own or admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'journal-photos' and (owner = auth.uid() or public.is_admin()));

-- 팀원 등록 (리더가 SQL editor 또는 관리자 UI에서; Supabase Auth에서 사용자 초대 후):
-- insert into public.team_members (email, role) values ('member@example.com', 'member');
