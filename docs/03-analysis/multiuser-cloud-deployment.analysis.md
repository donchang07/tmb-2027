# multiuser-cloud-deployment Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation) + Runtime Verification (v2.3.0)
>
> **Project**: tmb-2027
> **Version**: 0.1.0 (PRD v4.0 델타)
> **Analyst**: Claude (PDCA Check·Act)
> **Date**: 2026-09-23
> **Design Doc**: [multiuser-cloud-deployment.design.md](../02-design/multiuser-cloud-deployment.design.md)
> **Plan**: [multiuser-cloud-deployment.plan.md](../01-plan/multiuser-cloud-deployment.plan.md) · **PRD**: [multiuser-cloud-deployment.prd.md](../00-pm/multiuser-cloud-deployment.prd.md)
> **게이트**: `bkit.config.json` matchRateThreshold 95 · maxIterations 5

### Pipeline References (for verification)

| Phase | Document | Verification Target |
|-------|----------|---------------------|
| PM | `docs/00-pm/multiuser-cloud-deployment.prd.md` | FR-019~030, SC-016~024, SCR-015~018 |
| Plan | `docs/01-plan/multiuser-cloud-deployment.plan.md` §3·§4 | FR 표, Success Criteria, Quality Criteria |
| Design | `docs/02-design/multiuser-cloud-deployment.design.md` §3~§12 | 구조·계약·UI 체크리스트·테스트 계획 |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | localhost 전용·기기 전용 저장으로는 팀이 실제로 쓸 수 없다. 인터넷 배포와 계정별 개인 데이터가 필요하다(PRD 0장, S9~S13). |
| **WHO** | 리더 1명(`ADMIN_EMAIL`), 팀원 9명(`team_members`), 계정 사용자(누구나 가입, 자기 준비물만), 비로그인 방문자. |
| **RISK** | ① 타 사용자 데이터 노출(RLS 누락) ② 비밀값 공개 커밋 ③ 인증 도입으로 공개 화면·오프라인 회귀 ④ `team_members` 이메일 선점 ⑤ SW가 사용자별 응답을 캐시 |
| **SUCCESS** | SC-016~024 통과 + SC-001~015 회귀 유지(`npm test` ≥ 126, Playwright ≥ 111), 라우트 ○/ƒ diff 0, 비밀값 0, Vercel Ready, match rate ≥ 95 |
| **SCOPE** | module-1 인증 → module-2 사용자별 데이터 → module-3 SW·middleware → module-4 저장소·배포 → module-5 테스트·회귀 |

---

## 결과 요약 (최종: Act-1 이후)

| 축 | Check(반복 0) | Act-1 | 가중치 |
|---|:---:|:---:|:---:|
| Structural | 100% | **100%** | 0.15 |
| Functional | 97.6% | **100%** | 0.25 |
| Contract | 87.5% | **100%** | 0.25 |
| Runtime | 73.3% | **100%** | 0.35 |
| **Overall** | **86.9% (FAIL)** | **100% (PASS)** | — |

- 게이트 산정 범위: 저장소 안에서 검증 가능한 항목. 작성자 지시 대기 중인 **외부 작업**(GitHub 저장소 생성·push, Vercel 배포, production 스모크)은 분모에서 제외하고 §2.9에 따로 적었다.
- 참고 수치(외부 대기 항목을 미충족으로 포함): Functional 96.4% · Runtime 97.7% → Overall **98.3%**. 이 기준으로도 게이트 95를 넘는다.
- Critical 1건(계정 모드 미인식)을 Act-1에서 수정. 남은 Critical·Important 0건, Minor 1건(§3.2).

---

## Strategic Alignment Check

### PRD Alignment

| PRD Element | Expected | Implementation Status |
|-------------|----------|:---------------------:|
| Core Problem (WHY) | 팀이 인터넷 주소로 접속해 계정별로 준비물을 관리 | ✅ Addressed (로컬 프로덕션 빌드 + 원격 Supabase에서 두 계정 격리 검증. 인터넷 배포는 외부 대기) |
| Target User (WHO) | 리더·팀원·계정 사용자·비로그인 방문자 | ✅ Addressed (비로그인 공개 화면 회귀 0, 팀원 이메일 가입 차단, 계정 사용자 준비물 서버 저장) |
| Value Proposition | 공개 일정은 그대로, 개인 준비 상태는 계정별로 안전하게 분리 | ✅ Delivered (RLS 4정책 + 두 context E2E, 회귀 141건 통과) |

