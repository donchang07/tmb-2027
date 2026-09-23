# Plan — day-detail

> feature: day-detail · 순서 2/8 · 의존: itinerary-core · 규모: 중
> 출처: `docs/PRD.md` 8.3, FR-003/004/014, SC-001/002/010, 부록 C-3
> 작성일: 2026-09-16 · 상태: approved (L4 auto)

## 1. 목표
Day 상세 화면(`/day/[dayId]`)에서 하루 산행·숙박·대안·비상 정보를 출발 전에 확인한다. 홈 → 오늘 카드 → Day 상세의 2탭 안에 숙박 이름과 연락 수단이 보여야 한다(SC-001).

## 2. 포함 요구사항
| FR | 요약 | 검증 |
|---|---|---|
| FR-003 | Google 걷기 링크 새 창 1탭, origin·destination·travelmode=walking 파라미터 | URL 파라미터 unit test(12개 mapUrl) |
| FR-004 | 숙박 공식 예약 링크 + 검증된 전화 또는 공식 연락 링크, 미검증 전화는 “전화 확인 필요” | 연락 fallback unit test + 렌더 |
| FR-014 | 우천·피로 대안 + 112·숙박 연락 수단 | 12 Day fallback/emergency 완전성 unit test |

## 3. 범위
### In
- `/day/[dayId]` 페이지(12 trek Day, 예약 상태 실시간 조회를 위해 요청 시 렌더)
- 섹션: 핵심 지표 / 경로(출발·고개·도착 목록; 고도 프로파일 SVG는 route-visuals에서 추가) / 식사·숙박 / 지도 / 안전 / 데이터 상태
- 숙박 카드 컴포넌트 `LodgingCard`(공개 상태 배지 + 예약 링크 + 연락 + 대안)
- `parseMapUrl(url)` 유틸과 “공식 등산 경로 아님” 안내
- 이전/다음 Day 내비
- Edge Case: 전화 미검증(`lodging_phone_unverified`), 예약 상태 없음(“미예약”), 숙소 만실(`alternative` 표시), Day 데이터 누락(“확인 중”)
### Out
- 고도 프로파일 그래프(route-visuals), 예약 편집 패널(booking-tracker), 기록 타임라인(trip-journal) — 이 페이지의 삽입 지점만 남김

## 4. 성공 기준
1. `/day/[dayId]` 라우트 빌드 성공, 12개 trek id 요청 시 렌더(비 trek id는 404).
2. unit: 12 mapUrl 모두 `api=1`, `origin`, `destination`, `travelmode=walking` 보유.
3. 12 Day fallback·emergency(112) 완전성.
4. 숙박 연락: verifiedPhone null → “전화 확인 필요” + contactUrl/bookingUrl fallback 노출.
