# Analysis — booking-tracker (PRD v3.1 델타)

> feature: booking-tracker · Check 단계 · gap-detector 실행 2026-09-18 · 게이트 95
> 설계: `docs/02-design/booking-tracker.design.md` §1~§4 · Plan: `docs/01-plan/booking-tracker.plan.md` §5 · PRD: `docs/PRD.md` v3.1 (FR-010 · D-007 · 8.4 · 부록 A-2 · 부록 C-2 8/16 · 부록 C-4 3번)
> 이전 사이클: `docs/archive/2026-09-v3.0/booking-tracker/` (v2.0 사이클 97.9%)

## Context Anchor
| Key | Value |
|---|---|
| WHY | D-007 취리히 호텔 삭제 → 8/16 샤모니 2박째 |
| WHO | 리더, 방문자 |
| RISK | seed↔SQL 문구 불일치, 남은 `zurich-hotel` 참조 |
| SUCCESS | zurich-hotel 0건, chamonix-hotel-2 seed·SQL·bookings 일치, 14박 유지 |
| SCOPE | lodgings seed, migration 000003, admin 스키마, LodgingCard, 8/16 이동일 페이지, unit·E2E 테스트 |

## 결과

| 항목 | 값 |
|---|---|
| 대조 항목 수 | 16 |
| matched | 15 |
| partial | 1 |
| missing | 0 |
| **Match Rate** | **(15 + 0.5×1) / 16 = 96.9%** |
| 게이트(95) | **PASS** |
| Critical / Important / Minor | 0 / 0 / 1 |

seed↔SQL 대조(Important 등급 대상)는 `chamonix-hotel-2` 전 필드가 완전 일치하여 **불일치 0건**이다. 유일한 지적은 Plan §5 성공 기준 1번 문구와 Design §4 테스트 요구가 서로 모순되는 **문서 차원의 Minor** 건이다.

## 검증 근거

| 검증 | 명령 | 결과 |
|---|---|---|
| 단위 테스트 | `npx vitest run tests/unit/lodgings.test.ts tests/unit/bookings.test.ts` | **Test Files 2 passed (2) · Tests 27 passed (27)** · 678 ms · exit 0 |
| 타입 검사 | `npx tsc --noEmit` | **오류 0건** · exit 0 |
| `zurich-hotel` 전수 grep | `grep -rn "zurich-hotel" src tests supabase public` | `src` 0건 · `supabase` 0건 · `public` 0건 · `tests` **3건**(모두 `tests/unit/lodgings.test.ts`의 부재 검증: L48 `expect(byId.has("zurich-hotel")).toBe(false)`, L146 테스트 제목, L148 `expect(sql).not.toContain("zurich-hotel")`) |
| `Zürich HB` 전수 grep | `grep -rn "Zürich HB" src tests supabase public` | **0건** |
| `Zürich`/`zurich` 잔여 확인 | `grep -rni "zürich\|zurich" src tests supabase public` | 잔여물 없음. `src/data/seed/days.ts`(8/3 인천→취리히→제네바, 8/17 취리히 공항 경유), `src/data/seed/travel-legs.ts`(Zürich Flughafen), `tests/e2e/responsive.spec.ts`·`tests/unit/seed.test.ts`(8/17 D-007 경로 검증), `tests/e2e/security.spec.ts:90`("Fred Hotel Zürich Hauptbahnhof" **0건 단언**) — 모두 D-007이 유지하기로 한 항공·이동 경로이거나 삭제 회귀 가드다. |
| E2E | 미실행 (본 Check 범위 밖) | 아래 "런타임 미검증" 참조 |

## 항목별 대조

