# Report — booking-tracker (PRD v2.0 개정)

> feature: booking-tracker · 순서 5/9 · 완료일 2026-09-17 · 최종 match rate **97.9%** (설계 항목 대조 47항목 = matched 45 · partial 2 · missing 0, 게이트 95 통과) · 반복 횟수 **1회**(Check → Act-1)
> Plan `docs/01-plan/booking-tracker.plan.md` · Design `docs/02-design/booking-tracker.design.md` · Analysis `docs/03-analysis/booking-tracker.analysis.md`

## Executive Summary

| 관점 | 내용 (실제 결과) |
|---|---|
| Problem | v2.0은 예약 관리 대상을 14박(제네바·샤모니·취리히 호텔 포함)으로 넓히고, 리더가 전화·링크·가격·재확인일을 배포 없이 직접 갱신하도록 요구했다(N-007, N-009). 기존 구현은 Lodging이 코드 seed에 고정되어 있었고 예약 행은 12개였으며, 공개 뷰(`bookings_public` view)는 anon Realtime 구독이 불가능했다. |
| Solution | 마이그레이션 `20260917000003_lodgings.sql`로 `lodging_kind` enum·`lodgings` 테이블(RLS + 컬럼 단위 grant)·부록 C 14행 import·`bookings.alternative_lodging_id`·2행 추가를 넣고, `bookings_public`을 뷰에서 **테이블 + security definer 트리거 미러 + `supabase_realtime` publication**으로 교체했다. `src/lib/lodgings.ts`가 DB 우선·seed fallback 조회를 담당하고, `/admin/bookings` 14행 표와 Day 상세 `DayEditPanel`이 편집 경로가 된다. `security` 로그는 `notifySecurity`로 Resend 발송(미설정 시 로그만). Act-1에서 리더 이메일 저장 제거 + 컬럼 단위 grant·쓰기 revoke를 추가했다. |
| Function UX Effect | 리더는 `/admin/bookings` 한 표에서 14박의 상태·대안·전화(검증일)·링크·가격·재확인일·갱신 시각을 보고, 행을 펼쳐 바로 고친다. Day 상세에서도 같은 편집이 가능하다. 방문자는 상태와 공개 숙박 정보만 보고, 8/3·8/16 이동일에서는 후보 호텔 목록과 "리더가 확정 예정" 안내를 본다. |
| Core Value | 리더 1인이 2026년 말까지 모든 숙소를 확정 또는 대안으로 기록한다(3장 목표 2). 갱신 주체와 데이터 위치를 일치시켜 재확인 주기를 배포에서 분리했다. |

### 1.3 Value Delivered

| 관점 | 지표·근거 |
|---|---|
| 관리 범위 확대 | 예약 행 **12 → 14**, seed·마이그레이션 **14/14 id·dayId·kind 일치**, 후보 호텔 이름 **8개(제네바 4 + 취리히 4) 전수 일치** |
| 개인정보 보호(NFR) | Act-1에서 `phone_verified_by`에 이메일 대신 역할 라벨 `"leader"`만 저장(`admin.ts:250`). anon은 `phone_verified_by`·`updated_by`를 **컬럼 단위 grant에서 제외**해 SQL 경로로도 조회 불가 |
| 권한 경계 | `revoke all on public.lodgings from anon, authenticated` 후 명시 grant — **RLS + grant 이중 방어**. `bookings_public`도 `grant select` + `revoke insert, update, delete` |
| 실시간 준비(SC-004) | 뷰 → 테이블 전환 + `bookings_mirror()` security definer 트리거 + 초기 백필 + `alter publication supabase_realtime add table` — anon 구독 가능 상태(클라이언트 구독은 offline-pwa 범위) |
| 미연결 내구성 | `getLodgingsAsync()`가 미설정·오류·빈 결과 모두에서 seed 14개로 fallback + `booking_status_defaulted` warn (`lodgings.ts:80-95`) |
| 검증 자산 | `vitest` **113/113 pass** (`bookings.test.ts` 15 · `lodgings.test.ts` 10 · `notify.test.ts` 3 포함) · `tsc --noEmit` **0 오류** · `next build` **통과** · `security.spec.ts` **13/13 pass**(desktop-1440) |
| 계약 일치 | `LodgingFields` 폼 필드 ↔ `LodgingInputSchema` ↔ `saveLodgingAction` ↔ `lodgings` 컬럼 check 제약이 전 구간 동일 규칙(전화 ≤30자·URL·가격 low≤high·ISO 날짜·kind enum) |

