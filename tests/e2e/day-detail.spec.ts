import { expect, test } from "@playwright/test";

// Design Ref: docs/02-design/day-detail.design.md §5 — 기간 밖에는 홈의 첫 Day 링크가 이동일로 가므로 첫 트레킹 Day로 이어 본다
const FIRST_TREK_DAY = "/day/d2027-08-04";
const UNDECIDED_DAY = "/day/d2027-08-15";
const LA_BALME_DAY = "/day/d2027-08-05";

test.describe("day detail lodging and naming (FR-004, FR-017, SC-001)", () => {
  test("home today card reaches a lodging contact in two taps (SC-001)", async ({ page }) => {
    await page.goto("/");
    const link = page.getByTestId("today-card-link").first();
    await expect(link).toBeVisible();
    await link.click();
    await expect(page.locator("h1")).toBeVisible();
    if (!/\/day\//.test(page.url())) await page.goto(FIRST_TREK_DAY);

    const card = page.locator('article[aria-labelledby^="lodging-"]').first();
    await expect(card).toBeVisible();
    const reachable = card.locator(
      'a[href^="tel:"], a:has-text("공식 연락"), a:has-text("공식 예약"), :text("숙소 미정")',
    );
    expect(await reachable.count()).toBeGreaterThan(0);
  });

  test("undecided lodging shows the pending notice and no booking link (FR-004, Edge 숙소 미정)", async ({ page }) => {
    await page.goto(UNDECIDED_DAY);
    const card = page.locator('article[aria-labelledby^="lodging-"]').first();
    await expect(card).toBeVisible();
    await expect(card.getByText("숙소 미정")).toBeVisible();
    await expect(card.getByText("리더가 확정 예정")).toBeVisible();
    await expect(page.locator('a[href*="booking.com"]')).toHaveCount(0);
    await expect(card.locator('a:has-text("공식 예약")')).toHaveCount(0);
    await expect(card.getByText("전화 확인 필요")).toHaveCount(0);
  });

  test("Day 7 map card offers a GraphHopper trail link over Grand Col Ferret (FR-003 보완)", async ({ page }) => {
    await page.goto("/day/d2027-08-10");
    const trail = page.getByTestId("trail-link");
    await expect(trail).toBeVisible();
    await expect(trail).toHaveAttribute("href", /graphhopper\.com\/maps\/\?point=.*45\.8883%2C7\.0756.*profile=hike/);
    await expect(page.locator('a[href*="google.com/maps/dir"]')).toHaveCount(1);
  });

  test("Day 7 offers a GPX download that serves a GPX track (Act-4)", async ({ page, request }) => {
    await page.goto("/day/d2027-08-10");
    const gpx = page.getByTestId("gpx-download");
    await expect(gpx).toBeVisible();
    await expect(gpx).toHaveAttribute("href", "/gpx/tmb2027-day-07.gpx");
    await expect(gpx).toHaveAttribute("download", "tmb2027-day-07.gpx");
    const res = await request.get("/gpx/tmb2027-day-07.gpx");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("gpx");
    expect(res.headers()["content-disposition"]).toContain("attachment");
    const body = await res.text();
    expect(body).toContain("<trkseg>");
    expect(body).toContain("Grand Col Ferret");
  });

  test("route points and lodging render the original name only (FR-017, SC-013, N-003)", async ({ page }) => {
    await page.goto(LA_BALME_DAY);
    await expect(page.getByText("라 발므 산장")).toHaveCount(0);
    await expect(page.getByText("Refuge de la Balme").first()).toBeVisible();
  });
});