### Success Criteria Status

| # | Criteria (Plan §4.1) | Status | Evidence |
|---|---------------------|:------:|----------|
| SC-016 | 새 이메일 가입 → 즉시 로그인·`next` 이동·SCR-018 이메일, 재가입 거부, 재로그인 성공 | ✅ | `tests/e2e/auth.spec.ts:177` "signup logs in immediately…(SC-016)" 통과(원격 auth 설정 적용 후). 중복 거부 로그 `auth_signup_failed reason=duplicate` |
| SC-017 | 두 브라우저 동시 로그인 시 각자 이메일만, 한쪽 로그아웃 무영향 | ✅ | `multiuser.spec.ts:66`, `:109` 통과 |
| SC-018 | A 3개·B 5개 → reload 후 각자 것만, DB `checked=true` A 3·B 5 | ✅ | `multiuser.spec.ts:66` (UI 3/34·5/34 + 각자 JWT 조회) 통과 |
| SC-019 | A 세션으로 B 행 select/update/delete = 0행, B 불변 | ✅ | `multiuser.spec.ts:88` 통과 |
| SC-020 | anon 0행/거부, `team_members` 이메일 가입 거부, 로그아웃 후 Cache Storage 0건 | ✅ | `multiuser.spec.ts:88`(anon), `auth.spec.ts:212`(팀원 이메일, 422→동일 문구), `multiuser.spec.ts:129`(캐시·계정 키 0). Hook 403 경로는 원격에서 작성자 측 검증 완료 + `tests/unit/auth-rules.test.ts` 분류 단위 테스트 |
| SC-021 | 새로고침·재시작 후 로그인 유지, 만료 시 `reason=expired` 경유 복귀 | ✅ | `multiuser.spec.ts:109`(storageState 새 context), `auth.spec.ts:261`(clearCookies → EL-05 → 재로그인 → `/budget`) 통과 — Act-1 전에는 실패 |
| SC-022 | typecheck 0, `npm test` ≥126 통과, Playwright `--workers=1` 전체 통과 ≥111 | ✅ | typecheck 0 · vitest 174 pass/1 skip · Playwright 자격 없음 141 pass/36 skip, 자격 포함 153 pass/24 skip, 실패 0 |
| SC-023 | 저장소 커밋 비밀값 0, `.env.example` 값 비어 있음 | ⚠️ | `tests/unit/secrets.test.ts` 통과(작업 트리 기준), `.env.example` 값 전부 빈 값. git 저장소 미생성이라 `git log --all -p` 검사는 **외부 대기** |
| SC-024 | Vercel production Ready, SCR-001·006·009·015 200, 콘솔 오류 0 | ⏸ | 배포 금지 지시 — **외부 대기**. 로컬 프로덕션 빌드(`next build`) 성공으로 대체 확인 |

**Success Rate**: 7/9 충족, 1 부분(SC-023 저장소 이력 검사 대기), 1 외부 대기(SC-024).

회귀 SC-001~015: 기존 5개 E2E 스펙(`day-detail`·`offline`·`packing`·`responsive`·`security`)과 기존 15개 단위 테스트 파일이 **무수정**으로 전부 통과했다. SC-005 axe 검사는 `/login`·`/signup` 3개 뷰포트로 확장되어 통과(`auth.spec.ts:125`).

### Decision Record Verification

