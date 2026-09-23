import { expect, test } from "@playwright/test";

test.describe("booking privacy (FR-010, SC-007, S8)", () => {
  test("admin detail API rejects unauthenticated requests without leaking private fields", async ({ request }) => {
    const res = await request.get("/api/admin/bookings/mottets");
    expect([401, 403, 503]).toContain(res.status());
    const body = await res.text();
    expect(body).not.toContain("confirmation_ref");
    expect(body).not.toContain("private_memo");
    expect(res.headers()["cache-control"]).toContain("no-store");
  });

  test("public bookings API exposes only status fields", async ({ request }) => {
    const res = await request.get("/api/bookings");
    expect(res.status()).toBe(200);
    const json = (await res.json()) as { bookings: Record<string, unknown>[] };
    for (const b of json.bookings) {
      expect(Object.keys(b).sort()).toEqual(["alternativeLodging", "alternativeLodgingId", "lodgingId", "status", "updatedAt"]);
    }
  });

  test("admin page renders login or disabled notice for visitors", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("관리자 예약");
    const notice = page.getByText(/리더 로그인이 필요합니다|편집 비활성/);
    await expect(notice.first()).toBeVisible();
  });

  test("admin bookings page redirects visitors to /admin", async ({ page }) => {
    await page.goto("/admin/bookings");
    await expect(page).toHaveURL(/\/admin(\?|$)/);
  });

  test("journal day page shows login/disabled notice to visitors and renders no form (FR-016)", async ({ page }) => {
    await page.goto("/journal/d2027-08-04");
    await expect(page.getByText(/기록 작성은 팀원 로그인|기록 기능 비활성/).first()).toBeVisible();
    await expect(page.locator("form textarea[name='text']")).toHaveCount(0);
  });

  test("journal day page is public: timeline renders without login and exposes no email (FR-016, N-008)", async ({ page }) => {
    await page.goto("/journal/d2027-08-05");
    await expect(page.getByText("열람은 누구나 가능합니다").first()).toBeVisible();
    await expect(page.getByText(/기록 작성은 팀원 로그인/).first()).toBeVisible();
    const html = await page.content();
    expect(html).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
  });

  test("journal day page renders no write form for visitors (SC-012)", async ({ page }) => {
    await page.goto("/journal/d2027-08-05");
    await expect(page.locator("form textarea[name='text']")).toHaveCount(0);
    await expect(page.locator("form input[name='photo']")).toHaveCount(0);
    await expect(page.locator("form input[name='displayName']")).toHaveCount(0);
  });

  test("client bundle does not contain service role key or booking refs", async ({ page }) => {
    await page.goto("/day/d2027-08-06");
    const html = await page.content();
    expect(html).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(html).not.toMatch(/service_role/i);
    expect(html).not.toContain("private_memo");
  });

  test("day detail renders no leader edit panel for visitors (8.3)", async ({ page }) => {
    await page.goto("/day/d2027-08-05");
    const html = await page.content();
    expect(html).not.toContain("private_memo");
    expect(html).not.toContain("confirmation");
    expect(html).not.toContain("privateMemo");
    await expect(page.getByRole("button", { name: "펼치기" })).toHaveCount(0);
    await expect(page.locator("form input[name='confirmationRef']")).toHaveCount(0);
    await expect(page.locator("form select[name='status']")).toHaveCount(0);
    await expect(page.locator("form input[name='verifiedPhone']")).toHaveCount(0);
  });

  test("travel day 8/3 shows the Geneva lodging block with candidate hotels (8.4, C-2)", async ({ page }) => {
    await page.goto("/travel/d2027-08-03");
    await expect(page.getByRole("heading", { name: "숙박" })).toBeVisible();
    await expect(page.getByText("숙소 미정").first()).toBeVisible();
    await expect(page.getByText("Hotel Astoria").first()).toBeVisible();
    await expect(page.getByText("리더가 확정 예정").first()).toBeVisible();
    const html = await page.content();
    expect(html).not.toContain("private_memo");
    expect(html).not.toContain("confirmation_ref");
  });

  test("travel day 8/16 shows the second Chamonix night without candidates or edit forms (8.4, D-007)", async ({ page }) => {
    await page.goto("/travel/d2027-08-16");
    await expect(page.getByText("2박째").first()).toBeVisible();
    await expect(page.getByText("숙소 미정").first()).toBeVisible();
    await expect(page.getByText("Fred Hotel Zürich Hauptbahnhof")).toHaveCount(0);
    await expect(page.locator("form")).toHaveCount(0);
  });
});
