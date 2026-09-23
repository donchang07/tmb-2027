# PRD — TMB 2027

> 상태: final
> 문서 역할: 제품 통합 정본(사용자 지정 경로)
> feature: product
> 정본: `G:\내 드라이브\CEO_AI_Coding\CEO_18기\tmb2027prd.md` · 정본 개정: v2, 2026-09-16
> 작성일: 2026-09-09 · 최종 수정일: 2026-09-16
> 개정 이력: v1 최초 통합 2026-09-09 · v2 bkit 실행 계약·추적성·시스템 가정·gate 추가 2026-09-16
> 입력: 기존 `tmb2027prd.md`, 장동인 교수 기획 브리프, 2026-09-09 웹 조사 snapshot
> bkit 계약: v2.1.38 검증 기준(2026-09-16), 프로젝트 로컬 `bkit.config.json` 없음
> 게이트: 80점 · 조건부 착수 · Blocker 0 · Major 4 · Minor 0 → `tmb2027prd.gate.md`
> 라벨: [확정·출처] · [조사·기준일] · [추정] · [가설]
> 슬로건: **“걸어야 산다!”**

## 0. Executive Summary

| Perspective | Content |
|---|---|
| **Problem** | TMB 일정·산장·교통·예산 정보가 여러 사이트에 흩어져 있어 10명이 같은 계획과 수치를 공유하기 어렵고, 산행 중에는 작은 화면과 약한 네트워크 때문에 필요한 정보를 빠르게 찾기 어렵다. |
| **Solution** | 15일 전체 일정과 12개 트레킹 Day를 모바일 우선 카드로 제공하고, 각 Day의 거리·고도·시간·산장·지도·예약 상태·대안·비상 정보를 온라인과 오프라인에서 일관되게 보여 준다. |
| **Target User** | 계획과 예약을 관리하는 리더 1명, 일정을 확인하는 동행 9명, 제한된 정보를 열람하는 가족·지인. |
| **Core Value** | “정보 포털”이 아니라 **우리 10명의 확정 일정표**를 제공해 출발 전 예약과 산행 중 의사결정을 한 화면에서 끝낸다. |

### Context Anchor

| Key | Value |
|---|---|
| **WHY** | 분산된 정보와 서로 다른 수치 때문에 예약 누락·잘못된 이동·산행 중 확인 지연이 발생할 수 있다. |
| **WHO** | 원정 리더 1명과 동행 9명. 가족·지인은 공개 가능한 일정 요약만 열람한다. |
| **RISK** | 2027 예약·운행·가격·산장 운영 정보가 아직 확정되지 않아 오래된 데이터를 확정값처럼 노출할 수 있다. |
| **SUCCESS** | 사용자는 오늘 구간과 숙소 연락 수단을 2탭·10초 안에 찾고, 12개 Day 데이터·예산 합계·오프라인 화면·권한 분리가 자동 테스트를 통과한다. |
| **SCOPE** | MVP: 일정·Day·이동·예산·반응형·한국어 / v1: 예약 상태·지도·고도·오프라인·대안 / 이후: 준비물·여행 기록. |

## 1. 개요

- **한 줄 정의:** 2027년 8월 3일부터 17일까지 성인 10명의 TMB 원정을 위해 전체 일정·12일 트레킹·산장·예약·예산을 공유하는 모바일 우선 PWA.
- **해결하는 문제:** 공식 사이트·산장 홈페이지·교통 사이트·블로그에 흩어진 데이터를 팀의 확정 일정으로 재구성하고, 약한 네트워크에서도 오늘 필요한 정보를 빠르게 제공한다.
- **타깃 사용자:** 리더 1명(계획·편집), 동행 9명(열람), 가족·지인(제한된 공개 열람).
- **플랫폼:** 모바일·태블릿 우선 반응형 웹/PWA. 데스크톱 편집 지원.

## 2. 배경 & 근거

- **시장·경쟁 맥락:** Mon Tour du Mont-Blanc는 산장 검색·가용 캘린더·예약·구간 안내를 제공하지만 특정 팀의 확정 일정·예산·예약 상태 공유가 중심은 아니다. 가이드와 플래너는 일반 정보는 풍부하지만 10명 그룹의 단일 운영 화면을 제공하지 않는다. [조사·기준일 2026-09-09]
- **차별 프레이밍:** 하루 카드에 거리·획득/하강 고도·예상 시간·점심·숙박·지도·예약·대안을 고정하고, 팀의 실제 예약 상태와 재확인 시점을 함께 보여 준다.
- **기존 시스템 맥락:** 구현 저장소와 `bkit.config.json`은 아직 지정되지 않았다. 이 문서는 프로젝트 생성 시 `docs/PRD.md` 정본과 feature PRD를 만드는 source contract로 사용한다.
- **데이터 신뢰도:** 기존 일정·비용은 브리프와 2026-09-09 조사 snapshot이다. 2027 운영·가격·운행 정보는 부록 B의 재확인 규칙을 따른다.

## 3. 목표 (Goals)

- 동행 전원이 출발 전과 산행 중 오늘·내일 구간과 숙소를 30초 이내에 확인한다.
- 리더가 12박 숙소의 예약 우선순위와 상태를 한곳에서 관리하고, 2026년 말까지 모든 숙소에 확정 또는 승인된 대안을 기록한다.
- 항공권 제외 1인당 예산 범위와 근거·기준일을 공유해 참가와 경비 준비 결정을 돕는다.
- 오래된 여행 정보를 확정값처럼 숨기지 않고 출처·기준일·재확인 상태를 노출한다.

### 비목표 (Non-goals)

- 산장 예약 API 연동, 결제·정산, 실시간 GPS 추적, 실시간 날씨 예보는 구현하지 않는다.
- 의료·구조 판단을 대신하지 않으며 비상 연락 정보와 공식 안내 링크만 제공한다.
- MVP에서 회원가입, 다국어 UI, 소셜 피드, UTMB 레이스 기능을 제공하지 않는다.
- Google 지도 링크를 공식 등산 경로 또는 안전 보증으로 취급하지 않는다.

## 4. User Scenarios

### Scenario S1 — 오늘 구간 확인

- **사용자:** 동행 참가자, 휴대폰, 산장 Wi-Fi 또는 약한 LTE
- **상황:** 산장에서 출발 직전
- **목표:** 오늘 거리·고도·시간·점심·숙박·연락 수단 확인
- **흐름:** 홈 진입 → 오늘 카드 자동 강조 → Day 상세 → 숙박·지도·대안 확인
- **완료 조건:** Given 여행 기간의 현지 날짜 When 사용자가 홈을 연다 Then 2탭·10초 안에 오늘 숙박 이름과 검증된 전화 또는 공식 연락 링크가 보인다.

### Scenario S2 — 리더가 예약 상태 관리

- **사용자:** 승인된 리더 계정, 태블릿 또는 PC
- **상황:** 산장 예약 진행·변경·취소
- **목표:** 12박의 공개 상태와 비공개 예약 정보를 갱신
- **흐름:** 관리자 로그인 → Day 숙박 선택 → 미예약/문의/대기/확정/대안 확정 선택 → 예약번호·메모 저장
- **완료 조건:** Given 리더가 인증되었다 When 상태를 저장한다 Then 공개 화면에는 상태만 갱신되고 예약번호·비공개 메모는 리더에게만 보인다.

### Scenario S3 — 예산 확인

- **사용자:** 참가 검토자, 휴대폰
- **상황:** 참가와 준비 금액 결정
- **목표:** 항공권 제외 예산 범위와 근거 확인
- **흐름:** 홈 → 예산 → 항목별 저/중 금액 → 환율·기준일·재확인 상태
- **완료 조건:** Given 예산 데이터가 로드되었다 When 예산 화면을 연다 Then 저/중 합계가 항목 합산값과 일치하고 통화·환율·기준일이 함께 보인다.

### Scenario S4 — 입출국 이동 확인

- **사용자:** 동행 전원
- **상황:** 8월 3일 입국 또는 8월 16~17일 귀국 이동
- **목표:** 항공·기차·버스 구간과 fallback 확인
- **흐름:** 일정 → 이동일 → 구간별 시간·링크·대안 확인
- **완료 조건:** Given 이동일 When 카드를 연다 Then 각 구간의 순서·소요시간·예매 링크·지연 시 fallback이 표시된다.

### Scenario S5 — 오프라인 열람과 복구

- **사용자:** 동행 참가자
- **상황:** 신호가 없거나 외부 서비스가 실패함
- **목표:** 마지막으로 동기화된 일정과 숙박 연락 수단 확인
- **흐름:** 캐시 재진입 → 오프라인 배너 → Day 상세 → 온라인 전용 기능 안내
- **완료 조건:** Given 사용자가 해당 화면을 한 번 열었다 When 네트워크를 끊고 다시 연다 Then 일정·Day·숙박 연락 수단과 마지막 갱신 시각이 표시된다.