| Source | Decision | Followed? | Deviation |
|--------|----------|:---------:|-----------|
| [PRD] D-017 ③ | 팀원 계정 선생성 + Hook 거부 | ✅ | 없음(원격 Hook 활성 확인) |
| [PRD] D-018 ② | react-query 로컬 provider, 계정 준비물은 브라우저 조회 | ✅ | 없음 |
| [Plan] Option C | Server Action + 브라우저 세션 스토어, 레이아웃 쿠키 미사용 | ✅ | 없음(`/packing`·`/map`·`/offline` ○ 유지) |
| [Design] §4.2-5 | 로그인·가입 성공 시 서버 `redirect()` 대신 클라이언트 전체 이동 | ✅ (Act-1) | Check 시점엔 `/login`·`/signup` 페이지의 `redirectIfSignedIn`이 액션 재렌더 중 소프트 리다이렉트를 일으켜 설계를 우회 → Act-1에서 수정 |
| [Design] §5.3.1 | `useSyncExternalStore` 세션 스토어, `useEffect` 조회 금지 | ✅ | 없음 |

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Do 완료 후 설계 대비 구현 격차와 실제 런타임(원격 Supabase `utmb2027`, 마이그레이션 6개·합성 데이터 적용 상태)에서의 동작을 확인하고, 95% 게이트를 통과할 때까지 Act를 반복한다.

### 1.2 Analysis Scope

- 코드: `src/app/{login,signup,packing,auth}/**`, `src/components/{auth,layout,packing}/**`, `src/lib/{auth-rules,auth-client,packing-sync,packing-store,safe-next,sw-rules,log}.ts`, `src/lib/supabase/*`, `src/middleware.ts`, `public/sw.js`, `supabase/migrations/20260923000005~6`, `supabase/config.toml`, `scripts/seed-synthetic.mjs`
- 테스트: `tests/unit/*`(20 파일), `tests/e2e/*`(7 스펙)
- 제외: GitHub·Vercel 원격 작업(작성자 지시 대기)

---

## 2. Gap Analysis (Design vs Implementation)

### 2.1 설계 절별 대조

| Design § | 요구 | 구현 근거 | Check | Act-1 |
|---|---|---|:---:|:---:|
| §3.1 | 타입·저장 키(ACCOUNT_COPY/QUEUE/MIGRATED 접두어, `AuthView`, `LAST_UID_KEY`) | `src/lib/packing-sync.ts`, `src/lib/auth-client.ts:12~20` | ✅ | ✅ |
| §3.3 000005 | `packing_checks` 컬럼·PK·RLS 4정책·anon revoke·`upsert_packing_checks` security invoker | `supabase/migrations/20260923000005_packing_checks.sql`, `tests/unit/migrations-v4.test.ts` 통과, 원격 적용 | ✅ | ✅ |
| §3.3 000006 | `hook_before_user_created` 403, 권한 grant/revoke | `20260923000006_signup_guard_hook.sql`, `migrations-v4.test.ts` 통과, 원격 Hook 활성 | ✅ | ✅ |
| §4.1 | 엔드포인트 8종 | §2.6 표 | ⚠️ | ✅ |
| §4.2 | 스키마·오류 분류·문구, 액션 절차 | `src/lib/auth-rules.ts`, `src/app/login/actions.ts`, `src/app/packing/actions.ts` | ⚠️ | ✅ |
| §4.3 | `safeNext` 강화 벡터 | `src/lib/safe-next.ts`, `auth-rules.test.ts` 통과, E2E FR-021 통과 | ✅ | ✅ |
| §4.4 | 콜백 3분기·`auth_callback_failed`·배너 문장 | `src/app/auth/callback/route.ts:12~15`, `admin/page.tsx:23`, `journal/login/page.tsx:18`, `auth.spec.ts` SCR-017 통과 | ✅ | ✅ |
| §4.5 | middleware matcher 7개, 리더 `/day` `x-tmb-user-scoped` | `src/middleware.ts` | ✅ | ✅ |
| §4.6 | `requestOrigin`·`originFromHeaders` | `src/lib/supabase/server.ts`, `admin/actions.ts:24`, `journal/actions.ts:19` | ✅ | ✅ |
| §5.3.1 | 세션 스토어·전이·캐시 삭제·`prepareSignOut` | `src/lib/auth-client.ts` | ✅ | ✅ |
| §5.3.2 | AccountMenu 상태 5종, 관리자 링크, 로그아웃 폼 | `src/components/layout/AccountMenu.tsx`, `SignOutButton.tsx:18~33` | ⚠️(런타임에서 user 상태 미표시) | ✅ |
| §5.3.3 | PackingList 계정 모드·병합·대기열·EL-10~13 | `src/components/packing/PackingList.tsx:53~400` | ⚠️(계정 모드 미진입) | ✅ |
| §5.3.4 | 순수 함수 표 | `packing-sync.ts`, `tests/unit/packing-sync.test.ts` 통과 | ✅ | ✅ |
| §5.4 | 페이지 UI 체크리스트 30항목 | §2.5 | ⚠️ | ✅ |
| §6 | 오류 코드·문구·로그 코드 | `auth-rules.ts:70~101`, `src/lib/log.ts:22~33` | ✅ | ✅ |
| §7 | 보안 체크리스트 | RLS·Hook·service_role 미사용·safeNext·로그 해시 | ✅ | ✅ |
| §7.1 | SW v3, network-only·network-first·`clear_pages`·user-scoped 미캐시 | `public/sw.js:3~49,183,304`, `src/lib/sw-rules.ts`, `sw-rules-v4.test.ts` 통과 | ✅ | ✅ |
| §7.2 | `.gitignore`·`.env.example` | 두 파일 설계 블록과 일치, `secrets.test.ts` 통과 | ✅ | ✅ |
| §8 | L1·L2·L3 테스트 파일·시나리오 | §2.7 | ✅(존재) | ✅ |
| §8.5 | 합성 seed 스크립트(멱등·VERCEL/CI 차단·비밀 미출력) | `scripts/seed-synthetic.mjs:14~15`, 원격 데이터 6 users·team_members 4·packing 8·journal 3 | ✅ | ✅ |
| §9·§10 | 레이어·규칙(`any` 0, 주석 없음, `use client` 경계) | 도메인 모듈에 react/next import 없음, typecheck 0 | ✅ | ✅ |
| §11.1 | 신규 21·수정 23 파일 | 전 파일 존재 확인 | ✅ | ✅ |
| §12.1 | `supabase/config.toml` auth 섹션 | `enable_signup`·`enable_confirmations=false`·`[auth.hook.before_user_created]` | ✅ | ✅ |
| §12.2·§12.3 | 순서 고정 롤아웃·Vercel 환경변수 | 작성자 지시 대기 | ⏸ | ⏸ |

