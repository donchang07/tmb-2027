# Plan — trip-journal (PRD v2.0 개정)

> feature: trip-journal · 순서 9/9 · 의존: booking-tracker · 규모: 중
> 출처: `docs/PRD.md` v2.0 FR-016 · SC-012 · S7 · 8.8 · NFR 개인정보 · 11.2 #1(공개 버킷)·#2 · N-008, N-011 · 부록 A-4 JournalEntry/TeamMember.displayName
> 이전 사이클: `docs/archive/2026-09-v2/trip-journal/`
> 작성일: 2026-09-17 · 상태: approved (L4 auto)

## Executive Summary
| 관점 | 내용 |
|---|---|
| Problem | v2.0은 여행 기록을 모든 방문자에게 공개(N-008)하고, 팀원 1인당 Day별 1건(N-011), 작성자는 이메일이 아닌 표시명으로 노출하도록 바꿨다. 현재는 팀원만 열람, 사진 버킷 비공개, 이메일 앞부분을 작성자 라벨로 쓰며 Day당 다건이 가능하다. |
| Solution | 마이그레이션으로 anon 읽기 정책·공개 버킷·`(day_id, author_id)` 유니크·`team_members.display_name`을 추가한다. 목록은 비로그인도 조회하고, 작성 폼은 팀원만, 표시명은 팀원이 직접 설정한다. |
| Function UX Effect | 가족·지인도 링크로 Day 타임라인과 사진을 보고, 작성자는 표시명으로만 보인다. |
| Core Value | 팀 기록 공유(S7). |

## Context Anchor
| Key | Value |
|---|---|
| WHY | 가족·지인 열람 등급 없음(N-001)·기록 공개(N-008) |
| WHO | 팀원(작성), 방문자(열람) |
| RISK | 이메일 노출 금지(NFR). 공개 버킷은 URL을 아는 누구나 접근 가능 → PRD가 공개 버킷을 확정 |
| SUCCESS | anon 조회 정책, 1일 1건 제약, displayName만 공개, 미설정 시 안내 |
| SCOPE | 마이그레이션·journal lib·페이지·폼·테스트 |

## 2. 요구사항
| ID | 요구 | 검증 |
|---|---|---|
| FR-016 | 팀원 Day별 사진 1장·200자 기록 1건, 모든 방문자 열람 | SQL 텍스트·규칙 단위·렌더 |
| SC-012 | 비허용 입력 거부, 비로그인 열람 가능 | 단위·E2E(미설정 렌더) |
| NFR | 이메일 미노출, 표시명 공개 | 단위(`authorLabel`이 이메일 형식 아님) |

## 3. 범위
### In
- `supabase/migrations/20260917000004_journal_public.sql`
- `src/lib/journal.ts`(공개 listEntries, displayName, 1건 제한 오류 메시지), `src/lib/journal-rules.ts`(`authorLabelFrom` → displayName 규칙: 1~20자, 이메일 형식 금지)
- `src/app/journal/{page,[dayId]/page}.tsx`(비로그인 열람), `src/app/journal/actions.ts`(`setDisplayNameAction`), `src/components/journal/{JournalForm,JournalTimeline,JournalAccessNote,DisplayNameForm}.tsx`
- `src/app/day/[dayId]/page.tsx` 링크 문구 "팀 기록 보기"
- `tests/unit/journal.test.ts`, `tests/e2e/security.spec.ts`(journal HTML에 이메일 없음)
### Out
- 사진 편집·삭제 UI 확장

## 4. 결정
- 공개 읽기: `journal_entries` select policy `to anon, authenticated using (true)` + `grant select to anon`. 버킷 `journal-photos` `public = true` + anon select 정책. 이미지 URL은 public URL.
- 표시명: `team_members.display_name text check (1..20)`; 본인 행만 update 가능한 RLS(`email = jwt_email()`), 컬럼 제한은 서버 액션에서 display_name만 갱신. 미설정 시 작성 폼 대신 "표시명을 먼저 설정하세요".
- 1일 1건: `unique (day_id, author_id)`; 위반 시 "이 Day에는 이미 기록을 남겼습니다"(`journal_upload_rejected` warn).
- `author_label`은 저장 시 display_name 복사(기존 컬럼 재사용).

## 5. 성공 기준
1. SQL 텍스트: anon select 정책, `public = true` 버킷 갱신, `unique (day_id, author_id)`, `display_name`
2. `listEntries`가 세션 없이도 조회(미설정 시 `[]` + 안내), 반환 객체에 email 없음
3. `validateDisplayName`: 1~20자, `@` 포함 거부; `authorLabel`은 displayName
4. 중복 저장 시 오류 메시지 문자열
5. `/journal/d2027-08-05` 비로그인 렌더에 "팀원 로그인" 강제 없이 타임라인(빈 상태 안내) 표시, 폼은 미표시
6. `tsc`, `vitest`, `next build`
