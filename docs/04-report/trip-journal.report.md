# Report — trip-journal (PRD v2.0 개정)

> feature: trip-journal · 순서 9/9 · 완료일 2026-09-17 · 최종 match rate **98%** (가중, 설계 항목 대조 99% = 47.5/48, 게이트 95 통과) · 반복 횟수 **1회**(Check → Act-1)
> Plan `docs/01-plan/trip-journal.plan.md` · Design `docs/02-design/trip-journal.design.md` · Analysis `docs/03-analysis/trip-journal.analysis.md`

## Executive Summary

| 관점 | 내용 (실제 결과) |
|---|---|
| Problem | v2.0은 여행 기록을 모든 방문자에게 공개(N-008)하고 팀원 1인당 Day별 1건(N-011)으로 제한하며 작성자를 이메일이 아닌 표시명으로 노출하도록 바꿨다. 기존 구현은 팀원만 열람·사진 버킷 비공개·이메일 앞부분을 작성자 라벨로 사용·Day당 다건 허용이었다. |
| Solution | 마이그레이션 `20260917000004_journal_public.sql`로 anon select 정책·`grant select`·공개 버킷·`unique (day_id, author_id)`·`team_members.display_name`을 추가했다. `listEntries`는 anon 클라이언트로 조회하고 반환 객체에서 email을 완전히 제거했으며, `authorLabelFrom(email)`을 삭제했다. 표시명은 팀원이 `DisplayNameForm`으로 직접 설정한다. Act-1에서 컬럼 단위 권한·컬럼 단위 grant·중복행 정리·멱등성을 추가했다. |
| Function UX Effect | 가족·지인도 링크만으로 `/journal`과 Day 타임라인·사진을 볼 수 있고, 작성자는 표시명으로만 보인다. 팀원은 표시명 설정 후 Day당 1건을 작성하며 중복 시 "이 Day에는 이미 기록을 남겼습니다"가 뜬다. |
| Core Value | 팀 기록 공유(S7). 열람은 열되 식별자는 닫는 구조를 권한 계층에서 강제했다. |

### 1.3 Value Delivered

| 관점 | 지표·근거 |
|---|---|
| 개인정보 보호(NFR) | 이메일 **소스·렌더 경로 0건** — `listEntries` 반환에 email 없음, `authorLabelFrom` 전역 grep 0건, `src/components` 내 `.email` 참조 0건 |
| 권한 경계 | Act-1에서 `revoke update … from authenticated` + `grant update (display_name)`로 **권한 상승 경로 차단**. anon select도 6개 공개 컬럼으로 축소(`author_id` 수집 불가) |
| 공개 열람(N-008) | `journal public select` `to anon, authenticated using (true)` + 공개 버킷 `public = true` + `journal photos public read` |
| 1일 1건(N-011) | `unique index journal_entries_one_per_member_day` + `23505` 포착 → `DUPLICATE_MESSAGE` + `journal_upload_rejected` warn |
| 배포 안전성 | 중복행 선정리(최신 1건 잔존) + `if not exists`·`drop policy if exists`로 **마이그레이션 전체 멱등** |
| 검증 자산 | `journal.test.ts` **15/15 pass**(기존 11 + Act-1 신규 4), `security.spec.ts` journal 3케이스 |
| 계약 일치 | 폼 필드 ↔ 서버 액션 ↔ `CreateEntryResult.reason` ↔ `EntryState.status` 100% 일치 |

## Context Anchor

| Key | Value |
|---|---|
| WHY | 가족·지인 열람 등급 없음(N-001)·기록 공개(N-008) |
| WHO | 팀원(작성), 방문자(열람) |
| RISK | 이메일 노출 금지(NFR). 공개 버킷은 URL을 아는 누구나 접근 가능 → PRD가 공개 버킷을 확정 |
| SUCCESS | anon 조회 정책, 1일 1건 제약, displayName만 공개, 미설정 시 안내 |
| SCOPE | 마이그레이션·journal lib·페이지·폼·테스트 |

## FR/SC

