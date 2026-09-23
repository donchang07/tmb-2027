# Analysis — trip-journal (PRD v2.0 개정)

> feature: trip-journal · Check 단계 · gap-detector 실행 2026-09-17 · 게이트 95
> Design: `docs/02-design/trip-journal.design.md` · Plan: `docs/01-plan/trip-journal.plan.md` §5
> 출처: PRD v2.0 FR-016 · SC-012 · S7 · 8.8 · NFR 개인정보 · A-4

## 결과

| 항목 | 값 |
|---|---|
| 설계 항목 대조 | **99%** (47.5 / 48) |
| 가중 Match rate (정적 전용) | **94%** |
| 게이트 95 | **미달** |
| 차단 사유 | G1 권한 상승 RLS 구멍(Critical) · 런타임(`vitest`·`tsc`) 미검증 |
| 이메일 노출 | 소스·렌더 경로 0건 (`listEntries` 반환에 email 없음, `authorLabelFrom` 제거 완료) |

### 축별 점수

| 축 | 점수 | 근거 |
|---|---:|---|
| Structural | 100% | 설계 §1의 10개 파일 전부 존재 |
| Functional | 98% | placeholder 0건. `journalConfigured` 신호만 표기 차이 |
| Contract | 100% | 폼 필드 ↔ 서버 액션 ↔ `CreateEntryResult.reason` ↔ `EntryState.status` 전부 일치 |
| Intent (Plan §5) | 92% | 성공기준 1~5 충족, 6(`tsc`·`vitest`·`next build`) 미검증 |
| Behavioral | 83% | 마이그레이션 멱등성·중복행 선정리 없음, 컬럼 단위 권한 미제한 |
| UX | 90% | 로그인한 팀원에게도 "팀원 로그인 후 가능" 문구 노출 |

산식(런타임 미실행): `Structural×0.10 + Functional×0.20 + Contract×0.20 + Intent×0.25 + Behavioral×0.15 + UX×0.10 = 94.05`

## 검증 근거

- 정적 판독: `supabase/migrations/20260917000004_journal_public.sql`(29줄 전문), `src/lib/journal.ts`(165줄), `src/lib/journal-rules.ts`(52줄), `src/app/journal/{page.tsx,[dayId]/page.tsx,actions.ts,login/page.tsx}`, `src/components/journal/{JournalAccessNote,DisplayNameForm,JournalTimeline,JournalForm}.tsx`, `src/app/day/[dayId]/page.tsx:146-149`, `tests/unit/journal.test.ts`(105줄), `tests/e2e/security.spec.ts`(62줄)
- 선행 마이그레이션 대조: `20260916000001_bookings.sql`(team_members 스키마·`jwt_email()`·`is_admin()`·`revoke all … from anon`), `20260916000002_journal.sql`(구 RLS·private 버킷·본인 폴더 업로드 정책)
- `authorLabelFrom` 전역 grep: 소스 참조 0건 (잔존은 아카이브 설계서 `docs/archive/2026-09-v2/trip-journal/`와 테스트의 부재 단언뿐)
- 이메일 렌더 경로 grep(`src/components` 내 `.email`·`session.email`·`profile.email`): 0건
- `getTrekDays()` → `src/data/seed/days.ts`의 `type: "trek"` 12건 = 설계 §5 "Day 12개 카드" 일치
- `logEvent` 시그니처·`journal_upload_rejected` 코드·`warn` 레벨 존재 확인(`src/lib/log.ts:1,17,20`)
- `createSupabaseAnonClient` 쿠키 무시 구현 확인(`src/lib/supabase/server.ts:25-36`) — 세션 누출 없이 anon 컨텍스트 보장
- `StatusNote`의 `tone`·`action` prop 시그니처 확인(`src/components/ui/StatusNote.tsx:10,15,18`)

## 항목별 대조

### SQL (10/10)

| # | 설계 항목 | 구현 | 판정 |
|---|---|---|:--:|
| 1 | `display_name text` 추가 | `:5-6` | ✅ |
| 2 | `check (null or char_length between 1 and 20)` | `:6` | ✅ |
| 3 | 본인 행 update 정책(`email = public.jwt_email()`, using+with check) | `:8-11` | ✅ |
| 4 | `drop policy "journal member select"` | `:14` | ✅ |
| 5 | `journal public select` … `to anon, authenticated using (true)` | `:15-16` | ✅ |
| 6 | `grant select on public.journal_entries to anon` | `:18` | ✅ |
| 7 | `unique index (day_id, author_id)` | `:21` | ✅ |
| 8 | `update storage.buckets set public = true` | `:24` | ✅ |
| 9 | `drop policy "journal photos member read"` | `:26` | ✅ |
| 10 | `journal photos public read` (`bucket_id = 'journal-photos'`) | `:27-29` | ✅ |