### Scenario S6 — 준비물 체크

- **사용자:** 동행 참가자
- **상황:** 출발 전 개인 장비 점검
- **목표:** 준비물 누락 방지
- **흐름:** 준비물 → 카테고리별 항목 체크 → 기기에 자동 저장
- **완료 조건:** Given 준비물 목록이 보인다 When 항목을 체크하고 페이지를 다시 연다 Then 같은 기기에서 체크 상태가 유지된다.

### Scenario S7 — 여행 기록 공유

- **사용자:** 인증된 팀원
- **상황:** 산행 후 사진과 한 줄 기록을 남김
- **목표:** Day별 팀 기록 공유
- **흐름:** Day 상세 → 기록 추가 → 사진·문장 업로드 → 팀 타임라인 확인
- **완료 조건:** Given 팀원이 인증되었다 When 허용 형식·용량의 기록을 저장한다 Then 해당 Day 타임라인에 작성자·시각과 함께 표시된다.

### Scenario S8 — 편집 권한 실패

- **사용자:** 비로그인 방문자
- **상황:** 관리자 URL 또는 편집 API에 접근
- **목표:** 민감한 예약 정보 보호
- **흐름:** 편집 시도 → 인증 안내 → 원래 공개 화면으로 복귀
- **완료 조건:** Given 인증되지 않은 사용자가 편집을 요청한다 When 서버가 요청을 검사한다 Then 401/403을 반환하고 예약번호·비공개 메모를 응답에 포함하지 않는다.

## 5. Functional Requirements

| ID | 판정 가능한 요구사항 | 우선순위 | 시나리오 | 필요 데이터 | 화면 | 검증 방법 |
|---|---|:---:|---|---|---|---|
| FR-001 | 사용자는 2027-08-03부터 2027-08-17까지 15일 일정을 날짜 오름차순으로 볼 수 있어야 한다. | P0 (High) | S1, S4 | C-1, C-2 | 8.1, 8.2, 8.4 | 15개 날짜가 중복·누락 없이 정렬되는 통합 테스트 |
| FR-002 | 12개 트레킹 Day 카드에는 거리·획득·하강·예상시간·점심·숙박·지도·예약 연락 수단이 표시되어야 한다. | P0 (High) | S1 | C-1, C-3, A-1, A-2 | 8.2, 8.3 | 12개 카드의 필수 필드 완전성 테스트 |
| FR-003 | 사용자는 각 Day의 Google 걷기 링크를 한 번 탭으로 새 창에서 열 수 있어야 하며 링크에는 출발지·도착지·walking mode가 있어야 한다. | P0 (High) | S1 | C-3 `mapUrl` | 8.3 | URL 파라미터 단위 테스트와 링크 클릭 E2E |
| FR-004 | 각 숙박에는 공식 예약 링크와 검증된 전화 또는 공식 연락 링크가 표시되어야 하며, 확인되지 않은 전화는 “확인 필요” 상태로 대체되어야 한다. | P0 (High) | S1, S2 | C-3, A-2 | 8.3, 8.7 | 연락 정보 fallback과 외부 링크 테스트 |
| FR-005 | 이동일 카드에는 항공·기차·버스 구간, 소요시간, 예매 링크, 지연 시 fallback이 표시되어야 한다. | P0 (High) | S4 | C-2, A-3 | 8.2, 8.4 | 3개 이동일의 구간·fallback 완전성 테스트 |
| FR-006 | 예산 화면은 항공권 제외 저/중 범위를 항목별로 합산하고 통화·환율·기준일을 표시해야 한다. | P0 (High) | S3 | D-1, A-3 | 8.6 | 항목 합계·10% 예비비·반올림 재계산 테스트 |
| FR-007 | 360px 이상 모바일과 768px 이상 태블릿에서 가로 스크롤이 없어야 하고 상호작용 영역은 최소 44×44px이어야 한다. | P0 (High) | S1, S3 | 11.2 #9 | 8.1~8.8 | Playwright viewport와 axe 검사 |
| FR-008 | 홈 첫 화면은 “걸어야 산다!”, 기간, 인원 10명, 트레킹 약 162.5km, 획득 약 9,610m를 표시해야 한다. | P0 (High) | S1 | C-1 재계산값 | 8.1 | hero 텍스트·지표 렌더링 테스트 |
| FR-009 | 현지 날짜가 여행 기간이면 해당 일정 카드가 강조되고, 기간 밖이면 가장 가까운 시작·종료 안내가 표시되어야 한다. | P1 (Medium) | S1 | A-1 `date`, 11.2 #4 | 8.1, 8.2 | Europe/Paris 경계 날짜 테스트 |
| FR-010 | 리더는 숙박별 상태를 저장할 수 있고 방문자는 상태만 보며 예약번호·비공개 메모는 인증된 리더만 열람할 수 있어야 한다. | P1 (Medium) | S2, S8 | A-2 `Booking` | 8.3, 8.7 | RLS/API 권한 테스트와 상태 동기화 E2E |
| FR-011 | 사용자는 12개 Day를 구분한 전체 루트 개요와 주요 고개·숙박 지점을 볼 수 있어야 한다. | P1 (Medium) | S1 | A-1 `routeGeometry`, C-3 | 8.5 | 12개 구간·주요 마커 수 검사 |
| FR-012 | 각 Day 상세는 출발·주요 고개·도착을 포함한 3개 이상 고도점을 표시해야 한다. | P1 (Medium) | S1 | A-1 `ElevationPoint`, C-3 | 8.3 | Day별 고도점 3개 이상 검사 |
| FR-013 | 한 번 열어 본 일정·Day·연락 정보는 오프라인에서 재열람할 수 있고 마지막 갱신 시각을 표시해야 한다. | P1 (Medium) | S5 | A-4 `CacheManifest` | 8.1~8.4 | 서비스 워커 오프라인 E2E |
| FR-014 | 각 Day에는 우천·피로 시 대안과 112·숙박 연락 수단이 표시되어야 한다. | P1 (Medium) | S1, S5 | C-3 `fallback`, A-2 | 8.3 | Day별 대안·비상 필드 완전성 테스트 |
| FR-015 | 준비물 체크 상태는 사용자 기기의 로컬 저장소에 보존되어야 한다. | P2 (Low) | S6 | A-4 `ChecklistItem` | 8.8 | 체크 후 새로고침 유지 테스트 |
| FR-016 | 인증된 팀원은 Day별 사진 1장과 200자 이하 기록을 저장·열람할 수 있어야 한다. | P2 (Low) | S7 | A-4 `JournalEntry` | 8.8 | 파일 형식·용량·글자 수·권한 테스트 |
| FR-017 | UI는 한국어를 기본으로 하고 산장·지명은 원어를 함께 표시해야 한다. | P0 (High) | S1, S4 | A-1 `nameKo/nameOriginal` | 8.1~8.8 | 필수 명칭의 한국어·원어 병기 검사 |

### 5.x Non-Functional Requirements

| 분류 | 기준 | 측정 방법 |
|---|---|---|
| 성능 | 배포 빌드의 모바일 Lighthouse Performance 90 이상, LCP 2.5초 이하, 홈 최초 전송량 1MB 이하(지연 로딩 지도 제외) | Lighthouse CI, 4G throttling |
| 보안 | 예약번호·비공개 메모는 서버 권한 검사와 Supabase RLS를 모두 통과한 리더에게만 반환, 비밀키 client bundle 0건 | 권한 통합 테스트, bundle secret scan |
| 개인정보 | 공개 화면은 팀원 실명·예약번호·개인 연락처를 노출하지 않고 기본 `noindex`로 배포 | HTML meta 검사, 공개 API snapshot |
| 접근성 | WCAG 2.2 AA, 대비 4.5:1 이상, 키보드 탐색 가능, 터치 영역 44×44px 이상 | axe, Lighthouse Accessibility, 수동 키보드 점검 |
| 오프라인 | 방문한 일정·Day·공식 연락 수단과 마지막 갱신 시각을 캐시하며 지도·예약은 온라인 전용으로 표시 | Playwright offline mode |
| 데이터 신선도 | 외부 사실에는 출처·기준일·상태가 있고 기준일이 지난 P0 데이터는 UI에서 “재확인 필요”로 표시 | seed schema 검사, 만료 날짜 테스트 |
| 용량·한도 | P2 사진은 JPG/PNG/WebP, 10MB 이하, 기록 200자 이하. 일정 seed는 빌드 시 전체 검증 | upload validation, schema validation |

## 6. Success Criteria