## Context Anchor

| Key | Value |
|---|---|
| WHY | 재확인·갱신 주체가 리더이므로 데이터가 코드에 있으면 갱신이 배포에 묶인다(N-009) |
| WHO | 리더(편집), 방문자(열람) |
| RISK | RLS 오류로 private 필드 노출; Supabase 미연결 상태에서 런타임 검증 불가 |
| SUCCESS | 14박 목록 편집, 공개 응답 private 0건, seed↔DB 스키마 일치, 미설정 시 seed fallback |
| SCOPE | 마이그레이션·lodging 조회 계층·관리자 목록·Day 편집 패널·이동일 숙박 블록·security 알림 |

## FR/SC

| ID | 상태 | 근거 |
|---|---|---|
| FR-010 (14박 상태·대안·연락·가격·재확인일 저장) | ✅ 완료 | `lodgings` 14행 import + `bookings` 14행 (`20260917000003_lodgings.sql:66-91`), `saveLodging`(`src/lib/bookings/admin.ts:228-275`) |
| FR-010 (방문자는 공개 필드만) | ✅ 완료 | `toPublicBooking`이 `confirmationRef`·`privateMemo` 제거, `bookings_public` 테이블에 private 컬럼 0개, anon 컬럼 grant에서 `phone_verified_by`·`updated_by` 제외 |
| SC-004 (실시간 구독 DB 준비) | ✅ 완료 | 뷰 → 테이블 + `bookings_mirror()` security definer 트리거 + `supabase_realtime` publication (`…lodgings.sql:96-146`) |
| SC-007 (비인증 admin 접근 차단·private 0건) | ✅ 완료 | `security.spec.ts` admin API 401/403/503 + private 필드 정규식 0건 단언, QA 실행 통과 |
| 8.7 (관리자 14박 목록 + 인라인 편집) | ✅ 완료 | `src/app/admin/bookings/page.tsx:36,59`("14박 예약·숙박 편집"), `LodgingTable.tsx:66-79` 10개 컬럼, `:49-59,137-147` 행 확장 |
| 8.3 (리더 세션 시 Day 상세 편집 패널) | ✅ 완료 | `src/app/day/[dayId]/page.tsx:43-45,132-139` — `session.state === "admin"`일 때만 `<DayEditPanel/>`, 그 외 `null` |
| 8.4 (이동일 후보 호텔·상태·연락) | ✅ 완료 | `src/app/travel/[dayId]/page.tsx:52-64` + `src/components/day/LodgingCard.tsx` 후보 `ol` + "리더가 확정 예정" |
| I-006 (부록 C 14행 초기 import) | ✅ 완료 | `…lodgings.sql:66-86` `on conflict (id) do nothing`, `tests/unit/bookings.test.ts:165-169` |
| I-007 (security 알림 기본값) | ✅ 완료 | `src/lib/notify.ts:10-31` Resend REST, 미설정 시 `{ sent: false, reason: "not_configured" }` · `src/lib/log.ts:22,26-29` |
| 부록 A-2 (Lodging 필드 + alternativeLodgingId) | ✅ 완료 | `src/lib/schema.ts:75-112`, `…lodgings.sql:8-38,88` |
| NFR 개인정보 | ✅ 완료 | Act-1: 이메일 원문 저장 제거 + 비공개 컬럼 grant 제외 (`lodgings.test.ts:122-131`) |
| C-2/C-4 (제네바·취리히 후보 4곳씩, 샤모니 미정) | ✅ 완료 | `src/data/seed/lodgings.ts:6-31`(geneva), `:243-260`(chamonix, candidates []), `:263-291`(zurich) |

