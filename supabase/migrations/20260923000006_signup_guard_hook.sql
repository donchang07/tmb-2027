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
