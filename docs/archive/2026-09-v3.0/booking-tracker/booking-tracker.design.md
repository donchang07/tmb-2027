# Design — booking-tracker (PRD v2.0 개정)

> feature: booking-tracker · Plan: `docs/01-plan/booking-tracker.plan.md` · 의존: day-detail
> 작성일: 2026-09-17 · 상태: approved (L4 auto)

## Context Anchor
| Key | Value |
|---|---|
| WHY | 리더가 숙박 데이터를 직접 갱신(N-009), 14박 관리(N-007) |
| WHO | 리더(편집), 방문자(열람) |
| RISK | private 필드 노출, 미연결 런타임 검증 불가 |
| SUCCESS | 14박 목록·편집·공개 분리·seed fallback |
| SCOPE | SQL·lodging 계층·관리자 UI·Day 편집 패널·이동일 숙박·security 알림 |

## 1. 파일
```
supabase/migrations/20260917000003_lodgings.sql
src/lib/schema.ts                         Lodging 확장(candidates, address, lat, lng, phoneVerifiedAt/By, roomType, capacityNote, recheckAt)
src/data/seed/lodgings.ts                 14개 (geneva-hotel, zurich-hotel 추가)
src/lib/lodgings.ts                       (신규) getLodgingsAsync, getLodgingAsync, getLodgingForDayAsync, rowToLodging
src/lib/itinerary.ts                      validateSeed는 seed 검증만; getLodgings(seed) 유지(테스트·fallback용)
src/lib/bookings/public.ts                PublicBooking + alternativeLodgingId, bookings_public 테이블 조회
src/lib/bookings/admin.ts                 validateLodgingInput, saveLodging, listAdminRows(14행 join)
src/lib/notify.ts                         (신규) notifySecurity(code, meta)
src/lib/log.ts                            security → notifySecurity 호출(테스트 env 제외)
src/app/admin/bookings/page.tsx           14행 LodgingTable + PublicPreview
src/app/admin/bookings/actions.ts         saveBookingAction(+alternativeLodgingId), saveLodgingAction
src/components/admin/LodgingTable.tsx     (client) 14행 표, 행 확장 → BookingEditor(상태·대안·예약번호·메모) + LodgingFields(전화·검증일·링크·가격·재확인일 등)
src/components/admin/BookingEditor.tsx    alternativeLodgingId select(14개) + 기존 필드
src/components/admin/LodgingFields.tsx    (client) 숙박 필드 폼
src/components/admin/DayEditPanel.tsx     Day 상세 편집 패널(BookingEditor + LodgingFields)
src/app/day/[dayId]/page.tsx              getLodgingForDayAsync, 리더 세션이면 <DayEditPanel/>
src/app/travel/[dayId]/page.tsx           8/3·8/16 숙박 블록(LodgingCard + candidates)
src/components/day/LodgingCard.tsx        candidates 목록 렌더(undecided일 때)
src/app/api/bookings/route.ts             bookings_public 테이블 조회(필드 확장)
tests/unit/bookings.test.ts, tests/unit/lodgings.test.ts, tests/unit/notify.test.ts, tests/e2e/security.spec.ts
```