| ID | 상태 | 근거 |
|---|---|---|
| FR-016 (Day별 1건 기록) | ✅ 완료 | `unique (day_id, author_id)` + `createEntry` 23505 분기 (`journal.ts:158-161`) |
| FR-016 (모든 방문자 열람) | ✅ 완료 | `journal public select` + `grant select`(공개 6컬럼) + `createSupabaseAnonClient()` 조회 (`journal.ts:57`) |
| SC-012 (비허용 입력 거부) | ✅ 완료 | `validateDisplayName` 1~20자·`@` 금지·공백 정리, 기존 텍스트·이미지 검증 유지 |
| SC-012 (비로그인 열람) | ✅ 완료 | `/journal`·`/journal/[dayId]` 세션 없이 렌더, 폼은 조건부 (`[dayId]/page.tsx:52-61`) |
| NFR 개인정보 | ✅ 완료 | 이메일 미노출 + Act-1 컬럼 grant 축소로 `author_id`(UUID)도 비공개 |
| 11.2 #1 (공개 버킷) | ✅ 완료 | `update storage.buckets set public = true where id = 'journal-photos'` + anon select 정책 |
| 부록 A-4 (JournalEntry/displayName) | ✅ 완료 | `team_members.display_name text check (1..20)`, `author_label = displayName` 복사 |
| N-008 / N-011 | ✅ 완료 | 공개 읽기 정책 / 유니크 인덱스 |
| 8.8 (화면) | ✅ 완료 | Day 12개 카드, `JournalAccessNote`, 타임라인 빈 상태 "아직 기록이 없습니다" |

## Success Criteria 최종 (Plan §5)

| # | 기준 | 판정 | 근거 |
|---|---|:--:|---|
| 1 | SQL 텍스트: anon select 정책, `public = true` 버킷, `unique (day_id, author_id)`, `display_name` | ✅ | 마이그레이션 10항목 전수 일치 + `journal.test.ts:70-86` 텍스트 단언 |
| 2 | `listEntries`가 세션 없이 조회(미설정 시 `[]` + 안내), 반환 객체에 email 없음 | ✅ | `journal.ts:52,57-58,65-72`. 미설정 안내는 `getMemberProfile().state === "unconfigured"` + `countEntriesByDay() === null`이 담당 |
| 3 | `validateDisplayName` 1~20자·`@` 거부, `authorLabel`은 displayName | ✅ | `journal-rules.ts:48-50`, `journal.ts:152`, 테스트 4케이스 |
| 4 | 중복 저장 시 오류 메시지 문자열 | ✅ | `DUPLICATE_MESSAGE = "이 Day에는 이미 기록을 남겼습니다"` (`journal-rules.ts:42`) |
| 5 | `/journal/d2027-08-05` 비로그인 렌더에 타임라인 표시·폼 미표시 | ✅ | `[dayId]/page.tsx:33,63` + `security.spec.ts:48-53` 업로드 폼 0개 단언 |
| 6 | `tsc`·`vitest`·`next build` 통과 | ⚠️ 부분 | `vitest run tests/unit/journal.test.ts` **15/15 pass** · `tsc` **journal 관련 오류 0건**(잔여 2건은 booking-tracker 범위) · `next build` **미실행** |

**충족: 5/6** (6번 부분 충족 — `next build` 미실행)

## 산출물

- `supabase/migrations/20260917000004_journal_public.sql` — display_name 컬럼·셀프 업데이트 정책·컬럼 단위 update 권한(Act-1)·anon 공개 select 정책·컬럼 단위 grant(Act-1)·중복행 정리(Act-1)·unique index·공개 버킷·스토리지 public read
- `src/lib/journal-rules.ts` — `validateDisplayName`, `DUPLICATE_MESSAGE`, `authorLabelFrom` 제거
- `src/lib/journal.ts` — `listEntries`(공개), `getMemberProfile`, `countEntriesByDay`, `createEntry`(1건 제한), `setDisplayName`
- `src/app/journal/actions.ts` — `setDisplayNameAction`
- `src/app/journal/page.tsx`, `src/app/journal/[dayId]/page.tsx`, `src/app/journal/login/page.tsx`
- `src/components/journal/DisplayNameForm.tsx`(신규, client), `JournalAccessNote.tsx`, `JournalTimeline.tsx`, `JournalForm.tsx`
- `src/app/day/[dayId]/page.tsx:146-148` — "팀 기록 보기" 링크
- `tests/unit/journal.test.ts`(15 케이스), `tests/e2e/security.spec.ts`(journal 3케이스)

