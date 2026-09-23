-- TMB 2027 — booking-tracker v2.0 (PRD v2.0 FR-010, I-006, SC-004, 부록 A-2/C-2)
-- 숙박(Lodging)을 코드 seed에서 DB로 옮겨 리더가 직접 갱신하고, 예약 관리 대상을 14박으로 넓힌다.
-- 공개 미러(bookings_public)는 뷰 → 테이블로 바꿔 anon Realtime 구독을 가능하게 한다.

create type public.lodging_kind as enum ('refuge', 'village', 'hotel', 'undecided');

-- A-2 Lodging
create table public.lodgings (
  id text primary key,
  day_id text not null check (day_id ~ '^d\d{4}-\d{2}-\d{2}$'),
  name_original text not null,
  kind public.lodging_kind not null default 'refuge',
  location text not null,
  country text not null check (country in ('FR', 'IT', 'CH')),
  booking_channel text not null default 'other' check (booking_channel in ('portal', 'own', 'other')),
  address text,
  lat double precision,
  lng double precision,
  booking_url text,
  contact_url text,
  verified_phone text check (char_length(verified_phone) <= 30),
  phone_verified_at date,
  phone_verified_by text,  -- 역할 라벨('leader')만 저장, 이메일 금지
  room_type text,
  price_low numeric check (price_low is null or price_low >= 0),
  price_high numeric check (price_high is null or price_high >= 0),
  currency text not null default 'EUR' check (currency in ('EUR', 'CHF')),
  season text not null default '',
  capacity_note text,
  alternative text,
  candidates jsonb not null default '[]'::jsonb,
  checked_at date not null,
  recheck_at date,
  notes text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id),
  version integer not null default 1,
  check (price_low is null or price_high is null or price_low <= price_high)
);

create or replace function public.lodgings_touch()
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

create trigger lodgings_touch
before update on public.lodgings
for each row execute function public.lodgings_touch();

-- RLS: 숙박 정보는 공개 열람, 쓰기는 리더만 (FR-010)
alter table public.lodgings enable row level security;

create policy "lodgings public select" on public.lodgings
  for select to anon, authenticated using (true);
create policy "lodgings admin write" on public.lodgings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 공개 컬럼 제한: phone_verified_by(검증 주체)·updated_by는 비공개 (NFR 개인정보). 쓰기는 RLS + grant 이중 차단.
revoke all on public.lodgings from anon, authenticated;
grant select (id, day_id, name_original, kind, location, country, booking_channel, address, lat, lng, booking_url, contact_url,
  verified_phone, phone_verified_at, room_type, price_low, price_high, currency, season, capacity_note, alternative, candidates,
  checked_at, recheck_at, notes, updated_at, version) on public.lodgings to anon;
grant select on public.lodgings to authenticated;
grant insert, update on public.lodgings to authenticated;

