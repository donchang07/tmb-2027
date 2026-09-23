# Plan — offline-pwa (PRD v2.0, responsive-pwa 개명)

> feature: offline-pwa · 순서 6/9 · 의존: booking-tracker · 규모: 중
> 출처: `docs/PRD.md` v2.0 FR-013 · SC-004, SC-006 · S5 · Edge "예약 상태 서버 오류", "네트워크 없음", "캐시 없음" · I-002 · 부록 A-4 `CacheManifest.lastBookingSnapshot`
> 이전 사이클: `docs/archive/2026-09-v2/responsive-pwa/` (FR-007 반응형은 itinerary-core로 이관)
> 작성일: 2026-09-17 · 상태: approved (L4 auto)

## Executive Summary
| 관점 | 내용 |
|---|---|
| Problem | v2.0은 오프라인에서 "마지막 예약 상태"도 재열람되고, 예약 서버 오류 시 "예약 상태를 불러올 수 없습니다 · 마지막 갱신 시각"과 캐시값을 보여 주며, 온라인에서는 실시간 구독(5초)·30초 폴링으로 상태를 반영하길 요구한다. 현재 SW는 예약 응답을 캐시하지 않고 실시간·폴링이 없다. |
| Solution | `/api/bookings`를 stale-while-revalidate로 캐시하고 `CacheManifest.lastBookingSnapshot`을 기록한다. 클라이언트 `BookingLive`가 Supabase Realtime(`bookings_public`) 구독 + 30초 폴링으로 상태 배지를 갱신하고, 실패 시 마지막 스냅샷과 안내 문구를 표시한다. |
| Function UX Effect | 산장에서 신호가 없어도 마지막 예약 상태와 갱신 시각이 보이고, 리더가 저장하면 열려 있는 화면이 5초 내 바뀐다. |
| Core Value | 약한 네트워크에서도 일관된 정보(0장 Solution). |

## Context Anchor
| Key | Value |
|---|---|
| WHY | 산행 중 약한 네트워크 |
| WHO | 동행 전원 |
| RISK | Realtime은 Supabase 연결 후에만 검증 가능 → 폴링 fallback을 단위 테스트로 보장 |
| SUCCESS | 오프라인 E2E에 예약 상태·갱신 시각 표시, SW 규칙 테스트, 폴링 로직 테스트 |
| SCOPE | sw.js·sw-rules·cache-manifest·BookingLive·public.ts 오류 처리 |

## 2. 포함 요구사항
| ID | 요구 | 검증 |
|---|---|---|
| FR-013 | 일정·Day·연락·마지막 예약 상태 오프라인 재열람 + 마지막 갱신 시각 | offline E2E |
| SC-004 | 저장 후 5초 내 반영(Realtime), 구독 실패 시 30초 폴링 | 단위(스케줄러 모킹) |
| SC-006 | 네트워크 차단 재진입 시 표시 + 온라인 전용 기능 안내 | offline E2E(기존 확장) |
| Edge | 예약 상태 서버 오류 → "예약 상태를 불러올 수 없습니다 · 마지막 갱신 시각", `booking_fetch_failed` warn | 단위·렌더 |
| I-002 | Booking 상태 Realtime + 마지막 값 캐시, 저장 응답 network-only | sw-rules 테스트 |

## 3. 범위
### In
- `public/sw.js`, `src/lib/sw-rules.ts`(`/api/bookings` SWR 규칙), `src/lib/cache-manifest.ts`(`lastBookingSnapshot`)
- `src/components/pwa/BookingLive.tsx`(신규, client): 초기값 서버 렌더 → `/api/bookings` 폴링 30초 + Realtime 구독(`@supabase/supabase-js` 브라우저 클라이언트, 공개 anon 키), 실패 시 스냅샷 + 안내
- `src/lib/bookings/live.ts`(신규, 순수 로직: 병합·스케줄·스냅샷 저장/복원 localStorage)
- `src/lib/bookings/public.ts`: 오류 시 `booking_fetch_failed` warn
- `src/lib/log.ts`: `booking_fetch_failed`
- 상태 배지 사용처(홈 오늘 카드·일정 카드·Day LodgingCard)를 `BookingLive` 컨텍스트로 갱신
- `tests/unit/sw-rules.test.ts`, `tests/unit/booking-live.test.ts`, `tests/e2e/offline.spec.ts`
### Out
- DB 미러 테이블(booking-tracker에서 완료), 지도 타일 오프라인

## 4. 결정
- 스냅샷은 localStorage(`tmb.bookingSnapshot`: `{ fetchedAt, bookings }`)와 CacheManifest 양쪽에 기록; 화면은 localStorage 우선.
- Realtime 채널: `supabase.channel("bookings_public").on("postgres_changes", { event:"*", schema:"public", table:"bookings_public" }, …)`. `SUBSCRIBED` 못 받으면 폴링만. Supabase 미설정 시 폴링만(미설정이면 `/api/bookings`가 빈 배열 → 기본 "미예약").
- 폴링 간격 30초는 `document.visibilityState === "visible"`일 때만.

## 5. 성공 기준
1. `matchRule("/api/bookings")` → `swr`; `/admin`·`/api/admin` → `network-only`
2. `mergeBookings(prev, next)`, `shouldPoll(state)` 단위 테스트(폴링 스케줄은 `shouldPoll` 게이팅으로 표현, 별도 `nextPollAt` 없음)
3. `booking_fetch_failed` 로그 코드 존재, 오류 상태 렌더 문구 "예약 상태를 불러올 수 없습니다 · 마지막 갱신"
4. offline E2E: Day 상세 재진입 시 예약 상태 배지 + "마지막 갱신" 텍스트
5. `tsc`, `vitest`, `next build`
