# Design — itinerary-core (PRD v2.0 개정)

> feature: itinerary-core · Plan: `docs/01-plan/itinerary-core.plan.md` · 의존: —
> 작성일: 2026-09-17 · 상태: approved (L4 auto)

## Context Anchor
| Key | Value |
|---|---|
| WHY | v2 수치가 남으면 옛 데이터를 확정값으로 오인 |
| WHO | 방문자 전원 |
| RISK | 테스트 고정값 누락, route-visuals 노드명 불일치 |
| SUCCESS | Trip 합계 = Day 합계 = 163.0/9,750/9,725 · Day 1 아침 이동 · 빠른 링크 5개 |
| SCOPE | seed·홈·Day 1 아침 이동·빠른 링크 |

## 1. 파일
```
src/lib/schema.ts                       TripSchema.timezone 추가
src/data/seed/trip.ts                   163.0 / 9750 / 9725 / timezone / checkedAt 2026-09-16
src/data/seed/days.ts                   EMERGENCY, Day 9, Day 10(+Col des Posettes), checkedAt
src/data/seed/travel-legs.ts            항공편 2구간 needs_check + notes
src/lib/phases.ts                       (신규) RELEASED, visibleQuickLinks()
src/lib/log.ts                          LogCode + "nav_hidden_by_phase"
src/components/home/TripMetrics.tsx     5 타일, "약" 제거
src/components/home/QuickLinks.tsx      visibleQuickLinks() 사용
src/app/day/[dayId]/page.tsx            "아침 이동" 섹션
tests/unit/seed.test.ts                 합계·Day 9/10·emergency·항공
tests/unit/phases.test.ts               (신규)
tests/e2e/responsive.spec.ts            문자열 갱신
```

## 2. 데이터
### 2.1 Trip
```ts
distanceKm: 163.0, gainM: 9750, lossM: 9725, timezone: "Europe/Paris", checkedAt: "2026-09-16"
```
`TripSchema`: `timezone: z.literal("Europe/Paris")`.

### 2.2 Day 9 / Day 10 (`days.ts`)
| Day | distanceKm | gainM | lossM | duration | sourceCheckedAt |
|---|---|---|---|---|---|
| 9 | 16 | 850 | 1015 | "6 h" | 2026-09-16 |
| 10 | 13.5 | 1100 | 975 | "6 h" | 2026-09-16 |
Day 10 `routePoints`: Trient 1,300 → Col de Balme 2,191 → **Col des Posettes 1,997**(nameKo "콜 데 포제트") → Aiguillette des Posettes 2,201 → Tré-le-Champ 1,417.
Day 9 fallback을 PRD C-3 Day 9 대안 문장으로 갱신, Day 10 fallback도 C-3 문장으로 갱신(today-and-safety가 SC-010 검증).
`EMERGENCY = "112 · 숙박 연락처 (유럽 공통 긴급번호 · 연락처는 아래 숙박 카드 참고)"` — PRD 기본값 "112 · 숙박 연락처"로 시작하는 문자열 (12개 Day 공통).

### 2.3 TravelLeg 항공편
`leg-0803-1`(ICN→ZRH), `leg-0817-2`(ZRH→ICN): `verificationStatus: "needs_check"`, `notes: "브리프 기준, 확인 필요 — 항공권 예약 여부 확인 후 확정"`.

## 3. 단계 규칙 (`src/lib/phases.ts`)
```ts
export type NavKey = "itinerary" | "budget" | "map" | "packing" | "journal";
export const RELEASED: Record<NavKey, boolean> = { itinerary: true, budget: true, map: true, packing: true, journal: true };
export const QUICK_LINKS = [
  { key: "itinerary", href: "/itinerary", label: "일정", desc: "15일 전체" },
  { key: "budget", href: "/budget", label: "예산", desc: "1인 저/중" },
  { key: "map", href: "/map", label: "지도", desc: "12구간 개요" },
  { key: "packing", href: "/packing", label: "준비물", desc: "체크리스트" },
  { key: "journal", href: "/journal", label: "기록", desc: "팀 타임라인" },
] as const;
export function visibleQuickLinks(released = RELEASED, log = logEvent) {
  return QUICK_LINKS.filter(l => { if (released[l.key]) return true; log("nav_hidden_by_phase", "info", { key: l.key }); return false; });
}
```
`QuickLinks.tsx`는 `visibleQuickLinks()` 결과를 렌더(grid `sm:grid-cols-5`).

## 4. 홈 지표 (`TripMetrics.tsx`)
타일 순서: 기간 `2027-08-03 ~ 08-17` · 인원 `10명` · 트레킹 `163.0 km` · 획득 `9,750 m` · 하강 `9,725 m`. 거리는 `toFixed(1)` 고정("163.0 km", `fmtKm`은 최대 1자리라 163 → "163 km"가 되므로 사용하지 않음)·고도는 `fmtM`(천 단위) 사용, 접두 "약" 제거. 모바일 `grid-cols-2`, `sm:grid-cols-5`.

## 5. Day 1 아침 이동 (`day/[dayId]/page.tsx`)
`legs.length > 0`이면 header 아래에:
```tsx
<section aria-labelledby="morning-heading">
  <h2 id="morning-heading" className="mb-3 text-lg font-bold">아침 이동</h2>
  <div className="card p-4"><LegTimeline legs={legs} /></div>
  <Link href={`/travel/${day.id}`} …>이동 상세 보기</Link>
</section>
```
기존 "아침 이동 보기" 링크는 섹션 내부 보조 링크로 이동.

## 6. 테스트
- `seed.test.ts`: totals `{163, 9750, 9725}` = trip; Day 9/10 필드; Day 10 routePoints에 "Col des Posettes"; 12 trek `emergency.startsWith("112 · 숙박 연락처")`; 항공 2구간 needs_check
- `phases.test.ts`: 5개 반환; `{...RELEASED, journal:false}` → 4개 + spy 1회 `nav_hidden_by_phase`
- `responsive.spec.ts`: 홈에 "163.0 km", "9,750 m", "9,725 m"; "약 162.5" 제거; `/day/d2027-08-04`에 "아침 이동" 제목·타임라인 2구간·"이동 상세 보기" 링크
- 수동/빌드: `tsc --noEmit`, `vitest run`, `next build`

## 7. Edge Case
| 상황 | 문구 | 로그 |
|---|---|---|
| 미구현 단계 링크 | 링크 숨김 | `nav_hidden_by_phase` info |