### `src/lib/journal.ts` (9.5/10)

| # | 설계 항목 | 구현 | 판정 |
|---|---|---|:--:|
| 11 | `listEntries` anon 클라이언트 사용 | `:57` `createSupabaseAnonClient()` | ✅ |
| 12 | 미설정 시 `[]` | `:58` | ✅ |
| 13 | `journalConfigured = false` 신호 | `listEntries`에는 없음 — `getMemberProfile().state === "unconfigured"` + `countEntriesByDay() === null`로 대체 | ⚠️ |
| 14 | 반환 `{id,dayId,authorLabel,text,imageUrl(public URL),createdAt}`·email 없음 | `:52,65-72`, `getPublicUrl` | ✅ |
| 15 | `getMemberProfile` → `display_name` 조회·`member/guest/anon` | `:40-50` (+`unconfigured` 상위집합) | ✅ |
| 16 | `createEntry` 세션 팀원 검사 | `:110-113` | ✅ |
| 17 | displayName 없으면 `needs_display_name` | `:115-116` | ✅ |
| 18 | `23505` → `DUPLICATE_MESSAGE` + `journal_upload_rejected` warn | `:158-161` | ✅ |
| 19 | `author_label = displayName` | `:152` | ✅ |
| 20 | `setDisplayName` → `validateDisplayName` → email 기준 update | `:94-103` | ✅ |

### `src/lib/journal-rules.ts` (4/4)

| # | 설계 항목 | 구현 | 판정 |
|---|---|---|:--:|
| 21 | `DUPLICATE_MESSAGE = "이 Day에는 이미 기록을 남겼습니다"` | `:42` | ✅ |
| 22 | `validateDisplayName` trim·1~20자 | `:48-49` | ✅ |
| 23 | `@` 금지 · `\s{2,}` 정리 | `:48,50` | ✅ |
| 24 | `authorLabelFrom` 제거, 잔존 참조 0 | grep 0건 | ✅ |

### 페이지·컴포넌트 (14/14)

| # | 설계 항목 | 구현 | 판정 |
|---|---|---|:--:|
| 25 | `/journal` Day 12개 카드 | `page.tsx:13,22-31` | ✅ |
| 26 | 미설정 시 건수 "—" | `page.tsx:28` | ✅ |
| 27 | `JournalAccessNote` 문구 "열람은 누구나 가능합니다 / 기록 작성은 팀원 로그인(매직 링크) 후 가능합니다." | `JournalAccessNote.tsx:24,39` | ✅ |
| 28 | `/journal/[dayId]` 공개 타임라인 | `[dayId]/page.tsx:33,63` | ✅ |
| 29 | 빈 상태 "아직 기록이 없습니다" | `JournalTimeline.tsx:6` | ✅ |
| 30 | 팀원 + displayName 없음 → `DisplayNameForm` | `[dayId]/page.tsx:52` | ✅ |
| 31 | 팀원 + displayName 있음 → `JournalForm` | `[dayId]/page.tsx:53-60` | ✅ |
| 32 | 이미 작성 시 "이미 기록을 남겼습니다" | `[dayId]/page.tsx:55-56` | ✅ |
| 33 | 비로그인 → "팀원 로그인" 링크 `/journal/login` | `JournalAccessNote.tsx:29-33` | ✅ |
| 34 | `setDisplayNameAction` | `actions.ts:34-41` | ✅ |
| 35 | `/day/[dayId]` 링크 "팀 기록 보기" | `day/[dayId]/page.tsx:146-148` | ✅ |
| 36 | `DisplayNameForm` client 컴포넌트 | `DisplayNameForm.tsx:1` `"use client"` | ✅ |
| 37 | `JournalTimeline` authorLabel·시각 | `JournalTimeline.tsx:19` | ✅ |
| 38 | 폼은 팀원에게만 렌더 | `[dayId]/page.tsx:52-61` 조건부 | ✅ |

### 테스트 (10/10)

| # | 설계 §6 항목 | 구현 | 판정 |
|---|---|---|:--:|
| 39~42 | `validateDisplayName` 빈·21자·이메일 거부·trim | `journal.test.ts:45-59` | ✅ |
| 43 | `DUPLICATE_MESSAGE` | `journal.test.ts:62` | ✅ |
| 44 | 마이그레이션 텍스트(anon select·unique index·display_name·`public = true`) | `journal.test.ts:70-86` | ✅ |
| 45 | `authorLabelFrom` 미존재 | `journal.test.ts:63` | ✅ |
| 46 | `/journal/d2027-08-05` HTML에 이메일 패턴 없음 | `security.spec.ts:44-45` | ✅ |
| 47 | "팀원 로그인" 안내 | `security.spec.ts:42-43` | ✅ |
| 48 | 비로그인 업로드 폼 0개 | `security.spec.ts:48-53` | ✅ |