| # | 출처 | 요구 | 구현 근거 | 판정 |
|:--:|---|---|---|:--:|
| 1 | Design §1 | 변경 파일 5종(seed·migration·unit 4종·E2E) | `src/data/seed/lodgings.ts`, `supabase/migrations/20260917000003_lodgings.sql`, `tests/unit/{lodgings,bookings,itinerary,seed}.test.ts`, `tests/e2e/security.spec.ts` 모두 v3.1 값 반영 | matched |
| 2 | Design §2 · PRD C-2 8/16 | seed `chamonix-hotel-2` 전 필드 정확값 | `lodgings.ts:264~282`: id·nameOriginal `샤모니의 호텔(미정) · 2박째`·nameKo·kind `undecided`·location `Chamonix-Mont-Blanc, 1,035 m`·country `FR`·dayId `d2027-08-16`·bookingChannel `other`·bookingUrl/contactUrl/verifiedPhone `null`·priceLow 200·priceHigh 300·currency `EUR`·season·checkedAt `2026-09-18`·alternative `null`·candidates `[]`·notes 모두 설계 블록과 문자 단위 일치 | matched |
| 3 | Design §2 · PRD A-2/I-006 | SQL 행이 seed와 동일 값(country 'FR', candidates '[]'::jsonb, notes 동일 문자열) | `20260917000003_lodgings.sql:90~91` 행이 seed와 동일. `lodgings.test.ts:152` `expect(sql).toContain(seed.notes!)` 통과 | matched |
| 4 | Design §1 · Plan §5.2 | bookings 초기 행 `('geneva-hotel'), ('chamonix-hotel-2')` | `…_lodgings.sql:97` `insert into public.bookings (lodging_id) values ('geneva-hotel'), ('chamonix-hotel-2')` | matched |
| 5 | PRD FR-010 / N-007 · Plan §2 | 14박 유지(제네바 1 · 트레킹 11 · 샤모니 2), `zurich-hotel` 없음 | seed 엔트리 14개(id 목록 확인), `zurich-hotel` 0건. `lodgings.test.ts:37~41`·`bookings.test.ts:169~172` 통과 | matched |
| 6 | 과업 지시 | `LODGING_IDS`가 seed에서 파생 | `src/lib/bookings/admin.ts:37` `const LODGING_IDS = lodgings.map((l) => l.id) as [string, ...string[]]` → `BookingInputSchema.lodgingId`(L49)·`alternativeLodgingId`(L55)·`LodgingInputSchema.id`(L190)가 자동으로 `chamonix-hotel-2`를 수용, 하드코딩 없음 | matched |
| 7 | Design §3 · PRD 8.4 | `LodgingCard` undecided 분기가 "숙소 미정"·"리더가 확정 예정"·notes·season 렌더 | `LodgingCard.tsx:28` `undecided` 판정 → L47 `<Badge tone="warn">숙소 미정</Badge>` · L52 "리더가 확정 예정 · 확정 후 링크·연락처가 표시됩니다" · L82 가격행에 `lodging.season` · L91~96 `비고`에 `lodging.notes` · L53 후보는 `candidates.length > 0`일 때만 → `chamonix-hotel-2`는 `[]`이므로 미렌더 · L104 undecided면 예약·전화 버튼 미렌더 | matched |
| 8 | Design §3 · PRD 8.4 | 8/16 이동일 페이지 숙박 섹션 | `src/data/seed/days.ts:381~393` `d2027-08-16` type `travel`, `lodgingId: "chamonix-hotel-2"` → `src/app/travel/[dayId]/page.tsx:29~62`가 `getLodgingForDayAsync(day)` + `getPublicBookings()`로 `LodgingCard` 렌더 | matched |
| 9 | Design §4 | `lodgings.test.ts`: 8/3·8/15·8/16 매핑, zurich 없음, undecided 3개, 후보 제네바 4곳만, SQL 행·notes·bookings insert | `lodgings.test.ts:43~62`, `:145~153` 전부 존재·통과 | matched |
| 10 | Design §4 | `bookings.test.ts`: trek lodging 12개 필터가 `chamonix-hotel-2` 제외, bookings insert 문자열 | `bookings.test.ts:144~147`(제네바·샤모니2 제외 후 12개), `:175~177`(insert 문자열) 통과 | matched |
| 11 | Design §4 | `itinerary.test.ts`: undecided id 목록 | `itinerary.test.ts:82` `expect(all.filter(l => l.kind === "undecided").map(l => l.id)).toEqual(["geneva-hotel","chamonix-hotel","chamonix-hotel-2"])` 통과 | matched |
| 12 | Design §4 | `seed.test.ts`: 호텔 이동일 lodging id | `seed.test.ts:111~114` `hotelDayIds = ["d2027-08-03","d2027-08-16"]` → `["geneva-hotel","chamonix-hotel-2"]`, `:145` day `lodgingId` = `chamonix-hotel-2` 통과 | matched |
| 13 | Design §4 · PRD 8.4 | `security.spec.ts` 8/16 케이스: "2박째"·"숙소 미정"·"Fred Hotel Zürich Hauptbahnhof" 0건·`form` 0개 | `security.spec.ts:86~92`에 4개 단언 모두 존재. 정적 근거로도 `src/app/travel`·`src/components/day` 하위에 `<form` 0건 | matched (코드 기준, 런타임 미실행) |
| 14 | PRD C-4 3번 | 이동일 호텔 3박(제네바 8/3 1박 · 샤모니 8/15~8/16 2박 연속) | seed의 undecided 3건이 정확히 `geneva-hotel`(8/3)·`chamonix-hotel`(8/15)·`chamonix-hotel-2`(8/16)이며 `chamonix-hotel-2.notes`가 "2박 연속 예약(체크아웃·짐 이동 없음)"을 명시 | matched |
| 15 | Plan §5.3~5.4 | 기존 14박·kind 분포 테스트 갱신 후 통과, `tsc`·`vitest` | vitest 27/27 통과, `tsc --noEmit` 오류 0. kind 분포(refuge 7·village 4·undecided 3)는 `itinerary.test.ts:80~82` | matched |
| 16 | Plan §5.1 | `zurich-hotel` 문자열이 **src·tests·supabase에 0건** | `src` 0 · `supabase` 0 · **`tests` 3건**(`tests/unit/lodgings.test.ts` 회귀 가드). Design §4가 명시적으로 "`zurich-hotel` 없음" 검사를 요구하므로 0건과 동시에 만족 불가 | **partial** |