### 2.2 Data Model

`packing_checks`(DATA-018) 컬럼·제약·정책이 설계 SQL과 문자 단위로 일치한다. 해제는 `checked=false` upsert, `least(updated_at, now())`로 미래 시각 차단, 동일 배치 중복 id는 서버 액션이 항목별 최신 1건으로 정규화한다.

### 2.3 Component Structure

설계 §5.3 컴포넌트 11종 모두 지정 위치·Client/Server 구분대로 존재한다. `layout.tsx` 불변, `AppHeader`만 `AccountMenu`를 추가(`AppHeader.tsx:30`).

### 2.4 Functional Depth Analysis

| FR | 요구 | 구현 근거 | Check | Act-1 |
|---|---|---|:---:|:---:|
| FR-019 | 가입 검증·즉시 세션·중복/Hook 동일 문구 | `SignupSchema`, `signUpAction`, `SIGNUP_BLOCKED` | ✅ | ✅ |
| FR-020 | 로그인·세션 유지·로그아웃·자격 오류 단일 문구 | `signInAction`, `auth.spec.ts:205` | ✅ | ✅ |
| FR-021 | 보호 동작 안내·`next` 복귀·강화 safeNext | `safe-next.ts`, `resolvePageNext` | ✅ | ✅ |
| FR-022 | `user_id default auth.uid()`, 소유자 입력 무시 | 000005, `packing/actions.ts:31` `owner_access_denied` | ✅ | ✅ |
| FR-023 | RLS 4정책·anon revoke·service_role 미사용 | 000005, SC-019 E2E | ✅ | ✅ |
| FR-024 | 저장·복원·첫 로그인 병합·오프라인 대기열 | `PackingList.tsx:241~330`, `packing-sync.ts` | ✅(코드) | ✅ |
| FR-025 | `.gitignore`·공개 범위 점검 (저장소 내 부분) | `.gitignore`, `secrets.test.ts` | ✅ | ✅ |
| FR-026 | Vercel 배포·환경변수 | — | ⏸ 외부 | ⏸ 외부 |
| FR-027 | 회귀 0 | 기존 스펙·단위 무수정 통과 | ✅ | ✅ |
| FR-028 | 비밀값 스캔 테스트·`.env.example` 빈 값 | `secrets.test.ts` | ✅ | ✅ |
| FR-029 | 모든 화면 계정 메뉴, 브라우저 세션 읽기, 정적 라우트 보존 | `AccountMenu.tsx`, `auth-client.ts` | ⚠️ 0.5 | ✅ |
| FR-030 | 역할 함수 불변·Hook 거부·선생성 | 000006, `migrations-v4.test.ts`, 원격 Hook | ✅ | ✅ |

