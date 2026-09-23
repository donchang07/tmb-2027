# Analysis — booking-tracker (PRD v2.0 개정)

> feature: booking-tracker · Design: `docs/02-design/booking-tracker.design.md` · Plan: `docs/01-plan/booking-tracker.plan.md` · PRD: `docs/PRD.md` v2.0
> 작성일: 2026-09-17 · PDCA Check phase (gap detection)
> 범위 주의: 동시 작업 중인 offline-pwa 기능이 추가한 파일(`src/components/pwa/*`, `src/lib/bookings/live.ts`, `src/lib/supabase/browser.ts`)과 `public.ts`의 오류 로그 코드 변경은 본 분석 대상에서 제외했다.

## 결과

| 항목 | 값 |
|---|---|
| Match rate | **95.7 %** (47항목 = matched 43 · partial 4 · missing 0 → (43 + 0.5×4)/47) |
| 게이트 95 통과 여부 | **통과** (95.7 % ≥ 95 %) |
| Missing | **0건** |
| 보안 지적 | **Critical 1 · Important 2 · Minor 8** — 최대 지적: `lodgings.phone_verified_by`에 리더 이메일 원문을 저장하면서 같은 테이블에 anon 공개 select 정책을 두어, 공개 anon 키만으로 관리자 이메일을 조회할 수 있다(NFR 개인정보 위반) |

핵심 요약
- 설계 §1~§9의 파일·DB·스키마·조회 계층·관리자 UI·Day 편집 패널·이동일 블록·security 알림·테스트가 모두 구현되어 있고, 누락(missing) 항목은 없다.
- seed 14건과 마이그레이션 14행의 `id`·`dayId`·`kind`·후보 호텔 이름(부록 C-2, 제네바 4 + 취리히 4)이 **완전 일치**한다.
- 보안 요구 (a)~(h) 중 (b)(c)(d)(e)(f)(g)(h)는 충족. (a)는 RLS 정책 자체는 정확하나 `anon` 쓰기 grant 회수가 빠져 있고, 여기에 더해 공개 컬럼에 이메일을 넣는 Critical 결함이 있다.

## 검증 근거

| 검증 | 명령 / 방법 | 결과 |
|---|---|---|
| 단위 테스트 | `npx vitest run` | **통과** — Test Files 13 passed (13), Tests 98 passed (98), 2.70 s |
| 타입 검사 | `npx tsc --noEmit` | **통과** — exit 0, 오류 0건 |
| 프로덕션 빌드 | `next build` | **이전 실행에서 통과**(본 세션 재실행 없음, 기록만) |
| E2E | Playwright | **미실행**(지시에 따라 생략) — `tests/e2e/security.spec.ts` 11개 시나리오는 코드로만 확인 |
| seed ↔ 마이그레이션 대조 | id/dayId/kind/후보명 추출 후 비교 스크립트 | **14/14 id 일치**, 14/14 dayId 일치(`d2027-08-03` ~ `d2027-08-16`), 14/14 kind 일치, 후보 호텔 8개 이름 일치 |
| 서비스 키 사용 | `grep -rn "SERVICE_ROLE" src/ supabase/` | **0건** (h 조건 충족) |
| 관리자 문구 | `src/app/admin/bookings/page.tsx:36,59` | "14박 예약·숙박 편집", "14박 편집" — 확인 |

### 보안 점검 (a)~(h)

