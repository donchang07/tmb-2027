-- SYNC-04 (2026-10-07): phone_verified_by·updated_by는 관리자만 읽는다.
-- 로그인 사용자(authenticated)도 anon과 같은 공개 컬럼만 select, 관리자는 admin_lodging_private()로 비공개 컬럼을 읽는다.
revoke select on public.lodgings from authenticated;
grant select (id, day_id, name_original, kind, location, country, booking_channel, address, lat, lng, booking_url, contact_url,
  verified_phone, phone_verified_at, room_type, price_low, price_high, currency, season, capacity_note, alternative, candidates,
  checked_at, recheck_at, notes, updated_at, version) on public.lodgings to authenticated;

create or replace function public.admin_lodging_private()
returns table (id text, phone_verified_by text, updated_by uuid)
language sql
stable
security definer
set search_path = public
as $$
  select l.id, l.phone_verified_by, l.updated_by from public.lodgings l where public.is_admin();
$$;

revoke all on function public.admin_lodging_private() from public, anon;
grant execute on function public.admin_lodging_private() to authenticated;
