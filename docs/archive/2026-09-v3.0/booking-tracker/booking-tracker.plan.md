# Plan — booking-tracker (PRD v2.0 개정)

> feature: booking-tracker · 순서 5/9 · 의존: day-detail · 규모: 중(대)
> 출처: `docs/PRD.md` v2.0 FR-010 · SC-004, SC-007 · S2, S8 · 8.3 편집 패널, 8.4 숙박, 8.7 · 11.2 #1·#2 · I-004, I-006, I-007 · N-007, N-009 · NFR 로그 · 부록 A-2, C-2, C-4
> 이전 사이클: `docs/archive/2026-09-v2/booking-tracker/` (96%)
> 작성일: 2026-09-17 · 상태: approved (L4 auto)

## Executive Summary
| 관점 | 내용 |
|---|---|
| Problem | v2.0은 예약 관리 대상을 14박(제네바·샤모니·취리히 호텔 포함)으로 넓히고, 리더가 전화·링크·가격·재확인일 등 숙박 데이터를 직접 갱신하도록 Lodging을 Supabase DB로 옮긴다(N-009). 현재 Lodging은 코드 seed이고 예약 행은 12개다. |
| Solution | `lodgings` 테이블(공개 읽기, 리더 쓰기)과 seed import 마이그레이션(I-006)을 추가하고, `bookings`에 `alternative_lodging_id`와 2개 행을 더한다. 공개 뷰를 실시간 구독 가능한 `bookings_public` 테이블(트리거 미러)로 바꾼다. 리더는 `/admin/bookings` 14행 목록과 Day 상세 편집 패널에서 상태·숙박 정보를 저장한다. Supabase 미설정 시 seed로 동작한다. `security` 로그는 관리자 이메일 알림(Resend, 미설정 시 로그만). |
| Function UX Effect | 리더는 한 표에서 14박을 보고, Day 상세에서 바로 전화·가격·재확인일·예약번호를 고친다. 방문자는 갱신된 숙박 정보와 상태만 본다. |
| Core Value | 리더 1인이 2026년 말까지 모든 숙소를 확정 또는 대안으로 기록한다(3장 목표 2). |

## Context Anchor
| Key | Value |
|---|---|
| WHY | 재확인·갱신 주체가 리더이므로 데이터가 코드에 있으면 갱신이 배포에 묶인다 |
| WHO | 리더(편집), 방문자(열람) |
| RISK | RLS 오류로 private 필드 노출; Supabase 미연결 상태에서 런타임 검증 불가 |
| SUCCESS | 14박 목록 편집, 공개 응답 private 0건, seed↔DB 스키마 일치, 미설정 시 seed fallback |
| SCOPE | 마이그레이션·lodging 조회 계층·관리자 목록·Day 편집 패널·이동일 숙박 블록·security 알림 |

## 2. 포함 요구사항 (델타)
| ID | v2.0 변경 | 검증 |
|---|---|---|
| FR-010 | 14개 숙박의 상태·대안 숙소(참조)·전화(검증일)·링크·가격·재확인일 저장, 방문자는 상태·숙박 정보만, 예약번호·메모는 리더만 | 단위(검증·toPublic)·마이그레이션 텍스트·security E2E |
| 8.7 | 14박 × 상태·대안·전화(검증일)·링크·가격·재확인일·갱신 시각 목록 + 인라인 편집 + 공개 미리보기 | 렌더 |
| 8.3 | 리더 로그인 시 Day 상세 편집 패널(상태·대안 숙소·전화·링크·가격·재확인일·예약번호·메모) | 렌더(세션 없으면 미표시) |
| 8.4 | 이동일(8/3·8/16) 상세에 후보 호텔·상태·연락 | 렌더 |
| A-2 | Lodging 필드: id, dayId, nameOriginal, kind, address/lat/lng, bookingUrl, contactUrl, verifiedPhone/phoneVerifiedAt/phoneVerifiedBy, roomType/priceLow/priceHigh/currency/season/capacityNote/checkedAt · Booking.alternativeLodgingId | schema·SQL |
| I-006 | 부록 C 14행 초기 import | SQL 텍스트 테스트 |
| SC-004 | 실시간 구독 5초 + 30초 폴링 fallback — DB 측 준비(공개 미러 테이블 + publication). 클라이언트 구독은 offline-pwa | SQL |
| NFR 로그 | `security` 등급 → 관리자 이메일 알림 [기본값] | 단위(notify 호출) |
| C-2/C-4 | 제네바·취리히 후보 호텔 4곳씩, 샤모니 미정 → 14박 | seed |