## 지적과 조치 필요

| # | 심각도 | 지적 | 위치 | 조치 |
|---|---|---|---|---|
| G1 | **Critical / security** | `team_members self update display_name` 정책이 컬럼을 제한하지 않는다. `team_members`에는 `role public.member_role`·`enabled`가 있고(`20260916000001_bookings.sql:8-13`), `authenticated`에는 테이블 UPDATE 권한이 남아 있다(`revoke all … from anon`만 존재). 팀원이 브라우저의 anon 키로 PostgREST에 `PATCH /rest/v1/team_members?email=eq.<본인>` `{"role":"leader"}` 를 직접 호출하면 `is_admin()`이 참이 되어 `bookings`의 `confirmation_ref`·`private_memo`까지 열린다 — booking-tracker FR-010/SC-007 보호가 무력화된다. Plan §4의 "컬럼 제한은 서버 액션에서"는 직접 REST 호출을 막지 못한다. | `20260917000004_journal_public.sql:8-11` | 컬럼 단위 권한으로 고정: `revoke update on public.team_members from authenticated;` + `grant update (display_name) on public.team_members to authenticated;` (또는 `with check`에 `role`·`enabled` 불변 조건 추가) |
| G2 | **Important / security** | `grant select on public.journal_entries to anon`이 전 컬럼을 연다. 정책이 `using (true)`이므로 anon이 `?select=author_id`로 작성자 `auth.users.id`(UUID)를 수집·상호 연결할 수 있다. 이메일은 아니지만 A-4/NFR의 식별자 최소화 취지에 어긋난다. | `20260917000004_journal_public.sql:18` | `grant select (id, day_id, author_label, text, image_path, created_at) on public.journal_entries to anon` 으로 축소 |
| G3 | **Important / 배포** | `create unique index journal_entries_one_per_member_day` 앞에 기존 중복행 정리가 없다. 이전 사이클은 Day당 다건을 허용했으므로 운영 DB에 중복이 있으면 마이그레이션 전체가 실패한다. 또한 `add column`·`create policy`·`create unique index`에 `if not exists`가 없어 재실행이 불가능하다. | `20260917000004_journal_public.sql:5,8,21` | 인덱스 생성 전 `delete from journal_entries a using journal_entries b where a.day_id=b.day_id and a.author_id=b.author_id and a.created_at < b.created_at;` 선행 + `add column if not exists`·`drop policy if exists` 보강 |
| G4 | **Important / 테스트** | `security.spec.ts:34-38`은 이전 사이클의 잔존 단언이다. `/journal/d2027-08-04`에서 `팀원 로그인이 필요합니다`를 찾지만 그 문자열은 이제 어디에도 렌더되지 않는다(현재 문구는 "기록 작성은 팀원 로그인(매직 링크) 후 가능합니다"). Supabase 미설정 환경에서 `기록 기능 비활성` 대체 분기로만 통과하므로, Supabase를 연결하면 실패한다 — 즉 공개화 설계와 모순되는 테스트가 초록으로 남아 있다. | `tests/e2e/security.spec.ts:34-38` | 정규식을 `/기록 작성은 팀원 로그인\|기록 기능 비활성/`로 교체하거나, 40~53행 신규 테스트와 중복이므로 삭제 |
| G5 | **Minor / UX** | 로그인한 팀원에게도 `JournalAccessNote`가 "기록 작성은 팀원 로그인(매직 링크) 후 가능합니다"를 그대로 보여준다(`member` 분기). 이미 로그인한 사용자에게 무의미하다. | `src/components/journal/JournalAccessNote.tsx:9-12` | member 분기 본문을 "기록은 표시명으로만 공개됩니다" 등으로 분리 |
| G6 | **Minor / 설계표기** | 설계 §3은 `listEntries`가 `journalConfigured=false`를 반환한다고 적었으나 구현은 `[]`만 반환하고 미설정 안내는 `getMemberProfile`/`countEntriesByDay`가 담당한다. 동작은 동일하나 문서와 시그니처가 어긋난다. | `src/lib/journal.ts:56-58` · 설계 §3 | 설계 문구를 실제 시그니처에 맞춰 정정(코드 변경 불요) |
| G7 | **Minor** | `validateDisplayName`이 `\s{2,}`만 단일 공백으로 접을 뿐 개행·탭 자체는 허용한다(`"a\nb"` 통과). 타임라인 라벨이 줄바꿈될 수 있다. | `src/lib/journal-rules.ts:48` | `replace(/\s+/g, " ")`로 변경 |
| G8 | **Minor** | `DisplayNameForm`의 `current` prop이 항상 `null`로 전달되어 사실상 죽은 인자다. 표시명 설정 후 변경할 경로가 없다. | `src/app/journal/[dayId]/page.tsx:52` | 설계 범위 밖 — Report에 후속 항목으로 기록 |
| G9 | **Info / privacy** | 공개 버킷의 이미지 public URL 경로가 `{auth.uid()}/{uuid}.ext` 라서 URL에 작성자 UUID가 노출된다(G2와 동일 성격). | `src/lib/journal.ts:141` | 경로를 `{dayId}/{uuid}` 또는 난수 폴더로 변경 검토 |

