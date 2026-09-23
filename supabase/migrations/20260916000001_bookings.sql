-- TMB 2027 — booking-tracker (FR-010, I-004, 부록 A-2/A-4)
-- 리더 1인이 12박 예약 상태·비공개 정보를 관리하고, 방문자는 bookings_public 뷰(상태만)로 열람한다.

create type public.booking_status as enum ('unbooked', 'inquiry', 'waitlist', 'confirmed', 'alternative');
create type public.member_role as enum ('leader', 'member');

-- A-4 AdminUser / TeamMember (allowlist)
create table public.team_members (
  email text primary key check (email = lower(email)),
  role public.member_role not null default 'member',
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

-- A-2 Booking
create table public.bookings (
  lodging_id text primary key,
  status public.booking_status not null default 'unbooked',
  confirmation_ref text check (char_length(confirmation_ref) <= 100),      -- private
  private_memo text check (char_length(private_memo) <= 1000),             -- private
  alternative_lodging text check (char_length(alternative_lodging) <= 200),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id),
  version integer not null default 1
);

create or replace function public.jwt_email()
returns text
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.team_members m
    where m.email = public.jwt_email() and m.role = 'leader' and m.enabled
  );
$$;

create or replace function public.is_team_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.team_members m
    where m.email = public.jwt_email() and m.enabled
  );
$$;

create or replace function public.bookings_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  new.version := old.version + 1;
  new.updated_by := auth.uid();
  return new;
end;
$$;

create trigger bookings_touch
before update on public.bookings
for each row execute function public.bookings_touch();

-- RLS: bookings — 리더만 읽고 쓴다 (비공개 필드 보호)
alter table public.bookings enable row level security;

create policy "bookings admin select" on public.bookings
  for select to authenticated using (public.is_admin());
create policy "bookings admin insert" on public.bookings
  for insert to authenticated with check (public.is_admin());
create policy "bookings admin update" on public.bookings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- RLS: team_members — 본인 행 또는 리더
alter table public.team_members enable row level security;

create policy "team_members self or admin select" on public.team_members
  for select to authenticated using (email = public.jwt_email() or public.is_admin());
create policy "team_members admin write" on public.team_members
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on public.bookings from anon;
revoke all on public.team_members from anon;

-- 공개 뷰: 상태·대안 숙소·갱신 시각만 노출 (I-004). 뷰 소유자 권한으로 실행되어 RLS를 우회하되 컬럼을 제한한다.
-- security_invoker = off 를 명시해 의도를 고정한다. bookings 에 FORCE ROW LEVEL SECURITY 를 걸면 이 뷰가 0행이 되므로 금지.
create view public.bookings_public as
  select lodging_id, status, alternative_lodging, updated_at from public.bookings;

alter view public.bookings_public set (security_invoker = off);

grant select on public.bookings_public to anon, authenticated;

-- 12박 초기 행 (미예약)
insert into public.bookings (lodging_id) values
  ('gai-soleil'), ('la-balme'), ('mottets'), ('maison-vieille'), ('bertone'), ('elena'),
  ('edelweiss'), ('plein-air'), ('auberge-mont-blanc'), ('la-boerne'), ('la-flegere'), ('chamonix-hotel')
on conflict (lodging_id) do nothing;

-- 리더 등록 (1회, SQL editor에서 실제 이메일로 실행; ADMIN_EMAIL 환경변수와 동일해야 함):
-- insert into public.team_members (email, role) values ('leader@example.com', 'leader');
