import { createClient } from "@supabase/supabase-js";
import { expect, test } from "./qa-support/fixtures";
import { accounts, need } from "./qa-support/env";
import { captureBaseline, restoreBaseline } from "./qa-support/baseline";
import { anonClient, passwordSession, serviceClient, supabaseUrl, userIdByEmail } from "./qa-support/supabase";
import {
  A_ITEMS,
  B_ITEMS,
  MSG,
  PACKING_TOTAL,
  accountButton,
  authCookieNames,
  checkItems,
  headerLogin,
  lodgingRow,
  logoutViaMenu,
  noHorizontalScroll,
  openAccountMenu,
  packingBox,
  ready,
} from "./qa-support/ui";

// P0 5선: (1) 로그인·인증 (2) 역할 권한 (3) 사용자별 데이터 저장 (4) 관리자 핵심 저장 업무 (5) 핵심 조회 업무
// 근거: docs/PRD.md 5.1·5.4, SCR-007·008·009·015·018, FR-010·020~024·029, SC-001·002·004·007·008·017~021

test.use({ strictDiag: true });

test.beforeAll(async () => {
  await captureBaseline();
});

test.describe("P0 핵심 흐름", () => {
  test("TC-P0-01 이메일·비밀번호 로그인 → 계정 메뉴 → 로그아웃 → 세션 소멸, 잘못된 비밀번호 (SCR-015·018, FR-019~021·029)", async ({ page, context, shot, diag }) => {
    const A = accounts.userA();
    diag.allowStatus(400);

    await test.step("비로그인: 헤더에 '로그인' 링크, 보호 화면 안내", async () => {
      await page.goto("/login?next=/packing");
      await ready(page);
      await expect(page.getByRole("heading", { level: 1, name: "로그인" })).toBeVisible();
      await expect(page.getByText("로그인이 필요한 화면입니다. 로그인하면 보던 화면으로 돌아갑니다.")).toBeVisible();
      await expect(accountButton(page)).toHaveCount(0);
    });

    await test.step("잘못된 비밀번호: 오류 문구, 이메일 입력 유지, 세션 쿠키 없음", async () => {
      await page.getByLabel("이메일").fill(A.email);
      await page.getByLabel("비밀번호", { exact: true }).fill("wrong-password-for-qa");
      await page.getByRole("button", { name: "로그인", exact: true }).click();
      await expect(page.locator("main").getByRole("alert")).toContainText(MSG.badLogin);
      await expect(page.getByLabel("이메일")).toHaveValue(A.email);
      expect(await authCookieNames(context)).toEqual([]);
      await shot("TC-P0-01-wrong-password", page);
    });

    await test.step("올바른 비밀번호: next(/packing)로 복귀, 계정 저장 안내, 계정 메뉴에 이메일 축약", async () => {
      await page.getByLabel("비밀번호", { exact: true }).fill(A.password);
      await page.getByRole("button", { name: "로그인", exact: true }).click();
      await page.waitForURL((u) => u.pathname === "/packing");
      await expect(page.getByText(MSG.accountSubtitle)).toBeVisible();
      await expect(accountButton(page)).toContainText(A.email.slice(0, 12));
      expect((await authCookieNames(context)).length).toBeGreaterThan(0);
      await shot("TC-P0-01-logged-in", page);
    });

    await test.step("계정 메뉴: 전체 이메일·로그아웃 노출, 일반 사용자에게 '관리자 화면' 없음", async () => {
      const menu = await openAccountMenu(page);
      await expect(menu).toContainText(A.email);
      await expect(menu.getByRole("menuitem", { name: "로그아웃" })).toBeVisible();
      await expect(menu.getByRole("menuitem", { name: "관리자 화면" })).toHaveCount(0);
      await page.keyboard.press("Escape");
      await expect(page.getByRole("menu", { name: "계정 메뉴" })).toHaveCount(0);
    });

    await test.step("로그아웃: 홈 이동, '로그인' 링크 복귀, 세션 쿠키 제거, 준비물은 기기 저장 모드", async () => {
      await logoutViaMenu(page);
      await expect(headerLogin(page)).toBeVisible();
      expect(await authCookieNames(context)).toEqual([]);
      await page.goto("/packing");
      await expect(page.getByText(MSG.deviceSubtitle)).toBeVisible();
      await shot("TC-P0-01-logged-out", page);
    });
  });

  test("TC-P0-02 역할별 접근 권한: 비로그인·일반 사용자 차단, 관리자 허용 (5.1, SCR-007·008·011·018, FR-021, SC-007·020, SYNC-02·04)", async ({
    page,
    request,
    newRoleContext,
    shot,
  }) => {
    test.setTimeout(120_000);
    const svcUrl = supabaseUrl();
    const anonKey = need("NEXT_PUBLIC_SUPABASE_ANON_KEY");

    await test.step("비로그인: /admin/bookings → /admin 리다이렉트, 리더 로그인 필요 안내, 폼 존재(제출 안 함), 예약 데이터 없음", async () => {
      await page.goto("/admin/bookings");
      await expect(page).toHaveURL(/\/admin\?next=(%2F|\/)admin(%2F|\/)bookings/);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("관리자 예약");
      await expect(page.getByText(MSG.leaderNeeded)).toBeVisible();
      await expect(page.getByPlaceholder("leader@example.com")).toBeVisible();
      await expect(page.getByRole("button", { name: "로그인 링크 보내기" })).toBeVisible();
      await expect(page.getByText("14박 예약·숙박 편집")).toHaveCount(0);
      await shot("TC-P0-02-anon-admin", page);
    });

    await test.step("비로그인: 관리자 API 401/403·비공개 필드 없음, REST 익명 조회 0행", async () => {
      const res = await request.get("/api/admin/bookings/mottets");
      expect([401, 403]).toContain(res.status());
      const body = await res.text();
      expect(body).not.toContain("confirmation_ref");
      expect(body).not.toContain("private_memo");
      const anon = anonClient();
      for (const table of ["bookings", "packing_checks"]) {
        const r = await anon.from(table).select("*");
        expect(r.error !== null || (r.data ?? []).length === 0, `${table} 익명 조회`).toBe(true);
      }
      const phone = await anon.from("lodgings").select("phone_verified_by");
      expect(phone.error, "익명은 phone_verified_by를 읽을 수 없음(SYNC-04)").not.toBeNull();
    });

    const userA = await newRoleContext("userA");
    await test.step("일반 사용자 A: /admin·/admin/bookings 접근 불가 안내, 관리자 API 403, 계정 메뉴에 '관리자 화면' 없음", async () => {
      await userA.page.goto("/admin/bookings");
      await expect(userA.page).toHaveURL(/\/admin(\?|$)/);
      await expect(userA.page.getByText(MSG.forbidden)).toBeVisible();
      await expect(userA.page.getByRole("link", { name: "공개 화면으로" })).toBeVisible();
      await expect(userA.page.getByText("14박 예약·숙박 편집")).toHaveCount(0);
      const res = await userA.context.request.get("/api/admin/bookings/mottets");
      expect(res.status()).toBe(403);
      expect(await res.text()).not.toContain("private_memo");
      const menu = await openAccountMenu(userA.page);
      await expect(menu.getByRole("menuitem", { name: "관리자 화면" })).toHaveCount(0);
      await shot("TC-P0-02-userA-admin-forbidden", userA.page);
    });

    await test.step("일반 사용자 A: 팀원 아님 안내·기록 폼 없음, REST 쓰기·비공개 컬럼 차단", async () => {
      await userA.page.goto("/journal/d2027-08-06");
      await expect(userA.page.getByText(MSG.notMember)).toBeVisible();
      await expect(userA.page.locator("form textarea[name='text']")).toHaveCount(0);

      const session = await passwordSession(accounts.userA());
      const client = createClient(svcUrl, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${session.access_token}` } },
      });
      const ins = await client
        .from("journal_entries")
        .insert({ day_id: "d2027-08-06", author_id: session.user.id, author_label: "QA", text: "QA-should-be-rejected" })
        .select();
      if (!ins.error) await serviceClient().from("journal_entries").delete().eq("text", "QA-should-be-rejected");
      expect(ins.error, "비팀원 기록 INSERT는 RLS로 거부").not.toBeNull();
      const upd = await client.from("bookings").update({ status: "confirmed" }).eq("lodging_id", "la-balme").select();
      expect((upd.data ?? []).length, "일반 사용자의 bookings UPDATE는 0행").toBe(0);
      const sel = await client.from("bookings").select("lodging_id");
      expect((sel.data ?? []).length, "일반 사용자는 bookings(비공개) 0행").toBe(0);
      const phone = await client.from("lodgings").select("phone_verified_by");
      expect(phone.error, "로그인 사용자도 phone_verified_by 불가(SYNC-04)").not.toBeNull();
      const priv = await client.rpc("admin_lodging_private");
      expect((priv.data ?? []).length, "비관리자 admin_lodging_private 0행").toBe(0);
    });

    const admin = await newRoleContext("admin");
    await test.step("관리자: /admin 리더 배너·편집 링크, 계정 메뉴에 '관리자 화면', /admin/bookings 14박 목록", async () => {
      await admin.page.goto("/admin");
      await expect(admin.page.getByText("리더로 로그인됨")).toBeVisible();
      await expect(admin.page.getByText("DB 리더 등록 확인됨.")).toBeVisible();
      await expect(admin.page.getByRole("link", { name: /예약 상태 편집/ })).toBeVisible();
      const menu = await openAccountMenu(admin.page);
      await expect(menu.getByRole("menuitem", { name: "관리자 화면" })).toBeVisible();
      await admin.page.keyboard.press("Escape");
      await admin.page.goto("/admin/bookings");
      await expect(admin.page.getByRole("heading", { level: 1, name: "14박 예약·숙박 편집" })).toBeVisible();
      await expect(admin.page.getByRole("button", { name: "편집" })).toHaveCount(14);
      await expect(admin.page.getByRole("heading", { name: "공개 미리보기" })).toBeVisible();
      expect(await noHorizontalScroll(admin.page)).toBeLessThanOrEqual(0);
      const res = await admin.context.request.get("/api/admin/bookings/mottets");
      expect(res.status()).toBe(200);
      await shot("TC-P0-02-admin-bookings", admin.page);
    });
  });

  test("TC-P0-03 준비물: 사용자별 저장·새로고침 복원·사용자 간 격리·로그아웃 후 기기 모드 (SCR-009, FR-015·022~024, SC-011·017~020)", async ({
    newRoleContext,
    shot,
  }) => {
    test.setTimeout(120_000);
    const svc = serviceClient();
    const aId = (await userIdByEmail(accounts.userA().email)) ?? "";
    const bId = (await userIdByEmail(accounts.userB().email)) ?? "";
    expect(aId).not.toBe("");
    expect(bId).not.toBe("");
    try {
      await svc.from("packing_checks").delete().eq("user_id", aId);
      await svc.from("packing_checks").delete().eq("user_id", bId);

      const guest = await newRoleContext("anon");
      await test.step("비로그인: 기기 저장 — 체크·새로고침 유지·전체 해제 (SC-011)", async () => {
        await guest.page.goto("/packing");
        await expect(guest.page.getByText(MSG.deviceSubtitle)).toBeVisible();
        await expect(guest.page.getByText("로그인하면 체크 상태가 내 계정에 저장되어 다른 기기에서도 이어집니다.")).toBeVisible();
        await expect(packingBox(guest.page, "docs-passport")).toBeEnabled();
        await packingBox(guest.page, "docs-passport").check();
        await expect(guest.page.getByTestId("packing-progress")).toContainText(`1/${PACKING_TOTAL}`);
        await guest.page.reload();
        await expect(packingBox(guest.page, "docs-passport")).toBeChecked();
        await guest.page.getByRole("button", { name: "전체 해제" }).click();
        await expect(guest.page.getByTestId("packing-progress")).toContainText(`0/${PACKING_TOTAL}`);
      });

      const ctxA = await newRoleContext("userA");
      const ctxB = await newRoleContext("userB");
      await test.step("A 3개·B 5개 체크 → 계정에 저장됨 표시", async () => {
        await ctxA.page.goto("/packing");
        await ctxB.page.goto("/packing");
        await expect(ctxA.page.getByText(MSG.accountSubtitle)).toBeVisible();
        await expect(ctxB.page.getByText(MSG.accountSubtitle)).toBeVisible();
        await checkItems(ctxA.page, A_ITEMS);
        await expect(ctxA.page.getByTestId("packing-sync-status")).toContainText(MSG.syncSaved);
        await checkItems(ctxB.page, B_ITEMS);
        await expect(ctxB.page.getByTestId("packing-sync-status")).toContainText(MSG.syncSaved);
      });

      await test.step("새로고침 후 A는 3/34, B는 5/34, 서로의 항목은 보이지 않음 (SC-017·018)", async () => {
        await ctxA.page.reload();
        await ctxB.page.reload();
        await expect(ctxA.page.getByTestId("packing-progress")).toContainText(`3/${PACKING_TOTAL}`);
        await expect(ctxB.page.getByTestId("packing-progress")).toContainText(`5/${PACKING_TOTAL}`);
        for (const id of A_ITEMS) await expect(packingBox(ctxA.page, id)).toBeChecked();
        for (const id of B_ITEMS) await expect(packingBox(ctxA.page, id)).not.toBeChecked();
        for (const id of A_ITEMS) await expect(packingBox(ctxB.page, id)).not.toBeChecked();
        await shot("TC-P0-03-userA-after-reload", ctxA.page);
        await shot("TC-P0-03-userB-after-reload", ctxB.page);
      });

      await test.step("DB 검증: 각자 자기 행만 존재, A 세션으로 B 행 조회·수정·삭제 0행 (SC-019)", async () => {
        const rowsA = await svc.from("packing_checks").select("item_id").eq("user_id", aId).eq("checked", true);
        const rowsB = await svc.from("packing_checks").select("item_id").eq("user_id", bId).eq("checked", true);
        expect((rowsA.data ?? []).map((r) => r.item_id).sort()).toEqual([...A_ITEMS].sort());
        expect((rowsB.data ?? []).map((r) => r.item_id).sort()).toEqual([...B_ITEMS].sort());
        const session = await passwordSession(accounts.userA());
        const client = createClient(supabaseUrl(), need("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { Authorization: `Bearer ${session.access_token}` } },
        });
        expect(((await client.from("packing_checks").select("item_id").eq("user_id", bId)).data ?? []).length).toBe(0);
        expect(((await client.from("packing_checks").update({ checked: false }).eq("user_id", bId).select()).data ?? []).length).toBe(0);
        expect(((await client.from("packing_checks").delete().eq("user_id", bId).select()).data ?? []).length).toBe(0);
        const still = await svc.from("packing_checks").select("item_id").eq("user_id", bId).eq("checked", true);
        expect((still.data ?? []).length).toBe(B_ITEMS.length);
      });

      await test.step("A 로그아웃: 계정 체크가 화면·기기 저장소에 남지 않고, B 세션은 유지 (SC-017·020)", async () => {
        await logoutViaMenu(ctxA.page);
        await ctxA.page.goto("/packing");
        await expect(ctxA.page.getByText(MSG.deviceSubtitle)).toBeVisible();
        await expect(ctxA.page.getByTestId("packing-progress")).toContainText(`0/${PACKING_TOTAL}`);
        for (const id of A_ITEMS) await expect(packingBox(ctxA.page, id)).not.toBeChecked();
        const leftover = await ctxA.page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("tmb2027:packing:acct:") || k.startsWith("tmb2027:packing:queue:")).length);
        expect(leftover).toBe(0);
        await ctxB.page.reload();
        await expect(ctxB.page.getByTestId("packing-progress")).toContainText(`5/${PACKING_TOTAL}`);
        await shot("TC-P0-03-userA-after-logout", ctxA.page);
      });
    } finally {
      await restoreBaseline();
    }
  });

  test("TC-P0-04 관리자 예약 상태·숙박 정보 저장 → 공개 화면 반영 → 새로고침 후 유지 → 복원 (SCR-008·003, FR-010, SC-004·007)", async ({
    newRoleContext,
    shot,
  }, testInfo) => {
    test.setTimeout(150_000);
    const NAME = "Refuge de la Balme";
    const DAY = "/day/d2027-08-05";
    const stamp = Date.now().toString(36);
    const MEMO = `QA-PRIVATE-MEMO-${stamp}`;
    const NOTE = `QA-NOTE-${stamp}`;
    const svc = serviceClient();
    const before = await svc.from("bookings").select("status, private_memo, version").eq("lodging_id", "la-balme").single();
    expect(before.error).toBeNull();
    const origStatus = before.data?.status as string;
    try {
      const admin = await newRoleContext("admin");
      const visitor = await newRoleContext("anon");
      await visitor.page.goto(DAY);
      const lodgingCard = visitor.page.locator('article[aria-labelledby^="lodging-"]').first();
      await expect(lodgingCard.getByTestId("booking-status")).toContainText("미예약");

      await test.step("관리자: 편집 클릭 → 편집 패널이 화면에 스크롤되어 보임", async () => {
        await admin.page.goto("/admin/bookings");
        await expect(admin.page.getByRole("heading", { level: 1, name: "14박 예약·숙박 편집" })).toBeVisible();
        const row = lodgingRow(admin.page, NAME);
        await row.getByRole("button", { name: "편집" }).click();
        const panel = admin.page.locator("#lodging-edit-panel");
        await expect(panel.getByRole("heading", { name: new RegExp(`${NAME} 편집`) })).toBeInViewport();
        await expect(row.getByRole("button", { name: "닫기" })).toHaveAttribute("aria-expanded", "true");
        await shot("TC-P0-04-panel-open", admin.page);
      });

      const panel = admin.page.locator("#lodging-edit-panel");
      const saveStart = { t: 0 };
      await test.step("예약 상태 '문의'·비공개 메모 입력 → 변경 경고 → 저장 → 저장됨", async () => {
        await panel.getByLabel("공개 상태").selectOption({ label: "문의" });
        await panel.getByLabel("비공개 메모").fill(MEMO);
        await expect(panel.getByText("저장되지 않은 변경이 있습니다")).toBeVisible();
        saveStart.t = Date.now();
        await panel.getByRole("button", { name: "저장", exact: true }).click();
        await expect(panel.getByRole("status").filter({ hasText: "저장됨" }).first()).toBeVisible();
        await shot("TC-P0-04-saved", admin.page);
      });

      await test.step("방문자 화면: 열어 둔 Day 상세가 5초(구독 실패 시 30초 폴링) 내 '문의' 반영, 비공개 메모 비노출 (SC-004·007)", async () => {
        await expect(lodgingCard.getByTestId("booking-status")).toContainText("문의", { timeout: 40_000 });
        const elapsed = Date.now() - saveStart.t;
        testInfo.annotations.push({ type: "SC-004 반영 시간(ms)", description: String(elapsed) });
        const html = await visitor.page.content();
        expect(html).not.toContain(MEMO);
        const api = await visitor.context.request.get("/api/bookings");
        const json = (await api.json()) as { bookings: { lodgingId: string; status: string }[] };
        expect(json.bookings.find((b) => b.lodgingId === "la-balme")?.status).toBe("inquiry");
        expect(JSON.stringify(json)).not.toContain(MEMO);
        await shot("TC-P0-04-public-status", visitor.page);
      });

      await test.step("DB 검증 후 관리자 새로고침: 저장값 유지", async () => {
        const after = await svc.from("bookings").select("status, private_memo").eq("lodging_id", "la-balme").single();
        expect(after.data?.status).toBe("inquiry");
        expect(after.data?.private_memo).toBe(MEMO);
        await admin.page.reload();
        await lodgingRow(admin.page, NAME).getByRole("button", { name: "편집" }).click();
        await expect(admin.page.locator("#lodging-edit-panel").getByLabel("공개 상태")).toHaveValue("inquiry");
        await expect(admin.page.locator("#lodging-edit-panel").getByLabel("비공개 메모")).toHaveValue(MEMO);
      });

      await test.step("숙박 정보 '비고(공개)' 저장 → 방문자 Day 상세에 반영", async () => {
        const p = admin.page.locator("#lodging-edit-panel");
        await p.getByLabel("비고 (공개)").fill(NOTE);
        await p.getByRole("button", { name: "숙박 정보 저장" }).click();
        await expect(p.getByText("저장됨 — 새로고침하면 최신 값이 보입니다")).toBeVisible();
        await expect(async () => {
          await visitor.page.reload();
          await expect(visitor.page.locator("main")).toContainText(NOTE, { timeout: 3_000 });
        }).toPass({ timeout: 30_000 });
        await shot("TC-P0-04-lodging-note-public", visitor.page);
      });
    } finally {
      const report = await restoreBaseline();
      const check = await svc.from("bookings").select("status, private_memo").eq("lodging_id", "la-balme").single();
      expect(check.data?.status, `복원 후 상태 (${report.actions.join("; ")})`).toBe(origStatus);
      expect(check.data?.private_memo ?? null).toBe(before.data?.private_memo ?? null);
      expect(report.leftovers).toEqual([]);
    }
  });

  test("TC-P0-05 핵심 조회 업무: 홈 지표 → 전체 일정 15일 → Day 상세 필드·링크 → 이동일 (SCR-001·002·003·004, FR-001·002·003·005·008, SC-001·002·008)", async ({
    page,
    shot,
  }) => {
    await test.step("홈: 슬로건·5개 지표·오늘 카드(출발 전)·빠른 링크 5개 (FR-008, SC-008)", async () => {
      await page.goto("/");
      await expect(page.getByRole("heading", { level: 1, name: "걸어야 산다!" })).toBeVisible();
      const metrics = page.getByRole("list", { name: "원정 지표" }).or(page.locator("dl[aria-label='원정 지표']"));
      await expect(metrics).toContainText("2027-08-03 ~ 08-17");
      await expect(metrics).toContainText("10명");
      await expect(metrics).toContainText("163.0 km");
      await expect(metrics).toContainText("9,750 m");
      await expect(metrics).toContainText("9,725 m");
      await expect(page.getByText(/출발까지 D-\d+ \(현지 기준\)/)).toBeVisible();
      const quick = page.getByRole("navigation", { name: "빠른 링크" });
      for (const label of ["일정", "예산", "지도", "준비물", "기록"]) await expect(quick.getByRole("link", { name: new RegExp(label) })).toBeVisible();
      await shot("TC-P0-05-home", page);
    });

    await test.step("전체 일정: 이동일 3 + 트레킹 12 = 15장, 필터 탭, 합계가 홈 지표와 일치 (FR-001, SC-008)", async () => {
      await page.getByRole("navigation", { name: "빠른 링크" }).getByRole("link", { name: /일정/ }).click();
      await expect(page).toHaveURL(/\/itinerary$/);
      await expect(page.getByRole("heading", { level: 1, name: "전체 일정" })).toBeVisible();
      await expect(page.getByText("이동일 3일 + 트레킹 12일 · 2027-08-03 ~ 08-17")).toBeVisible();
      await expect(page.locator("main article")).toHaveCount(15);
      await page.getByRole("tab", { name: "이동" }).click();
      await expect(page.locator("main article")).toHaveCount(3);
      await page.getByRole("tab", { name: "트레킹" }).click();
      await expect(page.locator("main article")).toHaveCount(12);
      const texts = await page.locator("main article").allInnerTexts();
      let km = 0;
      let gain = 0;
      let loss = 0;
      for (const t of texts) {
        km += Number(/거리\s*([\d.,]+)\s*km/.exec(t)?.[1]?.replace(/,/g, "") ?? NaN);
        gain += Number(/획득\s*\+?([\d.,]+)\s*m/.exec(t)?.[1]?.replace(/,/g, "") ?? NaN);
        loss += Number(/하강\s*-?([\d.,]+)\s*m/.exec(t)?.[1]?.replace(/,/g, "") ?? NaN);
      }
      expect(km.toFixed(1), "Day 카드 거리 합계").toBe("163.0");
      expect(gain, "획득 합계").toBe(9750);
      expect(loss, "하강 합계").toBe(9725);
      await shot("TC-P0-05-itinerary", page);
    });

    await test.step("Day 2 상세: 8개 필드(거리·획득·하강·시간·점심·숙박·지도·연락)와 안전 정보 (FR-002·003·004, SC-001·002)", async () => {
      await page.getByRole("tab", { name: "트레킹" }).click();
      await page.locator("main article").filter({ hasText: "Refuge de la Balme" }).getByRole("link").first().click();
      await expect(page).toHaveURL(/\/day\/d2027-08-05$/);
      await expect(page.locator("h1")).toContainText("레 콩타민");
      const main = page.locator("main");
      for (const label of ["거리", "획득", "하강", "시간"]) await expect(main.getByText(label, { exact: true }).first()).toBeVisible();
      await expect(main).toContainText("9 km");
      await expect(main).toContainText("+550 m");
      await expect(main).toContainText("3 h");
      await expect(main.getByText("점심").first()).toBeVisible();
      await expect(main).toContainText("Refuge de Nant Borrant");
      const lodging = page.locator('article[aria-labelledby^="lodging-"]').first();
      await expect(lodging).toContainText("Refuge de la Balme");
      await expect(lodging.getByTestId("booking-status")).toBeVisible();
      const contact = lodging.locator('a[href^="tel:"], a:has-text("공식 연락"), a:has-text("공식 예약"), :text("전화 확인 필요")');
      expect(await contact.count()).toBeGreaterThan(0);
      const google = page.getByRole("link", { name: /Google 지도로 걷기 경로 열기/ });
      await expect(google).toHaveAttribute("href", /google\.com\/maps\/dir/);
      await expect(google).toHaveAttribute("href", /travelmode=walking/);
      await expect(google).toHaveAttribute("target", "_blank");
      await expect(page.getByTestId("trail-link")).toHaveAttribute("href", /graphhopper\.com\/maps\/.*profile=hike/);
      await expect(page.getByTestId("gpx-download")).toHaveAttribute("href", "/gpx/tmb2027-day-02.gpx");
      await expect(page.getByRole("link", { name: /112 긴급 전화/ })).toHaveAttribute("href", "tel:112");
      await expect(main).toContainText("우천·피로 시 대안");
      await expect(page.getByRole("link", { name: /다음 · Day 3/ })).toBeVisible();
      await expect(page.getByRole("link", { name: /이전 · Day 1/ })).toBeVisible();
      await shot("TC-P0-05-day2", page);
    });

    await test.step("이동일 8/16: 케이블카 구간·fallback·샤모니 2박째 (FR-005, SC-015)", async () => {
      await page.goto("/travel/d2027-08-16");
      await expect(page.getByTestId("leg-timeline")).toBeVisible();
      await expect(page.locator("main")).toContainText("에귀 뒤 미디");
      await expect(page.locator("main")).toContainText("케이블카");
      await expect(page.locator("main")).toContainText("지연 시 대안");
      await expect(page.locator("main")).toContainText("2박째");
      await shot("TC-P0-05-travel-0816", page);
    });
  });
});

test.afterAll(async () => {
  await restoreBaseline();
});