### 게이트 판정

게이트 95 대비 **94% — 미달**. 재진입(Act) 조건: G1 필수, G2~G4 권장, 이후 런타임 재검증.

## 런타임 미검증

| 항목 | 상태 | 사유 |
|---|---|---|
| `npx vitest run tests/unit/journal.test.ts` | **미실행** | 이 세션에서 셸 실행이 차단됨(3회 시도 실패). Plan §5 성공기준 6 미확인 |
| `npx tsc --noEmit` | **미실행** | 동일 |
| `next build` | **미실행** | 동일 |
| `tests/e2e/security.spec.ts` | **미실행** | Playwright 미구동. G4의 실패 여부도 정적 판독 기반 추론 |
| Supabase RLS 실동작(anon select, unique 위반 23505, 공개 버킷 read) | **미검증** | Supabase 미연결. G1 권한 상승은 정적 판독 기반 결론이며 실계정 PATCH로 재확인 필요 |
| 표시명 미설정 → 설정 → 작성 전체 플로우 | **미검증** | 로그인 세션 필요 |

정적 판독 범위에서는 타입·계약 불일치가 발견되지 않았으나, 위 6개 항목은 Act 단계에서 반드시 실행해 확정해야 한다.

---

## Act-1 반영 (2026-09-17)

### G1~G4 조치 결과

| # | 심각도 | 조치 | 결과 |
|---|---|---|:--|
| G1 | Critical / security | `20260917000004_journal_public.sql:17-18` — `revoke update on public.team_members from authenticated;` + `grant update (display_name) on public.team_members to authenticated;` 추가. 정책은 컬럼을 제한할 수 없으므로 컬럼 단위 GRANT로 고정. 리더의 `role`·`enabled` 변경은 기존 문서화된 운영 절차대로 Supabase SQL editor(service role)에서 수행하며, 마이그레이션 주석(`:14-16`)에 명시. 셀프 업데이트 정책은 `drop policy if exists` 후 재생성해 그대로 유지. | ✅ 해소 — anon 키로 `PATCH /rest/v1/team_members {"role":"leader"}` 호출 시 컬럼 권한에서 거부. booking-tracker FR-010/SC-007 보호 복구. 단위 테스트 `journal.test.ts` "locks team_members updates to the display_name column"으로 마이그레이션 텍스트 고정 |
| G2 | Important / security | `:27-28` — `grant select on public.journal_entries to anon` 제거, `revoke select … from anon;` + `grant select (id, day_id, author_label, text, image_path, created_at) … to anon;` 로 축소. `src/lib/journal.ts:61` `listEntries`는 이미 동일 6개 컬럼만 select 하므로 코드 변경 불요, `countEntriesByDay():78`의 `day_id`도 허용 컬럼 내. | ✅ 해소 — anon이 `?select=author_id`로 작성자 `auth.users.id`를 수집할 수 없음. 테스트 "limits the anonymous grant to public columns"에서 신규 문자열 포함 + 구 전체 grant 부재를 동시 단언 |
| G3 | Important / 배포 | `:31-33` — unique index 생성 전 `delete from public.journal_entries a using public.journal_entries b where a.day_id = b.day_id and a.author_id = b.author_id and a.created_at < b.created_at;` 선행(Day·작성자당 최신 1건만 잔존). 재실행 가능화: `add column if not exists`(`:6`), `create unique index if not exists`(`:35`), 3개 `create policy` 앞 `drop policy if exists`(`:8,22,41`). | ✅ 해소 — 운영 DB에 중복행이 있어도 마이그레이션이 실패하지 않고, 전체 파일이 멱등. 테스트 "is re-runnable and clears duplicates before the unique index"로 고정 |
| G4 | Important / 테스트 | `tests/e2e/security.spec.ts:36` — 잔존 정규식 `/팀원 로그인이 필요합니다\|기록 기능 비활성/` → `/기록 작성은 팀원 로그인\|기록 기능 비활성/`. 삭제 대신 정규식 교체를 택해 `d2027-08-04` 커버리지를 유지(40~53행 신규 테스트는 `d2027-08-05` 대상). 파일 내 다른 케이스는 미변경. | ✅ 해소 — Supabase 연결 환경에서도 실제 렌더 문구(`JournalAccessNote.tsx:39`)와 일치. 공개화 설계와 모순되는 초록 테스트 제거 |