## Key Decisions & Outcomes (Plan §4)

| 결정 | 준수 | 결과 |
|---|:--:|---|
| 공개 읽기: `journal_entries` select policy `to anon, authenticated using (true)` + `grant select to anon`. 버킷 `public = true` + anon select. 이미지 URL은 public URL | ✅ (보강) | 전부 구현. 단 Check에서 **전 컬럼 grant가 `author_id` 수집을 허용**함을 발견해, Act-1에서 6개 공개 컬럼 grant로 축소했다. `listEntries`가 이미 같은 6컬럼만 select해 코드 변경은 불필요했다 |
| 표시명: `display_name text check (1..20)`, 본인 행만 update 가능한 RLS, **컬럼 제한은 서버 액션에서** | ⚠️ 결정 자체가 취약 | 이 결정이 Critical 결함(G1)의 원인이었다. 서버 액션은 브라우저의 직접 REST 호출(`PATCH /rest/v1/team_members {"role":"leader"}`)을 막지 못한다. Act-1에서 **DB 컬럼 단위 GRANT**로 방침을 교정했고, `role`·`enabled` 변경은 service role(SQL editor) 전용으로 마이그레이션 주석에 명문화했다 |
| 1일 1건: `unique (day_id, author_id)`, 위반 시 "이 Day에는 이미 기록을 남겼습니다"(`journal_upload_rejected` warn) | ✅ | 구현·테스트 일치. Act-1에서 인덱스 생성 전 중복행 정리를 추가해 기존 운영 데이터에서도 안전하게 적용 가능 |
| `author_label`은 저장 시 display_name 복사(기존 컬럼 재사용) | ✅ | `journal.ts:152`. 스키마 변경 없이 이메일 유래 라벨을 제거 |
| 미설정 시 작성 폼 대신 "표시명을 먼저 설정하세요" | ✅ | `createEntry` → `needs_display_name`, `[dayId]/page.tsx:52` → `DisplayNameForm` |

## Check → Act 요약

| 단계 | 내용 |
|---|---|
| Check (gap-detector, 2026-09-17) | 설계 항목 대조 **99%**(47.5/48) · 가중 match rate **94%** — 게이트 95 **미달**. 축: Structural 100 · Functional 98 · Contract 100 · Intent 92 · Behavioral 83 · UX 90 |
| 차단 사유 | G1 권한 상승 RLS 구멍(Critical) + 런타임(`vitest`·`tsc`) 미검증 |
| G1 (Critical/보안) | 셀프 업데이트 정책이 컬럼을 제한하지 않아 팀원이 anon 키 REST 호출로 `role`을 `leader`로 올려 booking-tracker의 `confirmation_ref`·`private_memo`까지 열 수 있었다 → `revoke update … from authenticated` + `grant update (display_name)` → **해소**, booking-tracker FR-010/SC-007 보호 복구 |
| G2 (Important/보안) | anon 전 컬럼 grant로 `author_id`(auth.users UUID) 수집 가능 → 공개 6컬럼 grant로 축소 → **해소** |
| G3 (Important/배포) | 중복행 정리 없음 + 멱등성 없음 → 운영 DB 중복 시 마이그레이션 전체 실패 → `delete … using` 선행 + `if not exists`/`drop policy if exists` → **해소** |
| G4 (Important/테스트) | `security.spec.ts:36`의 잔존 정규식이 이제 렌더되지 않는 문구를 찾아 Supabase 연결 시 실패 예정(공개화 설계와 모순되는 초록 테스트) → 정규식 교체 → **해소** |
| Act-1 후 재계산 | Behavioral 83 → **100**, Intent 92 → **96** → 가중 **98%** · 게이트 95 **통과**. 설계 항목 대조는 99%(47.5/48) 유지 — 잔여 부분 충족은 G6(문서 표기) 1건 |
| 런타임 | `vitest run tests/unit/journal.test.ts` 15/15 pass · `tsc` journal 오류 0건 |
| G5~G9 | Minor/Info 5건은 Act 범위 밖, 아래 후속 항목으로 이관 |

