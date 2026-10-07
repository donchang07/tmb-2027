# TMB 2027 QA 테스트 계획서

- 대상: PRODUCTION `https://utmb2027.vercel.app` (Next.js 15 App Router + Supabase + Vercel)
- 기준 문서: `docs/PRD.md` v4.1 (2026-10-07), 보조 `docs/03-analysis/prd-code-sync.analysis.md`
- 작성: 독립 QA (소스·기존 테스트·PRD 무수정)
- 실행 일자: 2026-10-07

## 1. 범위

| 구분 | 내용 |
|---|---|
| 포함 | SCR-001~018 전 화면의 공개 열람, 이메일·비밀번호 로그인/회원가입/로그아웃, 역할별 접근 제어(5.1), 준비물 사용자별 저장·격리(FR-022~024), 관리자 예약·숙박 편집(FR-010), 팀원 기록(FR-016), 세션 만료·오프라인·네트워크 오류, 모바일(360)·데스크톱(1440) 반응형·접근성 |
| 제외 | 실제 이메일 발송(리더·팀원 magic link 폼은 존재·클라이언트 검증만, 제출 안 함), 결제(해당 없음), 복구 불가능한 프로덕션 데이터 변경, Lighthouse 성능 측정, GitHub/Vercel 설정(FR-025·026·028 일부) |
| 차단 대상 | 유효한 PKCE code가 필요한 콜백 성공 경로(SYNC-01) — 이메일 발송 없이 얻을 수 없음 |

## 2. 역할 (PRD 5.1)

| 역할 | 시험 방법 |
|---|---|
| 비로그인 | 쿠키 없는 새 브라우저 컨텍스트 |
| 일반 사용자 | E2E_USER_A/B 계정 (team_members 미등록) |
| 팀원 | E2E_MEMBER_1~3 계정 (team_members enabled, role=member) |
| 관리자(리더) | `ADMIN_EMAIL` 계정 — 이메일 발송 없이 세션 주입(아래 4절) |

## 3. 환경

- 도구: Playwright 1.63 (Chromium), `--workers=1`, 전부 headless, retries 0
- 프로젝트: `mobile-360`(Pixel 5, 360×640), `desktop-1440`(1440×900)
- 대상 URL: `PLAYWRIGHT_BASE_URL` 미지정 시 `https://utmb2027.vercel.app`, 로컬 서버 없음(webServer 없음)
- 설정: `playwright.qa.config.ts` (testMatch `qa-*.spec.ts`, 산출물 `qa/traces`, `qa/results.json`, `qa/html-report`)

## 4. 계정·세션 전략 (비밀값 미기재)

- 일반 사용자·팀원: `.env.test.local`의 `E2E_*` 값으로 Node에서 `signInWithPassword`로 세션을 얻고, 쿠키로 주입한다. 로그인 UI 자체는 TC-P0-01·TC-P1-06·TC-P1-10에서 실제 폼으로 검증한다(Supabase 인증 레이트 리밋 절약).
- 관리자: `.env.local`의 `ADMIN_EMAIL`로 service 클라이언트 `auth.admin.generateLink({type:"magiclink"})`의 `hashed_token`만 받고, anon 클라이언트 `auth.verifyOtp({token_hash,type:"magiclink"})`로 세션을 교환한다. 이메일 발송·`signInWithOtp` 호출·magic link 폼 제출 없음(owner 결정 "validation 생략").
- 쿠키 주입: `@supabase/ssr@0.12.7` 규칙 — 이름 `sb-<project-ref>-auth-token`, 값 `"base64-" + base64url(JSON(session))`, `encodeURIComponent` 길이가 3180을 넘으면 `.0/.1` 청크.
- 비밀번호·키·토큰은 콘솔·파일·보고서에 출력하지 않는다. 구현: `tests/e2e/qa-support/{env,supabase,cookies,fixtures,baseline,ui}.ts`.

## 5. 프로덕션 데이터 보호

- 첫 실행 시 `qa/baseline-snapshot.json`에 기준선(준비물 A/B 행, bookings 14행, lodgings, journal id, team_members 표시명)을 저장한다(관리자 이메일은 `__ADMIN__`로 마스킹).
- 데이터를 바꾸는 테스트는 `finally`/`afterEach`/`afterAll`에서 `restoreBaseline()`으로 되돌린다: 준비물 행 재삽입, bookings·lodgings 값 복원, 테스트가 만든 `journal_entries` 삭제, `qa-` 접두 가입 계정을 `auth.admin.deleteUser`로 삭제.
- 복원할 수 없는 값: 트리거가 관리하는 `version`·`updated_at`·`updated_by`(편집한 숙박의 version 증가, updated_by는 service 복원 시 null). TC-EX-99가 정리 결과를 검증한다.

## 6. 진입·종료 기준

| 구분 | 기준 |
|---|---|
| 진입 | 프로덕션 HTTP 200, `.env.test.local`·`.env.local` 존재, 시드 계정 로그인 가능, 관리자 세션 교환 성공 |
| 종료 | P0 5건 모두 두 프로젝트에서 실행 완료, P1·탐색 전부 실행, 정리 검증(TC-EX-99) 통과, 보고서 작성 |
| 배포 판정 | READY: P0 전부 통과 / CONDITIONALLY READY: 핵심 통과 + 경미한 결함 / NOT READY: 로그인·권한·핵심 저장·핵심 업무 실패 |