## 3. 범위
### In
- `supabase/migrations/20260917000003_lodgings.sql`: `lodging_kind` enum, `lodgings` 테이블+RLS, 14행 import, `bookings.alternative_lodging_id`, 2행 추가, `bookings_public` 뷰 → 테이블(트리거 동기화) + realtime publication
- `src/lib/schema.ts`(Lodging 확장, `candidates`), `src/data/seed/lodgings.ts`(14개)
- `src/lib/lodgings.ts`(신규: DB 우선·seed fallback 조회), `src/lib/itinerary.ts`(`getLodgings` 비동기 경로 분리)
- `src/lib/bookings/{admin,public}.ts`(lodging 저장·alternativeLodgingId·public 필드), `src/lib/notify.ts`(신규), `src/lib/log.ts`
- `src/app/admin/bookings/page.tsx`(14행 표), `src/components/admin/{BookingEditor,LodgingTable,PublicPreview}.tsx`
- `src/app/day/[dayId]/page.tsx` + `src/components/admin/DayEditPanel.tsx`(리더 세션 시)
- `src/app/travel/[dayId]/page.tsx` 숙박 블록
- `tests/unit/bookings.test.ts`, `tests/unit/lodgings.test.ts`, `tests/e2e/security.spec.ts`
### Out
- 실제 Supabase 프로젝트 연결·마이그레이션 적용(메인 대화), 클라이언트 실시간 구독(offline-pwa), 결제·예약 API

## 4. 결정
- Lodging 조회는 `getLodgingsAsync()`: Supabase anon 클라이언트가 있으면 `lodgings` 테이블(공개 select), 실패·미설정이면 seed. 요청당 1회 캐시(`cache()`).
- 대안 숙소는 `alternative_lodging_id`(lodgings 참조) + 기존 `alternative_lodging`(자유 텍스트) 병행. 공개 뷰는 둘 다 노출.
- `bookings_public`을 테이블로 바꾸는 이유: anon Realtime 구독은 RLS select 정책이 있는 테이블에만 동작(뷰 불가). `bookings` insert/update 트리거로 동기화.
- `security` 알림: `RESEND_API_KEY`·`ADMIN_EMAIL` 있을 때 Resend REST(fetch)로 발송, 없으면 로그만(I-007 기본값). 새 npm 의존성 없음.
- 미정 숙소(제네바·샤모니·취리히)는 kind `undecided`, `candidates`(후보 배열)로 표시.

## 5. 성공 기준
1. 마이그레이션 텍스트: `create table public.lodgings`, RLS enable, anon select 정책, leader write 정책, 14개 `insert into public.lodgings`, `alternative_lodging_id`, `bookings_public` 테이블+트리거+`supabase_realtime` publication
2. `validateLodgingInput` — 전화(≤30자)·URL·가격(≥0, low≤high)·재확인일(ISO)·kind enum 검증; `toPublicBooking`이 `confirmationRef/privateMemo` 제거
3. `getLodgingsAsync()` 미설정 시 seed 14개 반환, dayId 매핑(8/3, 8/15, 8/16 포함)
4. `/admin/bookings` 미설정 렌더: 14행 헤더(상태·대안·전화·링크·가격·재확인일·갱신)
5. `/travel/d2027-08-03` 숙박 블록에 "Hotel Astoria" 후보와 "숙소 미정" 표시
6. security E2E: 비인증 admin API 401/403/503, 응답에 private 필드 0건, HTML에 service_role 없음
7. `notifySecurity` 미설정 시 fetch 미호출, 설정 시 1회 호출(모킹)
8. `tsc`, `vitest`, `next build`