| ID | 소프트웨어가 보장할 기준 | 측정 방법 | 현재 PRD 데이터로 검증 가능 | 라벨 |
|---|---|---|:---:|---|
| SC-001 | 테스트 참가자 5명 모두 홈 진입 후 2탭·10초 이내에 오늘 숙박 이름과 전화 또는 공식 연락 링크를 찾는다. | 실제 모바일 사용성 테스트 | 예 | [가설] |
| SC-002 | 12개 Day 모두 거리·획득·하강·시간·점심·숙박·지도·예약 연락 수단 8개 필드가 값 또는 명시적 확인 필요 상태를 가진다. | seed validation | 예 | [추정] |
| SC-003 | 예산의 저/중 소계·예비비·총액이 항목 합계와 일치하고 반올림 오차가 €1 이하이다. | 자동 산술 테스트 | 예 | [확정·출처] |
| SC-004 | 리더가 12개 숙박 상태를 저장하면 공개 화면은 5초 내 상태를 반영하고 예약번호·비공개 메모는 비로그인 응답에서 0건이다. | E2E와 API snapshot | 예 | [가설] |
| SC-005 | 360×640, 768×1024, 1440×900에서 가로 스크롤이 0건이고 주요 터치 요소가 44×44px 이상이다. | Playwright와 axe | 예 | [가설] |
| SC-006 | 방문한 일정과 Day 상세는 네트워크 차단 후 재진입 시 표시되고 마지막 갱신 시각과 온라인 전용 기능 안내가 보인다. | offline E2E | 예 | [가설] |
| SC-007 | 비로그인 사용자의 예약 상세 API 요청은 401/403이며 응답과 client bundle에 예약번호·비밀키가 포함되지 않는다. | 보안 통합 테스트 | 예 | [가설] |
| SC-008 | 일정에는 이동일 3개와 트레킹 Day 12개가 중복·누락 없이 있고 홈의 거리·획득 지표가 Day 합계 162.5km·9,610m와 일치한다. | seed schema와 산술 테스트 | 예 | [추정] |
| SC-009 | 개요 지도는 12개 구간과 주요 숙박·고개를 표시하고, 각 Day 고도 프로파일은 출발·주요 고개·도착 3점 이상을 가진다. | route/elevation seed validation | 아니오 — 검증된 GPX 필요, I-003 적용 | [가설] |
| SC-010 | 12개 트레킹 Day 모두 우천·피로 fallback과 112·숙박 연락 수단을 값 또는 명시적 확인 필요 상태로 가진다. | safety field validation | 예 | [추정] |
| SC-011 | 준비물 항목을 체크한 뒤 새로고침해도 같은 기기에서 상태가 유지된다. | localStorage E2E | 예 | [가설] |
| SC-012 | 팀원은 JPG·PNG·WebP 10MB 이하 사진 1장과 200자 이하 기록만 저장할 수 있고 비허용 입력은 저장되지 않는다. | upload·권한 E2E | 예 | [가설] |
| SC-013 | 모든 일정 카드와 Day 상세의 산장·지명은 한국어와 원어를 함께 표시하고 영어 전용 핵심 UI 라벨이 0건이다. | i18n seed/UI 검사 | 예 | [가설] |

## 7. Edge Cases

| 상황 | 사용자 표시 문구 | 이후 동작 | 로그 |
|---|---|---|---|
| 여행 기간 밖 | “출발까지 D-N” 또는 “원정이 종료되었습니다” | 첫 일정 또는 요약으로 이동 | `trip_date_outside` info |
| Day 데이터 누락 | “이 항목은 확인 중입니다 · 기준일 표시” | 나머지 데이터는 표시하고 관리자 점검 링크 제공 | `day_field_missing` warn |
| 예약 상태 없음 | “미예약” | 공식 예약·연락 링크 표시 | `booking_status_defaulted` info |
| 전화 미검증 | “전화 확인 필요” | 공식 연락/예약 링크를 fallback으로 표시 | `lodging_phone_unverified` warn |
| 외부 지도·예약 링크 실패 | “외부 사이트를 열 수 없습니다” | 주소·좌표·공식 연락 수단 유지, 다시 시도 | `external_link_failed` warn |
| 네트워크 없음 | “오프라인 · 마지막 갱신 시각” | 캐시된 일정 표시, 온라인 기능 비활성 | `offline_cache_served` info |
| 캐시 없음 | “인터넷 연결 후 한 번 열어 주세요” | 재시도 버튼과 비상 정보만 표시 | `offline_cache_miss` warn |
| 숙소 만실·예약 실패 | “대안 숙소 확인 필요” | 승인된 대안과 연락 링크 표시 | `lodging_unavailable` warn |
| 인증 없음 | “리더 로그인이 필요합니다” | 로그인 후 원래 화면으로 복귀 | `admin_auth_required` info |
| 권한 없음 | “이 정보에 접근할 수 없습니다” | 공개 화면으로 이동 | `admin_forbidden` security |
| 동시 편집 | “다른 변경이 먼저 저장되었습니다” | 최신 값 재조회 후 재적용 안내 | `booking_conflict` warn |
| 저장 중 이탈 | “저장되지 않은 변경이 있습니다” | 이탈 확인 또는 저장 | `unsaved_changes` info |
| 예산 기준일 만료 | “금액을 다시 확인해 주세요” | 이전 값은 참고용으로 유지 | `budget_stale` warn |
| 사진 형식·용량 초과 | “JPG·PNG·WebP 10MB 이하만 가능합니다” | 파일 재선택 | `journal_upload_rejected` warn |

## 8. 화면 · 정보 구조 (Page UI Checklist)

이동 구조: 홈 → 전체 일정 → Day/이동일 상세 → 지도·예산·준비물·기록. 관리자 로그인 후 같은 Day 상세에서 예약 편집 패널을 연다.

### 8.1 홈

- **목적:** 원정 핵심 가치와 오늘 필요한 진입점을 한 화면에서 제공
- [ ] 히어로: 라이선스 확인 이미지 또는 알파인 그라디언트, “걸어야 산다!”
- [ ] 지표: 2027-08-03~17, 10명, 약 162.5km, 약 9,610m
- [ ] 오늘 카드: 현지 날짜 기준 Day 또는 출발 카운트다운
- [ ] 빠른 링크: 일정, 예산, 지도, 준비물
- **상태:** 로딩 skeleton · 빈 seed 오류 안내 · 오류 재시도 · 성공 오늘 카드와 지표

### 8.2 전체 일정

- **목적:** 이동일 3개와 트레킹 Day 12개를 날짜 순으로 탐색
- [ ] 필터: 전체/이동/트레킹, 국가 배지
- [ ] 카드: 날짜, 구간, 거리, 고도, 시간, 숙박 상태
- [ ] 오늘 강조: 현지 날짜와 기간 밖 fallback
- **상태:** 로딩 카드 skeleton · 빈 “일정 없음” · 오류 캐시 fallback · 성공 15개 카드

### 8.3 Day 상세

- **목적:** 하루 산행·숙박·대안 정보를 출발 전에 확인
- [ ] 핵심 지표: 거리, 획득, 하강, 시간
- [ ] 경로: 출발·주요 고개·도착, 고도 프로파일
- [ ] 식사·숙박: 원어명, 연락, 예약 링크, 공개 상태
- [ ] 지도: Google walking 링크와 “공식 등산 경로 아님” 안내
- [ ] 안전: 우천·피로 대안, 112, 확인 기준일
- **상태:** 로딩 skeleton · 빈 확인 필요 라벨 · 오류 캐시 데이터 · 성공 전체 필드

### 8.4 이동일 상세

- **목적:** 항공·기차·버스 순서와 지연 fallback 확인
- [ ] 구간 타임라인: 출발/도착, 예상 시간, 예약 링크
- [ ] fallback: 제네바 1박 또는 승인된 이동안
- [ ] 데이터 상태: 확정/조사/추정과 재확인일
- **상태:** 로딩 skeleton · 빈 “시간 확인 필요” · 오류 저장된 계획 · 성공 구간 타임라인

### 8.5 개요 지도

- **목적:** 12개 Day와 주요 고개·숙박 위치의 전체 관계 파악
- [ ] 12개 색 구분 구간
- [ ] 고개·숙박 마커와 Day 연결
- [ ] 라이선스·출처·기준일
- **상태:** 로딩 정적 preview · 빈 지도 준비 중 · 오류 Day 목록 fallback · 성공 상호작용 지도

### 8.6 예산

- **목적:** 1인당 저/중 비용과 산정 근거 확인
- [ ] 항목 표: 저/중, 통화, 근거
- [ ] 합계: 소계, 10% 예비비, 총액
- [ ] 환율·기준일·재확인 상태
- **상태:** 로딩 skeleton · 빈 계산 불가 안내 · 오류 마지막 계산값 · 성공 자동 합계