## 7. P0 선정 근거

| P0 | 선정 이유 | PRD 근거 |
|---|---|---|
| TC-P0-01 로그인·로그아웃·오류 | 모든 개인 데이터와 권한의 입구. 실패 시 이후 기능 전체 무의미 | SCR-015·018, FR-019~021·029 |
| TC-P0-02 역할별 접근 권한 | 예약번호·비공개 메모 유출은 가장 큰 보안 위험(SC-007) | 5.1, SCR-007·008·011, SC-007·020, SYNC-02·04 |
| TC-P0-03 준비물 사용자별 저장·격리 | v4.0의 핵심 신규 가치(계정별 데이터), RLS 격리 검증 | SCR-009, FR-022~024, SC-017~020 |
| TC-P0-04 관리자 예약 상태·숙박 저장 | 리더의 유일한 쓰기 업무, 공개 반영·비공개 보호·복원까지 한 흐름 | SCR-008·003, FR-010, SC-004·007 |
| TC-P0-05 핵심 조회 업무 | 방문자 대부분의 사용 경로(홈→일정→Day→이동일), 합계 163.0 km·9,750 m·9,725 m 검증 | SCR-001~004, FR-001~005·008, SC-001·002·008 |

## 8. 위험

| 위험 | 대응 |
|---|---|
| Supabase 인증 레이트 리밋(동시 로그인 시 실패) | workers=1, 세션 캐시·쿠키 주입, UI 로그인 최소화 |
| 프로덕션 데이터 오염 | 6절 기준선·복원, 실행 후 TC-EX-99 검증 |
| 서비스 워커가 `page.route`를 우회 | 요청 모의는 `context.route` 사용 |
| 외부 이미지·서드파티 요청 실패로 인한 거짓 실패 | 진단 수집기가 실패 요청을 첨부하고 P0는 예상 밖 오류만 단언 |
| PRD 모호·상충 | 임의 해석 금지, 보고서 10절에 분류해 기록 |

## 9. 산출물과 실행 명령

| 산출물 | 위치 |
|---|---|
| 테스트 케이스 | `qa/test-cases.md` |
| 보고서 | `qa/test-report.md` |
| 화면 캡처(P0 핵심 시점) | `qa/screenshots/<케이스ID>-<설명>__<project>.png` |
| trace·video·실패 캡처 | `qa/traces/`, `qa/html-report/`, `qa/results.json` |

```bash
# 전체(두 프로젝트, headless, workers=1)
npx playwright test -c playwright.qa.config.ts

# P0만
npx playwright test -c playwright.qa.config.ts tests/e2e/qa-p0.spec.ts --workers=1
# P1 / 탐색
npx playwright test -c playwright.qa.config.ts tests/e2e/qa-p1.spec.ts --workers=1
npx playwright test -c playwright.qa.config.ts tests/e2e/qa-explore.spec.ts --workers=1
# 단일 프로젝트
npx playwright test -c playwright.qa.config.ts --project=mobile-360
# 리포트 열기
npx playwright show-report qa/html-report
```

## 10. 2차 실행 (2026-10-07, headed)

- 목적: 1차 결함(F-1 관리자 저장 네트워크 실패, F-2 soft 404) 수정 배포 후 전 케이스를 브라우저 화면이 보이는 상태(`--headed`)로 재검증.
- 케이스·코드: 1차와 동일(`tests/e2e/qa-p0.spec.ts`·`qa-p1.spec.ts`·`qa-explore.spec.ts`, 71케이스 × 2프로젝트). 단언 변경 없음.
- 실행 주체 분리:
  - 인증 불필요 26케이스(TC-P1-01·02·07·08·09·12·31·50·52·52b·53·54·55, TC-EX-01~13): QA가 headed로 실행. `QA_PUBLIC_ONLY=1`이면 기준선 캡처·복원(service_role 사용)을 건너뛴다(`tests/e2e/qa-support/baseline.ts`).
  - 인증 필요 32케이스(P0 5건 포함): 운영 URL에 테스트 계정 비밀번호로 로그인하거나 service_role로 관리자 세션을 만들기 때문에, QA 에이전트는 실행하지 않고 사용자가 아래 명령으로 실행한다.
- 기준선: 1차 기준선(14:13 캡처)은 `qa/prev-run-1619/`로 옮겼다. 2차 인증 실행의 첫 `beforeAll`이 현재 운영 데이터로 새 기준선을 캡처하고, 종료 시 그 값으로 복원한다(1차 이후 리더가 바꾼 값을 옛 기준선으로 되돌리지 않기 위함).
- 산출물: 공개 실행 `qa/results-public.json`·`qa/run-public.log`·`qa/html-report-public/`, 인증 실행 `qa/results.json`·`qa/html-report/`, 실패 증거 `qa/traces/`(screenshot·video·trace), P0 시점 캡처 `qa/screenshots/`.
