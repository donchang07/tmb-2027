# Plan — trip-journal

> feature: trip-journal · 순서 8/8 · 의존: booking-tracker · 규모: 중
> 출처: `docs/PRD.md` S7, FR-016, SC-012, 8.8 기록, 5.x 용량·한도, 11.2 #2 (allowlist 팀원 magic link), 부록 A-4 JournalEntry/TeamMember
> 작성일: 2026-09-16 · 상태: approved (L4 auto)

## 1. 목표
인증된 팀원이 Day별 사진 1장(JPG/PNG/WebP ≤ 10MB)과 200자 이하 기록을 저장·열람하고, 비허용 입력은 저장되지 않는다.

## 2. 포함 요구사항
| FR | 요약 | 검증 |
|---|---|---|
| FR-016 | 팀원: Day별 사진 1장 + 200자 기록 저장·열람 | 형식·용량·글자수·권한 테스트 |

SC-012: 허용 형식·용량·글자수만 저장, 비허용 입력 거부.

## 3. 범위
### In
- 마이그레이션 `20260916000002_journal.sql`: `journal_entries`(A-4) + RLS(팀원 `is_team_member()` 읽기/쓰기, 삭제는 본인) + Storage 버킷 `journal-photos`(private, 10MB, jpeg/png/webp) + 스토리지 정책(본인 폴더 업로드, 팀원 읽기)
- 인증: 팀원 allowlist(`team_members`, booking-tracker에서 생성) + magic link(`shouldCreateUser: false` — 리더가 Supabase에서 사용자 초대)
- 서버 `src/lib/journal.ts`: 입력 스키마(200자), 사진 검증(형식·10MB), 세션 판정(member/forbidden/anonymous/unconfigured), 목록(signed URL), 생성(업로드 → insert)
- 화면: `/journal`(12 Day 목록 + 상태), `/journal/login`, `/journal/[dayId]`(타임라인 + 작성 폼), Day 상세에 “팀 기록” 링크
- Edge Case: 사진 형식·용량 초과 → “JPG·PNG·WebP 10MB 이하만 가능합니다” + `journal_upload_rejected` warn; 인증 없음 → 로그인 안내; 권한 없음 → “이 정보에 접근할 수 없습니다”; Supabase 미설정 → 비활성 안내
- `next.config.ts` Server Action body 한도 11MB
### Out
- 댓글·좋아요·수정, 공개 타임라인(팀원 전용), 이미지 리사이즈

## 4. 결정
- 작성자 표시는 이메일 local-part(`author_label`) — 팀원 전용 화면이므로 실명·이메일 전체는 저장·노출하지 않음(개인정보 NFR)
- 사진은 private 버킷 + 1시간 signed URL (공개 URL 없음)
- 팀원 계정은 리더가 Supabase Auth에서 초대(`shouldCreateUser: false`) → 무단 가입 방지

## 5. 성공 기준
1. unit: 200자 경계, 10MB 경계, 허용 MIME 3종, 마이그레이션에 RLS·버킷 제한·정책 존재
2. build 성공, 방문자 `/journal/[dayId]` → 로그인 안내(E2E), HTML에 private 내용 없음
3. Supabase 연결 후: 팀원 업로드·열람, 비팀원 403 동작(수동 재검증 목록 Report에 기재)
