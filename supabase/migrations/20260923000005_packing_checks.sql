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