## 2. DB (`20260917000003_lodgings.sql`)
```sql
create type public.lodging_kind as enum ('refuge','village','hotel','undecided');
create table public.lodgings (
  id text primary key, day_id text not null check (day_id ~ '^d\d{4}-\d{2}-\d{2}$'),
  name_original text not null, kind public.lodging_kind not null default 'refuge',
  location text not null, country text not null check (country in ('FR','IT','CH')),
  booking_channel text not null default 'other' check (booking_channel in ('portal','own','other')),
  address text, lat double precision, lng double precision,
  booking_url text, contact_url text,
  verified_phone text check (char_length(verified_phone) <= 30), phone_verified_at date, phone_verified_by text,
  room_type text, price_low numeric, price_high numeric, currency text not null default 'EUR' check (currency in ('EUR','CHF')),
  season text not null default '', capacity_note text, alternative text, candidates jsonb not null default '[]'::jsonb,
  checked_at date not null, recheck_at date, notes text,
  updated_at timestamptz not null default now(), updated_by uuid references auth.users(id), version integer not null default 1);
-- touch trigger(lodgings_touch) — bookings_touch와 동일 패턴
alter table public.lodgings enable row level security;
create policy "lodgings public select" on public.lodgings for select to anon, authenticated using (true);
create policy "lodgings admin write" on public.lodgings for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- I-006: 14행 insert (부록 C, seed와 동일 값) ... on conflict (id) do nothing;

alter table public.bookings add column alternative_lodging_id text references public.lodgings(id);
insert into public.bookings (lodging_id) values ('geneva-hotel'), ('zurich-hotel') on conflict do nothing;

-- 공개 미러: 뷰 → 테이블 (Realtime 구독 가능, SC-004)
drop view if exists public.bookings_public;
create table public.bookings_public (lodging_id text primary key, status public.booking_status not null, alternative_lodging text, alternative_lodging_id text, updated_at timestamptz not null);
alter table public.bookings_public enable row level security;
create policy "bookings_public read" on public.bookings_public for select to anon, authenticated using (true);
revoke insert, update, delete on public.bookings_public from anon, authenticated;
create or replace function public.bookings_mirror() returns trigger ... security definer  -- upsert into bookings_public
create trigger bookings_mirror after insert or update on public.bookings for each row execute function public.bookings_mirror();
insert into public.bookings_public select lodging_id, status, alternative_lodging, alternative_lodging_id, updated_at from public.bookings on conflict do nothing;
alter publication supabase_realtime add table public.bookings_public;
```

## 3. Lodging 스키마·seed
`LodgingSchema` 추가: `address: string|null`, `lat/lng: number|null`, `phoneVerifiedAt: isoDate|null`, `phoneVerifiedBy: string|null`, `roomType: string|null`, `capacityNote: string|null`, `recheckAt: isoDate|null`, `candidates: z.array(z.object({ name, stars: string|null, note: string, url: string|null })).default([])`. `country` enum에 CH 포함(기존).
신규 seed:
- `geneva-hotel`: dayId d2027-08-03, kind undecided, nameOriginal "제네바 호텔(미정)", location "Genève Cornavin, 375 m", country CH, currency EUR, priceLow 150, priceHigh 180, season "3성 실당 €150~180 추정 · 트윈 5실 기준", candidates: Hotel Astoria(3성, "역 앞 100 m — 늦은 도착에 가장 짧은 이동"), Hôtel International & Terminus(3성, "역 앞 — 24시간 프런트"), Hotel Cornavin(4성, "역 옆 — 상향 대안"), Geneva Hostel(null, "도미토리·다인실 — 저예산 대안"), checkedAt 2026-09-16, notes "제네바 1박 확정 [확정 2026-09-16]"
- `zurich-hotel`: dayId d2027-08-16, kind undecided, nameOriginal "취리히 호텔(미정)", location "Zürich HB, 408 m", priceLow 195, priceHigh 270, candidates: Fred Hotel Zürich Hauptbahnhof(3성 superior, "역 2분, 2023 전면 리노베이션 — 1순위"), Ruby Mimi Hotel Zurich(3성, "역 5분 — 2순위"), Hotel Arlette beim Hauptbahnhof(null, "가족 운영, 역 200 m — 저예산 대안"), Central Plaza(4성, "역 2분 — 상향 대안")
- `chamonix-hotel`: day-detail에서 정의한 값 + candidates []
`days.ts`의 travel Day 8/3·8/16에 `lodgingId` 부여(`DaySchema`는 travel에 lodgingId optional 허용).