### 2.5 Page UI Checklist Verification

| 화면 | 항목 수 | Check | Act-1 | 근거 |
|---|:---:|:---:|:---:|---|
| SCR-015 `/login` | 11 | 11 | 11 | `LoginForm.tsx`, `login/page.tsx`, `auth.spec.ts` SCR-015 L2 4건 |
| SCR-016 `/signup` | 7 | 6.5 | 7 | EL-07 성공 표시가 Check 시점엔 소프트 리다이렉트로 가려짐 → Act-1 후 `auth.spec.ts:177`에서 표시·1초 이동 확인 |
| SCR-018 헤더 | 4 | 4(코드) | 4 | `AccountMenu.tsx`, E2E 계정 버튼·로그아웃·만료 |
| SCR-009 `/packing` 추가분 | 6 | 6(코드) | 6 | EL-02·10~13, `packing.spec.ts` 선택자 불변 |
| SCR-012·SCR-007 | 2 | 2 | 2 | `TeamLoginForm.tsx:24`, 배너 문장 |

**Functional Match Rate**: Check (10.5 + 29.5) / 41 = **97.6%** → Act-1 41/41 = **100%** (FR-026 외부 대기 제외)

### 2.6 API Contract Verification

| # | Endpoint | Design | Server | Client | Check | Act-1 |
|---|----------|--------|--------|--------|:---:|:---:|
| 1 | `signInAction` | 성공 시 `success`+`redirectTo`, 클라이언트가 page 캐시 삭제 후 전체 이동 | `login/actions.ts` | `LoginForm.tsx:28~31` | ⚠️ | ✅ |
| 2 | `signUpAction` | 성공 시 EL-07 → 1초 후 전체 이동 | `login/actions.ts` | `SignupForm.tsx:31~57` | ⚠️ | ✅ |
| 3 | `savePackingChecksAction` | `PackingSyncResult` 판별 유니온, rpc upsert | `packing/actions.ts:31~48` | `PackingList.tsx` `useMutation` | ✅ | ✅ |
| 4 | `fetchPackingChecks` | RLS 본인 행, 무효 id 제거 | `packing-sync.ts` | `useQuery` | ✅ | ✅ |
| 5 | `team_members` self select | 드롭다운 첫 열림 1회 | — | `AccountMenu.tsx` `checkRole` | ✅ | ✅ |
| 6 | `GET /auth/callback` | code 교환·3분기 | `auth/callback/route.ts` | — | ✅ | ✅ |
| 7 | `POST /auth/signout` | 세션 삭제 303 `/` + `auth_logout` | `auth/signout/route.ts:9` | `SignOutButton.tsx` | ✅ | ✅ |
| 8 | `/login`·`/signup` 페이지 | 로그인 상태면 redirect | `login/shared.ts` | — | ✅ | ✅ |

**Contract Failures (Check)**: #1·#2 — 액션이 쿠키를 설정하면 Next가 같은 POST 안에서 현재 페이지를 다시 렌더하고, 그 렌더의 `redirectIfSignedIn()`이 `redirect(next)`를 던져 클라이언트가 **소프트 내비게이션**으로 이동했다. 설계 §4.2-5가 명시적으로 피하려던 경로다. `LoginForm`의 전체 이동·page 캐시 삭제와 `SignupForm`의 EL-07이 실행되지 않았다.

