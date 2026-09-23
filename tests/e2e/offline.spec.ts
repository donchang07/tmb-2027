import { expect, test } from "@playwright/test";

test.describe("offline re-entry (FR-013, SC-006)", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "service worker offline test runs on chromium only");

  test("visited pages are served from cache with last-updated banner; unvisited falls back to /offline", async ({ page, context }) => {
    await page.goto("/");
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.goto("/itinerary");
    await page.goto("/day/d2027-08-04");
    await expect(page.locator("h1")).toContainText("레주슈");
    await page.waitForTimeout(500);

    await context.setOffline(true);
    await page.goto("/day/d2027-08-04");
    await expect(page.locator("h1")).toContainText("레주슈");
    await expect(page.getByText("Chalet-Hôtel Gai Soleil")).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "오프라인 · 마지막 갱신" })).toBeVisible();
    await expect(page.getByText("온라인 전용 기능은 비활성")).toBeVisible();

    await page.goto("/day/d2027-08-15");
    await expect(page.getByText("인터넷 연결 후 한 번 열어 주세요")).toBeVisible();

    await context.setOffline(false);
  });

  test("last booking status stays visible on offline re-entry (FR-013, SC-006)", async ({ page, context }) => {
    await page.goto("/day/d2027-08-05");
    await page.evaluate(() => navigator.serviceWorker.ready);
    await expect(page.locator('[data-testid="booking-status"]').first()).toBeVisible();
    await page.waitForTimeout(500);

    await context.setOffline(true);
    await page.goto("/day/d2027-08-05");

    const badge = page.locator('[data-testid="booking-status"]').first();
    await expect(badge).toBeVisible();
    await expect(page.locator("body")).toContainText(/마지막 갱신|오프라인/);

    await context.setOffline(false);
  });
});