## Success Criteria 최종 (Plan §5)

| # | 기준 | 판정 | 근거 |
|---|---|:--:|---|
| 1 | 마이그레이션 텍스트: `create table public.lodgings`, RLS enable, anon select 정책, leader write 정책, 14개 insert, `alternative_lodging_id`, `bookings_public` 테이블+트리거+publication | ✅ | `tests/unit/bookings.test.ts:154-192` 전수 단언 + Act-1 추가분(`revoke all … from anon, authenticated`, 컬럼 grant, `phone_verified_by` 미포함) |
| 2 | `validateLodgingInput` 검증(전화 ≤30·URL·가격 low≤high·ISO·kind) + `toPublicBooking` private 제거 | ✅ | `src/lib/bookings/admin.ts:188-222`, DB 이중 제약 `…lodgings.sql:21,25-26,37`, `tests/unit/bookings.test.ts:50-105` |
| 3 | `getLodgingsAsync()` 미설정 시 seed 14개 반환, dayId 매핑(8/3·8/15·8/16) | ✅ | `src/lib/lodgings.ts:80-95`, `tests/unit/lodgings.test.ts:37-41,97-118` |
| 4 | `/admin/bookings` 미설정 렌더: 14행 헤더 10종 | ✅ | `src/app/admin/bookings/page.tsx:36,59`, `src/components/admin/LodgingTable.tsx:66-79`(데스크톱 표) `:106`(모바일 카드) |
| 5 | `/travel/d2027-08-03` 숙박 블록에 "Hotel Astoria" 후보와 "숙소 미정" 표시 | ✅ | `tests/e2e/security.spec.ts:75` 케이스 **실행 통과**(desktop-1440) + `src/components/day/LodgingCard.tsx` |
| 6 | security E2E: 비인증 admin API 401/403/503, 응답 private 0건, HTML에 service_role 없음 | ✅ | `tests/e2e/security.spec.ts` **13/13 pass**(QA, desktop-1440). `grep -rn "SERVICE_ROLE" src/ supabase/` 0건 |
| 7 | `notifySecurity` 미설정 시 fetch 미호출, 설정 시 1회 호출(모킹) | ✅ | `tests/unit/notify.test.ts:7-48`(3 케이스, Bearer 헤더 포함) |
| 8 | `tsc`, `vitest`, `next build` | ✅ | `tsc --noEmit` 0 오류 · `vitest run` **113/113 pass** · `next build` **통과** |

**충족: 8/8**

## 산출물

- `supabase/migrations/20260917000003_lodgings.sql` — `lodging_kind` enum · `lodgings` 테이블(check 제약·`lodgings_touch` 트리거) · RLS 공개 select + 리더 write · **Act-1: `revoke all … from anon, authenticated` + 컬럼 단위 `grant select`(`phone_verified_by`·`updated_by` 제외) + `grant insert, update … to authenticated`** · 14행 import(I-006) · `bookings.alternative_lodging_id` FK · geneva/zurich 2행 · `bookings_public` 뷰→테이블 + `bookings_mirror()` security definer 트리거 + 백필 + `supabase_realtime` publication
- `src/lib/schema.ts` — `LodgingCandidateSchema`(`:75-81`), `LodgingSchema` 확장(`:83-112`: address/lat/lng/phoneVerifiedAt/By/roomType/capacityNote/recheckAt/candidates), `DaySchema.lodgingId` optional(`:49`)
- `src/data/seed/lodgings.ts` — 14개 seed(`geneva-hotel`, `chamonix-hotel`, `zurich-hotel` 포함), 후보 호텔 8개
- `src/data/seed/days.ts:17,388` — 이동일 8/3·8/16에 `lodgingId` 부여
- `src/lib/lodgings.ts` — `PUBLIC_LODGING_COLUMNS`(`:77-78`), `getLodgingsAsync`/`getLodgingAsync`/`getLodgingForDayAsync`, `rowToLodging`(snake→camel + `safeParse`)
- `src/lib/bookings/admin.ts` — `validateLodgingInput`, `saveLodging`(세션 재검사·version 낙관적 잠금·역할 라벨 저장), `listAdminRows`(14행 join)
- `src/lib/bookings/public.ts` — `PublicBooking` + `alternativeLodgingId`, `bookings_public` 테이블 조회
- `src/lib/notify.ts`(신규) · `src/lib/log.ts` — `security` 등급 → `notifySecurity`(test env 제외, 실패 시 `console.warn`)
- `src/app/admin/bookings/page.tsx`, `src/app/admin/bookings/actions.ts` — `saveBookingAction`(+`alternativeLodgingId`), `saveLodgingAction`
- `src/components/admin/LodgingTable.tsx`(client), `BookingEditor.tsx`, `LodgingFields.tsx`(client), `DayEditPanel.tsx`, `PublicPreview.tsx`
- `src/app/day/[dayId]/page.tsx`, `src/app/travel/[dayId]/page.tsx`, `src/components/day/LodgingCard.tsx`, `src/app/api/bookings/route.ts`
- `tests/unit/bookings.test.ts`(15) · `tests/unit/lodgings.test.ts`(10) · `tests/unit/notify.test.ts`(3) · `tests/e2e/security.spec.ts`