### 8.7 관리자 예약

- **목적:** 리더가 공개 상태와 비공개 예약 정보를 관리
- [ ] 인증: 허용 이메일 magic link
- [ ] 편집: 상태, 예약번호, 메모, 대안 숙소, 갱신 시각
- [ ] 공개 미리보기: 방문자에게 보이는 상태
- **상태:** 로딩 권한 확인 · 빈 12개 미예약 초기값 · 오류 저장 재시도 · 성공 저장 확인

### 8.8 준비물·기록

- **목적:** P2 개인 준비와 팀 기록 지원
- [ ] 준비물: 카테고리, 체크, 로컬 저장
- [ ] 기록: Day, 사진 1장, 200자, 작성자·시각
- **상태:** 로딩 skeleton · 빈 첫 항목 안내 · 오류 로컬 임시 보관 · 성공 체크/업로드 확인

## 9. 브랜드 & 디자인

- **서비스 이름:** TMB 2027
- **한 줄 무드:** 알프스 고개 위의 맑은 아침 — 큰 풍경, 넉넉한 여백, 한 손으로 읽히는 굵은 숫자.
- **보이스:** 짧고 단단한 한국어. 숫자를 먼저 쓰고 다음 행동을 명확히 안내한다.
- **UI 카피:** Do “오늘 13km · 고개 하나” / Don't “완벽한 최고의 여정”
- **시각 시스템 기본값:** 알파인 블루 `#0F5D7A`, 설백 `#F7F8F5`, 바위 회색 `#56616A`, 안전 포인트 `#C84A36`. 본문은 시스템 sans-serif, 숫자는 tabular-nums. 카드 radius 16px, spacing 8px scale.
- **이미지 규칙:** 팀 소유 사진 또는 상업 이용 가능한 라이선스만 사용하고 출처를 메타데이터에 기록한다. 확정 이미지가 없으면 그라디언트와 지도 없는 레이아웃으로 구현한다.

## 10. 범위 / 비범위 & 우선순위 · 납기

- **MVP (P0):** FR-001~008, FR-017 · 목표일 **2026-10-01 [기본값]**
- **v1 (P0 + P1):** MVP + FR-009~014 · 목표일 **2026-10-10 [기본값]**
- **이후 (P2):** FR-015~016 · TMB 출발 전 별도 결정
- **Out of scope:** 예약 API·결제·정산·실시간 날씨/GPS·회원가입·다국어·의료 판단
- **외부 일정과의 관계:** 2027 시즌 예약 오픈이 2026년 10월 중순이라는 기존 조사 가정을 기준으로 v1을 그 전에 준비한다. 실제 오픈일은 부록 B 규칙으로 재확인한다.

## 11. Assumptions

### 11.1 레벨·스택

- **레벨:** Dynamic(풀스택)
- **스택:** Next.js App Router + TypeScript + Supabase(Postgres/Auth/Storage) + Vercel + PWA service worker [기본값]

### 11.2 시스템 가정 10칸

| # | 칸 | 결정 | 상태 | 근거·이유 |
|---|---|---|---|---|
| 1 | 데이터 저장 위치와 수명 | 일정·예산 seed는 versioned JSON, 예약·기록은 Supabase Postgres, 사진은 Supabase Storage. 원정 종료 후 1년 보관 뒤 export/삭제 결정 | [기본값] | 정적 열람과 제한된 동적 편집을 분리 |
| 2 | 로그인·열람·편집 주체와 권한 | 공개 열람은 unlisted/noindex. MVP 편집은 `ADMIN_EMAIL` 1개 magic-link 계정, P2 기록은 allowlist 팀원 magic link. 예약번호·메모는 private | [기본값] | 기존 “리더 1인 편집”을 지키며 P2 기록 권한을 분리 |
| 3 | 호스팅·배포 환경 | Vercel production + preview, Supabase managed project | [기본값] | 선택한 스택의 최소 운영 조합 |
| 4 | 시간대·로케일 | 일정 판정 `Europe/Paris`, UI `ko-KR`, 저장 시각 UTC | [기본값] | 프랑스·이탈리아·스위스가 동일한 하계 시간대 사용 |
| 5 | 통화·환율·기준일 | 표시 기준 EUR, CHF는 1 CHF=1.07 EUR, 기준일 2026-09-09. 결제 전 재확인 | [기본값] | 기존 조사값을 표시용 기본값으로 보존 |
| 6 | 지원 언어 | 한국어 UI, 산장·지명 원어 병기 | [확정] | 기존 FR-017 |
| 7 | 콘텐츠 출처와 권한 | 팀 소유 또는 상업 이용 허용 이미지·지도만 사용, 출처 저장. 미확정 시 이미지 없이 구현 | [기본값] | 저작권 리스크 차단 |
| 8 | 외부 서비스 실패 시 동작 | 캐시된 일정·주소·공식 연락 링크 유지, 외부 링크 실패 안내와 재시도 제공 | [확정] | 기존 Edge Cases와 S5 |
| 9 | 성능·용량·접근성 기준 | Lighthouse 성능 90+, LCP 2.5초 이하, 홈 1MB 이하, WCAG 2.2 AA, 터치 44px | [기본값] | 모바일·약한 네트워크 우선 |
| 10 | 수치·외부 사실 출처와 기준일 | 부록 B registry로 관리하고 만료 시 “재확인 필요” 표시 | [기본값] | 2027 데이터가 아직 변동 가능 |

### 11.3 제품 가정

- 트레킹은 반시계 방향이며 리프트·케이블카를 사용하지 않는다. [확정]
- 홈 지표는 상세 일정 재계산값인 162.5km·획득 9,610m를 반올림해 표시한다. [추정]
- 10명 전원이 공개 상태를 보되 개인 이름과 예약번호는 공개하지 않는다. [기본값]
- Google 지도 링크는 편의 기능이며 실제 길 찾기는 공식 지도·GPX·현장 표지를 따른다. [확정]
- 기존 2026-09-09 여행 데이터는 seed snapshot이며 2027 예약·운행 확정값이 아니다. [확정]

## 12. 오픈 이슈 / 리스크 [구현자]

| ID | 항목 | 기본값 | 연쇄 영향 | 재확인 시점 |
|---|---|---|---|---|
| I-001 | 프로젝트 bootstrap과 배포 연결 | Next.js + Supabase + Vercel, 환경변수 schema 포함 | 데이터 모델·인증·CI | 구현 시작 |
| I-002 | 오프라인 cache 무효화 | app-shell은 cache-first, 일정 JSON은 stale-while-revalidate, 저장 응답은 network-only | FR-013·SC-006 | Design |
| I-003 | 전체 지도 구현 | 검증된 GPX 전에는 정적 개요 SVG와 지점 마커, GPX 승인 후 MapLibre 적용 | FR-011·012 | GPX 확보 시 |
| I-004 | 예약 데이터 권한 | Supabase RLS + server action 이중 검사, 공개 view는 상태 필드만 노출 | FR-010·SC-007 | Design |
| I-005 | 외부 링크 상태 검사 | 배포 전 link checker, 런타임에서는 마지막 검증일과 fallback 표시 | FR-003~005 | 각 release |

## 13. 작성자 결정 요청 [작성자]

| ID | 상태 | 결정 | 선택지 | 추천값과 이유 | fallback | 연쇄 영향 |
|---|---|---|---|---|---|---|
| D-001 | Open | 2027-08-03 늦은 도착 이동안 | ① 제네바 1박 ② 프라이빗 미니버스 | ① — 연착·10인 이동 리스크가 낮음 | 제네바 1박으로 seed 유지 | 이동일·숙박·예산 |
| D-002 | Open | MVP/v1 목표일 | ① 10/01·10/10 ② 다른 날짜 | ① — 예상 예약 오픈 전에 테스트 가능 | 2026-10-01·10-10 | 일정·feature 순서 |
| D-003 | Open | 관리자 이메일 | ① 리더 이메일 1개 ② 공동 관리자 2개 | ① — 권한 모델이 단순함 | `ADMIN_EMAIL`이 없으면 production 편집 비활성 | 인증·운영 |
| D-004 | Open | 사이트 공개 범위 | ① unlisted+noindex ② 완전 공개 ③ 초대 사용자만 | ① — 공유는 쉽고 검색 노출은 줄임 | unlisted+noindex | 개인정보·배포 |
| D-005 | Open | 히어로 이미지 | ① 팀 소유 사진 ② 라이선스 이미지 ③ 이미지 없음 | ① — 원정 정체성과 권리 확인이 가장 명확 | 이미지 없이 그라디언트 | 디자인·성능 |

## 14. feature 분해표

