# Analysis — trip-journal

> feature: trip-journal · Check 단계 · gap-detector 실행 2026-09-16
> Design: `docs/02-design/trip-journal.design.md` · 게이트 95

## 결과
| 항목 | 값 |
|---|---|
| Match rate (1차, 정적) | **99%** (59 matched + 1 partial × 0.5) / 60 |
| 게이트 | 통과 |
| 유출 경로 점검 | 비팀원에게 기록·signed URL 노출 경로 0건 (페이지 member 가드 + listEntries 재검증 + RLS + anon revoke + SW `/journal` bypass + 교차 출처 SW 미개입) |
| Storage 정책 | 본인 폴더 업로드·팀원 읽기·버킷 10MB/MIME 3종 — 설계와 일치 |

## 검증 근거
- `vitest run` 53 → 54/54 (journal 6), `tsc` 0 오류, `next build` 성공
- E2E security.spec: 방문자 `/journal/d2027-08-04` → 로그인/비활성 안내, `<textarea name="text">` 0개

## 지적과 조치
| # | 심각도 | 지적 | 조치 |
|---|---|---|---|
| G1 | Low/security | 사진 MIME이 클라이언트 신고값 | `sniffImageMime` 매직 바이트 검증(JPEG/PNG/WebP) 추가, 불일치 시 거부 + `journal_upload_rejected` |
| G2 | Low/coverage | 서버 거부·RLS 런타임 미검증(Supabase 미연결) | Report에 수동 재검증 체크리스트 |
| G3 | Low/UX | 콜백 실패가 `/admin`으로 고정 | `next`가 `/journal*`이면 `/journal/login?error=auth` + 오류 안내 |
| G4 | Info/privacy | 로그에 이메일 전체 | local-part만 기록(journal·booking admin 동일) |
| G5 | Info | 0바이트 파일 클라/서버 불일치 | 클라이언트도 size 0 → 사진 없음 |
| G8 | Info/perf | 세션 조회 2회 | `listEntries(dayId, session)` |
| G6·G7 | Info | sw-rules 교차 출처 모델링, `storage.objects.owner` 레거시 | 기록만(삭제 UI 없음, sw.js origin 가드 유지) |