**Contract Match Rate**: Check 7/8 = **87.5%** → Act-1 8/8 = **100%**

### 2.7 Runtime Verification Results

실행 환경: `NEXT_DIST_DIR=.next-e2e next build && next start -p 3100`, 원격 Supabase(마이그레이션 6개·합성 데이터), `--workers=1`.

#### L1: 단위·규칙 (Vitest)

| 실행 | 결과 |
|---|---|
| `npm test` | Test Files 20 passed · Tests **174 passed / 1 skipped** (Check·Act-1 동일) |
| `npm run typecheck` | 오류 0 |

#### L2: UI Action (Playwright, 자격 없이)

| 실행 | Check | Act-1 |
|---|---|---|
| 전체 스위트(`.env.test.local` 없이) | 141 passed / 33 skipped | **141 passed / 36 skipped / 0 failed** (신규 L3 테스트 1건 × 3 프로젝트 skip 증가) |

#### L3: E2E 시나리오 (Playwright, `.env.test.local` 자격)

| # (§8.4) | 시나리오 | Check | Act-1 |
|---|---|:---:|:---:|
| 1·2 | 가입 즉시 로그인·중복 거부·재로그인 (SC-016) | ❌ 원격 Confirm email ON(외부) | ✅ (원격 설정 적용 후) |
| 3 | 잘못된 비밀번호 (FR-020) | ❌ 테스트 선택자(Next route announcer와 `role=alert` 중복) | ✅ |
| 4 | 팀원 이메일 가입 거부 (SC-020·FR-030) | ❌ 선택자 + 원격 Confirm ON에서 `no_session` 문구 | ✅ |
| 5 | 첫 로그인 병합 (FR-024) — 가입 경로 | ❌ 원격 설정(외부) | ✅ |
| 5b | 첫 로그인 병합 — 기존 계정 로그인 경로(Act-1 추가) | — | ✅ |
| 6 | 오픈 리다이렉트 (FR-021) | ✅ | ✅ |
| 7 | 만료 (SC-021) | ❌ 계정 모드 미인식(Critical-1) | ✅ |
| 8 | 두 계정 격리 (SC-017·018) | ❌ Critical-1 | ✅ |
| 9 | 교차 접근·anon (SC-019·020) | 미실행(serial 중단) | ✅ |
| 10 | 세션 독립·영속 (SC-017·021) | 미실행 | ✅ |
| 11 | 로그아웃 캐시 (SC-020) | 미실행 | ✅ |
| 12 | 오프라인 재전송 (FR-024) | 미실행 | ✅ |
| 13 | 기존 5개 스펙 무수정 | ✅ | ✅ |
| 14 | production 스모크 | ⏸ 외부 | ⏸ 외부 |

