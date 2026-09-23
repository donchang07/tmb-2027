# Plan — day-detail (PRD v2.0 개정)

> feature: day-detail · 순서 2/9 · 의존: itinerary-core · 규모: 중
> 출처: `docs/PRD.md` v2.0 FR-003, FR-004, FR-017 · SC-001, SC-002, SC-013 · 8.3 · Edge "숙소 미정" · N-002, N-003 · 부록 A-2 `kind`
> 이전 사이클: `docs/archive/2026-09-v2/day-detail/`
> 작성일: 2026-09-17 · 상태: approved (L4 auto)

## Executive Summary
| 관점 | 내용 |
|---|---|
| Problem | Day 12 숙소는 미정인데 카드가 Booking.com 링크를 "공식 예약"으로 보여 준다. 산장·고개 이름에 한국어 음차가 붙어 있어 N-003과 어긋난다. SC-001(홈→오늘 Day→숙박 연락 2탭)이 E2E로 검증되지 않는다. |
| Solution | `Lodging.kind`(refuge/village/hotel/undecided)를 도입해 미정 숙소는 "숙소 미정 · 리더가 확정 예정"으로 표시하고 `lodging_undecided`를 로그한다. LodgingCard·RouteList에서 음차를 제거하고 원어를 주 표기로 한다. 2탭 경로 E2E를 추가한다. |
| Function UX Effect | Day 12를 열면 "샤모니의 호텔(미정)"과 안내가 보이고, 산장·고개는 원어만 보인다. |
| Core Value | 오래된 링크를 확정처럼 노출하지 않는다(3장 목표 4). |

## Context Anchor
| Key | Value |
|---|---|
| WHY | 미정 숙소를 링크로 노출하면 잘못된 예약 시도가 생긴다 |
| WHO | 방문자 전원 |
| RISK | `kind` 추가는 booking-tracker의 DB 스키마와 이름·enum이 같아야 한다 |
| SUCCESS | Day 12 카드 "숙소 미정", 음차 0건, SC-001 E2E 통과 |
| SCOPE | LodgingCard·RouteList·DayCard 표기, Lodging.kind, SC-001 E2E |

## 2. 포함 요구사항 (델타)
| ID | v2.0 변경 | 검증 |
|---|---|---|
| FR-004 | 숙소 미정 → "숙소 미정"(예: "샤모니의 호텔(미정)") + "리더가 확정 예정", 링크·전화 대신 표시. 전화 미검증 → "전화 확인 필요" 유지 | 단위(kind 분기)·렌더 |
| FR-017/SC-013 | Day 제목 한국어·원어 병기(유지). 산장·점심 장소·고개는 원어만(음차 제거) | UI 검사 |
| SC-001 | 홈 → 오늘 Day 상세 → 숙박 연락 수단, 탭 2 이하 | Playwright 경로 테스트 |
| Edge | 숙소 미정 `lodging_undecided` info | 로그 코드 |

## 3. 범위
### In
- `src/lib/schema.ts`: `LodgingKind` enum + `Lodging.kind`, `nameKo` optional
- `src/data/seed/lodgings.ts`: 12개 kind 부여, `chamonix-hotel` → nameOriginal "샤모니의 호텔(미정)", kind undecided, bookingUrl/contactUrl null, bookingChannel "other"
- `src/components/day/LodgingCard.tsx`: undecided 분기, nameKo 줄 제거
- `src/components/day/RouteList.tsx`: 원어 주 표기(음차 보조 표기 제거)
- `src/lib/log.ts`: `lodging_undecided`
- `src/lib/itinerary.ts`: `getMissingFields` — undecided 숙소는 contact 누락으로 세지 않음
- `tests/unit/itinerary.test.ts`, `tests/e2e/day-detail.spec.ts`(신규, SC-001)
### Out
- 14박·DB 이동·편집 패널(booking-tracker), 대안 문장(today-and-safety)

## 4. 결정
- `kind` 값·이름은 PRD A-2와 동일(`refuge|village|hotel|undecided`)하며 booking-tracker DB enum `lodging_kind`와 1:1.
- 음차(`nameKo`)는 seed에 남겨도 되지만 공개·관리자 UI 어디에도 렌더하지 않는다. RouteList는 `nameOriginal`을 굵게, 고도만 보조.
- SC-001 E2E는 날짜를 고정할 수 없으므로 홈의 "오늘 카드" 링크(기간 밖이면 첫 Day 링크)를 1탭, Day 상세의 숙박 연락 요소 확인을 2탭으로 판정한다.

## 5. 성공 기준
1. `LodgingSchema.parse` — 12개 모두 kind 존재, chamonix-hotel = undecided
2. LodgingCard(undecided) 렌더에 "숙소 미정", "리더가 확정 예정" 포함, 예약·전화 버튼 없음
3. Day 상세·일정 카드·LodgingCard·RouteList에 lodgings/route nameKo 음차 문자열 0건(테스트: "라 발므 산장" 미출현)
4. `day-detail.spec.ts` 통과(홈 → Day → 숙박 카드 연락 요소 또는 "숙소 미정")
5. `tsc`, `vitest`, `next build` 통과