| 순서 | feature 슬러그 | 포함 FR | 관련 SC | 의존 | 규모 | 검증 가능한 완료점 |
|:---:|---|---|---|---|:---:|---|
| 1 | itinerary-core | FR-001, FR-002, FR-005, FR-008, FR-009, FR-017 | SC-001, SC-002, SC-008, SC-013 | — | 중 | 15일·12 Day seed가 홈과 일정에 정확히 렌더링 |
| 2 | day-detail | FR-003, FR-004, FR-014 | SC-001, SC-002, SC-010 | itinerary-core | 중 | 지도·숙박·대안·연락 fallback이 Day별 동작 |
| 3 | budget-view | FR-006 | SC-003 | itinerary-core | 소 | 저/중 예산이 자동 재계산되고 기준일 표시 |
| 4 | responsive-pwa | FR-007, FR-013 | SC-005, SC-006 | itinerary-core, day-detail | 중 | viewport·접근성·오프라인 테스트 통과 |
| 5 | booking-tracker | FR-010 | SC-004, SC-007 | itinerary-core | 중 | 공개 상태와 private 예약정보 권한 분리 |
| 6 | route-visuals | FR-011, FR-012 | SC-009 | itinerary-core | 중 | 12구간 지도와 Day 고도점 검증 |
| 7 | packing-checklist | FR-015 | SC-011 | responsive-pwa | 소 | 로컬 체크 상태 유지 |
| 8 | trip-journal | FR-016 | SC-012 | booking-tracker | 중 | 인증 팀원의 제한된 사진·기록 업로드 |

## 15. bkit 실행 명세

- **확인한 bkit 계약:** v2.1.38 reference, 2026-09-16. 실제 프로젝트 생성 후 로컬 `bkit.config.json`이 우선한다.
- **현재 source PRD:** `G:\내 드라이브\CEO_AI_Coding\CEO_18기\tmb2027prd.md`
- **프로젝트 정본 경로:** `docs/PRD.md`
- **feature 경로:** `docs/00-pm/FEATURE_SLUG.prd.md` 또는 로컬 `pdca.docPaths.pm`의 우선 경로
- **설정:** `matchRateThreshold` 90 · `maxIterations` 5 · `autoIterate` true · `requireDesignDoc` true
- **PM 단계:** 이 PRD가 PM 계약을 대체하므로 `/pdca pm`을 생략하고 `/pdca plan`부터 시작한다.
- **첫 실행:** `/pdca plan itinerary-core`
- **feature 실행:** `/pdca plan FEATURE_SLUG` → `/pdca design FEATURE_SLUG` → `/pdca do FEATURE_SLUG` → `/pdca analyze FEATURE_SLUG` → 기준 미달 시 autoIterate → `/pdca report FEATURE_SLUG`
- **Sprint 실행:** `/sprint master-plan tmb-2027 --features itinerary-core,day-detail,budget-view,responsive-pwa,booking-tracker,route-visuals,packing-checklist,trip-journal`
- **완료:** match rate 90 이상, 해당 feature의 SC 통과, 적용되는 Edge Case 전 행 동작, critical 보안 결함 0건
- **중단:** 5회 반복 후 미달, private 데이터 공개, P0 외부 데이터 만료, 또는 13장 fallback이 편집 비활성인 상태에서 production 편집 요청

## 부록 A. 데이터 계약

### A-1. Trip · Day · ElevationPoint

| 엔티티 | 필드 | 타입 | 필수 | 값·출처 | 기준일 | 라벨 |
|---|---|---|:---:|---|---|---|
| Trip | `id, name, slogan` | string | 예 | `tmb-2027`, TMB 2027, 걸어야 산다! | 2026-09-09 | [확정·출처] |
| Trip | `startDate, endDate, partySize` | date/date/integer | 예 | 2027-08-03, 2027-08-17, 10 | 2026-09-09 | [확정·출처] |
| Trip | `distanceKm, gainM, lossM` | number | 예 | 162.5, 9610, 9585 재계산값 | 2026-09-16 | [추정] |
| Day | `id, sequence, date, type` | string/int/date/enum | 예 | 15일 seed, `travel|trek` | 2026-09-09 | [조사·기준일] |
| Day | `nameKo, nameOriginal, country` | string | 예 | 부록 C | 2026-09-09 | [조사·기준일] |
| Day | `distanceKm, gainM, lossM, duration` | number/number/number/string | 트레킹 | 부록 C, GPX ±10% 허용 | 2026-09-09 | [추정] |
| Day | `lunch, lodgingId, mapUrl, fallback, emergency` | string/reference/url/text/text | 트레킹 | 부록 C | 2026-09-09 | [조사·기준일] |
| Day | `sourceUrl, sourceCheckedAt, verificationStatus` | url/date/enum | 외부 사실 | 운영 데이터 registry | release 전 | [기본값] |
| ElevationPoint | `dayId, sequence, label, altitudeM` | reference/int/string/number | P1 | 출발·고개·도착 3점 이상 | GPX 확인 시 | [가설] |
| DayRoute | `dayId, routeGeometry, source, license` | reference/GeoJSON/string/string | P1 | 검증된 GPX 후 입력 | GPX 확인 시 | [가설] |

### A-2. Lodging · Booking

| 엔티티 | 필드 | 타입 | 공개 | 값·출처 | 라벨 |
|---|---|---|:---:|---|---|
| Lodging | `id, nameOriginal, location` | string | 예 | 부록 C | [조사·기준일] |
| Lodging | `bookingUrl, contactUrl, verifiedPhone` | url/url/string nullable | 예 | 공식 원본 확인 후 입력 | [조사·기준일] |
| Lodging | `price, currency, season, checkedAt` | number/enum/string/date | 예 | 2025~2026 조사 snapshot | [조사·기준일] |
| Booking | `lodgingId, status` | reference/enum | 예 | `unbooked|inquiry|waitlist|confirmed|alternative` | [기본값] |
| Booking | `confirmationRef, privateMemo` | string/text | 아니오 | 리더 입력, RLS 보호 | [확정] |
| Booking | `updatedAt, updatedBy, version` | timestamp/reference/integer | 상태 시각만 공개 | 동시 편집 제어 | [기본값] |

### A-3. TravelLeg · Budget

| 엔티티 | 필드 | 타입 | 필수 | 값·출처 | 라벨 |
|---|---|---|:---:|---|---|
| TravelLeg | `dayId, sequence, mode, origin, destination` | ref/int/enum/string/string | 예 | 부록 C-2 | [조사·기준일] |
| TravelLeg | `departAt, arriveAt, duration, bookingUrl` | datetime/datetime/string/url | 예 | 2027 확정 전 재검증 | [추정] |
| TravelLeg | `fallback, checkedAt` | text/date | 예 | 제네바 1박 기본 | [기본값] |
| BudgetItem | `category, lowEur, midEur, basis` | string/number/number/text | 예 | 부록 D | [조사·기준일] |
| BudgetSummary | `subtotal, contingencyRate, total` | number/number/number | 예 | 저 1460+10%=1606, 중 2342+10%=2576.2 | [확정·출처] |
| ExchangeRate | `pair, rate, checkedAt` | string/number/date | CHF 항목 | CHF/EUR 1.07, 2026-09-09 | [조사·기준일] |

### A-4. Client state · Journal

| 엔티티 | 필드 | 타입 | 저장 위치 | 라벨 |
|---|---|---|---|---|
| CacheManifest | `version, cachedAt, routes, sourceUpdatedAt` | string/date/list/date | 브라우저 Cache Storage | [기본값] |
| ChecklistItem | `id, category, label, checked` | string/string/string/bool | 브라우저 localStorage | [기본값] |
| JournalEntry | `id, dayId, authorId, text, imageUrl, createdAt` | string/ref/ref/string/url/timestamp | Supabase, P2 | [가설] |
| AdminUser | `id, email, role` | string/string/enum | Supabase Auth, private | [기본값] |
| TeamMember | `id, email, role, enabled` | string/string/enum/bool | Supabase Auth allowlist, P2 | [기본값] |

## 부록 B. 외부 사실 확인

