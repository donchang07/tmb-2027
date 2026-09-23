import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = ["/", "/itinerary", "/day/d2027-08-04", "/budget", "/map", "/packing"];

for (const path of PAGES) {
  test(`no horizontal scroll and 44px tap targets on ${path} (FR-007, SC-005)`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);

    const boxes = await page.locator("nav a, main a.tap, main button, button.tap, main label.tap").evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { w: r.width, h: r.height, visible: r.width > 0 && r.height > 0 };
      }),
    );
    for (const b of boxes.filter((x) => x.visible)) {
      expect(b.h).toBeGreaterThanOrEqual(44);
      expect(b.w).toBeGreaterThanOrEqual(44);
    }
  });

  test(`axe has no critical/serious violations on ${path} (WCAG 2.2 AA)`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
    const severe = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    expect(severe, JSON.stringify(severe, null, 2)).toEqual([]);
  });
}

test("budget table renders 10 items and 3 total rows (SC-003 view)", async ({ page }) => {
  await page.goto("/budget");
  await expect(page.locator("tbody tr")).toHaveCount(10);
  await expect(page.locator("tfoot tr")).toHaveCount(3);
  await expect(page.locator("tfoot").getByText("€1,716")).toBeVisible();
  await expect(page.locator("tfoot").getByText("€2,673")).toBeVisible();
  await expect(page.getByText("€1,900 ~ €3,000").first()).toBeVisible();
  await expect(page.getByText("USD/EUR").first()).toBeVisible();
});

test("overview map renders 12 segments and day detail has an elevation profile (FR-011, FR-012)", async ({ page }) => {
  await page.goto("/map");
  await expect(page.locator("svg path[data-segment]")).toHaveCount(12);
  await expect(page.locator("svg g[data-marker='pass']").first()).toBeAttached();
  await expect(page.getByText("출처·라이선스")).toBeVisible();
  await expect(page.getByText(/OpenFreeMap 또는 MapTiler Free/)).toBeVisible();
  await expect(page.locator("svg g[data-marker='pass']")).toHaveCount(12);
  await page.goto("/day/d2027-08-06");
  await expect(page.locator("svg[aria-label^='고도 프로파일 Day 3']")).toBeAttached();
});

test("Day 1 detail shows inline morning-travel timeline with 2 legs (FR-005)", async ({ page }) => {
  await page.goto("/day/d2027-08-04");
  await expect(page.getByRole("heading", { name: "아침 이동" })).toBeVisible();
  const section = page.locator("section[aria-labelledby='morning-heading']");
  await expect(section.locator("ol > li")).toHaveCount(2);
  await expect(section.getByText("제네바").first()).toBeVisible();
  await expect(section.getByText("레주슈").first()).toBeVisible();
  await expect(section.getByRole("link", { name: /이동 상세 보기/ })).toBeVisible();
});

test("8/16 travel day shows the Aiguille du Midi cable-car leg with suspension fallback (FR-005, SC-015)", async ({ page }) => {
  await page.goto("/travel/d2027-08-16");
  await expect(page.locator("h1")).toContainText("에귀 뒤 미디");
  await expect(page.getByTestId("leg-timeline").locator("> li")).toHaveCount(2);
  await expect(page.getByText("케이블카").first()).toBeVisible();
  await expect(page.getByText("Aiguille du Midi (3,842 m) round trip")).toBeVisible();
  await expect(page.getByText(/운휴/).first()).toBeVisible();
  await expect(page.locator('a[href*="montblancnaturalresort.com"]')).toHaveCount(1);
  await expect(page.getByText("2박째").first()).toBeVisible();
});

test("8/17 travel day goes Chamonix → Geneva airport → Zurich airport → flight with shuttle fallback (FR-005, SC-015, D-007)", async ({ page }) => {
  await page.goto("/travel/d2027-08-17");
  await expect(page.locator("h1")).toContainText("취리히 공항");
  await expect(page.getByTestId("leg-timeline").locator("> li")).toHaveCount(3);
  await expect(page.getByText("Genève Aéroport").first()).toBeVisible();
  await expect(page.getByText("Zürich Flughafen").first()).toBeVisible();
  await expect(page.getByText(/공유셔틀/).first()).toBeVisible();
  await expect(page.getByText("18:40").first()).toBeVisible();
});

test("home shows hero slogan and metrics (FR-008)", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("걸어야 산다!");
  await expect(page.getByText("163.0 km")).toBeVisible();
  await expect(page.getByText("9,750 m")).toBeVisible();
  await expect(page.getByText("9,725 m")).toBeVisible();
  await expect(page.getByText("10명")).toBeVisible();
});
