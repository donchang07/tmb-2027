import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Design Ref: §8.3 L2(설정 불필요) · §8.4 L3(E2E_USER_A_EMAIL 등 없으면 skip)

const USER_A_EMAIL = process.env.E2E_USER_A_EMAIL;
const USER_A_PASSWORD = process.env.E2E_USER_A_PASSWORD;
const MEMBER_1_EMAIL = process.env.E2E_MEMBER_1_EMAIL;
const EMAIL_DOMAIN = process.env.E2E_EMAIL_DOMAIN ?? "tmb2027.test";
const HAS_ACCOUNTS = Boolean(USER_A_EMAIL && USER_A_PASSWORD);

if (!process.env.NEXT_PUBLIC_SUPABASE_URL && existsSync(".env.local")) process.loadEnvFile(".env.local");

async function clearUserAChecks() {
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "", {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email: USER_A_EMAIL ?? "", password: USER_A_PASSWORD ?? "" });
  if (error || !data.user) throw new Error(`sign-in failed: ${error?.message ?? "no user"}`);
  await client.from("packing_checks").delete().eq("user_id", data.user.id);
}

async function ready(page: Page) {
  await page.waitForFunction(() => !document.querySelector("header .skeleton"));
}

async function login(page: Page, email: string, password: string, path = "/login") {
  await page.goto(path);
  await ready(page);
  await page.getByLabel("이메일").fill(email);
  await page.getByLabel("비밀번호", { exact: true }).fill(password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
}

test.describe("SCR-015 로그인 화면 (L2)", () => {
  test("renders every element of the login contract", async ({ page }) => {
    await page.goto("/login");
    await ready(page);
    await expect(page.getByRole("heading", { level: 1, name: "로그인" })).toBeVisible();
    const email = page.getByLabel("이메일");
    await expect(email).toHaveAttribute("placeholder", "you@example.com");
    await expect(email).toHaveAttribute("autocomplete", "email");
    await expect(page.getByLabel("비밀번호", { exact: true })).toHaveAttribute("autocomplete", "current-password");
    const toggle = page.getByRole("button", { name: "비밀번호 표시" });
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByLabel("비밀번호", { exact: true })).toHaveAttribute("type", "text");
    await expect(page.getByRole("button", { name: "로그인", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "계정이 없으신가요? 회원가입" })).toHaveAttribute("href", "/signup");
    await expect(page.getByRole("link", { name: "팀원 이메일 링크 로그인" })).toHaveAttribute("href", "/journal/login");
    await expect(page.getByRole("link", { name: "리더 로그인" })).toHaveAttribute("href", "/admin");
    await expect(page.getByText("인증 메일 다시 보내기")).toHaveCount(0);
  });

  test("shows field errors on empty submit and focuses the email field", async ({ page }) => {
    await page.goto("/login");
    await ready(page);
    await page.getByRole("button", { name: "로그인", exact: true }).click();
    await expect(page.getByText("이메일을 입력해 주세요.")).toBeVisible();
    const email = page.getByLabel("이메일");
    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(email).toBeFocused();
    await expect(page.getByText("비밀번호를 입력해 주세요.")).toBeVisible();
  });

  test("shows the expiry notice and keeps next on the signup link", async ({ page }) => {
    await page.goto("/login?reason=expired&next=/packing");
    await expect(page.getByText("로그인 시간이 만료되었습니다. 다시 로그인해 주세요.")).toBeVisible();
    await expect(page.getByRole("link", { name: "계정이 없으신가요? 회원가입" })).toHaveAttribute("href", "/signup?next=%2Fpacking");
  });

  test("shows the next notice and drops an unsafe next", async ({ page }) => {
    await page.goto("/login?next=/packing");
    await expect(page.getByText("로그인이 필요한 화면입니다. 로그인하면 보던 화면으로 돌아갑니다.")).toBeVisible();
    await page.goto("/login?next=//evil.com");
    await expect(page.getByText("로그인이 필요한 화면입니다.")).toHaveCount(0);
    await expect(page.locator("input[name='next']")).toHaveValue("");
  });
});