| 사실 | 현재 근거 | 기준일 | 재확인 시점 | 영향받는 FR |
|---|---|---|---|---|
| bkit v2.1.38 docPaths·90점·5회·autoIterate | 공식 `ww-w-ai/bkit-claude-code` 설정 | 2026-09-16 | 프로젝트 생성 및 bkit 업데이트 시 | 15장 |
| 2027 TMB 예약 오픈일 | 2026 시즌이 2025-10-15에 열렸다는 기존 조사, 2027 일정은 미확정 | 2026-09-09 | 2026-09-20부터 주 1회 | FR-004, FR-010 |
| 15일 항공·이동 시각 | 사용자 브리프와 2026-09-09 조사 | 2026-09-09 | 항공권·교통 예약 직전과 출발 30일 전 | FR-001, FR-005 |
| Croix du Bonhomme 2026-08-17~2029 봄 폐쇄 | 기존 PRD의 FFCAM 조사 메모, 원본 링크 미기록 | 2026-09-09 | Day 2·3 확정 전 | FR-002, FR-014 |
| 12개 Day 거리·고도·시간 | 복수 2차 자료 교차, GPX ±10% | 2026-09-09 | 검증된 GPX 확보 시 | FR-002, FR-008, FR-012 |
| 산장 가격·운영·10명 수용 | 2025~2026 요금과 기존 조사 | 2026-09-09 | 각 산장 예약 오픈 시 | FR-004, FR-006, FR-010 |
| 산장 전화·공식 연락 수단 | 전화번호 미수록, 링크 일부 보유 | 2026-09-09 | 예약 문의 전 | FR-004, SC-001 |
| SBB 단체권·Supersaver 조건 | 기존 조사 snapshot | 2026-09-09 | 티켓 판매 개시 시 | FR-005, FR-006 |
| CHF/EUR 1.07, EUR/KRW 1500 | 예산용 가정 | 2026-09-09 | 결제·예산 공유 시 | FR-006 |
| Google walking URL과 실제 산길의 차이 | 기존 PRD 경고 | 2026-09-09 | GPX/공식 지도 확보 시 | FR-003, FR-011 |
| 히어로·지도 이미지 사용권 | 아직 확정 자료 없음 | 2026-09-16 | 디자인 asset 채택 전 | FR-007, 9장 |

## 부록 C. 기존 조사 기반 일정·예약 seed data
> 기준일 2026-09-09. 거리·고도·시간은 공식 사이트·산장 홈페이지·복수 트레킹 가이드(AllTrails, outdooractive, bergfex, visorando, tmb-guide, Moon & Honey 등) 교차 근사값이며 GPX 기준 ±10% 오차를 허용한다. 가격은 2025~2026 시즌 하프보드(저녁·아침) 1인 기준. 방향: 반시계(레주슈 → 프랑스 → 이탈리아 → 스위스 → 샤모니). 전 구간 리프트·케이블카 미사용.
> "예약" 열의 **포털**은 공식 플랫폼 Mon Tour du Mont-Blanc(montourdumontblanc.com) 온라인 예약 가능, **자체**는 산장 홈페이지·이메일·폼 예약을 뜻한다.
> Google 걷기 지도는 출발·도착(경유지 1곳) 기준 링크다. Google 지도는 산길을 도로로 우회시키는 경우가 있으므로 거리·시간은 이 표를, 실제 길 찾기는 공식 지도·GPX를 기준으로 한다.

### C-1. 요약(트레킹 12일)

| Day | 날짜 | 구간 | 거리 | 획득 | 하강 | 시간 | 숙박 |
|:---:|---|---|---:|---:|---:|---:|---|
| 1 | 8/4(수) | 레주슈 → 콜 드 보자 → 레 콩타민 | 16.5 km | +880 m | −800 m | 5~6 h | Chalet-Hôtel Gai Soleil |
| 2 | 8/5(목) | 레 콩타민 → 낭 보랑 → 라 발므 | 9 km | +550 m | −0 m | 3 h | Refuge de la Balme |
| 3 | 8/6(금) | 라 발므 → 콜 뒤 보놈 → 콜 데 푸르 → 모테 | 15 km | +1,000 m | −900 m | 6~6.5 h | Refuge des Mottets |
| 4 | 8/7(토) | 모테 → 콜 드 라 세뉴 → 엘리자베타 → 콩발 호수 → 메종 비에유 | 16.3 km | +1,200 m | −1,100 m | 6.5~7 h | Rifugio Maison Vieille |
| 5 | 8/8(일) | 메종 비에유 → 쿠르마예 → 베르토네 | 9.2 km | +830 m | −750 m | 5 h | Rifugio Bertone |
| 6 | 8/9(월) | 베르토네 → 보나티 → 아르누바 → 엘레나 | 15 km | +750 m | −700 m | 5~5.5 h | Rifugio Elena |
| 7 | 8/10(화) | 엘레나 → 그랑 콜 페레 → 라 푈 → 라 풀리 | 13.5 km | +480 m | −930 m | 5 h | Hôtel Edelweiss |
| 8 | 8/11(수) | 라 풀리 → 프라 드 포르 → 샹페 호수 | 15 km | +420 m | −565 m | 4.5~5 h | Pension en Plein Air |
| 9 | 8/12(목) | 샹페 → 보빈 → 콜 드 라 포르클라 → 트리앙 | 16 km | +740 m | −680 m | 6 h | Auberge Mont-Blanc |
| 10 | 8/13(금) | 트리앙 → 콜 드 발므 → 에귀예트 데 포제트 → 트레르샹 | 13 km | +1,070 m | −1,170 m | 5.5 h | Auberge La Boërne |
| 11 | 8/14(토) | 트레르샹 → 사다리 구간 → 라크 블랑 → 라 플레제르 | 11 km | +950 m | −500 m | 5 h | Refuge de la Flégère |
| 12 | 8/15(일) | 라 플레제르 → 르 브레방 → 벨라샤 → 샤모니 | 13 km | +740 m | −1,490 m | 6 h | 샤모니 호텔 |
| | | **합계** | **약 163 km** | **약 9,600 m** | **약 9,600 m** | | |

- 하루 평균 13.5 km · 획득 800 m. 상한(20 km · 1,000 m)을 넘는 날은 Day 4(획득 1,200 m 추정)뿐이며 Day 2·5·11은 회복일 성격이다.
- 8/5~8/14 트레킹 숙박 11박 중 마을형 숙소 4박(레 콩타민·라 풀리·샹페·트리앙, 개인실 가능) + 산장 7박(도미토리 기본).

### C-2. 이동일

**8/3(화) 인천 → 취리히 → 제네바**
- KE ICN 11:05 → ZRH 17:25(확정). 입국·수하물 약 60~75분.
- SBB 취리히공항 → 제네바 코르나뱅: 직통 IC 약 2h50~3h(매시 :08/:15/:48 출발, 2등석 정가 약 CHF 88~90, 10인 이상 단체권 30% 할인·출발 2영업일 전 명단 필요, Supersaver CHF 26~29부터). 18:48 또는 19:08/19:15 열차 → 제네바 21:45~22:15 도착.
- **권장: 제네바 1박**(코르나뱅 인근 3성, 실당 €150~180 추정). 대안: 8~10인승 프라이빗 미니버스 사전 예약(Alpybus·Mountain Drop-offs·Chamonix Valley Transfers·XC Chamonix, 1인 €30~45 추정·견적 필요).
- 예매: SBB https://www.sbb.ch/en · FlixBus https://www.flixbus.com · BlaBlaCar Bus https://www.blablacar.co.uk/bus · Alpybus https://www.alpybus.com

