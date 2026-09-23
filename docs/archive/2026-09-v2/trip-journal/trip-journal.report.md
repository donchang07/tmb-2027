# Report — trip-journal

> feature: trip-journal (8/8) · 완료일 2026-09-16 · 최종 match rate **99%** (게이트 95 통과)
> Plan `docs/01-plan/trip-journal.plan.md` · Design `docs/02-design/trip-journal.design.md` · Analysis `docs/03-analysis/trip-journal.analysis.md`

## 요약
팀원(`team_members` allowlist, magic link `shouldCreateUser: false`)이 `/journal/[dayId]`에서 사진 1장(JPG/PNG/WebP ≤ 10MB, 매직 바이트 검증)과 200자 기록을 저장·열람한다. `journal_entries` RLS와 private Storage 버킷(`journal-photos`, 본인 폴더 업로드·팀원 읽기·1시간 signed URL)로 팀원 외 접근을 차단한다. 작성자는 이메일 local-part로만 표시한다.

## FR/SC
| ID | 상태 | 근거 |
|---|---|---|
| FR-016 | 완료(정적) | 스키마·검증 unit, RLS/Storage 정책, member 가드 |
| SC-012 | 부분(런타임 미검증) | 200자·10MB·MIME 경계 unit 통과; 실제 업로드 거부는 Supabase 연결 후 재검증 |
| S7 | 완료 | Day 상세 → 팀 기록 → 폼 → 타임라인 |

## 산출물
- `supabase/migrations/20260916000002_journal.sql`
- `src/lib/{journal-rules,journal}.ts`, `src/app/journal/{page,actions}.tsx|ts`, `src/app/journal/login/page.tsx`, `src/app/journal/[dayId]/page.tsx`
- `src/components/journal/{TeamLoginForm,JournalForm,JournalTimeline,JournalAccessNote}.tsx`
- `src/app/auth/callback/route.ts`(journal fallback), `src/middleware.ts`, `next.config.ts`(bodySizeLimit 11mb), `sw-rules.ts`/`sw.js`(`/journal` bypass)
- `tests/unit/journal.test.ts`, `tests/e2e/security.spec.ts`(+journal)

## Supabase 연결 후 재검증 체크리스트
1. 마이그레이션 2개 적용 후 Storage에 `journal-photos` private 버킷(10MB, 3 MIME) 확인
2. Supabase Auth에서 팀원 초대 → `insert into team_members(email, role) values ('<member>', 'member')`
3. 팀원 로그인 → 사진+200자 저장 → 타임라인 표시(signed URL)
4. 거부: 201자 / 11MB / GIF / 확장자 위조(gif→.jpg) 모두 저장 안 됨
5. 비팀원 계정 → “이 정보에 접근할 수 없습니다”, REST로 `journal_entries` 조회 0행

## 결정
- 팀원 계정은 리더가 초대(무단 가입 방지), 공개 타임라인 없음(팀원 전용)
- 사진 리사이즈·수정·댓글은 범위 외