test.describe("SCR-016 회원가입 화면 (L2)", () => {
  test("renders the signup contract and validates length and confirmation", async ({ page }) => {
    await page.goto("/signup?next=/packing");
    await ready(page);
    await expect(page.getByRole("heading", { level: 1, name: "회원가입" })).toBeVisible();
    await expect(page.getByText("가입하면 준비물 체크가 계정에 저장되어 다른 기기에서도 이어집니다.", { exact: false })).toBeVisible();
    await expect(page.getByText("8자 이상", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "이미 계정이 있으신가요? 로그인" })).toHaveAttribute("href", "/login?next=%2Fpacking");

    await page.getByLabel("이메일").fill("someone@example.com");
    await page.getByLabel("비밀번호", { exact: true }).fill("1234567");
    await page.getByLabel("비밀번호 확인").fill("1234567");
    await page.getByRole("button", { name: "가입하기" }).click();
    await expect(page.getByText("비밀번호는 8자 이상이어야 합니다.")).toBeVisible();
    await expect(page.getByLabel("비밀번호", { exact: true })).toBeFocused();

    await page.getByLabel("비밀번호", { exact: true }).fill("12345678");
    await page.getByLabel("비밀번호 확인").fill("12345679");
    await page.getByRole("button", { name: "가입하기" }).click();
    await expect(page.getByText("비밀번호가 서로 다릅니다.")).toBeVisible();
    await expect(page.getByLabel("비밀번호 확인")).toHaveAttribute("aria-invalid", "true");
  });
});

test.describe("SCR-017 콜백 실패 경로 (L2)", () => {
  test("routes a missing code to the matching login screen with the other-device sentence", async ({ page }) => {
    await page.goto("/auth/callback?next=/packing");
    await expect(page).toHaveURL(/\/login\?error=auth&next=%2Fpacking$/);
    await expect(page.getByText("다른 기기에서 링크를 열었다면 이 기기에서 다시 요청해 주세요.", { exact: false })).toBeVisible();

    await page.goto("/auth/callback?next=/journal");
    await expect(page).toHaveURL(/\/journal\/login\?error=auth$/);
    await expect(page.getByText("다른 기기에서 링크를 열었다면 이 기기에서 다시 요청해 주세요.", { exact: false })).toBeVisible();

    await page.goto("/auth/callback?next=/admin/bookings");
    await expect(page).toHaveURL(/\/admin\?error=auth$/);
    await expect(page.getByText("다른 기기에서 링크를 열었다면 이 기기에서 다시 요청해 주세요.", { exact: false })).toBeVisible();
  });
});

for (const path of ["/login", "/signup"]) {
  test(`${path} has no horizontal scroll, 44px targets and no serious axe violations (SC-005, FR-029)`, async ({ page }) => {
    await page.goto(path);
    await ready(page);
    await expect(page.locator("h1")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);

    const boxes = await page.locator("main a.tap, main button, button.tap, header a.tap").evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { w: r.width, h: r.height, visible: r.width > 0 && r.height > 0 };
      }),
    );
    for (const b of boxes.filter((x) => x.visible)) {
      expect(b.h).toBeGreaterThanOrEqual(44);
      expect(b.w).toBeGreaterThanOrEqual(44);
    }

    const account = page.locator("header").getByRole("link", { name: "로그인", exact: true });
    if ((await account.count()) > 0) await expect(account).toHaveAttribute("aria-current", "page");

    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
    const severe = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    expect(severe, JSON.stringify(severe, null, 2)).toEqual([]);
  });
}

test("header login link carries the current path as next (SCR-018-EL-01)", async ({ page }) => {
  await page.goto("/itinerary");
  await ready(page);
  const account = page.locator("header").getByRole("link", { name: "로그인", exact: true });
  test.skip((await account.count()) === 0, "Supabase 미설정 — 계정 메뉴 숨김");
  await expect(account).toHaveAttribute("href", "/login?next=%2Fitinerary");
  await expect(account).not.toHaveAttribute("aria-current", "page");
});