## 지적과 조치 필요

### [Minor-1] Plan §5 성공 기준 1번과 Design §4가 서로 모순된다 (문서)

- 현상: Plan `docs/01-plan/booking-tracker.plan.md` §5-1은 "`zurich-hotel` 문자열이 src·tests·supabase에 **0건**"을 요구한다. 그러나 Design `docs/02-design/booking-tracker.design.md` §4는 `lodgings.test.ts`가 "`zurich-hotel` 없음"·"zurich-hotel 0건"을 **단언**할 것을 요구한다. 단언을 작성하려면 테스트 파일에 문자열이 반드시 등장한다.
- 실제 상태: `tests/unit/lodgings.test.ts` L48·L146·L148 3건. 전부 부재를 검증하는 회귀 가드이며, 삭제하면 Design §4 요구가 깨지고 재도입 회귀를 잡을 수 없다.
- 판단: 구현 결함 아님. **코드 수정 불필요.**
- 조치(Act 단계 권고): Plan §5-1 문구를 "`zurich-hotel`이 `src`·`supabase`·`public`에 0건, `tests`는 부재 검증 단언에 한해 참조 허용"으로 정정한다. 문서만 수정하며 소스는 건드리지 않는다.

### 참고 관찰 (지적 아님)

- seed의 `nameKo`는 마이그레이션 insert 컬럼 목록에 없다. 확인 결과 `name_ko` 컬럼은 스키마 전체에 존재하지 않으며 14행 모두 동일하다 — 이번 델타가 만든 회귀가 아니라 기존 공개 컬럼 설계다.
- `src/data/seed/days.ts`·`travel-legs.ts`·`tests/e2e/responsive.spec.ts`·`tests/unit/seed.test.ts`에 남은 `Zürich`는 8/3 입국편과 8/17 취리히 공항 직행(D-007이 신설한 경로)이며 삭제 대상이 아니다.
- `tests/e2e/security.spec.ts:90`의 "Fred Hotel Zürich Hauptbahnhof"는 삭제된 후보 호텔이 다시 렌더되지 않는지 확인하는 0건 단언이다. 해당 문자열은 `src`·`supabase`·`public` 어디에도 없다.

## 런타임 미검증

본 Check는 정적 대조 + 단위 테스트 + 타입 검사까지만 수행했다. 다음은 확인하지 못했다.

1. **E2E 미실행**: `tests/e2e/security.spec.ts:86~92`(8/16 "2박째"·"숙소 미정"·후보 0건·`form` 0개)와 `responsive.spec.ts:76`(8/17 경로)는 코드상 단언 존재만 확인했고 프로덕션 빌드에서 실행하지 않았다. 실행 시 `npm run build && next start -p 3100` 전제와 `--workers=1` 권장.
2. **`/travel/d2027-08-16` 실제 렌더 미확인**: 페이지는 `dynamic = "force-dynamic"`이고 `legs.length === 0`이면 `notFound()`한다. 8/16 레그 존재는 `seed.test.ts:140`으로 간접 확인했을 뿐 브라우저 렌더는 확인하지 않았다.
3. **마이그레이션 미적용**: `20260917000003_lodgings.sql`은 아직 DB에 적용 전이다(Plan §4 결정). `insert … on conflict do nothing` 특성상, 이미 적용된 환경이라면 기존 `zurich-hotel` 행이 남고 `chamonix-hotel-2` 행이 삽입되지 않는다. 적용 이력이 있는 환경에서는 8.7 관리자 화면으로 갱신해야 한다.
4. **Supabase 연동 경로 미검증**: 단위 테스트는 `NEXT_PUBLIC_SUPABASE_URL` 부재 시 seed fallback 경로만 통과시킨다(`lodgings.test.ts:113~119`). 실제 DB 조회 시 `bookings_public` 미러·RLS 동작은 미확인.
5. **전체 회귀 스위트 미실행**: 지정된 2개 파일만 실행했다. `lodgings`/`bookings` 외 `itinerary.test.ts`·`seed.test.ts`의 v3.1 단언은 소스 대조로만 확인했다.