## Key Decisions & Outcomes (Plan §4)

| 결정 | 준수 | 결과 |
|---|:--:|---|
| Lodging 조회는 `getLodgingsAsync()` — anon 클라이언트 있으면 `lodgings` select, 실패·미설정이면 seed. 요청당 1회 `cache()` | ✅ (보강) | 전부 구현. Act-1에서 `select("*")` → `PUBLIC_LODGING_COLUMNS`로 좁혀 **코드 경로에서도 비공개 컬럼을 요청하지 않도록** 이중화했다 |
| 대안 숙소는 `alternative_lodging_id`(FK) + 기존 자유 텍스트 `alternative_lodging` 병행, 공개 뷰는 둘 다 노출 | ✅ | `…lodgings.sql:88`, `bookings_public` 컬럼 2종, `admin.ts:54-64` 자기 참조 거부(zod). DB CHECK는 미추가(후속 #6) |
| `bookings_public`을 테이블로 전환 — anon Realtime은 RLS select 정책이 있는 테이블에만 동작(뷰 불가). insert/update 트리거로 동기화 | ✅ | 뷰 drop → 테이블 + security definer 트리거 + 백필 + publication. `after delete` 분기는 없으나 `bookings`에 delete 정책이 없어 현재 위험 없음(후속 #7) |
| `security` 알림: `RESEND_API_KEY`·`ADMIN_EMAIL` 있을 때 Resend REST(fetch), 없으면 로그만. 새 npm 의존성 없음 | ✅ | `notify.ts` 의존성 0 추가, `deps` 주입으로 테스트 가능. 키는 `Authorization` 헤더로만 쓰이고 로그 출력 없음 |
| 미정 숙소(제네바·샤모니·취리히)는 kind `undecided` + `candidates` 배열 | ✅ | seed·마이그레이션 kind 14/14 일치, `LodgingCard`가 `undecided && candidates.length`에서 후보 `ol` 렌더 |
| **`phone_verified_by`에 검증 주체(리더 이메일)를 저장** | ❌ 결정 자체가 취약 | 이 결정이 Critical 결함의 원인이었다. 같은 테이블에 `for select to anon using (true)` 정책이 있어 **공개 anon 키만으로 관리자 이메일 조회**가 가능했고, `team_members`를 anon에서 막아 둔 설계 의도를 lodgings 경로가 우회했다. Act-1에서 **역할 라벨 저장 + 컬럼 단위 grant 제외**로 방침을 교정했다 |

## Check → Act 요약

| 단계 | 내용 |
|---|---|
| Check (gap-detector, 2026-09-17) | 설계 항목 대조 **95.7%**(47항목 = matched 43 · partial 4 · missing 0) · 게이트 95 **통과**. 단 **보안 지적 Critical 1 · Important 2 · Minor 8** |
| 차단 사유 | 게이트 수치는 통과했으나 Critical 개인정보 노출 1건이 남아 Act-1을 실행 |
| G1 (Critical/개인정보) | `saveLodging`이 `phone_verified_by`에 리더 이메일 원문을 저장(`admin.ts:250`) + `lodgings`의 anon 공개 select → anon 키로 `select phone_verified_by` 가능 → 관리자 magic link 대상 이메일이 표적 피싱 경로가 됨. **역할 라벨 `"leader"`만 저장 + anon 컬럼 grant에서 제외 + 공개 조회를 `PUBLIC_LODGING_COLUMNS`로 축소** → **해소** |
| G2 (Important/권한) | `lodgings`에 `revoke`가 없어 Supabase 기본 public 스키마 권한상 **RLS만이 유일한 방어선**이었다(`bookings`·`bookings_public`은 revoke 병행). `revoke all … from anon, authenticated` + 명시 grant → **해소** |
| G3 (Important/테스트) | Playwright E2E 11 시나리오 미실행으로 SC-007·8.3·8.4가 런타임 미검증 → QA 단계에서 일괄 실행, `security.spec.ts` **13/13 pass**(desktop-1440) → **해소** |
| Act-1 후 재계산 | 지적 1·2 대응으로 항목 #13·#35가 matched 전환 → **(45 + 0.5×2)/47 = 97.9%** · 게이트 95 통과 · **Critical 보안 결함 0건**. 잔여 partial 2건은 #10(`name_ko` 컬럼 부재)·#47(E2E, QA에서 해소됨) |
| 런타임 | `vitest run` **113/113 pass** · `tsc --noEmit` **0 오류** · `next build` **통과** · E2E `security.spec.ts` **13/13 pass** |
| G4~G11 | Minor 8건은 Act 범위 밖, 아래 후속 항목으로 이관 |

## 후속·미검증 항목

### Supabase 연결 시 해야 할 일 (체크리스트)

- [ ] **마이그레이션 순서 적용** — `supabase/migrations/20260917000003_lodgings.sql`(booking-tracker) → `supabase/migrations/20260917000004_journal_public.sql`(trip-journal) **순서대로** 적용한다. 000004는 `team_members` 권한을 컬럼 단위로 좁히므로 000003의 `is_admin()` 경로가 먼저 존재해야 한다.
- [ ] **리더를 `team_members`에 등록** — `insert into public.team_members (email, role) values ('<리더 이메일>', 'leader');`를 **service role(SQL editor)** 로 실행한다. 000004 이후 `role`·`enabled` 변경은 service role 전용이다(`20260916000001_bookings.sql:114` 주석 참조).
- [ ] **환경변수 설정** — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`(필수) / `ADMIN_EMAIL`(security 알림 수신, 리더 판정) / `RESEND_API_KEY`·`SECURITY_MAIL_FROM`(선택 — 미설정 시 `notifySecurity`는 `not_configured`로 로그만 남긴다).
- [ ] **`bookings_public` realtime publication 확인** — `select * from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'bookings_public';`가 1행을 반환하는지 확인한다. Supabase 대시보드 Database → Replication에서도 대조한다(SC-004 전제).
- [ ] **anon이 `phone_verified_by`를 읽지 못하는지 확인** — anon 키로 `GET /rest/v1/lodgings?select=phone_verified_by`가 **거부**되고, `GET /rest/v1/lodgings?select=id,name_original,verified_phone`은 **성공**하는지 각각 1회 확인한다. G1 해소는 마이그레이션 텍스트 단언 + 정적 판독 기반이다.

### 그 외 후속 항목

1. **런타임 미검증(마이그레이션 적용 후)** — `lodgings` RLS 실동작(anon select 허용 / 비리더 write 거부), `lodgings_touch` 트리거(`version + 1`·`updated_by = auth.uid()`), `bookings_mirror` 트리거의 security definer RLS 통과, 낙관적 잠금 conflict(두 세션 동시 저장), magic link 로그인 → `/admin/bookings` 14행 렌더 → 저장 → `revalidatePath` 반영, Day 편집 패널 저장 후 공개 화면 동기화. Analysis "런타임 미검증" 표가 전체 목록이다.
2. **E2E 케이스 수 대조** — QA 기록은 `security.spec.ts` 13/13이나 현재 파일은 `test()` **11개**를 선언하고 있다(다른 spec 케이스 합산 또는 QA 시점 이후 정리로 추정). 다음 QA에서 실행 로그의 케이스 목록과 파일을 1회 대조한다.
3. **#4 (Minor) `name_ko` 컬럼 부재** — `lodgings` 테이블에 `name_ko`가 없고 `rowToLodging`도 매핑하지 않아 **DB 연결 후 seed의 한국어 숙박명 14건이 소실**된다. `tests/unit/seed.test.ts:94`의 FR-017 단언은 seed만 검사해 이를 잡지 못한다. `name_ko text` 컬럼 + 14행 값 보강 + `rowToLodging` 매핑, 또는 `nameKo`를 seed 전용 표시 필드로 설계 §3에 명시한다. **이 1건이 남은 partial의 실질 내용이다.**
4. **#5 (Minor) 자기 참조 DB CHECK 부재** — `alternative_lodging_id`의 자기 참조 금지가 zod(`admin.ts:60-64`)에만 있다. `alter table public.bookings add constraint bookings_alt_not_self check (alternative_lodging_id is null or alternative_lodging_id <> lodging_id);` 추가 권장.
5. **#6 (Minor) `saveLodging`의 0행 결과 오진** — update 0행을 항상 `conflict`로 보고해(`admin.ts:268-271`) version 불일치와 RLS 거부(리더 미등록)를 구분하지 못한다. `saveBooking`(`:164-178`)처럼 최신 행 재조회로 `conflict`/`forbidden`을 분기한다. **리더 미등록 상태에서 가장 먼저 만나게 될 혼동**이므로 위 체크리스트 2번과 함께 다룬다.
6. **#7 (Minor) `LodgingFields` 입력 누락** — `lat`/`lng`·`candidates`·`bookingChannel` 입력이 없다(`LodgingFields.tsx:24-98`). 부록 A-2는 좌표를 "리더 입력(초기 null)"으로 규정하나 FR-010 필수 목록에는 없다. 다음 사이클 범위로 잡거나 설계 §5에 의도적 제외로 명시한다.
7. **#8 (Minor) admin 상세 API의 seed 의존** — `/api/admin/bookings/[lodgingId]`가 seed 기반 `getLodging`으로 존재 여부를 판정한다(`route.ts:3,16`). DB에만 추가된 숙박은 404가 되므로 `getLodgingAsync`로 교체한다(권한 검사 이후라 비용 영향 없음).
8. **#9 (Minor) 연속 저장 시 강제 conflict** — `LodgingFields`의 hidden `version`이 저장 성공 후 서버 값으로 갱신되지 않아(`LodgingFields.tsx:22,104-108`) 새로고침 없이 두 번 저장하면 반드시 conflict가 난다. `saveLodgingAction`이 갱신된 row를 반환하고 `BookingEditor`처럼 `formKey`를 재설정한다.
9. **#10 (Minor) `bookings_mirror` DELETE 미처리** — 트리거가 `after insert or update`만 처리한다(`…lodgings.sql:135-137`). `bookings`에 delete 정책이 없어 현재 실질 위험은 없으나, 삭제 경로가 생기면 `after delete` 분기를 함께 추가한다.
10. **#11 (Info) `notify.ts` 서버 경계** — `log.ts:27`의 동적 `import("@/lib/notify")`가 클라이언트 컴포넌트를 통해 참조될 수 있다. `RESEND_API_KEY`는 `NEXT_PUBLIC_` 접두사가 아니라 번들에 인라인되지 않고 `typeof window` 가드로 호출도 차단되므로 실제 노출은 없으나, `notify.ts` 상단에 `import "server-only";`를 추가해 경계를 명시한다.
11. **클라이언트 실시간 구독** — SC-004의 DB 측(publication)만 이 사이클 범위였다. anon Realtime 구독 5초 + 30초 폴링 fallback의 클라이언트 구현·검증은 offline-pwa 사이클에서 마감한다.