test("packing shows the account prompt for guests and keeps the device subtitle (SCR-009-EL-02, EL-10)", async ({ page }) => {
  await page.goto("/packing");
  await expect(page.getByText("체크 상태는 이 기기에만 저장됩니다 · 12일 산장 트레킹 기준")).toBeVisible();
  await expect(page.locator("input[data-item-id='docs-passport']")).toBeEnabled();
  const prompt = page.getByText("로그인하면 체크 상태가 내 계정에 저장되어 다른 기기에서도 이어집니다.");
  test.skip((await prompt.count()) === 0, "Supabase 미설정 — EL-10 숨김");
  await expect(page.locator("main").getByRole("link", { name: "로그인", exact: true })).toHaveAttribute("href", "/login?next=/packing");
  await expect(page.locator("main").getByRole("link", { name: "회원가입", exact: true })).toHaveAttribute("href", "/signup?next=/packing");
});

test.describe("L3 인증 시나리오 (E2E 계정 필요)", () => {
  test.skip(!HAS_ACCOUNTS, "E2E_USER_A_EMAIL/E2E_USER_A_PASSWORD 없음 — scripts/seed-synthetic.mjs 실행 후 활성");
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440", "Auth 요청 한도 — desktop-1440에서만 실행");
  });

  test("signup logs in immediately and lands on packing with the account subtitle (SC-016)", async ({ page }) => {
    const email = `e2e-${Date.now()}@${EMAIL_DOMAIN}`;
    await page.goto("/signup?next=/packing");
    await page.getByLabel("이메일").fill(email);
    await page.getByLabel("비밀번호", { exact: true }).fill("e2e-password-1234");
    await page.getByLabel("비밀번호 확인").fill("e2e-password-1234");
    await page.getByRole("button", { name: "가입하기" }).click();
    await expect(page.getByText("가입이 완료되어 로그인되었습니다.", { exact: false })).toBeVisible();
    await page.waitForURL((u) => u.pathname === "/packing");
    await expect(page.getByRole("button", { name: new RegExp(email.slice(0, 12).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) })).toBeVisible();
    await expect(page.getByText("체크 상태는 내 계정에 저장됩니다 · 12일 산장 트레킹 기준")).toBeVisible();

    await page.getByRole("button", { name: new RegExp(email.slice(0, 12).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }).click();
    await page.getByRole("menuitem", { name: "로그아웃" }).click();
    await page.waitForURL((u) => u.pathname === "/");

    await page.goto("/signup");
    await page.getByLabel("이메일").fill(email);
    await page.getByLabel("비밀번호", { exact: true }).fill("e2e-password-1234");
    await page.getByLabel("비밀번호 확인").fill("e2e-password-1234");
    await page.getByRole("button", { name: "가입하기" }).click();
    await expect(page.locator("main").getByRole("alert")).toContainText("이 이메일로 가입할 수 없습니다. 이미 계정이 있으면 로그인해 주세요.");
    await expect(page.getByLabel("이메일")).toHaveValue(email);

    await login(page, email, "e2e-password-1234");
    await page.waitForURL((u) => u.pathname === "/");
  });

  test("wrong password shows the credential error and keeps the email (FR-020)", async ({ page }) => {
    await login(page, USER_A_EMAIL ?? "", "definitely-wrong-password");
    await expect(page.locator("main").getByRole("alert")).toContainText("이메일 또는 비밀번호가 올바르지 않습니다.");
    await expect(page.getByLabel("이메일")).toHaveValue(USER_A_EMAIL ?? "");
    await expect(page.getByLabel("비밀번호", { exact: true })).toHaveValue("");
  });

  test("team member email cannot sign up (SC-020, FR-030)", async ({ page }) => {
    test.skip(!MEMBER_1_EMAIL, "E2E_MEMBER_1_EMAIL 없음");
    await page.goto("/signup");
    await page.getByLabel("이메일").fill(MEMBER_1_EMAIL ?? "");
    await page.getByLabel("비밀번호", { exact: true }).fill("e2e-password-1234");
    await page.getByLabel("비밀번호 확인").fill("e2e-password-1234");
    await page.getByRole("button", { name: "가입하기" }).click();
    await expect(page.locator("main").getByRole("alert")).toContainText("이 이메일로 가입할 수 없습니다.");
  });

  test("first login migrates device checks once (FR-024, SCR-009-EL-12)", async ({ page }) => {
    await page.goto("/packing");
    await page.locator("input[data-item-id='docs-passport']").check();
    await page.locator("input[data-item-id='docs-cards']").check();
    const email = `e2e-mig-${Date.now()}@${EMAIL_DOMAIN}`;
    await page.goto("/signup?next=/packing");
    await page.getByLabel("이메일").fill(email);
    await page.getByLabel("비밀번호", { exact: true }).fill("e2e-password-1234");
    await page.getByLabel("비밀번호 확인").fill("e2e-password-1234");
    await page.getByRole("button", { name: "가입하기" }).click();
    await page.waitForURL((u) => u.pathname === "/packing");
    await expect(page.getByText("이 기기에 있던 체크 2개를 내 계정으로 옮겼습니다.")).toBeVisible();
    await page.reload();
    await expect(page.locator("input[data-item-id='docs-passport']")).toBeChecked();
    await expect(page.locator("input[data-item-id='docs-cards']")).toBeChecked();
    await expect(page.getByText("이 기기에 있던 체크", { exact: false })).toHaveCount(0);
  });

  test("first login of an existing account migrates device checks once (FR-024, SCR-009-EL-12)", async ({ page }) => {
    await clearUserAChecks();
    await page.goto("/packing");
    await page.locator("input[data-item-id='docs-passport']").check();
    await page.locator("input[data-item-id='docs-cards']").check();
    await login(page, USER_A_EMAIL ?? "", USER_A_PASSWORD ?? "", "/login?next=/packing");
    await page.waitForURL((u) => u.pathname === "/packing");
    await expect(page.getByText("이 기기에 있던 체크 2개를 내 계정으로 옮겼습니다.")).toBeVisible();
    await page.reload();
    await expect(page.locator("input[data-item-id='docs-passport']")).toBeChecked();
    await expect(page.locator("input[data-item-id='docs-cards']")).toBeChecked();
    await expect(page.getByText("이 기기에 있던 체크", { exact: false })).toHaveCount(0);
    await clearUserAChecks();
  });

  test("login ignores an open-redirect next (FR-021)", async ({ page }) => {
    await login(page, USER_A_EMAIL ?? "", USER_A_PASSWORD ?? "", "/login?next=//evil.com");
    await page.waitForURL((u) => u.pathname === "/");
    expect(new URL(page.url()).origin).toBe(new URL(test.info().project.use.baseURL ?? page.url()).origin);
  });

  test("expired session shows the header notice and returns after re-login (SC-021)", async ({ page, context }) => {
    await login(page, USER_A_EMAIL ?? "", USER_A_PASSWORD ?? "", "/login?next=/itinerary");
    await page.waitForURL((u) => u.pathname === "/itinerary");
    await expect(page.getByRole("banner").getByRole("button", { name: /계정/ })).toBeVisible();
    await context.clearCookies();
    await page.goto("/budget");
    await expect(page.getByText("로그인 시간이 만료되었습니다. 다시 로그인하면 계정 데이터를 불러옵니다.")).toBeVisible();
    await page.getByRole("link", { name: "다시 로그인" }).click();
    await expect(page).toHaveURL(/\/login\?reason=expired&next=%2Fbudget/);
    await page.getByLabel("이메일").fill(USER_A_EMAIL ?? "");
    await page.getByLabel("비밀번호", { exact: true }).fill(USER_A_PASSWORD ?? "");
    await page.getByRole("button", { name: "로그인", exact: true }).click();
    await page.waitForURL((u) => u.pathname === "/budget");
  });
});
