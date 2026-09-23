# Report — booking-tracker (PRD v3.1 델타)

> feature: booking-tracker · 순서 2/3 (v3.1 델타) · 완료일 2026-09-18 · 최종 match rate **96.9%** (15.5/16, 게이트 95 통과) · 반복 횟수 **0회**(Check 1회로 게이트 통과, Act 불필요)
> Plan `docs/01-plan/booking-tracker.plan.md` · Design `docs/02-design/booking-tracker.design.md` · Analysis `docs/03-analysis/booking-tracker.analysis.md` · 이전 사이클 `docs/archive/2026-09-v3.0/booking-tracker/` (v2.0 사이클 97.9%)

## Executive Summary

| 관점 | 내용 (실제 결과) |
|---|---|
| Problem | 14박 예약 관리 대상 중 8/16 숙박이 `zurich-hotel`(취리히, 후보 호텔 4곳)로 남아 있었다. v3.1 D-007은 8/16을 8/15와 같은 샤모니 호텔 2박째로 바꿨으므로, 리더의 예약 관리 대상과 실제 일정이 어긋난 상태였다. |
| Solution | seed(`src/data/seed/lodgings.ts`)와 아직 적용 전인 마이그레이션(`supabase/migrations/20260917000003_lodgings.sql`)의 `zurich-hotel` 블록·행을 `chamonix-hotel-2`(dayId 8/16, kind `undecided`, country FR, 후보 없음, "8/15와 같은 호텔 2박 연속 예약")로 교체하고 `bookings` 초기 insert 행도 바꿨다. 14박 총수와 kind 분포(refuge 7·village 4·undecided 3)는 유지했다. |
| Function UX Effect | `/travel/d2027-08-16` 숙박 섹션과 `/admin/bookings` 14행 표에 "샤모니의 호텔(미정) · 2박째"가 보이고, "숙소 미정 · 리더가 확정 예정"과 "체크아웃·짐 이동 없음" 안내가 함께 노출된다. 취리히 후보 호텔 4곳은 화면에서 사라졌다. |
| Core Value | 리더의 예약 관리 대상이 확정 일정과 일치한다. 관리 단위(Day↔Lodging 1:1)를 흔들지 않고 대상만 교체해 예약 상태 추적이 끊기지 않는다. |

### 1.3 Value Delivered

| 관점 | 지표·근거 |
|---|---|
| 정본 일치 | PRD v3.1 D-007·부록 C-2 8/16·부록 C-4 3번의 "제네바 1박 + 샤모니 2박 연속"이 seed undecided 3건(`geneva-hotel`·`chamonix-hotel`·`chamonix-hotel-2`)과 1:1 |
| seed↔SQL 정합 | `chamonix-hotel-2` **전 필드 문자 단위 일치** — 불일치 0건 (`lodgings.ts:264~282` ↔ `20260917000003_lodgings.sql:90~91`), `lodgings.test.ts:152`가 `sql`에 seed `notes` 전문 포함을 단정 |
| 잔존 참조 제거 | `zurich-hotel` — `src` 0건 · `supabase` 0건 · `public` 0건. `tests` 3건은 전부 **부재 검증 회귀 가드**(`tests/unit/lodgings.test.ts:48,146,148`) |
| 삭제 회귀 가드 | `tests/e2e/security.spec.ts:90`이 "Fred Hotel Zürich Hauptbahnhof" 0건을 단정 — 삭제된 후보 호텔이 다시 렌더되면 즉시 실패 |
| 관리 범위 불변 | 숙박 14개·dayId 1:1·kind 분포 유지 (`lodgings.test.ts:37~41`, `bookings.test.ts:169~172`, `itinerary.test.ts:80~82`) |
| 하드코딩 부재 | `src/lib/bookings/admin.ts:37` `LODGING_IDS = lodgings.map((l) => l.id)` — 입력 스키마가 seed에서 파생돼 id 교체만으로 관리자 폼이 자동 수용 |
| 변경 면적 | 소스 1파일 + SQL 1파일 + 테스트 5파일. 관리자 UI·`LodgingCard`·`LodgingTable`·`PublicPreview` 변경 0줄 |

## Context Anchor

| Key | Value |
|---|---|
| WHY | D-007 취리히 호텔 삭제 → 8/16 샤모니 2박째 |
| WHO | 리더(예약 갱신), 방문자(열람) |
| RISK | seed↔마이그레이션 문구 불일치, 남은 `zurich-hotel` 참조 |
| SUCCESS | `zurich-hotel` 0건, `chamonix-hotel-2` seed·SQL·bookings 일치, 14박 유지, E2E 통과 |
| SCOPE | lodgings seed, migration 000003, 단위 테스트 4종, security E2E |

## FR/SC

