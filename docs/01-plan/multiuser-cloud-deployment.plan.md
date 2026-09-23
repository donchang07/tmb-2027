# multiuser-cloud-deployment Planning Document

> **Summary**: 기존 TMB 2027 화면·기능을 그대로 두고 이메일·비밀번호 회원가입/로그인, 사용자별 준비물 저장(RLS 격리), GitHub 공개 저장소, Vercel production 배포를 추가하는 PRD v4.0 델타
>
> **Project**: tmb-2027
> **Version**: 0.1.0 (PRD v4.0 델타)
> **Author**: 장동인(작성자) · Claude(PDCA)
> **Date**: 2026-09-23
> **Status**: Approved (작성자 사전 승인, L4 auto)
> **Source contract**: `docs/00-pm/multiuser-cloud-deployment.prd.md` (정본 `docs/PRD.md` v4.0 projection, 게이트 97점)
> **Feature 순서**: 10/10 · 의존: feature 1~9 완료(v3.1) · 규모: 대

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 앱이 localhost에서만 동작하고 준비물 체크가 기기 한 대의 localStorage에만 남는다. 팀원 10명이 인터넷 주소로 접속해 각자 계정으로 자기 데이터를 관리할 수 없고, 소스는 git 저장소도 아니어서 배포·비밀값 관리 절차가 없다. |
| **Solution** | Supabase Auth 이메일·비밀번호(이메일 인증 OFF, 가입 즉시 로그인)를 SCR-015·016으로 추가하고, 공통 헤더에 클라이언트 계정 메뉴(SCR-018)를 둔다. 로그인 사용자의 준비물은 `packing_checks`(RLS `user_id = auth.uid()`)에 저장하고 react-query로 조회한다. `team_members` 이메일 선점은 before-user-created Auth Hook + 계정 선생성으로 막는다. 소스는 GitHub public `donchang07/tmb-2027`, 배포는 Vercel `utmb2027`(https://utmb2027.vercel.app). |
| **Function/UX Effect** | 공개 화면(SCR-001~014)은 변화 없이 그대로 열리고, 헤더 우측에 "로그인"/계정 메뉴가 생긴다. 가입하면 확인 메일 없이 바로 로그인되어 보던 화면으로 돌아가고, 준비물 체크가 어느 기기에서든 이어진다. 두 사람이 동시에 써도 각자 자기 체크만 보인다. |
| **Core Value** | "우리 10명의 확정 일정표"를 같은 인터넷 주소로 열고, 개인 준비 상태는 계정별로 서버에서 안전하게 분리한다 — 기존 기능 회귀 0건, 저장소 비밀값 0건. |

---

## Context Anchor

> Design/Do 문서로 그대로 전파한다.

| Key | Value |
|-----|-------|
| **WHY** | localhost 전용·기기 전용 저장으로는 팀이 실제로 쓸 수 없다. 인터넷 배포와 계정별 개인 데이터가 필요하다(PRD 0장, S9~S13). |
| **WHO** | 리더 1명(편집·배포 담당, `ADMIN_EMAIL`), 팀원 9명(`team_members`, 기록 작성), 계정 사용자(누구나 가입, 자기 준비물만), 비로그인 방문자(공개 열람·기기 저장). |
| **RISK** | ① 다른 사용자 데이터 노출(RLS 누락) ② 비밀값의 공개 GitHub 커밋 ③ 인증 도입으로 기존 공개 화면·오프라인 회귀 ④ `team_members` 이메일 비밀번호 선점(이메일 인증 OFF) ⑤ SW가 사용자별 응답을 캐시해 로그아웃 후 노출. |
| **SUCCESS** | SC-016~024 통과 + SC-001~015 회귀 유지(`npm test` ≥ 126, Playwright ≥ 111 기존 건 전부 통과), `next build` 기존 라우트 ○/ƒ diff 0건, 저장소 비밀값 0건, Vercel production Ready, match rate ≥ 95. |
| **SCOPE** | module-1 인증(SCR-015~018, FR-019·020·021·029·030) → module-2 사용자별 데이터(FR-022~024, SCR-009-EL-10~13) → module-3 SW·middleware(DATA-012, I-025) → module-4 저장소·배포(FR-025·026·028) → module-5 테스트·회귀(FR-027). |

---

## 1. Overview

### 1.1 Purpose

PRD v4.0 델타(feature 10 `multiuser-cloud-deployment`)를 구현 가능한 계획으로 옮긴다. 소유 범위는 SCR-015·016·017·018, SCR-009-EL-10~13, FR-019~030, SC-016~024, DATA-017~019다. 17.1 "변경(최소)" 항목(SCR-007·009·012·017, DATA-012·014, middleware)은 17.2 파일 범위 안에서만 손댄다.

### 1.2 Background

- 현재 인증은 magic link 두 경로(리더 `/admin`, 팀원 `/journal/login`)뿐이며 회원가입·비밀번호 로그인·공통 계정 메뉴가 없다(PRD 2장).
- 준비물은 `tmb2027:packing:v1` localStorage에만 저장된다(DATA-014).
- 저장소는 git이 아니고 GitHub·Vercel 연결이 없다. `.env.local`에 앱이 쓰지 않는 비밀값(service_role·secret·OpenAI)이 있다(I-021).
- 작성자 결정(13.1): D-008 누구나 가입·이메일 인증 OFF, D-009 기존 magic link 화면 유지, D-010 사용자별 데이터 = 준비물만, D-012 public 저장소, D-013 Supabase 1개 공유, D-014 `*.vercel.app`, D-015 첫 로그인 합집합 병합, D-016 목표일 없음, D-017 ③ Hook + 계정 선생성, D-018 ② react-query. **D-011(SMTP)만 Open** — fallback ③ 기본 SMTP로 진행하고 메일을 받을 수 없는 리더·팀원은 SCR-015 비밀번호 로그인을 쓴다.

### 1.3 Related Documents

- Requirements: `docs/00-pm/multiuser-cloud-deployment.prd.md` (5.4, SCR-009·015~018, 6장, 7장, 11.4·11.5, 12장, 13장, 17장, DATA-017~019)
- Gate: `docs/00-pm/multiuser-cloud-deployment.gate.md` (97점)
- Design: `docs/02-design/multiuser-cloud-deployment.design.md`
- 이전 사이클: `docs/01-plan/packing-checklist.plan.md`, `offline-pwa.plan.md`, `booking-tracker.plan.md`

### 1.4 Checkpoint 기록

| Checkpoint | 내용 | 결과 |
|---|---|---|
| CP-1 요구사항 확인 | 소유 범위·변경(최소) 범위·비범위 | **요구사항 확인: 작성자 사전 승인(2026-09-23, 원스톱 지시)** |
| CP-2 확인 질문 | 13.1 결정 D-008~D-018 | 전부 Closed(D-011 fallback ③ 적용) — 추가 질문 없음 |
| 의존성 추가 | `@tanstack/react-query` 1개 | D-018 ② 작성자 승인(2026-09-23) |

---

## 2. Scope

### 2.1 In Scope

- [ ] SCR-015 로그인(`/login`), SCR-016 회원가입(`/signup`) — 이메일·비밀번호, 이메일 인증 OFF, 가입 즉시 로그인(FR-019·020)
- [ ] SCR-017 인증 콜백 실패 경로: `/journal*`→SCR-012, `/admin*`→SCR-007, 그 외 `/login?error=auth` + 오류 배너 한 문장(FR-021)
- [ ] SCR-018 계정 메뉴(NAV-012)·세션 만료 알림 — 클라이언트 컴포넌트, 레이아웃에서 쿠키를 읽지 않음(FR-029, I-013)
- [ ] 강화된 `safeNext`(제어문자·백슬래시·`//`·origin 검사) 모든 로그인·콜백 경로 적용(FR-021, I-024)
- [ ] SCR-009 계정 모드: EL-02 문구 분기, EL-10~13, react-query 조회, Server Action 저장, 기기 대기열, 첫 로그인 합집합 병합(FR-022~024)
- [ ] `packing_checks` 마이그레이션 + RLS 4정책 + anon revoke(FR-022·023, DATA-018)
- [ ] before-user-created Auth Hook 마이그레이션 + 배포 전 계정 선생성 절차(FR-030, D-017 ③)
- [ ] middleware matcher 확장(`/packing`·`/login`·`/signup`·`/day/:path*`), 관리자 세션 `/day` 응답에만 `x-tmb-user-scoped: 1`(I-025)
- [ ] SW: `/login`·`/signup` network-only, 헤더 응답 미캐시, `/day/*`·`/packing` network-first(3초), 로그인·로그아웃 시 page 캐시 삭제(DATA-012, I-025)
- [ ] 리더·팀원 magic link `emailRedirectTo`를 요청 origin 기반으로(I-015), SCR-012-EL-07 비밀번호 로그인 링크
- [ ] `.gitignore`·`.env.example` 최종화, 비밀값 스캔 단위 테스트(FR-025·028)
- [ ] `supabase/config.toml` auth 섹션, 합성 seed 스크립트(`scripts/seed-synthetic.mjs`, 로컬 전용)
- [ ] GitHub public `donchang07/tmb-2027`(`main`), Vercel 프로젝트 `utmb2027`(team `don-changs-projects`) 배포(FR-026)
- [ ] 회귀: 기존 vitest·Playwright 무수정 통과(FR-027, 17.3)

### 2.2 Out of Scope

- 기존 UI 재설계, 업무 기능(일정·Day·이동·예산·지도·예약·기록) 변경, SCR-007-EL-11 "12박" 문구(I-027)
- 비밀번호 재설정·변경 화면, 소셜 로그인, 프로필, 사용자별 여행, 팀원 셀프 승인 화면
- `/login` 단일 통합(D-009 ②), 여행 기록 비공개 전환(D-010 ②), Supabase 환경 분리(D-013 ②), 커스텀 도메인(D-014 ②)
- `@tanstack/react-query` 외 의존성 추가, 관계없는 패키지 업그레이드·폴더 재구성
- git commit·push·마이그레이션 원격 적용·Vercel 배포 실행 — 작성자 지시 후에만(15장 운영 규칙)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | 화면 | Status |
|----|-------------|----------|------|--------|
| FR-019 | 이메일(형식·소문자·254자)·비밀번호(8~72자, 확인 일치)로 가입. Confirm email OFF — 가입 즉시 확인된 계정·세션 발급, EL-07 후 `next`. 중복·Hook 거부는 같은 문구 | High (P0) | SCR-016 | Pending |
| FR-020 | 이메일·비밀번호 로그인, 쿠키 세션 유지(새로고침·탭 재시작), 로그아웃으로 세션 삭제, 자격 오류 문구 단일화 | High (P0) | SCR-015·018 | Pending |
| FR-021 | 비로그인·만료 사용자의 보호 동작은 보호 데이터 없이 로그인 안내, 로그인 후 `next` 복귀. 강화된 `safeNext`를 모든 로그인·콜백에 적용 | High (P0) | SCR-015·017·018·009 | Pending |
| FR-022 | 사용자별 테이블 소유자 컬럼 `user_id uuid not null default auth.uid() references auth.users on delete cascade`, 서버는 소유자 값을 입력으로 받지 않음 | High (P0) | SCR-009 | Pending |
| FR-023 | RLS 4정책(`user_id = auth.uid()`), `revoke all ... from anon`, service_role 미사용 | High (P0) | SCR-009 | Pending |
| FR-024 | 로그인 사용자 체크·해제·전체 해제를 계정에 저장·복원, 첫 로그인 합집합 병합(EL-12), 오프라인·실패분 기기 대기열 → 항목별 최신 `updated_at` 우선 재전송 | High (P0) | SCR-009 | Pending |
| FR-025 | GitHub public `tmb-2027` `main` + feature 브랜치, `.gitignore` 제외 규칙(비밀값·개인 작업 기록), I-028 공개 범위 점검 | High (P0) | — | Pending |
| FR-026 | Vercel `main`→Production(`next build`), 환경변수 범위 분리, Supabase Site URL·Redirect URLs 등록 | High (P0) | — | Pending |
| FR-027 | **회귀**: SCR-001~014 요소 계약·FR-001~018 동작 유지, 기존 vitest·Playwright 무수정 통과(인증 기대값 추가만 허용) | High (P0) | SCR-001~014 | Pending |
| FR-028 | 비밀값 커밋 0건 — 추적 파일 비밀값 패턴 스캔 단위 테스트, `.env.example` 값 비움, GitHub secret scanning·push protection | High (P0) | — | Pending |
| FR-029 | 계정 메뉴는 모든 화면에서 비로그인 "로그인"/로그인 이메일 축약·로그아웃, 두 브라우저 동시 로그인 시 각자 세션만 표시, 브라우저에서 세션 읽기(정적 라우트 보존) | High (P0) | SCR-018 | Pending |
| FR-030 | 역할 함수(`is_admin`·`is_team_member`) v3.1 정의 유지, `team_members` 이메일 신규 가입은 Auth Hook이 거부, 배포 전 계정 선생성(D-017 ③) | High (P0) | SCR-016·007 | Pending |

기준선(회귀 대상, 변경 금지): FR-001~018. FR-015는 적용 범위만 "비로그인"으로 한정된다.

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 기존 라우트 렌더링 방식(○/ƒ) 불변 — `/packing`·`/map`·`/offline` 정적 유지, 레이아웃 쿠키 미사용. middleware는 matcher 7개 경로만 | v3.1 대비 `next build` 라우트 표 diff(신규 `/login`·`/signup`만 추가) |
| Security | RLS 4정책·anon 0 권한, service_role 앱 코드·Vercel 미등록, Auth Hook 활성, 오픈 리다이렉트 차단, 로그에 비밀번호·토큰·원문 이메일 없음(이메일은 해시) | 마이그레이션 텍스트 테스트, RLS 두 계정 E2E, `safeNext` 단위 테스트, 비밀값 스캔 |
| Privacy | 계정 이메일은 본인 SCR-018에만, 타인 준비물 0건, 로그아웃 시 기기 계정 사본·대기열·SW page 캐시 삭제 | 두 context E2E, 로그아웃 후 Cache Storage 검사 |
| Offline | `/login`·`/signup`·`/auth/*`·준비물 저장(POST) 미캐시, `x-tmb-user-scoped` 응답 미캐시, `/day/*`·`/packing` network-first 3초 타임아웃 | `sw-rules` 단위 6건, 기존 `offline.spec.ts` 통과 |
| Accessibility | WCAG 2.2 AA, 인증 폼 label·autocomplete·`aria-describedby`·`role=alert`, 터치 44px, 360px 가로 스크롤 0 | axe(SCR-015·016·018 추가, SC-005) |
| Logging | `auth_login_succeeded`·`auth_login_failed`·`auth_signup_requested`·`auth_signup_failed`·`auth_callback_failed`·`auth_logout`·`auth_session_expired`·`packing_sync_failed`·`owner_access_denied`·`auth_next_rejected`·`packing_local_migrated`·`supabase_unconfigured` | `LogCode` 유니온 타입체크, 서버 로그 |

---

## 4. Success Criteria

### 4.1 Definition of Done (소유 SC)

| ID | 기준 | 검증 |
|---|---|---|
| SC-016 | 새 이메일 가입 → 확인 메일 없이 즉시 로그인·`next` 이동·SCR-018에 이메일. 같은 이메일 재가입 시 "이 이메일로 가입할 수 없습니다…", 로그아웃 후 재로그인 성공 | `auth.spec.ts`(localhost 프로덕션 빌드 + `PLAYWRIGHT_BASE_URL`=production) + production 체크리스트 |
| SC-017 | 두 브라우저 동시 로그인 시 각자 이메일만, 한쪽 로그아웃이 다른 쪽에 영향 없음 | `multiuser.spec.ts` 두 context |
| SC-018 | A 3개·B 5개 체크 → 새로고침 후 각자 자기 것만, DB `checked=true` 행 A 3·B 5 | `multiuser.spec.ts` + 각 사용자 JWT 조회 |
| SC-019 | A 세션으로 B 행 조회·수정·삭제 = 0행, B 데이터 불변 | `multiuser.spec.ts` REST 직접 호출 |
| SC-020 | anon은 `packing_checks`·`bookings` 0행/거부, `team_members` 이메일 가입 거부(Hook), 로그아웃 후 Cache Storage에 예약번호·타인 체크 0건 | anon 통합 + Hook E2E + D-017 체크리스트 + Cache Storage E2E |
| SC-021 | 새로고침·브라우저 재시작 후 로그인·계정 체크 복원, 만료 시 `reason=expired` 경유 복귀 | E2E(reload, storageState, 쿠키 삭제) |
| SC-022 | `npm run typecheck` 0 오류, `npm test` 전체 통과(≥126), `npx playwright test --workers=1` 전체 통과(≥111), 17.3 회귀 목록 유지 | 실행 로그 |
| SC-023 | 저장소 모든 커밋에 비밀값 파일·패턴 0건, `.env.example` 값 비어 있음 | `secrets.test.ts`, `git log --all -p` 검색 |
| SC-024 | Vercel production `main` 커밋 Ready, SCR-001·006·009·015 200, 콘솔 오류 0 | Vercel 배포 상태 + production 스모크 |

회귀 SC(유지): SC-001~015. SC-005는 검사 대상에 SCR-015·016·018을 추가, SC-011은 "비로그인 상태" 한정.

### 4.2 Quality Criteria

- [ ] match rate ≥ 95 (bkit.config `matchRateThreshold` 95, `maxIterations` 5)
- [ ] `tsc --noEmit` 0 오류, `any` 0건, `useEffect` 데이터 조회 0건(react-query 사용)
- [ ] 신규 로직 모듈(`safe-next`, `auth-rules`, `packing-sync`, `sw-rules`)은 단위 테스트로 분기 전부 커버
- [ ] `npm run build` 성공, 기존 라우트 표 diff 0
- [ ] critical 보안 결함 0건(타인 데이터 노출·비밀값 커밋·오픈 리다이렉트)
- [ ] production 체크리스트(11.5 #6) 통과

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| RLS 누락·오류로 타인 준비물 노출(S12) | High | Low | 4정책 + `revoke all from anon` + 마이그레이션 텍스트 테스트 + 두 계정 REST E2E(SC-019). 저장은 `security invoker` 함수라 RLS 우회 없음 |
| `team_members` 이메일 비밀번호 선점(인증 OFF) | High | Medium | D-017 ③: Hook + "Add user → `team_members` 등록" 순서 고정. Hook 활성·선생성 확인 전 production URL 비공개(11.5 ②~⑦) |
| 비밀값 공개 커밋(public 저장소) | High | Medium | `.gitignore` 보강 → 비밀값 스캔 테스트 → I-028 점검 → secret scanning·push protection. 발견 시 push 중단·키 교체 |
| SW가 로그인 전 사본·관리자 Day를 캐시해 로그아웃 후 노출 | High | Medium | `x-tmb-user-scoped` 헤더 미캐시, `/day/*`·`/packing` network-first, 로그인·로그아웃·만료 시 page 캐시 삭제, SW_VERSION v3 |
| 계정 메뉴 도입으로 정적 라우트가 동적으로 전환 | Medium | Medium | 레이아웃은 쿠키를 읽지 않고 AccountMenu가 브라우저에서 세션 확인(I-013), 빌드 라우트 표 diff 테스트 |
| 원격 Supabase 상태 미확인(I-014) | Medium | High | Do 첫 작업으로 `supabase link`·`migration list`, 미적용분 순서대로 적용(작성자 지시 후) |
| magic link 메일 미발송(D-011 Open, 기본 SMTP) | Medium | High | SCR-012-EL-07·SCR-015 비밀번호 로그인 경로, 팀원 계정은 "Add user"로 생성 |
| `.test` 도메인 합성 이메일을 Supabase가 거부 | Low | Medium | seed 스크립트·E2E의 도메인을 환경변수(`E2E_EMAIL_DOMAIN`)로 교체 가능하게 설계 |
| E2E 가입이 Auth 요청 한도(429)에 걸림 | Low | Medium | 가입 E2E는 `desktop-1440` 프로젝트 1개에서만, 계정 A·B는 seed로 1회 생성 |
| 기존 E2E 회귀(오프라인·packing) | High | Low | 비로그인 경로 코드 경로 불변, network-first는 오프라인 시 즉시 캐시, 기존 스펙 무수정 실행 |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| `public.packing_checks` | DB 테이블(신규) | PK(`user_id`,`item_id`), RLS 4정책, anon revoke, `upsert_packing_checks(jsonb)` 함수 |
| `public.hook_before_user_created(jsonb)` | DB 함수(신규) + Auth Hook | `team_members` 이메일 가입 거부, `supabase_auth_admin` 전용 실행 |
| `public.team_members` | DB 정책(추가) | `supabase_auth_admin` select grant + 전용 RLS 정책(기존 정책·역할 함수 불변) |
| `src/lib/safe-next.ts` | 유틸(수정) | 규칙 강화, 시그니처 호환(3번째 인자 `origin` 선택) |
| `src/middleware.ts` | 설정(수정) | matcher 4개 추가, 관리자 `/day`에 `x-tmb-user-scoped` |
| `src/lib/sw-rules.ts`·`public/sw.js` | SW(수정) | network-only 추가, network-first, 헤더 미캐시, `clear_pages` 메시지, `SW_VERSION` v3 |
| `src/app/auth/callback/route.ts` | Route Handler(수정) | 실패 fallback 3분기, `auth_callback_failed` |
| `src/app/auth/signout/route.ts` | Route Handler(수정) | `auth_logout` 로그만 추가 |
| `src/components/admin/SignOutButton.tsx` | 컴포넌트(수정) | client 전환, 제출 전 캐시·대기열 삭제 |
| `src/components/packing/PackingList.tsx`·`src/lib/packing-store.ts`·`src/app/packing/page.tsx` | 컴포넌트·유틸(수정) | 계정 모드, 로컬 QueryClientProvider, EL-02 문구 분기 |
| `src/components/layout/AppHeader.tsx` | 컴포넌트(수정) | AccountMenu 배치 |
| `src/app/admin/actions.ts`·`src/app/journal/actions.ts` | Server Action(수정) | `emailRedirectTo` 요청 origin 기반 |
| `src/app/admin/page.tsx`·`src/app/journal/login/page.tsx`·`TeamLoginForm.tsx` | 화면(수정) | 오류 배너 한 문장, SCR-012-EL-07 링크 |
| `src/lib/log.ts`·`src/lib/supabase/server.ts` | 유틸(수정) | LogCode 추가, `requestOrigin()` 추가 |
| `.gitignore`·`.env.example`·`playwright.config.ts`·`package.json` | 설정(수정) | 제외 규칙, 키 목록, `.env.test.local` 로드, react-query |

### 6.2 Current Consumers

| Resource | Operation | Code Path | Impact |
|----------|-----------|-----------|--------|
| `safeNext` | READ | `src/app/admin/actions.ts` → `sendMagicLinkAction` | None — 정상 경로 결과 동일 |
| `safeNext` | READ | `src/app/admin/page.tsx`(fallback `/admin/bookings`) | None |
| `safeNext` | READ | `src/app/journal/actions.ts`, `src/app/journal/login/page.tsx`(fallback `/journal`) | None |
| `safeNext` | READ | `src/app/auth/callback/route.ts` | Needs verification — 실패 fallback 분기 변경 |
| `safeNext` | TEST | `tests/unit/bookings.test.ts` L107~112 | None — 기존 벡터 모두 같은 결과 |
| `sw-rules` | READ | `src/components/pwa/SwRegister.tsx`(`shouldRegisterSw`), `src/lib/cache-manifest.ts` | Needs verification — `SW_VERSION` v3로 manifest 캐시 키 변경 |
| `sw-rules` | TEST | `tests/unit/sw-rules.test.ts`(버전 동기화·bypass·static·route rule) | None — 기존 규칙 유지, 추가만 |
| `public/sw.js` page 전략 | READ | `tests/e2e/offline.spec.ts`(`/day/d2027-08-04`·`08-05` 오프라인 재열람) | Needs verification — network-first여도 오프라인 즉시 캐시 |
| middleware | READ | `/admin/*`·`/api/admin/*`·`/journal/*` 세션 갱신 | None — 기존 matcher 유지 |
| `SignOutButton` | READ | `src/app/admin/page.tsx`, `src/app/admin/bookings/page.tsx`, `src/components/journal/JournalAccessNote.tsx` | Needs verification — client 전환 후 서버 컴포넌트에서 import 가능 |
| `PackingList` | READ | `src/app/packing/page.tsx`, `tests/e2e/packing.spec.ts`(비로그인 체크·새로고침·전체 해제) | None — 비로그인 경로 불변 |
| `packing-store` | READ | `PackingList.tsx`, `tests/unit/packing-store.test.ts` | None — 기존 함수 시그니처 유지, 함수 1개 추가 |
| `createBrowserClient` | READ | `src/components/pwa/BookingLive.tsx`(Realtime) | None — 새 사용처만 추가 |
| `AppHeader` | READ | `src/app/layout.tsx`, `tests/e2e/responsive.spec.ts`(가로 스크롤·44px) | Needs verification — 360px에서 계정 버튼 포함 스크롤 0 |
| `team_members` | READ | `is_admin()`·`is_team_member()`(SECURITY DEFINER), `src/lib/journal.ts`, `src/lib/bookings/admin.ts` | None — 정책 추가만, 기존 정책·함수 불변 |
| `emailRedirectTo` | CREATE | 리더·팀원 magic link 메일 | Needs verification — Supabase Redirect URLs에 localhost·production·preview 등록 필요 |

### 6.3 Verification

- [ ] 위 소비자 전부 기존 테스트(17.3 회귀 목록)로 확인
- [ ] 역할 함수·기존 RLS 정책 텍스트가 v3.1과 동일(텍스트 테스트)
- [ ] `next build` 라우트 표 v3.1 대비 기존 경로 diff 0

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites | ☐ |
| **Dynamic** | Feature-based modules, BaaS integration | Web apps with backend | ☑ (Supabase BaaS, PRD 11.1) |
| **Enterprise** | Strict layer separation | High-traffic systems | ☐ |

### 7.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Framework | Next.js 15.5 App Router | 유지 | 기존 스택(11.1) |
| Auth | Supabase Auth 이메일·비밀번호 + 기존 magic link | `@supabase/ssr` 쿠키 세션 | D-008·D-009, 새 인증 의존성 없음 |
| 세션 표시 | 레이아웃 쿠키 / 클라이언트 | 클라이언트(AccountMenu) | 정적 라우트 보존(FR-029, I-013) |
| API Client | fetch / react-query | 로그인 준비물 조회 = react-query, 저장 = Server Action | D-018 ②, CLAUDE.md `useEffect` 조회 금지 |
| Provider 위치 | layout / 컴포넌트 로컬 | `PackingList.tsx` 내부 로컬 `QueryClientProvider` | `layout.tsx`·다른 라우트 무변경(I-017) |
| 저장 규칙 | JS 다중 쿼리 / Postgres 함수 | `upsert_packing_checks(jsonb)` security invoker | 항목별 최신 우선을 1쿼리로, RLS 유지(CLAUDE.md Supabase 규칙) |
| 가입 선점 차단 | 운영 절차 / Hook / 둘 다 | 둘 다(D-017 ③) | 이메일 인증 OFF에서 유일한 보호 |
| Form Handling | native + `useActionState` + zod | 유지 | 기존 `TeamLoginForm` 패턴 |
| Styling | Tailwind 4, `card`·`tap`·`StatusNote`·`bg-alpine` | 유지 | 새 디자인 토큰 금지(9장) |
| Testing | Vitest + Playwright(`--workers=1`, 프로덕션 빌드 3100) | 유지 | 기존 규칙 |
| Hosting | Vercel(`utmb2027`, team `don-changs-projects`) + GitHub public | 확정 | D-012·D-014 |

### 7.3 Clean Architecture Approach

```
Selected Level: Dynamic (기존 구조 유지 — 목적 없는 폴더 재구성 금지)

src/app/login|signup/        Presentation (Server Component 페이지 + Server Action)
src/app/packing/actions.ts   Application (Server Action, zod 검증)
src/components/auth|layout/  Presentation (client 폼·계정 메뉴)
src/lib/auth-rules.ts        Domain (zod 스키마·오류 매핑·origin 계산, 순수)
src/lib/packing-sync.ts      Domain (병합·대기열 규칙, 순수 + localStorage 래퍼)
src/lib/auth-client.ts       Infrastructure(client) (세션 훅·SW 캐시 삭제)
src/lib/supabase/*           Infrastructure (Supabase 클라이언트)
supabase/migrations/         Infrastructure (RLS·Hook)
```

---

## 8. Convention Prerequisites

### 8.1 Existing Project Conventions

- [x] `CLAUDE.md`(전역) 코딩 규칙: strict TS·`any` 금지·`useEffect` 조회 금지·`cn()`·주석 금지·Supabase RLS·`@supabase/ssr`
- [ ] `docs/01-plan/conventions.md` — 없음(기존 사이클과 동일하게 코드 패턴을 기준으로 함)
- [x] TypeScript `tsconfig.json` strict
- [ ] ESLint/Prettier — 없음(`npm run typecheck`·`npm test`가 품질 게이트)

### 8.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| Naming | 존재(컴포넌트 PascalCase, lib kebab-case 파일) | `LoginForm.tsx`·`auth-rules.ts`·`packing-sync.ts` 동일 규칙 | High |
| Folder structure | 존재(`src/app`·`src/components/<domain>`·`src/lib`) | `src/components/auth/` 신규 1개만 | High |
| Server Action 반환 | 존재(`{ message, error }`·`EntryState`) | `AuthFormState`·`PackingSyncResult` 판별 유니온 | High |
| Environment variables | `.env.example` 존재 | 11.4 최종 키 6개(값 비움) | High |
| Error handling | `StatusNote`·`role=alert` | 인증 오류는 한국어 고정 문구, Supabase 원문 비노출 | Medium |
| Log | `logEvent(code, level, meta)` | 이메일은 `hashEmail()` 12자, 비밀번호·토큰 금지 | Medium |
| Commit | `<type>: <description>` 영어 소문자 | 작성자 지시 시에만 | Medium |

### 8.3 Environment Variables Needed

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | Client | Vercel Preview·Production ☐ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon/publishable 키(RLS 전제) | Client | Vercel Preview·Production ☐ |
| `NEXT_PUBLIC_SITE_URL` | magic link 콜백 fallback | Client | Production만(`https://utmb2027.vercel.app`) ☐ |
| `ADMIN_EMAIL` | 리더 이메일 1개 | Server | Vercel Preview·Production ☐ |
| `RESEND_API_KEY`·`SECURITY_MAIL_FROM` | security 알림(선택) | Server | Production 선택 ☐ |
| `SUPABASE_SERVICE_ROLE_KEY` | seed 스크립트 전용 | 로컬 `.env.local`만 | Vercel **등록 금지** |
| `E2E_USER_A/B_*`·`E2E_MEMBER_*`·`E2E_EMAIL_DOMAIN`·`PLAYWRIGHT_BASE_URL` | E2E 테스트 계정 | `.env.test.local`만 | seed 스크립트가 생성 |

### 8.4 Pipeline Integration

9-phase 파이프라인 문서는 사용하지 않는다(기존 9개 feature와 동일). 스키마 기준은 PRD 부록 A(DATA-017~019), 규칙은 CLAUDE.md.

---

## 9. Next Steps

1. [x] Plan 작성(본 문서)
2. [ ] Design 작성 — `docs/02-design/multiuser-cloud-deployment.design.md`(3안 비교, 추천안 채택)
3. [ ] Do — module-1~5 순서(Design §11.3), `npm install @tanstack/react-query` 포함
4. [ ] Check — general-purpose 에이전트로 gap 분석(bkit gap-detector는 쓰기 불가), Playwright `--workers=1`
5. [ ] 작성자 지시 후: 마이그레이션 원격 적용·Auth 설정(11.5 ①~⑦)·GitHub push·Vercel 배포

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-09-23 | PRD v4.0 델타 최초 Plan(작성자 사전 승인) | Claude(PDCA) |