| # | 점검 항목 | 판정 | 근거 |
|---|---|---|---|
| (a) | `lodgings` RLS — 공개 select, 리더 전용 write | **부분 충족** | `20260917000003_lodgings.sql:57-63` RLS enable + `"lodgings public select" … using (true)` + `"lodgings admin write" for all to authenticated using (public.is_admin()) with check (public.is_admin())`. 단 `revoke … from anon`이 없음(지적 #2), 공개 컬럼에 이메일 저장(지적 #1) |
| (b) | `bookings_public` 미러 — private 컬럼 없음, anon 쓰기 불가, security definer 트리거, insert 포함 전 상태 반영 | **충족** | 테이블 정의 `…sql:99-105`에 `confirmation_ref`·`private_memo` 없음 · `revoke insert, update, delete … from anon, authenticated`(:115) · `create or replace function public.bookings_mirror() … security definer set search_path = public`(:117-124) · `create trigger bookings_mirror after insert or update on public.bookings`(:135-137) · 초기 백필(:139-141) · `alter publication supabase_realtime add table`(:143) |
| (c) | `alternative_lodging_id` FK | **충족** | `…sql:88` `alter table public.bookings add column alternative_lodging_id text references public.lodgings (id)` |
| (d) | 서버 액션 세션 재검사 + zod 검증(전화 ≤30, URL, low≤high, ISO, kind enum) + version 낙관적 잠금 | **충족** | `src/lib/bookings/admin.ts:229-232`(세션 재검사), `:188-222`(`LodgingInputSchema`/`validateLodgingInput`), `:262-263`(`.eq("id").eq("version")`), booking 측은 `:137-141`, `:158-159`. DB 측 이중 제약 `…sql:21,25-26,37` |
| (e) | Day 상세 편집 패널은 admin 세션만, 익명 HTML에 private 필드 없음 | **충족** | `src/app/day/[dayId]/page.tsx:43-45,132-139` — `session.state === "admin"`일 때만 `<DayEditPanel/>` 렌더, 그 외 `null`. 익명 경로에서는 `getAdminBooking`도 호출하지 않음(`:45`). E2E 검증은 `tests/e2e/security.spec.ts:63-73` |
| (f) | `notifySecurity`가 비밀을 로깅하지 않고 test env에서 스킵 | **충족** | `src/lib/notify.ts` 전체에 로그 출력 없음(키는 `Authorization` 헤더로만 사용) · `src/lib/log.ts:22` `if (process.env.NODE_ENV === "test" \|\| process.env.VITEST) return;` · security meta도 `admin.ts:31`에서 `email.split("@")[0]`로 마스킹 |
| (g) | 앱 코드의 `SUPABASE_SERVICE_ROLE_KEY` 사용 | **충족** | 전역 grep 0건 |
| (h) | `getLodgingsAsync` 미설정 시 seed fallback + zod 검증 | **충족** | `src/lib/lodgings.ts:76-92`(미설정 `return getLodgings()`, 오류·빈 결과 시 `logEvent` 후 seed), `:43-74`(`LodgingSchema.safeParse` → 실패 시 `null` 후 필터) · 테스트 `tests/unit/lodgings.test.ts:112-118`, `:97-101` |

## 항목별 대조

| # | 설계 항목 | 판정 | 근거 (file:line) |
|---|---|:--:|---|
| 1 | §1 `supabase/migrations/20260917000003_lodgings.sql` 신규 | matched | `supabase/migrations/20260917000003_lodgings.sql:1-143` |
| 2 | §1 `schema.ts` Lodging 확장(candidates, address, lat, lng, phoneVerifiedAt/By, roomType, capacityNote, recheckAt) | matched | `src/lib/schema.ts:83-112` |
| 3 | §1 `seed/lodgings.ts` 14개(geneva-hotel, zurich-hotel 추가) | matched | `src/data/seed/lodgings.ts:5-292`, `tests/unit/lodgings.test.ts:37-41` |
| 4 | §1 `src/lib/lodgings.ts` 신규 4함수 | matched | `src/lib/lodgings.ts:43,76,94,98` |
| 5 | §1 `itinerary.ts` validateSeed는 seed 검증만, `getLodgings` 유지 | matched | `src/lib/itinerary.ts:25,71-81` |
| 6 | §1 `bookings/public.ts` PublicBooking + alternativeLodgingId, `bookings_public` 조회 | matched | `src/lib/bookings/public.ts:5-11,27-29,45` |
| 7 | §1 `bookings/admin.ts` validateLodgingInput·saveLodging·listAdminRows | matched | `src/lib/bookings/admin.ts:218,228,278` |
| 8 | §1 `notify.ts` 신규 + `log.ts` security 연동 | matched | `src/lib/notify.ts:10-31`, `src/lib/log.ts:26-29` |
| 9 | §2 `lodging_kind` enum | matched | `…sql:5` |
| 10 | §2 `lodgings` 테이블 컬럼(A-2 전 필드) | **partial** | `…sql:8-38` — 설계 §2 컬럼 목록과 1:1 일치하나 `name_ko` 컬럼이 없어 seed의 `nameKo` 14건이 DB 왕복에서 소실(지적 #4). `rowToLodging`도 미매핑(`src/lib/lodgings.ts:44-72`) |
| 11 | §2 컬럼 check 제약(day_id 정규식·country·booking_channel·currency·phone ≤30·price ≥0·low ≤ high) | matched | `…sql:9,13,14,21,25,26,30,37` |
| 12 | §2 `lodgings_touch` 트리거(updated_at·version+1·updated_by) | matched | `…sql:40-54` |
| 13 | §2 `lodgings` RLS enable + 공개 select + 리더 write | **partial** | `…sql:57-63` 정책은 설계대로. `20260916000001_bookings.sql:95-96`의 `revoke all … from anon` 패턴이 lodgings에는 적용되지 않음(지적 #2) |
| 14 | §2 14행 `insert into public.lodgings … on conflict (id) do nothing` (I-006) | matched | `…sql:66-86`, `tests/unit/bookings.test.ts:165-169` |
| 15 | §2 `bookings.alternative_lodging_id` FK → `lodgings(id)` | matched | `…sql:88` |
| 16 | §2 geneva/zurich bookings 행 2개 추가 | matched | `…sql:90-91` |
| 17 | §2 공개 미러 뷰 drop → 테이블(private 컬럼 0) | matched | `…sql:96-105`, `tests/unit/bookings.test.ts:187-192` |
| 18 | §2 `bookings_public` RLS + read 정책 + write revoke | matched | `…sql:107-115` |
| 19 | §2 `bookings_mirror()` security definer + after insert or update 트리거 | matched | `…sql:117-137` |
| 20 | §2 초기 백필 + `supabase_realtime` publication (SC-004 DB 측) | matched | `…sql:139-143` |
| 21 | §3 `LodgingSchema` 신규 필드 nullable/default | matched | `src/lib/schema.ts:92-110` |
| 22 | §3 `LodgingCandidateSchema`(name/stars/note/url) | matched | `src/lib/schema.ts:75-81` |
| 23 | §3 `geneva-hotel` seed 값 + 후보 4(C-2) | matched | `src/data/seed/lodgings.ts:6-31`, `tests/unit/lodgings.test.ts:51-61` |
| 24 | §3 `zurich-hotel` seed 값 + 후보 4(C-2) | matched | `src/data/seed/lodgings.ts:263-291` |
| 25 | §3 `chamonix-hotel` candidates `[]` | matched | `src/data/seed/lodgings.ts:243-260`, `tests/unit/lodgings.test.ts:59` |
| 26 | §3 `days.ts` travel 8/3·8/16 `lodgingId` + DaySchema optional | matched | `src/data/seed/days.ts:17,388`, `src/lib/schema.ts:49` |
| 27 | §4 `getLodgingsAsync` = `cache()` + anon 클라이언트 + 미설정 시 seed | matched | `src/lib/lodgings.ts:76-78` |
| 28 | §4 오류·빈 결과 시 `booking_status_defaulted` 로그 후 seed fallback | matched | `src/lib/lodgings.ts:80-90` |
| 29 | §4 `rowToLodging` snake→camel + `LodgingSchema.safeParse` | matched | `src/lib/lodgings.ts:43-74` |
| 30 | §4 공개 페이지(홈·일정·Day·이동일·관리자) 모두 `getLodgingsAsync` | matched | `src/app/page.tsx:18`, `src/app/itinerary/page.tsx:15`, `src/app/day/[dayId]/page.tsx:38,47`, `src/app/travel/[dayId]/page.tsx:29`, `src/lib/bookings/admin.ts:279` (지도 화면은 lodging 데이터를 쓰지 않음) |
| 31 | §5 `listAdminRows()` → 14행 `{ lodging, booking }`, booking 없으면 unbooked | matched | `src/lib/bookings/admin.ts:278-288`, `src/components/admin/LodgingTable.tsx:38-40` |
| 32 | §5 LodgingTable 표 컬럼 10종(Day/날짜·숙박·상태·대안·전화(검증일)·링크·가격·재확인일·갱신·편집) | matched | `src/components/admin/LodgingTable.tsx:66-79` |
| 33 | §5 행 확장 → `BookingEditor` + `LodgingFields` | matched | `src/components/admin/LodgingTable.tsx:49-59,137-147` |
| 34 | §5 모바일 카드형(가로 스크롤 금지) | matched | `src/components/admin/LodgingTable.tsx:63`(`hidden lg:block`), `:106`(`lg:hidden` 카드 목록) |
| 35 | §5 `saveLodgingAction`: 세션 재검사 → 검증 → version 낙관적 잠금 → `revalidatePath` | **partial** | `src/lib/bookings/admin.ts:229-236,262-263`, `src/app/admin/bookings/actions.ts:66` — 흐름은 설계와 일치하나 `admin.ts:250`이 `phone_verified_by`에 `session.email`(원문)을 저장하여 공개 select 대상 컬럼에 이메일이 들어감(지적 #1) |
| 36 | §5 `saveBookingAction` + `alternativeLodgingId`(null \| 14 id, 자기 자신 불가) | matched | `src/lib/bookings/admin.ts:54-64`, `src/app/admin/bookings/actions.ts:23`, `tests/unit/bookings.test.ts:50-60` |
| 37 | §5 헤더·문구 "14박" | matched | `src/app/admin/bookings/page.tsx:36,59` |
| 38 | §6 `session.state === "admin"`일 때만 `<DayEditPanel/>` 렌더 | matched | `src/app/day/[dayId]/page.tsx:43-45,132-139` |
| 39 | §6 기본 접힘 + 비로그인 HTML에 폼 없음 | matched | `src/components/admin/DayEditPanel.tsx:20,38`, `tests/e2e/security.spec.ts:63-73` |
| 40 | §7 `day.lodgingId` 있으면 이동일 "숙박" 섹션에 `LodgingCard` | matched | `src/app/travel/[dayId]/page.tsx:52-64` |
| 41 | §7 `LodgingCard` undecided + candidates → `ol` 후보 목록 + "리더가 확정 예정" | matched | `src/components/day/LodgingCard.tsx` 후보 숙소 블록(`undecided && lodging.candidates.length > 0` → `ol`)과 "리더가 확정 예정" 문구 · 동시 작업 중인 offline-pwa가 같은 파일의 상태 배지를 교체하여 행 번호는 이동 가능 |
| 42 | §8 `notifySecurity` 시그니처·Resend REST·미설정 시 not_configured | matched | `src/lib/notify.ts:10-31`, `tests/unit/notify.test.ts:7-36` |
| 43 | §8 `logEvent`가 `security`에서 notifySecurity 호출, test env 제외, 실패 시 console.warn | matched | `src/lib/log.ts:22,26-29` |
| 44 | §9 `lodgings.test.ts`(14개·dayId·kind·후보 4×2·rowToLodging·fallback) | matched | `tests/unit/lodgings.test.ts:36-118` |
| 45 | §9 `bookings.test.ts`(validateLodgingInput·alternativeLodgingId·toPublicBooking·마이그레이션 텍스트) | matched | `tests/unit/bookings.test.ts:50-105,151-192` |
| 46 | §9 `notify.test.ts`(미설정 미호출 / 설정 1회·Bearer) | matched | `tests/unit/notify.test.ts:7-48` |
| 47 | §9 `security.spec.ts`(Day 상세 편집 폼 0, `/travel/d2027-08-03` "Hotel Astoria") | **partial** | `tests/e2e/security.spec.ts:63-90` — 시나리오는 설계대로 작성되어 있으나 Playwright 미실행으로 통과 여부 미확인(지적 #3) |

**판정 집계** — matched 43 · partial 4(#10, #13, #35, #47) · missing 0 · 총 47 → **(43 + 2) / 47 = 95.7 %**

## 지적과 조치 필요

| # | 심각도 | 지적 | 권장 조치 |
|---|---|---|---|
| 1 | **Critical** | `saveLodging`이 `phone_verified_by`에 리더 이메일 원문을 저장하고(`src/lib/bookings/admin.ts:250`), `lodgings`에는 `for select to anon … using (true)` 정책이 있어(`…lodgings.sql:59-60`) 공개 anon 키만으로 `select phone_verified_by from lodgings`가 가능하다. PRD 5.x NFR 개인정보("공개 화면은 예약번호·팀원 이메일·개인 연락처를 노출하지 않고")에 위배되며, `team_members`를 `revoke all … from anon`으로 막아 둔 설계 의도(`20260916000001_bookings.sql:96`)를 lodgings 경로가 우회한다. 관리자 계정(magic link 대상 이메일) 노출은 표적 피싱 경로가 된다. | ① `phone_verified_by`에 이메일 대신 마스킹 값(`session.email.split("@")[0]`, `logEvent`와 동일 규칙)이나 `auth.uid()`를 저장하도록 `admin.ts:250` 수정. ② 또는 컬럼을 비공개로 돌리고(`revoke select (phone_verified_by) … from anon`) 공개 화면에는 검증일만 노출. ③ `tests/e2e/security.spec.ts`에 공개 응답 이메일 정규식 0건 단언을 `/api` 및 lodgings 경로에도 추가 |
| 2 | **Important** | `lodgings` 테이블에 `revoke insert, update, delete … from anon, authenticated`가 없다(`…lodgings.sql:57-65`). Supabase 기본 권한이 public 스키마 신규 테이블에 전체 권한을 부여하므로, 현재는 RLS만이 유일한 방어선이다(`bookings`·`bookings_public`은 revoke를 병행). | `grant select on public.lodgings to anon, authenticated;` 뒤에 `revoke insert, update, delete on public.lodgings from anon, authenticated;`를 추가하고, `tests/unit/bookings.test.ts`의 lodgings 마이그레이션 describe에 해당 문자열 단언 추가 |
| 3 | **Important** | Playwright E2E(`tests/e2e/security.spec.ts` 11 시나리오)가 실행되지 않아 SC-007(비로그인 401/403, private 0건), 8.3(편집 패널 미렌더), 8.4(제네바·취리히 후보 표시)가 런타임에서 미검증이다. Plan §5 성공기준 5·6도 같은 이유로 코드 수준 확인에 머문다. | 다음 사이클에서 `npx playwright test tests/e2e/security.spec.ts` 실행을 게이트에 포함. Supabase 미연결 상태에서도 503 경로로 최소 검증 가능 |
| 4 | Minor | `lodgings` 테이블에 `name_ko` 컬럼이 없고 `rowToLodging`도 `nameKo`를 매핑하지 않아(`src/lib/lodgings.ts:44-72`), DB 연결 후에는 seed의 한국어 숙박명 14건이 소실된다. `tests/unit/seed.test.ts:94`의 FR-017 단언은 seed만 검사하므로 이 손실을 잡지 못한다. | `name_ko text` 컬럼 추가 + 14행 insert 값 보강 + `rowToLodging` 매핑, 또는 `nameKo`를 seed 전용 표시 필드로 명시하고 `LodgingSchema` 주석·설계 §3에 기록 |
| 5 | Minor | `alternative_lodging_id`의 자기 참조 금지가 zod(`admin.ts:60-64`)에만 있고 DB CHECK가 없다. SQL 콘솔 등 앱 외 경로로는 자기 참조가 가능하다. | `alter table public.bookings add constraint bookings_alt_not_self check (alternative_lodging_id is null or alternative_lodging_id <> lodging_id);` 추가 |
| 6 | Minor | `saveLodging`이 update 결과 0행일 때 항상 `conflict`로 보고한다(`admin.ts:268-271`). version 불일치와 RLS 거부(리더 미등록)를 구분하지 못해 원인 진단이 어렵다. `saveBooking`은 `getAdminBooking` 재조회로 둘을 구분한다(`:164-178`). | booking 쪽과 동일하게 최신 행을 재조회해 `conflict`/`forbidden`을 분기 |
| 7 | Minor | `LodgingFields`에 `lat`/`lng`·`candidates`·`bookingChannel` 입력이 없다(`src/components/admin/LodgingFields.tsx:24-98`). PRD 부록 A-2는 `address, lat, lng`를 "리더 입력(초기 null)"으로 규정한다(FR-010 필수 목록에는 미포함). | 좌표 입력 2칸과 후보 목록 편집을 다음 사이클 범위로 기록하거나, 설계 §5에 의도적 제외로 명시 |
| 8 | Minor | `/api/admin/bookings/[lodgingId]`가 seed 기반 `getLodging`으로 존재 여부를 판정한다(`src/app/api/admin/bookings/[lodgingId]/route.ts:3,16`). 설계 §4의 "공개 페이지는 모두 `getLodgingsAsync`" 원칙 밖이라, 향후 DB에만 추가된 숙박은 404가 된다. | `getLodgingAsync`로 교체(권한 검사 이후이므로 비용 영향 없음) |
| 9 | Minor | `LodgingFields` 저장 성공 후 폼의 hidden `version`이 서버 값으로 갱신되지 않아(`LodgingFields.tsx:22,104-108`) 새로고침 없이 연속 저장하면 반드시 conflict가 난다. 안내 문구로만 우회 중. | `saveLodgingAction`이 갱신된 row를 반환하고 `BookingEditor`처럼 `formKey` 재설정으로 version 반영 |
| 10 | Minor | `bookings_mirror` 트리거가 `after insert or update`만 처리해 DELETE는 미러에 반영되지 않는다(`…lodgings.sql:135-137`). 현재 `bookings`에 delete 정책이 없어 실질 위험은 없다. | 삭제 경로가 생기면 `after delete` 분기 추가 |
| 11 | Minor | `src/lib/log.ts:27`의 `import("@/lib/notify")`가 클라이언트 컴포넌트(`BookingEditor`, `LodgingCard` 등)를 통해 참조되어 `notify.ts`가 클라이언트 청크에 포함될 수 있다. `RESEND_API_KEY`는 `NEXT_PUBLIC_` 접두사가 아니므로 번들에 인라인되지 않고, `typeof window !== "undefined"` 가드로 호출도 차단되어 실제 노출은 없다. | 서버 전용 경계를 명확히 하려면 `notify.ts` 상단에 `import "server-only";` 추가 |

## 런타임 미검증 (Supabase 미연결 항목)

아래 항목은 Supabase 프로젝트가 연결되지 않아 이번 Check에서 **정적 검토(마이그레이션 텍스트·코드 경로)로만** 확인했다. Plan §3 Out("실제 Supabase 프로젝트 연결·마이그레이션 적용")에 따른 예정된 미검증이다.

| 항목 | 미검증 내용 | 검증 시점 |
|---|---|---|
| `lodgings` RLS 실동작 | anon select 허용 / anon·비리더 authenticated write 거부 | 마이그레이션 적용 후 psql 또는 Supabase SQL 콘솔 |
| `lodgings_touch` 트리거 | update 시 `version + 1`, `updated_at`, `updated_by = auth.uid()` 반영 | 동일 |
| `bookings_mirror` 트리거 | insert/update가 `bookings_public`에 반영되는지, security definer로 RLS를 통과하는지 | 동일 |
| `supabase_realtime` publication | anon Realtime 구독으로 5초 내 상태 반영(SC-004) — 클라이언트 구독은 offline-pwa 범위 | offline-pwa 통합 후 |
| 낙관적 잠금 conflict | 두 세션 동시 저장 시 `conflict` 반환·최신 값 재조회 | 리더 계정 로그인 후 |
| `phone_verified_by` 노출 | anon 키로 `select phone_verified_by` 성공 여부 (지적 #1 실증) | 마이그레이션 적용 직후 우선 확인 |
| 관리자 편집 경로 | magic link 로그인 → `/admin/bookings` 14행 렌더 → 저장 → `revalidatePath` 반영 | 리더 계정 연결 후 |
| Day 편집 패널 | admin 세션에서만 렌더, 저장 후 공개 화면 동기화 | 동일 |
| security 이메일 알림 | `RESEND_API_KEY`·`ADMIN_EMAIL` 설정 시 실제 발송(I-007) | 환경변수 설정 후 |
| E2E 11 시나리오 | `tests/e2e/security.spec.ts` 전체 (지적 #3) | Playwright 실행 시 |

## Act-1 반영 (2026-09-17, pdca-iterate)
| # | 심각도 | 조치 | 결과 |
|---|---|---|---|
| 1 | Critical | `src/lib/bookings/admin.ts` `saveLodging`이 `phone_verified_by`에 이메일 대신 역할 라벨 `"leader"`만 저장. 마이그레이션에 `revoke all on public.lodgings from anon, authenticated` 후 anon에게는 `phone_verified_by`·`updated_by`를 제외한 컬럼 단위 `grant select`, authenticated에는 `select` + `insert, update`(RLS가 리더로 제한). `src/lib/lodgings.ts` 공개 조회는 `PUBLIC_LODGING_COLUMNS`(비공개 컬럼 제외)로 select. 테스트: `bookings.test.ts`(grant/revoke 텍스트, phone_verified_by 미포함), `lodgings.test.ts`(공개 컬럼 상수·이메일 미저장) | 해소 |
| 2 | Important | 위 `revoke all … from anon, authenticated` + 명시 grant로 anon/authenticated 직접 쓰기 차단(RLS + grant 이중 방어) | 해소 |
| 3 | Important | Playwright E2E는 전체 feature 완료 후 QA 단계에서 일괄 실행(결과는 QA 절에 기록) | QA 대기 |

**재계산 Match rate: 지적 1·2 항목 matched → (45 + 0.5×2)/47 = 97.9%** · 게이트 95 통과 · Critical 보안 결함 0건 · `tsc` 0 오류 · `vitest run` 통과.