| ID | 상태 | 근거 |
|---|---|---|
| FR-010 / N-007 (14박 관리) | ✅ 완료 | seed 14개 유지 — 제네바 1 · 트레킹 11 · 샤모니 2 (`lodgings.test.ts:37~41`) |
| 부록 A-2 / I-006 (seed↔DB 일치) | ✅ 완료 | 마이그레이션 lodgings 행·`bookings` insert `('geneva-hotel'), ('chamonix-hotel-2')`가 seed와 동일 (`…_lodgings.sql:90~97`) |
| 8.4 (8/16 숙박 블록) | ✅ 완료 | `LodgingCard` undecided 분기 → "숙소 미정"·"리더가 확정 예정"·notes·season 렌더, 후보 목록·예약/전화 버튼 미렌더 (`LodgingCard.tsx:28,47,52,53,82,91~96,104`) |
| 부록 C-2 8/16 | ✅ 완료 | `nameOriginal` "샤모니의 호텔(미정) · 2박째", location "Chamonix-Mont-Blanc, 1,035 m", 가격 €200~300/실 |
| 부록 C-4 3번 | ✅ 완료 | 이동일 호텔 3박이 제네바 8/3 1박 + 샤모니 8/15~8/16 2박 연속으로 정렬, notes에 "체크아웃·짐 이동 없음" 명시 |
| D-007 | ✅ 완료 | `zurich-hotel` 전역 삭제, 8/16 day `lodgingId: "chamonix-hotel-2"` (`days.ts:388`) |
| 보안(anon 노출 범위) | ✅ 유지 | 컬럼 단위 grant·RLS·`bookings_public` 미러는 v2.0 사이클 구조 그대로, 이번 델타는 행 값만 교체 |

## Success Criteria 최종 (Plan §5)

| # | 기준 | 판정 | 근거 |
|---|---|:--:|---|
| 1 | `zurich-hotel` 문자열이 src·tests·supabase에 0건 | ⚠️ 부분 | `src`·`supabase`·`public` 0건. `tests` 3건은 Design §4가 요구한 **부재 검증 단언**이라 0건과 동시 충족 불가 — 구현 결함 아님, Plan 문구 정정 대상(후속 1번) |
| 2 | seed `chamonix-hotel-2` 전 필드 + SQL 동일 행·notes + bookings insert | ✅ | `lodgings.ts:264~282` ↔ `…_lodgings.sql:90~91,97` 문자 단위 일치 |
| 3 | 14박·kind 분포 테스트 갱신 후 통과, security E2E 8/16 케이스 통과 | ✅ | `vitest` 통과 + 프로덕션 빌드 Playwright **111/111**에 `security.spec.ts:86~92`("2박째"·"숙소 미정"·후보 0건·`form` 0개) 포함 |
| 4 | `tsc`·`vitest` | ✅ | `tsc` 오류 0 · `vitest run` **126/126**(lodgings·bookings 27건 포함) |

**충족: 4/4** (1번은 Design §4 요구와의 문구 충돌로 `tests` 3건만 예외, 기능 판정은 충족)

## 산출물

- `src/data/seed/lodgings.ts` — `zurich-hotel` 블록 → `chamonix-hotel-2`(dayId `d2027-08-16`, kind `undecided`, country FR, `candidates: []`, priceLow 200 / priceHigh 300, notes "2박 연속 예약(체크아웃·짐 이동 없음)")
- `supabase/migrations/20260917000003_lodgings.sql` — lodgings insert 행 교체, `bookings` 초기 행 `('geneva-hotel'), ('chamonix-hotel-2')`
- `tests/unit/lodgings.test.ts` — dayId 매핑·undecided 3개·후보는 제네바 4곳만·SQL 행·notes·bookings insert·`zurich-hotel` 부재 가드
- `tests/unit/bookings.test.ts` — trek lodging 12개 필터가 `chamonix-hotel-2` 제외, insert 문자열 단언
- `tests/unit/itinerary.test.ts`, `tests/unit/seed.test.ts` — undecided id 목록·호텔 이동일 lodging id 갱신
- `tests/e2e/security.spec.ts` — 8/16 케이스 4단언
- 변경 없음(확인만): `src/lib/bookings/admin.ts`, `src/components/day/LodgingCard.tsx`, `src/app/travel/[dayId]/page.tsx`

## Key Decisions & Outcomes (Plan §4)

| 결정 | 준수 | 결과 |
|---|:--:|---|
| 8/15·8/16을 하나의 lodging으로 합치지 않고 Day↔Lodging 1:1을 유지 | ✅ | 예약 상태 관리 단위가 그대로라 `bookings` 행 수·관리자 표 구조·`getLodgingForDayAsync` 경로가 전부 무변경. 대신 notes가 "동일 호텔 2박 연속"을 문장으로 보장 |
| 아직 적용 전인 마이그레이션 000003의 행을 직접 교체(새 마이그레이션 추가 아님) | ✅ | 파일 1개 수정으로 끝났고 seed↔SQL 이중 관리 지점이 늘지 않았다. 다만 **이미 적용된 환경에서는 `on conflict do nothing` 특성상 교체가 일어나지 않는다** — 후속 3번 |
| 후보 호텔은 제네바 4곳만 남기고 `chamonix-hotel-2`는 `candidates: []` | ✅ | `LodgingCard`의 후보 블록이 `candidates.length > 0`일 때만 렌더되므로 8/16 화면에서 후보 섹션이 자동 소거. 취리히 후보 4곳이 되살아나면 E2E 0건 단언이 실패 |
| 관리자 입력 스키마는 손대지 않고 seed 파생에 맡긴다 | ✅ | `LODGING_IDS`가 seed에서 파생돼 id 하드코딩 0건. 다음 숙소 교체도 seed 1곳 수정으로 끝난다 |