-- I-006: 부록 C 14행 초기 import (seed와 동일 값)
insert into public.lodgings (id, day_id, name_original, kind, location, country, booking_channel, booking_url, contact_url, price_low, price_high, currency, season, checked_at, alternative, candidates, notes) values
  ('geneva-hotel', 'd2027-08-03', '제네바 호텔(미정)', 'undecided', 'Genève Cornavin, 375 m', 'CH', 'other', null, null, 150, 180, 'EUR', '3성 실당 €150~180 추정 · 트윈 5실 기준', '2026-09-16', null,
   '[{"name":"Hotel Astoria","stars":"3성","note":"역 앞 100 m — 늦은 도착에 가장 짧은 이동","url":null},{"name":"Hôtel International & Terminus","stars":"3성","note":"역 앞 — 24시간 프런트","url":null},{"name":"Hotel Cornavin","stars":"4성","note":"역 옆 — 상향 대안","url":null},{"name":"Geneva Hostel","stars":null,"note":"도미토리·다인실 — 저예산 대안","url":null}]'::jsonb,
   '제네바 1박 확정 [확정 2026-09-16]'),
  ('gai-soleil', 'd2027-08-04', 'Chalet-Hôtel Gai Soleil', 'village', 'Les Contamines-Montjoie, 1,164 m', 'FR', 'own', 'https://www.gaisoleil.com/en/', 'https://www.gaisoleil.com/en/', 85, 150, 'EUR', '3성 · 개인실 가능 · 하프보드 약 €85/인, 더블 €110~150 (연도 미확인)', '2026-09-09', null, '[]'::jsonb, null),
  ('la-balme', 'd2027-08-05', 'Refuge de la Balme', 'refuge', 'Les Contamines-Montjoie, 1,706 m', 'FR', 'portal', 'https://www.montourdumontblanc.com/fr/refuges/refuge-de-la-balme', 'https://www.montourdumontblanc.com/fr/refuges/refuge-de-la-balme', 68, 75, 'EUR', '4~6인실 €75, 12인실 €68, 더블 개인실 €180+€80', '2026-09-09', null, '[]'::jsonb, null),
  ('mottets', 'd2027-08-06', 'Refuge des Mottets', 'refuge', 'Bourg-Saint-Maurice, 1,870 m', 'FR', 'portal', 'https://www.montourdumontblanc.com/en/refuges/refuge-des-mottets', 'https://www.montourdumontblanc.com/en/refuges/refuge-des-mottets', 60, 80, 'EUR', '대형 도미토리 €60, 4인실 €80 (2026, 6/10~9/20 운영)', '2026-09-09', 'Auberge de la Nova (Les Chapieux, 하프보드 €70~91, 포털 예약)', '[]'::jsonb, null),
  ('maison-vieille', 'd2027-08-07', 'Rifugio Maison Vieille', 'refuge', 'Courmayeur, 1,956 m', 'IT', 'portal', 'https://www.montourdumontblanc.com/en/refuges/rifugio-maison-vieille', 'https://www.montourdumontblanc.com/en/refuges/rifugio-maison-vieille', 75, 75, 'EUR', '도미토리 하프보드 €75 (2025)', '2026-09-09', null, '[]'::jsonb, null),
  ('bertone', 'd2027-08-08', 'Rifugio Bertone', 'refuge', 'Courmayeur, 1,989 m', 'IT', 'portal', 'https://www.montourdumontblanc.com/en/refuges/rifugio-g-bertone', 'https://www.montourdumontblanc.com/en/refuges/rifugio-g-bertone', 70, 110, 'EUR', '하프보드 €70~110 (2~4인실, 2026)', '2026-09-09', null, '[]'::jsonb, null),
  ('elena', 'd2027-08-09', 'Rifugio Elena', 'refuge', 'Courmayeur, 2,062 m', 'IT', 'own', 'https://www.rifugioelena.it/', 'https://www.rifugioelena.it/', 70, 82, 'EUR', '도미토리 €70, 2~4인실 €82 (2026)', '2026-09-09', 'Rifugio Bonatti (도미토리 €75 · 2~4인실 €95, 폼 예약 1건 최대 10명) 숙박 후 Day 7을 20 km로 연장', '[]'::jsonb, null),
  ('edelweiss', 'd2027-08-10', 'Hôtel Edelweiss', 'village', 'La Fouly, 1,600 m', 'CH', 'portal', 'https://www.montourdumontblanc.com/en/refuges/hotel-edelweiss', 'https://www.montourdumontblanc.com/en/refuges/hotel-edelweiss', 95, 170, 'CHF', '도미토리 하프보드 CHF 95, 트윈 CHF 145~170/인', '2026-09-09', 'Auberge des Glaciers 도미토리 CHF 97', '[]'::jsonb, null),
  ('plein-air', 'd2027-08-11', 'Pension en Plein Air', 'village', 'Champex-Lac, 1,466 m', 'CH', 'portal', 'https://www.montourdumontblanc.com/en/recherche/', 'https://www.montourdumontblanc.com/en/recherche/', 82, 92, 'CHF', '도미토리 CHF 82, 2~3인실 CHF 92 (2025)', '2026-09-09', 'Hôtel Splendide 객실 CHF 153~188 + 하프보드 CHF 28 (https://www.hotel-splendide.ch/)', '[]'::jsonb, null),
  ('auberge-mont-blanc', 'd2027-08-12', 'Auberge Mont-Blanc', 'village', 'Trient, 1,300 m', 'CH', 'portal', 'https://www.montourdumontblanc.com/en/refuges/auberge-mont-blanc', 'https://www.montourdumontblanc.com/en/refuges/auberge-mont-blanc', 70, 88, 'CHF', '5~10인 도미토리 CHF 70, 4인실 CHF 77, 2~4인 개인실 CHF 88 (2026)', '2026-09-09', 'La Grande Ourse 도미토리 CHF 80', '[]'::jsonb, null),
  ('la-boerne', 'd2027-08-13', 'Auberge La Boërne', 'refuge', 'Tré-le-Champ, 1,417 m', 'FR', 'portal', 'https://www.montourdumontblanc.com/fr/refuges/auberge-la-boerne', 'https://www.montourdumontblanc.com/fr/refuges/auberge-la-boerne', 60, 60, 'EUR', '도미토리 하프보드 €60 (2026, 6/1~9/30)', '2026-09-09', null, '[]'::jsonb, null),
  ('la-flegere', 'd2027-08-14', 'Refuge de la Flégère', 'refuge', 'Chamonix-Mont-Blanc, 1,877 m', 'FR', 'own', 'https://www.refuge-de-la-flegere.com/en/', 'https://www.refuge-de-la-flegere.com/en/', 50, 60, 'EUR', '하프보드 도미토리만 운영 · 2026 가격 미표기(구자료 약 €50~60) · 직접 확인 필요', '2026-09-09', null, '[]'::jsonb, '가격·운영 직접 확인 필요'),
  ('chamonix-hotel', 'd2027-08-15', '샤모니의 호텔(미정)', 'undecided', 'Chamonix-Mont-Blanc, 1,035 m', 'FR', 'other', null, null, 200, 300, 'EUR', '8월 실당 €200~300 추정 · 리더가 확정 후 입력', '2026-09-16', null, '[]'::jsonb, '호텔 미확정 · 다음 날 06:30 에귀 뒤 미디 출발이므로 샤모니 남역(Aiguille du Midi 승강장) 도보 10분 이내 권장 [확정 2026-09-18]'),
  ('chamonix-hotel-2', 'd2027-08-16', '샤모니의 호텔(미정) · 2박째', 'undecided', 'Chamonix-Mont-Blanc, 1,035 m', 'FR', 'other', null, null, 200, 300, 'EUR', '8월 실당 €200~300 추정 · 8/15와 같은 호텔 2박 연속 예약', '2026-09-18', null, '[]'::jsonb,
   '8/15 숙소와 동일 호텔 2박 연속 예약(체크아웃·짐 이동 없음) · 에귀 뒤 미디 승강장(샤모니 남역) 도보 10분 이내 권장 [확정 2026-09-18, D-007]')