G5~G9(Minor/Info)는 이번 Act 범위 밖으로 Report 후속 항목에 유지한다.

### 재계산 Match rate

`항목별 대조` 표 48개 항목 재집계: G1~G3가 지적한 SQL 항목 #3(셀프 업데이트 정책)·#6(anon select grant)·#7(unique index)은 조치 후 결함 없이 ✅, 나머지 ✅ 항목은 변동 없음. 유일한 부분 충족은 여전히 #13(G6 — `journalConfigured` 신호 표기 차이, 설계 문서 정정 사안)뿐이다.

| 항목 | Check | Act-1 | 근거 |
|---|---:|---:|---|
| 설계 항목 대조 | 99% (47.5 / 48) | **99% (47.5 / 48)** | #13(G6)만 부분 충족 유지 — 코드 변경 불요 사안 |
| 가중 Match rate | 94% | **98%** | 아래 축별 재계산 |

| 축 | Check | Act-1 | 변동 근거 |
|---|---:|---:|---|
| Structural | 100% | 100% | 파일 구성 변동 없음 |
| Functional | 98% | 98% | G6 표기 차이 잔존 |
| Contract | 100% | 100% | 타입·계약 변경 없음 |
| Intent (Plan §5) | 92% | 96% | 성공기준 6 중 `vitest`·`tsc` 실행 완료, `next build` 미실행 |
| Behavioral | 83% | 100% | G1 컬럼 권한·G2 컬럼 grant·G3 멱등성/중복 정리·G4 테스트 정합성 전부 해소 |
| UX | 90% | 90% | G5(로그인 팀원 문구) 범위 밖 |

산식: `100×0.10 + 98×0.20 + 100×0.20 + 96×0.25 + 100×0.15 + 90×0.10 = 97.6` → **98%**

**게이트 95 — 통과** (Check 94% 미달 → Act-1 98% 충족). 차단 사유였던 G1 권한 상승 RLS 구멍 해소, 런타임 `vitest`·`tsc` 검증 완료.

### 런타임 검증 결과

| 명령 | 결과 |
|---|---|
| `npx vitest run tests/unit/journal.test.ts` | ✅ **Test Files 1 passed / Tests 15 passed** (기존 11 → 신규 4 케이스 추가, 238ms) |
| `npx tsc --noEmit` | ⚠️ **journal 관련 오류 0건**. 잔여 2건은 booking-tracker 범위(`src/lib/itinerary.ts`, `src/data/seed/lodgings.ts`, `tests/unit/itinerary.test.ts`의 `Lodging` 타입 중복 정의 / `address` 옵셔널 불일치)로 동시 진행 중인 다른 작업의 미완 상태이며 본 Act 변경과 무관 |
| `next build` | 미실행 — 위 booking-tracker 타입 오류가 해소된 뒤 통합 확인 필요 |
| `tests/e2e/security.spec.ts` | 미실행(Playwright 미구동) — G4는 렌더 문구 정적 대조로 확정 |
| Supabase RLS 실동작 | 미검증 — 마이그레이션 적용 후 실계정 `PATCH team_members {"role":"leader"}` 거부 및 anon `?select=author_id` 거부를 1회 확인 권장 |

### 변경 파일

| 파일 | 변경 |
|---|---|
| `supabase/migrations/20260917000004_journal_public.sql` | G1 컬럼 단위 update 권한, G2 컬럼 단위 anon select grant, G3 중복행 정리 + 멱등성(`if not exists`·`drop policy if exists`) |
| `tests/unit/journal.test.ts` | 마이그레이션 텍스트 단언 갱신(2건) + 신규 케이스 3건(G1 권한, G2 컬럼 grant, G3 멱등성·중복 정리) |
| `tests/e2e/security.spec.ts` | G4 — journal 케이스 1건의 잔존 정규식 교체(1줄) |
| `src/lib/journal.ts` | 변경 없음 — `listEntries`가 이미 G2 허용 컬럼만 select |