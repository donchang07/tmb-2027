import { existsSync } from "node:fs";
import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Design Ref: §8.4 L3 #8~12 — 두 계정 격리·교차 접근·세션 독립·로그아웃 캐시·오프라인 재전송

if (!process.env.NEXT_PUBLIC_SUPABASE_URL && existsSync(".env.local")) process.loadEnvFile(".env.local");

const A = { email: process.env.E2E_USER_A_EMAIL ?? "", password: process.env.E2E_USER_A_PASSWORD ?? "" };
const B = { email: process.env.E2E_USER_B_EMAIL ?? "", password: process.env.E2E_USER_B_PASSWORD ?? "" };
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const ENABLED = Boolean(A.email && A.password && B.email && B.password && SUPABASE_URL && ANON_KEY);

const A_ITEMS = ["docs-passport", "docs-tickets", "docs-insurance"];
const B_ITEMS = ["pack-backpack", "pack-raincover", "pack-liner", "gear-poles", "gear-boots"];

async function signedClient(user: { email: string; password: string }): Promise<{ client: SupabaseClient; id: string }> {
  const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.signInWithPassword(user);
  if (error || !data.user) throw new Error(`sign-in failed: ${error?.message ?? "no user"}`);
  return { client, id: data.user.id };
}

async function uiLogin(browser: Browser, user: { email: string; password: string }): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/login?next=/packing");
  await page.getByLabel("이메일").fill(user.email);
  await page.getByLabel("비밀번호", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await page.waitForURL((u) => u.pathname === "/packing");
  await expect(page.getByText("체크 상태는 내 계정에 저장됩니다 · 12일 산장 트레킹 기준")).toBeVisible();
  return { context, page };
}

async function checkAll(page: Page, ids: string[]) {
  for (const id of ids) {
    const box = page.locator(`input[data-item-id='${id}']`);
    await expect(box).toBeEnabled();
    await box.check();
  }
  await expect(page.getByTestId("packing-sync-status")).toContainText("내 계정에 저장됨");
}