on conflict (id) do nothing;

-- Booking.alternativeLodgingId (A-2) + 이동일 호텔 2행 → 14박
alter table public.bookings add column alternative_lodging_id text references public.lodgings (id);

insert into public.bookings (lodging_id) values ('geneva-hotel'), ('chamonix-hotel-2')
on conflict (lodging_id) do nothing;

-- 공개 미러: 뷰 → 테이블 (anon Realtime 구독은 RLS select 정책이 있는 테이블에만 동작, SC-004)
drop view if exists public.bookings_public;

create table public.bookings_public (
  lodging_id text primary key,
  status public.booking_status not null,
  alternative_lodging text,
  alternative_lodging_id text,
  updated_at timestamptz not null
);

alter table public.bookings_public enable row level security;

create policy "bookings_public read" on public.bookings_public
  for select to anon, authenticated using (true);

grant select on public.bookings_public to anon, authenticated;
revoke insert, update, delete on public.bookings_public from anon, authenticated;

create or replace function public.bookings_mirror()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.bookings_public (lodging_id, status, alternative_lodging, alternative_lodging_id, updated_at)
  values (new.lodging_id, new.status, new.alternative_lodging, new.alternative_lodging_id, new.updated_at)
  on conflict (lodging_id) do update set
    status = excluded.status,
    alternative_lodging = excluded.alternative_lodging,
    alternative_lodging_id = excluded.alternative_lodging_id,
    updated_at = excluded.updated_at;
  return new;
end;
$$;

create trigger bookings_mirror
after insert or update on public.bookings
for each row execute function public.bookings_mirror();

insert into public.bookings_public (lodging_id, status, alternative_lodging, alternative_lodging_id, updated_at)
  select lodging_id, status, alternative_lodging, alternative_lodging_id, updated_at from public.bookings
on conflict (lodging_id) do nothing;

alter publication supabase_realtime add table public.bookings_public;