## Check → Act 요약

| 단계 | 내용 |
|---|---|
| Check (gap-detector, 2026-09-18) | 대조 16항목 — matched 15 · partial 1 · missing 0 → **(15 + 0.5×1)/16 = 96.9%**. 게이트 95 **통과(PASS)** |
| 검증 방식 | `npx vitest run tests/unit/lodgings.test.ts tests/unit/bookings.test.ts` 27/27 · `npx tsc --noEmit` exit 0 · `zurich-hotel`·`Zürich HB`·`Zürich` 전수 grep · seed↔SQL 필드 대조 |
| Act | **불필요** — Critical/Major 0, 소스 수정이 필요한 gap 없음. 지적 1건은 문서 차원 |
| Minor-1 (문서) | Plan §5-1 "`zurich-hotel` … tests 0건"과 Design §4 "테스트가 `zurich-hotel` 부재를 단언" 요구가 상호 모순. 단언을 쓰면 문자열이 반드시 등장한다 → Plan 문구를 "`tests`는 부재 검증 단언에 한해 참조 허용"으로 정정 권고 (후속 1번, **미반영 잔여**) |
| 참고 관찰 | ① seed `nameKo`는 마이그레이션 컬럼 목록에 없으나 `name_ko` 컬럼 자체가 스키마에 없고 14행 모두 동일 — 기존 공개 컬럼 설계. ② `days.ts`·`travel-legs.ts`에 남은 `Zürich`는 8/3 입국편·8/17 취리히 공항 직행으로 D-007이 유지한 경로 |
| QA (2026-09-18) | `tsc` 0 · `vitest run` **126/126** · 프로덕션 빌드 Playwright **111/111**(`security.spec.ts` 8/16 케이스 포함, itinerary-core Act-1 이후 재실행분 포함) |

## 후속·미검증 항목

1. **Minor 잔여 — Plan §5-1 문구 정정(문서)** — `docs/01-plan/booking-tracker.plan.md` §5-1의 "src·tests·supabase에 0건"을 "`src`·`supabase`·`public`에 0건, `tests`는 부재 검증 단언에 한해 참조 허용"으로 고친다. 소스·테스트 수정은 불필요하며, 회귀 가드 3건(`tests/unit/lodgings.test.ts:48,146,148`)은 그대로 둔다.
2. **Supabase 미연결 항목** — 단위 테스트는 `NEXT_PUBLIC_SUPABASE_URL` 부재 시의 **seed fallback 경로만** 통과시킨다(`lodgings.test.ts:113~119`). 실제 DB 조회에서 `bookings_public` 미러·RLS·컬럼 단위 grant가 `chamonix-hotel-2` 행에 대해 의도대로 동작하는지는 연결 후 1회 확인이 필요하다.
3. **마이그레이션 적용 이력 주의** — `20260917000003_lodgings.sql`은 아직 DB 미적용 전제로 행을 직접 교체했다. 이미 적용된 환경에서는 `insert … on conflict do nothing` 때문에 **기존 `zurich-hotel` 행이 남고 `chamonix-hotel-2`가 삽입되지 않는다.** 그런 환경에서는 8.7 관리자 화면 또는 별도 갱신 마이그레이션으로 처리한다.
4. **`/travel/d2027-08-16` 실제 렌더** — 페이지는 `force-dynamic`이며 `legs.length === 0`이면 `notFound()`한다. 8/16 숙박 카드(undecided·후보 없음)의 브라우저 렌더는 E2E 단언 통과로만 확인했고 시각 스냅샷은 남기지 않았다.
5. **8/16 숙박 금액의 단일 출처화** — `chamonix-hotel-2`의 €200~300/실과 budget-view `city-hotels` 항목(275/390, 실당 €550~780 ÷ 2인)이 이중 관리된다. 숙소 확정 시 두 값과 `checkedAt`·`sourceCheckedAt`을 같은 날짜로 함께 갱신한다(budget-view 후속 2번과 같은 건).
6. **리더 예약 확정 절차** — `chamonix-hotel-2`는 여전히 `undecided`다. 8/15 호텔을 고를 때 2박 연속 예약이 가능한 곳인지(에귀 뒤 미디 승강장 도보 10분 이내 권장)를 확인한 뒤 두 행을 함께 확정해야 한다.