## 4. 조회 계층 (`src/lib/lodgings.ts`)
```ts
export const getLodgingsAsync = cache(async (): Promise<Lodging[]> => {
  const supabase = createSupabaseAnonClient();
  if (!supabase) return getLodgings();               // seed
  const { data, error } = await supabase.from("lodgings").select("*");
  if (error || !data?.length) { logEvent("booking_status_defaulted","warn",{reason:"lodgings_fallback_seed"}); return getLodgings(); }
  return data.map(rowToLodging).filter(ok);
});
```
`rowToLodging`: snake→camel, `LodgingSchema.safeParse`. 공개 페이지(홈·일정·Day·이동일·지도·관리자)는 모두 `getLodgingsAsync`를 쓴다.

## 5. 관리자 (`/admin/bookings`)
- 서버: `listAdminRows()` → 14행 `{ lodging, booking }` (booking은 admin select, 없으면 unbooked)
- `LodgingTable`(client): 표 컬럼 — Day/날짜 · 숙박(원어) · 상태 · 대안 숙소 · 전화(검증일) · 링크 · 가격 · 재확인일 · 갱신 시각 · [편집]. 행 클릭 → 아래에 `BookingEditor` + `LodgingFields` 펼침. 모바일은 카드형(가로 스크롤 금지).
- `saveLodgingAction(input)`: `getAdminSession` 재검사 → `validateLodgingInput` → `update lodgings ... where id and version` (낙관적 잠금, conflict 처리 기존 패턴) → `revalidatePath("/", "layout")`
- `saveBookingAction`: 기존 + `alternativeLodgingId`(null | 14 id 중 하나, 자기 자신 불가)
- 헤더·문구 "14박"

## 6. Day 상세 편집 패널
`day/[dayId]/page.tsx`: `const session = await getAdminSession()`; `session.state === "admin"`이면 식사·숙박 섹션 아래 `<DayEditPanel lodging booking lodgings />`(접기/펼치기, 기본 접힘). 미설정·비로그인은 렌더 없음(HTML에 폼 없음 → security E2E 유지).

## 7. 이동일 숙박 블록 (`travel/[dayId]/page.tsx`)
`day.lodgingId`가 있으면 "숙박" 섹션에 `LodgingCard`(공개 상태 포함). `LodgingCard`는 `kind === "undecided" && candidates.length`이면 후보 목록(이름·등급·메모)을 `ol`로 렌더하고 "리더가 확정 예정" 안내.

## 8. security 알림 (`src/lib/notify.ts`)
```ts
export async function notifySecurity(code, meta, deps = { fetch: globalThis.fetch, env: process.env }) {
  const key = env.RESEND_API_KEY, to = env.ADMIN_EMAIL;
  if (!key || !to) return { sent: false, reason: "not_configured" };
  await fetch("https://api.resend.com/emails", { method:"POST", headers:{ Authorization:`Bearer ${key}`, "Content-Type":"application/json" }, body: JSON.stringify({ from: env.SECURITY_MAIL_FROM ?? "tmb2027@resend.dev", to, subject:`[TMB 2027] security: ${code}`, text: JSON.stringify(meta) }) });
  return { sent: true };
}
```
`logEvent`: `level === "security"`이면 `void notifySecurity(code, meta)` (test env 제외, 실패는 console.warn).

## 9. 테스트
- `lodgings.test.ts`: seed 14개, dayId 매핑, kind, candidates 4개×2, `rowToLodging` 변환, `getLodgingsAsync` 미설정 fallback
- `bookings.test.ts`: `validateLodgingInput`(전화 길이, URL, 가격 low≤high, recheckAt ISO, kind), `validateBookingInput` alternativeLodgingId(자기 자신 거부), `toPublicBooking` private 제거; 마이그레이션 텍스트(위 §2 키워드, 14개 insert)
- `notify.test.ts`: 미설정 → fetch 미호출; 설정 → 1회 호출·Bearer 헤더
- `security.spec.ts`: 기존 + `/day/d2027-08-05` HTML에 `private_memo`·`confirmation`·`<form` 편집 폼 없음, `/travel/d2027-08-03`에 "Hotel Astoria"