- Check: 원격 설정 대기(#1·#2·#4·#5)를 분모에서 빼면 1/9 = 11.1%.
- Act-1: 전체 스위트(자격 포함) **153 passed / 24 skipped / 0 failed**(skip 24건 = L3 12건 × 비데스크톱 2프로젝트, 설계 §8.4 규칙). `auth.spec`+`multiuser.spec` 데스크톱 22/22, SC-021·FR-024 `--repeat-each=3` 9/9.

**Runtime Match Rate** = L1 × 0.4 + L2 × 0.3 + L3 × 0.3
- Check: 100 × 0.4 + 100 × 0.3 + 11.1 × 0.3 = **73.3%**
- Act-1: 100 × 0.4 + 100 × 0.3 + 100 × 0.3 = **100%** (#14 외부 대기 제외. 포함 시 L3 12/13 → 97.7%)

### 2.8 Match Rate Summary

```
┌─────────────────────────────────────────────┐
│  (Act-1 최종)                                │
│  Structural Match Rate:  100%                │
│  Functional Match Rate:  100%                │
│  Contract Match Rate:    100%                │
│  Runtime Match Rate:     100%                │
│  ─────────────────────────────              │
│  Overall Match Rate:     100%                │
│  = (Structural × 0.15) + (Functional × 0.25)│
│    + (Contract × 0.25) + (Runtime × 0.35)   │
│  Check(반복 0): 15 + 24.4 + 21.9 + 25.7      │
│               = 86.9%  → FAIL               │
└─────────────────────────────────────────────┘
```

### 2.9 외부 대기 항목 (게이트 분모 제외)

| 항목 | 상태 | 필요한 작업(작성자) |
|---|---|---|
| FR-025 GitHub 저장소·push, secret scanning·push protection | 작업 폴더가 git 저장소가 아님 | 저장소 생성·첫 push 지시 |
| FR-026 Vercel `utmb2027` 배포·환경변수 | 배포 금지 지시 | §12.3 환경변수 등록 후 배포 지시 |
| SC-023 `git log --all -p` 비밀값 검색 | git 이력 없음 | 첫 커밋 후 재검사 |
| SC-024·§8.4 #14 production 스모크 | 배포 전 | `PLAYWRIGHT_BASE_URL=https://utmb2027.vercel.app` 실행 |

원격 Supabase auth 설정 push(Confirm email OFF, Hook 활성, 가입 허용)는 Act-1 중 작성자 승인으로 적용되었고, 해당 테스트(SC-016, 팀원 이메일 거부)는 모두 통과했다.

---

## 3. Code Quality Analysis

### 3.1 발견 사항

| 등급 | ID | 내용 | 상태 |
|---|---|---|---|
| Critical | C-1 | 로그인·가입 후 계정 모드 미인식 — 헤더 "로그인" 유지, `/packing` 기기 모드, 만료 감지 불가 | Act-1 수정 |
| Important | I-1 | E2E `waitForURL(/\/packing$/)`가 `/login?next=/packing`에도 일치해 로그인 실패를 가림 | Act-1 수정 |
| Important | I-2 | E2E `getByRole("alert")`가 Next route announcer와 중복되어 strict 위반(FR-020·SC-020 오탐) | Act-1 수정 |
| Minor | M-1 | AccountMenu guest 링크가 설계 표의 `Link` 대신 `<a>` 사용 | 유지(아래) |

### 3.2 Minor-1 판단

`<a>`는 전체 문서 이동을 만들어 로그인 화면이 항상 새로 렌더된다. 기능·접근성 영향이 없고 E2E(`auth.spec.ts:152`)가 href 계약을 검증하므로 수정하지 않는다.

### 3.3 Security Issues

| Severity | 항목 | 결과 |
|---|---|---|
| Critical | 타인 데이터 노출 | 0 (SC-019 E2E) |
| Critical | 비밀값 커밋 | 0 (작업 트리 스캔), git 이력은 외부 대기 |
| Critical | 오픈 리다이렉트 | 0 (safeNext 단위 + E2E FR-021) |
| — | 로그 | 이메일은 `emailHash`만, 비밀번호·토큰 미기록 |

---

## 4. Performance Analysis

`next build` 라우트 표: `/packing`·`/map`·`/offline` ○(정적) 유지, 신규 `/login`·`/signup`만 ƒ. 레이아웃은 쿠키를 읽지 않는다. Act-1 변경(`headers()` 호출)은 이미 동적인 `/login`·`/signup` 페이지 안에서만 일어나 라우트 표 변화 없음.

---

## 5. Test Coverage

| 영역 | 파일 | 결과 |
|---|---|---|
| L1 규칙 | `auth-rules`·`packing-sync`·`secrets`·`migrations-v4`·`sw-rules-v4` | 통과 |
| L2 UI | `auth.spec.ts` L2 10건(×3 뷰포트) | 통과 |
| L3 | `auth.spec.ts` L3 7건 · `multiuser.spec.ts` 5건 | 통과(데스크톱) |
| 회귀 | 기존 unit 15 · E2E 5 스펙 | 무수정 통과 |

미커버: Hook 403 경로의 UI E2E(계정 없는 `team_members` 이메일이 합성 데이터에 없음 — 분류 로직은 단위 테스트, 원격 403은 작성자 측 확인).

---

## 6. Clean Architecture Compliance

도메인 모듈(`auth-rules`·`safe-next`·`packing-sync` 순수부·`sw-rules`)은 react·next·Supabase를 import하지 않는다. Supabase 브라우저 클라이언트는 `auth-client`·`fetchPackingChecks`로만 사용. 위반 0건.

## 7. Convention Compliance

`any` 0, 코드 주석 추가 없음(Act-1 포함), `useEffect` 데이터 조회 0(조회는 `useQuery`, 세션은 `useSyncExternalStore`), 새 의존성 없음.

---

## 8. Iteration History

### Check (반복 0) — 2026-09-23

- Overall 86.9% (Structural 100 · Functional 97.6 · Contract 87.5 · Runtime 73.3) → 게이트 미달.
- 자격 포함 E2E(auth+multiuser): 31 pass / 6 fail / 4 did not run.

### Act-1 — 2026-09-23

**원인 추적(C-1)**: 프로덕션 빌드에 Playwright 스크립트로 로그인 후 쿠키·콘솔을 수집했다. 쿠키 `sb-<ref>-auth-token`(base64-, httpOnly 아님)은 정상이고 같은 페이지에서 새 `createBrowserClient`로 `getSession()`을 호출하면 세션이 읽혔다. 세션 스토어에 임시 로그를 넣어 보니 스토어 초기화는 `/login`에서 1회(쿠키 없음 → guest)뿐이었고, 로그인 POST 뒤 `/packing`으로의 이동은 **문서 요청 없는 소프트 내비게이션**이었다. 서버 액션이 세션 쿠키를 쓰면 Next가 같은 요청에서 `/login` 페이지를 다시 렌더하고, 그 안의 `redirectIfSignedIn()`이 `redirect(next)`를 던진 것이 원인이다. 모듈 스코프 스토어는 guest로 남고, 서버가 쓴 쿠키는 `onAuthStateChange`를 일으키지 않는다. SW의 오래된 `/packing` 사본 가설은 배제(해당 이동은 SW·문서 요청 자체가 없음).

**수정**

| 파일 | 변경 |
|---|---|
| `src/app/login/shared.ts` | `redirectIfSignedIn()`이 서버 액션 재렌더(`next-action` 요청 헤더)에서는 리다이렉트하지 않음 → 설계 §4.2-5대로 `LoginForm`/`SignupForm`이 page 캐시 삭제 후 전체 이동, EL-07 표시 |
| `tests/e2e/auth.spec.ts` | 오류 문구 선택자를 `main` 범위로 한정(I-2), `waitForURL`을 pathname 비교로(I-1), SC-021에서 계정 버튼 표시 확인 후 쿠키 삭제(스토어 기록 전 삭제 경합 제거), 기존 계정 로그인 경로의 첫 로그인 병합 테스트 추가(FR-024, A 계정 행은 전후 정리) |
| `tests/e2e/multiuser.spec.ts` | `waitForURL`을 pathname 비교로(I-1) |

- 가입 응답에 `identities: []`(Confirm ON의 기존 계정)일 때 duplicate로 분류하는 방어 분기를 잠시 넣었다가, 원격 Confirm email OFF 적용(기존 계정은 422 `user_already_exists`)을 확인한 뒤 설계 §4.2 원형으로 되돌렸다.
- 재검증: typecheck 0 · vitest 174/1 skip · build OK(라우트 ○/ƒ 불변) · E2E 자격 없음 141 pass/36 skip · 자격 포함 153 pass/24 skip · 실패 0.
- 결과: Overall **100%** (외부 대기 포함 참고치 98.3%) → 게이트 통과, 반복 종료.

---

## 9. Recommended Actions

1. (작성자) GitHub 저장소 생성·첫 push 후 `git log --all -p` 비밀값 검사(SC-023) 실행.
2. (작성자) Vercel 환경변수 등록·배포 후 `PLAYWRIGHT_BASE_URL=https://utmb2027.vercel.app`로 §8.4 #1·#2·#8 + SCR-001·006·009·015 스모크(SC-024).
3. production 공개 전 합성 팀원·E2E 계정 삭제 여부 결정(§8.5).
4. 다음 단계: `/pdca report multiuser-cloud-deployment` (또는 QA).
