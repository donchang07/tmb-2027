import { expect, type BrowserContext, type Locator, type Page } from "@playwright/test";

export const PACKING_TOTAL = 34;
export const A_ITEMS = ["docs-passport", "docs-tickets", "docs-insurance"];
export const B_ITEMS = ["pack-backpack", "pack-raincover", "pack-liner", "gear-poles", "gear-boots"];

export const MSG = {
  accountSubtitle: "체크 상태는 내 계정에 저장됩니다 · 12일 산장 트레킹 기준",
  deviceSubtitle: "체크 상태는 이 기기에만 저장됩니다 · 12일 산장 트레킹 기준",
  badLogin: "이메일 또는 비밀번호가 올바르지 않습니다.",
  forbidden: "이 정보에 접근할 수 없습니다",
  leaderNeeded: "리더 로그인이 필요합니다",
  notMember: "현재 계정은 팀원 목록에 없습니다 — 리더에게 등록을 요청하세요.",
  syncSaved: "내 계정에 저장됨",
  expired: "로그인 시간이 만료되었습니다. 다시 로그인하면 계정 데이터를 불러옵니다.",
};

/** 헤더의 계정 자리 skeleton이 사라질 때까지(세션 판정 완료) 기다린다. */
export async function ready(page: Page): Promise<void> {
  await page.waitForFunction(() => !document.querySelector("header .skeleton"));
}

export function accountButton(page: Page): Locator {
  return page.locator("header").getByRole("button", { name: /계정/ });
}

export function headerLogin(page: Page): Locator {
  return page.locator("header").getByRole("link", { name: "로그인", exact: true });
}

/** 계정 메뉴를 열고, 처음 열 때 호출되는 관리자 판정 서버 액션이 끝날 때까지 기다린다. */
export async function openAccountMenu(page: Page): Promise<Locator> {
  await ready(page);
  const button = accountButton(page);
  await expect(button).toBeVisible();
  const expanded = await button.getAttribute("aria-expanded");
  if (expanded !== "true") {
    const roleCheck = page.waitForResponse((r) => r.request().method() === "POST" && "next-action" in r.request().headers(), { timeout: 15_000 }).catch(() => null);
    await button.click();
    await roleCheck;
  }
  const menu = page.getByRole("menu", { name: "계정 메뉴" });
  await expect(menu).toBeVisible();
  return menu;
}

export async function logoutViaMenu(page: Page): Promise<void> {
  const menu = await openAccountMenu(page);
  await menu.getByRole("menuitem", { name: "로그아웃" }).click();
  await page.waitForURL((u) => u.pathname === "/");
  await expect(headerLogin(page)).toBeVisible();
}

export async function authCookieNames(context: BrowserContext): Promise<string[]> {
  return (await context.cookies()).map((c) => c.name).filter((n) => /^sb-.*-auth-token([.][0-9]+)?$/.test(n));
}

export async function uiLogin(page: Page, email: string, password: string, path = "/login"): Promise<void> {
  await page.goto(path);
  await ready(page);
  await page.getByLabel("이메일").fill(email);
  await page.getByLabel("비밀번호", { exact: true }).fill(password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
}

export function packingBox(page: Page, id: string): Locator {
  return page.locator(`input[data-item-id='${id}']`);
}

export async function checkItems(page: Page, ids: string[]): Promise<void> {
  for (const id of ids) {
    const box = packingBox(page, id);
    await expect(box).toBeEnabled();
    await box.check();
  }
}

export async function noHorizontalScroll(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

export function lodgingRow(page: Page, name: string): Locator {
  return page
    .locator("tr:visible, li:visible")
    .filter({ hasText: name })
    .filter({ has: page.getByRole("button", { name: /^(편집|닫기)$/ }) })
    .first();
}