## 후속·미검증 항목

1. **Supabase 연결 후 필수 확인(보안 회귀)** — 마이그레이션 적용 뒤 실계정으로 ① `PATCH /rest/v1/team_members?email=eq.<본인>` `{"role":"leader"}`가 **거부**되는지 ② anon 키로 `GET /rest/v1/journal_entries?select=author_id`가 **거부**되는지 각각 1회 확인한다. G1·G2 해소는 정적 판독 + 마이그레이션 텍스트 단언 기반이다.
2. **Supabase 연결 후 기능 확인** — anon select 실동작, 중복 작성 시 `23505` → `DUPLICATE_MESSAGE` 노출, 공개 버킷 이미지 read, 그리고 **표시명 미설정 → 설정 → 작성** 전체 플로우(로그인 세션 필요)를 검증한다.
3. **`next build` 미실행** — Plan §5-6이 부분 충족 상태다. booking-tracker 범위의 타입 오류 2건(`Lodging` 타입 중복 정의 / `address` 옵셔널 불일치)이 해소된 뒤 통합 빌드를 실행해 마감한다.
4. **E2E 미실행** — `tests/e2e/security.spec.ts`(Playwright 미구동). G4의 정규식 교체가 실제 렌더 문구와 맞는지는 정적 대조로만 확정했다. Supabase 연결 환경에서 journal 3케이스를 실행해야 한다.
5. **G5 (Minor/UX)** — 로그인한 팀원에게도 `JournalAccessNote`가 "기록 작성은 팀원 로그인(매직 링크) 후 가능합니다"를 그대로 노출한다(`JournalAccessNote.tsx:9-12` member 분기). "기록은 표시명으로만 공개됩니다" 등으로 분리 권장.
6. **G6 (Minor/문서)** — 설계 §3은 `listEntries`가 `journalConfigured=false`를 반환한다고 적었으나 구현은 `[]`만 반환하고 미설정 안내는 `getMemberProfile`/`countEntriesByDay`가 담당한다. 동작은 동일하므로 **설계 문구를 실제 시그니처에 맞춰 정정**한다(코드 변경 불요). 이 1건이 설계 항목 대조의 유일한 부분 충족(47.5/48)이다.
7. **G7 (Minor)** — `validateDisplayName`이 `\s{2,}`만 접어서 개행·탭 자체는 통과한다(`"a\nb"` 허용). 타임라인 라벨이 줄바꿈될 수 있으므로 `replace(/\s+/g, " ")`로 변경 권장.
8. **G8 (Minor)** — `DisplayNameForm`의 `current` prop이 항상 `null`로 전달되는 죽은 인자다. 표시명 설정 후 **변경할 경로가 없다**. 표시명 변경 UI는 설계 범위 밖이었으므로 별도 사이클에서 다룬다.
9. **G9 (Info/개인정보)** — 공개 버킷 이미지 public URL 경로가 `{auth.uid()}/{uuid}.ext`라 URL에 작성자 UUID가 남는다(G2와 동일 성격). `{dayId}/{uuid}` 또는 난수 폴더로 변경을 검토한다. 변경 시 기존 업로드 경로 마이그레이션이 필요하다.
10. **운영 절차 문서화** — `role`·`enabled` 변경이 service role 전용이 되었으므로, 팀원 추가·리더 지정 절차를 Supabase SQL editor 기준으로 운영 문서에 정리해야 한다(현재는 마이그레이션 주석 `:14-16`에만 존재).