**8/4(수) 아침 제네바 → 샤모니 → 레주슈 (Day 1 출발)**
- 제네바 → 샤모니 버스 약 1h25~1h35(FlixBus·BlaBlaCar €12~27). 07:00~08:00대 출발 → 샤모니 09:30 전후.
- 샤모니 → 레주슈: 계곡 버스·Mont-Blanc Express 열차 20~25분(숙박객 카드 Carte d'hôte로 무료, 없으면 편도 €1.5~3). 10:30~11:00 레주슈 출발 → 17:00 레 콩타민 도착 목표.

**8/16(월) 샤모니 → 제네바 → 취리히**
- 샤모니 09:30~10:00 버스 → 제네바 11:30 → IC 열차 → 취리히 15:00 전후. 취리히 중앙역 인근 3성 1박(실당 $210~290). 저녁 자유.

**8/17(화) 취리히 → 인천**
- 취리히 중앙역 → 공항 열차 10~15분. 16:00 공항 도착, KE ZRH 18:40 → ICN 익일 14:10(확정).

### C-3. Day별 상세

**Day 1 · 8/4(수) · 레주슈(Les Houches, 1,010 m) → 콜 드 보자(Col de Voza, 1,653 m) → 레 콩타민-몽주아(Les Contamines-Montjoie, 1,164 m)** 🇫🇷
- 거리 16.5 km · 획득 +880 m · 하강 −800 m · 5~6 h (벨뷰 케이블카 미사용, 도보 등반)
- 점심: Hôtel Le Prarion(1,860 m, 파노라마 레스토랑) https://www.prarion.com/en/
- 숙박: Chalet-Hôtel Gai Soleil(3성, 개인실 가능) · 하프보드 약 €85/인, 더블 €110~150(연도 미확인) · 예약 **자체** https://www.gaisoleil.com/en/
- 지도: https://www.google.com/maps/dir/?api=1&origin=Les+Houches,+France&destination=Les+Contamines-Montjoie,+France&waypoints=Col+de+Voza&travelmode=walking
- 대안: 우천 시 Col de Tricot 변형 금지(더 험함). 피로 시 Le Champel에서 계곡 버스.

**Day 2 · 8/5(목) · 레 콩타민 → 노트르담 드 라 고르주 → 낭 보랑(Nant Borrant, 1,460 m) → 라 발므(Refuge de la Balme, 1,706 m)** 🇫🇷
- 거리 약 9 km · 획득 +550 m · 하강 −0 m · 3 h (로마 가도 경유, 회복일)
- 점심: Refuge de Nant Borrant(1,460 m)
- 숙박: Refuge de la Balme · 4~6인실 €75, 12인실 €68, 더블 개인실 €180+€80 · 예약 **포털** https://www.montourdumontblanc.com/fr/refuges/refuge-de-la-balme
- 지도: https://www.google.com/maps/dir/?api=1&origin=Les+Contamines-Montjoie,+France&destination=Refuge+de+la+Balme,+Les+Contamines-Montjoie&waypoints=Notre-Dame+de+la+Gorge&travelmode=walking
- 비고: 원래 표준 2일차(레 콩타민 → 레 샤피외 19 km, +1,350 m)는 상한 초과이고, 중간 산장 **Croix du Bonhomme(2,443 m)가 2026-08-17부터 2029년 봄까지 개보수로 완전 폐쇄**(FFCAM 공지)라 2일 분할로 재구성했다.

**Day 3 · 8/6(금) · 라 발므 → 콜 뒤 보놈(2,329 m) → 콜 드 라 크루아 뒤 보놈(2,479 m) → 콜 데 푸르(Col des Fours, 2,665 m, TMB 최고점) → 모테(Refuge des Mottets, 1,870 m)** 🇫🇷
- 거리 약 15 km · 획득 약 +1,000 m · 하강 약 −900 m · 6~6.5 h
- 점심: 도시락(라 발므에서 전날 주문, €10~16). 크루아 뒤 보놈 산장은 폐쇄라 매점 이용 불가.
- 숙박: Refuge des Mottets · 대형 도미토리 €60, 4인실 €80 (2026, 6/10~9/20 운영) · 예약 **포털** https://www.montourdumontblanc.com/en/refuges/refuge-des-mottets
- 지도: https://www.google.com/maps/dir/?api=1&origin=Refuge+de+la+Balme,+Les+Contamines-Montjoie&destination=Refuge+des+Mottets,+Bourg-Saint-Maurice&waypoints=Col+du+Bonhomme&travelmode=walking
- 대안(악천후): 콜 데 푸르 대신 레 샤피외(Les Chapieux)로 하강, Auberge de la Nova에서 점심(하프보드 €70~91, 포털 예약) 후 도로로 모테까지 +2 h. 콜 데 푸르 남쪽 하강은 초여름 잔설·급경사 주의.

**Day 4 · 8/7(토) · 모테 → 콜 드 라 세뉴(Col de la Seigne, 2,516 m, 🇫🇷→🇮🇹) → 리푸조 엘리자베타(2,195 m) → 콩발 호수(Lac Combal, 1,950 m) → 몽 파브르 발코니 → 콜 셰크루이·메종 비에유(Rifugio Maison Vieille, 1,956 m)** 🇮🇹
- 거리 16.3 km · 획득 약 +1,200 m(추정, 상한 초과 가능) · 하강 약 −1,100 m · 6.5~7 h
- 점심: Rifugio Elisabetta(2,195 m, 자체 예약·도시락 €10) https://www.rifugioelisabetta.com/
- 숙박: Rifugio Maison Vieille · 도미토리 하프보드 €75(2025) · 예약 **포털** https://www.montourdumontblanc.com/en/refuges/rifugio-maison-vieille
- 지도: https://www.google.com/maps/dir/?api=1&origin=Refuge+des+Mottets,+Bourg-Saint-Maurice&destination=Rifugio+Maison+Vieille,+Courmayeur&waypoints=Rifugio+Elisabetta+Soldini&travelmode=walking
- 대안: 피로 시 콩발 호수에서 발 베니 계곡길로 우회(발코니 구간 생략), 비상 시 발 베니 버스로 쿠르마예 이동 후 다음 날 조정.

**Day 5 · 8/8(일) · 메종 비에유 → 돌론·쿠르마예(Courmayeur, 1,224 m) → 리푸조 베르토네(Rifugio Bertone, 1,989 m)** 🇮🇹
- 거리 9.2 km · 획득 +830 m · 하강 −750 m · 5 h (쿠르마예까지 1h45 하강, 시내 점심·보급 2h 여유)
- 점심: 쿠르마예 시내(이탈리아 식당, 현금 인출·약국·보급)
- 숙박: Rifugio Bertone · 하프보드 €70~110(2~4인실, 2026) · 예약 **포털** https://www.montourdumontblanc.com/en/refuges/rifugio-g-bertone
- 지도: https://www.google.com/maps/dir/?api=1&origin=Rifugio+Maison+Vieille,+Courmayeur&destination=Rifugio+Bertone,+Courmayeur&waypoints=Courmayeur&travelmode=walking

**Day 6 · 8/9(월) · 베르토네 → 발 페레 발코니 → 리푸조 보나티(Rifugio Bonatti, 2,025 m) → 아르누바(Arnouvaz, 1,769 m) → 리푸조 엘레나(Rifugio Elena, 2,062 m)** 🇮🇹
- 거리 15 km · 획득 약 +750 m · 하강 약 −700 m · 5~5.5 h (몽블랑 동면·그랑드 조라스 조망의 명 발코니 길)
- 점심: Rifugio Bonatti https://www.rifugiobonatti.it/
- 숙박: Rifugio Elena · 도미토리 €70, 2~4인실 €82(2026) · 예약 **자체** https://www.rifugioelena.it/
- 지도: https://www.google.com/maps/dir/?api=1&origin=Rifugio+Bertone,+Courmayeur&destination=Rifugio+Elena,+Courmayeur&waypoints=Rifugio+Bonatti&travelmode=walking
- 대안: 엘레나 만실 시 보나티 숙박(도미토리 €75·2~4인실 €95, 폼 예약 1건 최대 10명) 후 Day 7을 20 km로 연장.

**Day 7 · 8/10(화) · 엘레나 → 그랑 콜 페레(Grand Col Ferret, 2,537 m, 🇮🇹→🇨🇭) → 알파주 라 푈(La Peule, 2,071 m) → 라 풀리(La Fouly, 1,600 m)** 🇨🇭
- 거리 약 13.5 km · 획득 +480 m · 하강 −930 m · 5 h
- 점심: Alpage de La Peule(라클레트·크루트, 현금 권장) https://www.valais.ch/en/taste/activities/gastronomy/alpine-pastures-with-snack-bars/alpage-de-la-peule
- 숙박: Hôtel Edelweiss · 도미토리 하프보드 CHF 95, 트윈 CHF 145~170/인 · 예약 **포털** https://www.montourdumontblanc.com/en/refuges/hotel-edelweiss (대안: Auberge des Glaciers 도미토리 CHF 97)
- 지도: https://www.google.com/maps/dir/?api=1&origin=Rifugio+Elena,+Courmayeur&destination=La+Fouly,+Switzerland&waypoints=Grand+Col+Ferret&travelmode=walking

**Day 8 · 8/11(수) · 라 풀리 → 프라 드 포르(Praz de Fort) → 이세르(Issert) → 샹페 호수(Champex-Lac, 1,466 m)** 🇨🇭
- 거리 15 km · 획득 +420 m · 하강 −565 m · 4.5~5 h (계곡 마을길, 회복일)
- 점심: 프라 드 포르 또는 이세르 마을 식당(도시락 병행)
- 숙박: Pension en Plein Air · 도미토리 CHF 82, 2~3인실 CHF 92(2025) · 예약 **포털** https://www.montourdumontblanc.com/en/recherche/ (대안: Hôtel Splendide 객실 CHF 153~188 + 하프보드 CHF 28 https://www.hotel-splendide.ch/)
- 지도: https://www.google.com/maps/dir/?api=1&origin=La+Fouly,+Switzerland&destination=Champex-Lac,+Switzerland&waypoints=Praz+de+Fort&travelmode=walking
- 비고: Prayon~Branche 구간 낙석 우회로 운영 중(2026-07 기준), 현지 표지 확인.

**Day 9 · 8/12(목) · 샹페 → 알파주 드 보빈(Bovine, 1,987 m) → 콜 드 라 포르클라(1,526 m) → 트리앙(Trient, 1,300 m)** 🇨🇭
- 거리 16 km · 획득 +740 m · 하강 −680 m · 6 h (페네트르 다르페트 변형 대신 완만한 보빈 루트)
- 점심: Alpage de Bovine(현금만, 10인 단체 식사 사전 연락 권장)
- 숙박: Auberge Mont-Blanc · 5~10인 도미토리 CHF 70, 4인실 CHF 77, 2~4인 개인실 CHF 88(2026) · 예약 **포털** https://www.montourdumontblanc.com/en/refuges/auberge-mont-blanc (대안: La Grande Ourse 도미토리 CHF 80)
- 지도: https://www.google.com/maps/dir/?api=1&origin=Champex-Lac,+Switzerland&destination=Trient,+Switzerland&waypoints=Col+de+la+Forclaz&travelmode=walking

**Day 10 · 8/13(금) · 트리앙 → 콜 드 발므(Col de Balme, 2,191 m, 🇨🇭→🇫🇷) → 에귀예트 데 포제트(2,201 m) → 트레르샹(Tré-le-Champ, 1,417 m)** 🇫🇷
- 거리 13 km · 획득 +1,070 m · 하강 −1,170 m · 5.5 h (포제트 능선 생략 시 획득 약 −250 m)
- 점심: Refuge du Col de Balme(2025 하프보드 €60) https://www.refugeducoldebalme.com/
- 숙박: Auberge La Boërne · 도미토리 하프보드 €60(2026, 6/1~9/30) · 예약 **포털** https://www.montourdumontblanc.com/fr/refuges/auberge-la-boerne
- 지도: https://www.google.com/maps/dir/?api=1&origin=Trient,+Switzerland&destination=Tr%C3%A9-le-Champ,+Chamonix-Mont-Blanc&waypoints=Col+de+Balme&travelmode=walking

**Day 11 · 8/14(토) · 트레르샹 → 에귀예트 다르장티에르 사다리 구간 → 라크 블랑(Lac Blanc, 2,352 m) → 라 플레제르(Refuge de la Flégère, 1,877 m)** 🇫🇷
- 거리 약 11 km · 획득 약 +950 m · 하강 약 −500 m · 5 h (사다리 9세트, 고소공포 시 우회로 있음)
- 점심: Refuge du Lac Blanc(현금만) https://refugelacblanc.com/en/
- 숙박: Refuge de la Flégère · 하프보드 도미토리만 운영, 2026 가격 미표기(구자료 약 €50~60) — **직접 확인 필요** · 예약 **자체** https://www.refuge-de-la-flegere.com/en/
- 지도: https://www.google.com/maps/dir/?api=1&origin=Tr%C3%A9-le-Champ,+Chamonix-Mont-Blanc&destination=Refuge+de+la+Fl%C3%A9g%C3%A8re,+Chamonix-Mont-Blanc&waypoints=Lac+Blanc,+Chamonix&travelmode=walking

**Day 12 · 8/15(일) · 라 플레제르 → 플랑프라·르 브레방(Le Brévent, 2,525 m) → 벨라샤(Refuge de Bellachat, 2,152 m) → 샤모니(Chamonix, 1,035 m) 도보 하산** 🇫🇷
- 거리 약 13 km · 획득 약 +740 m · 하강 약 −1,490 m · 6 h (브레방 케이블카 미사용, 무릎 보호대·스틱 권장)
- 점심: Refuge de Bellachat(하프보드 €55, 현금만) https://www.refuge-bellachat.com/en/
- 숙박: 샤모니 시내 2~3성 호텔(8월 실당 €200~300 추정) · 예약 Booking.com 등 · 완주 만찬
- 지도: https://www.google.com/maps/dir/?api=1&origin=Refuge+de+la+Fl%C3%A9g%C3%A8re,+Chamonix-Mont-Blanc&destination=Chamonix-Mont-Blanc&waypoints=Le+Br%C3%A9vent&travelmode=walking
- 대안: 공식 종점 레주슈까지 연장(17 km, +830 m)은 하강이 길어 권장하지 않음.

### C-4. 예약 우선순위(10인 단체)
1. 2027 시즌 포털 오픈(예상 2026-10 중순) 당일: Mottets(D3) → Maison Vieille(D4) → Bertone(D5) → La Balme(D2) → Edelweiss(D7) → Auberge Mont-Blanc(D9) → La Boërne(D10) → Plein Air(D8).
2. 자체 예약 산장은 오픈 시점이 제각각: Elena(D6)·Flégère(D11) 이메일, Gai Soleil(D1) 호텔 예약, Col de Balme 점심은 2026-04 오픈 사례.
3. 각 Day에 대안 숙소 1곳을 병행 문의하고, 확정 후 사이트 Day 카드에 예약 번호를 기록한다.
4. 현금(EUR·CHF) 준비: Lac Blanc·Bellachat·Bovine·La Peule 등 현금 전용.

## 부록 D. 기존 조사 기반 1인당 예산 snapshot
### D-1. 예산 표

> 기준일 2026-09-09 · 2025~2026 요금 기준 웹 조사(원본 사이트 다수가 이 세션에서 차단되어 검색 요약·2차 자료 근거, 예약 전 원본 확인 필요) · 환율 가정 1 CHF ≈ 1.07 EUR · 2027년 물가 인상 미반영.

**가정:** 8/3 제네바 1박 · 8/4 레 콩타민 1박부터 8/14 라 플레제르까지 트레킹 숙박 11박(마을형 숙소 4박 + 산장 7박, 스위스 3박 포함) · 8/15 샤모니 1박 · 8/16 취리히 1박 = 총 14박. 호텔은 2인 1실 분담, 산장은 하프보드(저녁·아침). 리프트·케이블카 비용 없음(전 구간 도보).

| 항목 | 저(€) | 중(€) | 근거·비고 |
|---|---:|---:|---|
| ZRH↔GVA 기차 왕복(2등석) | 70 | 132 | 정가 약 CHF 88~90/편도, Supersaver CHF 26~29부터(6개월 전 판매), 10인 이상 단체권 30% 할인 → 저=Supersaver, 중=단체권 |
| 제네바↔샤모니 버스 왕복 | 40 | 80 | FlixBus·BlaBlaCar €12~27/편도, 공유셔틀(Alpybus·Mountain Drop-offs) €30~45/편도 |
| 샤모니 계곡 교통(샤모니↔레주슈) | 0 | 10 | 숙박객 카드(Carte d'hôte)로 계곡 버스·열차 무료, 없으면 편도 €1.5~3 |
| 마을형 숙소 4박(레 콩타민·라 풀리·샹페·트리앙, 1인 몫) | 300 | 480 | 하프보드 도미토리 €70~95 / 개인실 2인 분담 €90~150 |
| 산장 하프보드 7박(도미토리) | 440 | 560 | 프랑스 €50~80, 이탈리아 €45~75, 스위스 CHF 65~110(스위스는 30~50% 비쌈) |
| 제네바·샤모니·취리히 호텔 3박(1인 몫) | 300 | 420 | 제네바 3성 약 €150~180/실, 샤모니 8월 €200~300/실, 취리히 중앙역 3성 $210~290/실 |
| 점심·도시락·음료 12일 | 180 | 360 | 산장 점심 세트 약 €18, 도시락 €10~16, 커피 €2~5, 맥주 €4~7 → €15/일 vs €30/일 |
| 호텔 숙박일 식사 3일 | 90 | 180 | €30/일 vs €60/일 |
| 여행자보험 15일 | 40 | 120 | 국내 다이렉트 종합형 약 3~8만원 / World Nomads 2주 $150~300(연령 의존) |
| 소계 | 1,460 | 2,342 | |
| 예비비 10% | 146.00 | 234.20 | 만실 대체 숙소·우천 시 택시 등 |
| **합계(1인, 항공권 제외)** | **€1,606.00** | **€2,576.20** | |

- **권장 준비 금액:** 2027년 물가 인상(연 3~5%)을 더해 **1인 약 €1,750~2,800** (약 260만~420만 원, 1 EUR ≈ 1,500원 가정).
- **1인 1실 위주로 바꾸면** 마을형 숙소 4박 기준 +€250~450. 고산 산장(La Balme·Mottets·Maison Vieille·Bertone·Elena·La Flégère)은 도미토리가 기본이며 1인 1실은 사실상 없다.
- **10명 단체 팁:** SBB 단체권은 출발 2영업일 전까지 명단 제출. 8/3 밤 제네바 도착이 21:45~22:15로 늦어 정기 버스가 사실상 없으므로 제네바 1박(저) 또는 8~10인승 프라이빗 미니버스 사전 예약(중, 1인 €30~45 추정·미검증) 중 택일.
- **참고 총액 기준(업계):** 셀프가이드 산장 하프보드 10일 €700~900, 전 구간 €1,600~2,000/인(2025~2026 가이드 블로그 기준).