test.describe("multi-user isolation (SC-017~021)", () => {
  test.skip(!ENABLED, "E2E_USER_A/B 계정 또는 Supabase 공개 키 없음 — scripts/seed-synthetic.mjs 실행 후 활성");
  test.describe.configure({ mode: "serial" });
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440", "Auth 요청 한도 — desktop-1440에서만 실행");
  });

  let aId = "";
  let bId = "";

  test.beforeAll(async () => {
    if (!ENABLED) return;
    const a = await signedClient(A);
    const b = await signedClient(B);
    aId = a.id;
    bId = b.id;
    await a.client.from("packing_checks").delete().eq("user_id", a.id);
    await b.client.from("packing_checks").delete().eq("user_id", b.id);
  });

  test("two accounts keep separate checks across reload (SC-017, SC-018)", async ({ browser }) => {
    const ctxA = await uiLogin(browser, A);
    const ctxB = await uiLogin(browser, B);
    await checkAll(ctxA.page, A_ITEMS);
    await checkAll(ctxB.page, B_ITEMS);
    await ctxA.page.reload();
    await ctxB.page.reload();
    await expect(ctxA.page.getByTestId("packing-progress")).toContainText("3/34");
    await expect(ctxB.page.getByTestId("packing-progress")).toContainText("5/34");
    for (const id of B_ITEMS) await expect(ctxA.page.locator(`input[data-item-id='${id}']`)).not.toBeChecked();
    for (const id of A_ITEMS) await expect(ctxB.page.locator(`input[data-item-id='${id}']`)).not.toBeChecked();

    const a = await signedClient(A);
    const b = await signedClient(B);
    const rowsA = await a.client.from("packing_checks").select("item_id").eq("checked", true);
    const rowsB = await b.client.from("packing_checks").select("item_id").eq("checked", true);
    expect(rowsA.data?.map((r) => r.item_id).sort()).toEqual([...A_ITEMS].sort());
    expect(rowsB.data?.map((r) => r.item_id).sort()).toEqual([...B_ITEMS].sort());
    await ctxA.context.close();
    await ctxB.context.close();
  });

  test("cross-account and anonymous access is denied by RLS (SC-019, SC-020)", async () => {
    const a = await signedClient(A);
    const sel = await a.client.from("packing_checks").select("item_id").eq("user_id", bId);
    expect(sel.data ?? []).toHaveLength(0);
    const upd = await a.client.from("packing_checks").update({ checked: false }).eq("user_id", bId).select();
    expect(upd.data ?? []).toHaveLength(0);
    const del = await a.client.from("packing_checks").delete().eq("user_id", bId).select();
    expect(del.data ?? []).toHaveLength(0);

    const b = await signedClient(B);
    const still = await b.client.from("packing_checks").select("item_id").eq("checked", true);
    expect(still.data ?? []).toHaveLength(B_ITEMS.length);

    const anon = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
    const anonSel = await anon.from("packing_checks").select("item_id");
    expect(anonSel.error !== null || (anonSel.data ?? []).length === 0).toBe(true);
    const anonBookings = await anon.from("bookings").select("lodging_id");
    expect(anonBookings.error !== null || (anonBookings.data ?? []).length === 0).toBe(true);
    expect(aId).not.toBe(bId);
  });

  test("logout in one context keeps the other signed in (SC-017, SC-021)", async ({ browser }) => {
    const ctxA = await uiLogin(browser, A);
    const ctxB = await uiLogin(browser, B);
    await ctxA.page.getByRole("button", { name: new RegExp(A.email.slice(0, 5)) }).click();
    await ctxA.page.getByRole("menuitem", { name: "로그아웃" }).click();
    await ctxA.page.waitForURL((u) => u.pathname === "/");
    await expect(ctxA.page.locator("header").getByRole("link", { name: "로그인", exact: true })).toBeVisible();

    await ctxB.page.reload();
    await expect(ctxB.page.getByTestId("packing-progress")).toContainText("5/34");
    const state = await ctxB.context.storageState();
    const ctxB2 = await browser.newContext({ storageState: state });
    const page2 = await ctxB2.newPage();
    await page2.goto("/packing");
    await expect(page2.getByText("체크 상태는 내 계정에 저장됩니다 · 12일 산장 트레킹 기준")).toBeVisible();
    await ctxA.context.close();
    await ctxB.context.close();
    await ctxB2.close();
  });

  test("logout clears page cache and account storage (SC-020)", async ({ browser }) => {
    const { context, page } = await uiLogin(browser, A);
    await page.goto("/day/d2027-08-04");
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: new RegExp(A.email.slice(0, 5)) }).click();
    await page.getByRole("menuitem", { name: "로그아웃" }).click();
    await page.waitForURL((u) => u.pathname === "/");
    const leftovers = await page.evaluate(async () => {
      const keys = await caches.keys();
      let pageEntries = 0;
      for (const k of keys.filter((x) => x.startsWith("pages-"))) {
        const c = await caches.open(k);
        pageEntries += (await c.keys()).filter((r) => new URL(r.url).pathname.startsWith("/day/")).length;
      }
      const accountKeys = Object.keys(localStorage).filter((k) => k.startsWith("tmb2027:packing:acct:") || k.startsWith("tmb2027:packing:queue:"));
      return { pageEntries, accountKeys: accountKeys.length };
    });
    expect(leftovers).toEqual({ pageEntries: 0, accountKeys: 0 });
    await context.close();
  });

  test("offline changes are queued and resent when back online (FR-024)", async ({ browser }) => {
    const { context, page } = await uiLogin(browser, A);
    await context.setOffline(true);
    await page.locator("input[data-item-id='gear-water']").check();
    await expect(page.getByTestId("packing-sync-status")).toContainText(/오프라인|저장하지 못했습니다/);
    await context.setOffline(false);
    await expect(page.getByTestId("packing-sync-status")).toContainText("내 계정에 저장됨");
    await page.reload();
    await expect(page.locator("input[data-item-id='gear-water']")).toBeChecked();
    await page.locator("input[data-item-id='gear-water']").uncheck();
    await expect(page.getByTestId("packing-sync-status")).toContainText("내 계정에 저장됨");
    await context.close();
  });
});
