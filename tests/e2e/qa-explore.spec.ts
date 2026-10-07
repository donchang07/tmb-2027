import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./qa-support/fixtures";
import { leftoverQaUsers, restoreBaseline, captureBaseline } from "./qa-support/baseline";
import { serviceClient } from "./qa-support/supabase";
import { accountButton, noHorizontalScroll, ready } from "./qa-support/ui";

// 탐색 테스트: 360/1440 반응형, 접근성, 데이터 많음(15일·12 Day·34항목), 합계 검증, 네비게이션, 정리 검증

const PUBLIC_PAGES = ["/", "/itinerary", "/day/d2027-08-04", "/day/d2027-08-10", "/travel/d2027-08-03", "/travel/d2027-08-16", "/map", "/budget", "/packing", "/journal", "/journal/d2027-08-05", "/login", "/signup", "/admin"];
const TREK_DAYS = ["04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15"];

test.beforeAll(async () => {
  await captureBaseline();
});

test.describe("반응형·접근성 (FR-007, SC-005)", () => {
  for (const path of PUBLIC_PAGES) {
    test(`TC-EX-01 ${path}: 가로 스크롤 없음·터치 영역 44px·치명 접근성 위반 없음`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await ready(page);
      await expect(page.locator("h1").first()).toBeVisible();
      await page.waitForLoadState("networkidle");
      expect(await noHorizontalScroll(page), "가로 스크롤").toBeLessThanOrEqual(0);
      const small = await page.locator("main a.tap, main button, header a.tap, nav a.tap").evaluateAll((els) =>
        els
          .map((el) => ({ r: el.getBoundingClientRect(), t: (el.textContent ?? "").trim().slice(0, 20) }))
          .filter((x) => x.r.width > 0 && x.r.height > 0 && (x.r.height < 44 || x.r.width < 44))
          .map((x) => `${x.t}:${Math.round(x.r.width)}x${Math.round(x.r.height)}`),
      );
      expect(small, "44px 미만 터치 영역").toEqual([]);
      await page.addStyleTag({ content: "*, *::before, *::after { animation: none !important; transition: none !important; }" });
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
      const severe = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious").map((v) => `${v.id}:${v.nodes.length}`);
      expect(severe, "axe critical/serious").toEqual([]);
    });
  }
});

test.describe("데이터 많음·정확성", () => {
  test("TC-EX-02 12개 트레킹 Day 상세 모두 8개 필드(거리·획득·하강·시간·점심·숙박·지도·연락)와 고도점 3개 이상 (FR-002·012, SC-002·009a·010)", async ({ page }) => {
    test.setTimeout(180_000);
    for (const n of TREK_DAYS) {
      const id = `d2027-08-${n}`;
      await page.goto(`/day/${id}`);
      const main = page.locator("main");
      await expect(page.locator("h1"), id).toBeVisible();
      for (const label of ["거리", "획득", "하강", "시간"]) await expect(main.getByText(label, { exact: true }).first(), `${id} ${label}`).toBeVisible();
      await expect(main.getByText("점심").first(), id).toBeVisible();
      await expect(page.locator('article[aria-labelledby^="lodging-"]').first(), id).toBeVisible();
      await expect(page.getByRole("link", { name: /Google 지도로 걷기 경로 열기/ }), id).toHaveAttribute("href", /travelmode=walking/);
      await expect(page.getByTestId("gpx-download"), id).toBeVisible();
      await expect(main, id).not.toContainText("고도점 확인 필요");
      await expect(main, id).not.toContainText("경로 지점 확인 필요");
      expect(await page.locator("table.sr-only tbody tr, [class*='sr-only'] tbody tr").count(), `${id} 고도점`).toBeGreaterThanOrEqual(3);
      const fallback = main.getByText("우천·피로 시 대안");
      await expect(fallback, id).toBeVisible();
      if (n !== "04" && n !== "15") await expect(main, `${id} 대안 확인 필요`).not.toContainText("대안 확인 필요");
      await expect(page.getByRole("link", { name: /112 긴급 전화/ }), id).toBeVisible();
    }
  });

  test("TC-EX-03 12개 GPX 파일 모두 200·트랙 포함 (FR-018, SC-014)", async ({ request }) => {
    for (let i = 1; i <= 12; i += 1) {
      const res = await request.get(`/gpx/tmb2027-day-${String(i).padStart(2, "0")}.gpx`);
      expect(res.status(), `day ${i}`).toBe(200);
      const body = await res.text();
      expect(body, `day ${i}`).toContain("<trkseg>");
      expect(body, `day ${i} OSM 출처`).toMatch(/OpenStreetMap/i);
    }
  });

  test("TC-EX-04 예산: 항목 합계=소계, 예비비 10%, 합계=소계+예비비 (오차 €1 이하) (FR-006, SC-003)", async ({ page }) => {
    await page.goto("/budget");
    const data = await page.evaluate(() => {
      const num = (s: string) => Number(s.replace(/[^0-9]/g, ""));
      const rows = [...document.querySelectorAll("tbody tr")].map((tr) => {
        const vals = [...tr.querySelectorAll("td")].map((td) => (td.textContent ?? "").trim()).filter((t) => /^(저|중)?\s*€\s?[\d,]+$/.test(t));
        return vals.slice(0, 2).map(num);
      });
      const foot = [...document.querySelectorAll("tfoot tr")].map((tr) => [...tr.querySelectorAll("td")].map((td) => (td.textContent ?? "").trim()).filter((t) => /€/.test(t)).map(num));
      return { rows, foot };
    });
    expect(data.rows.length).toBe(10);
    const low = data.rows.reduce((a, r) => a + (r[0] ?? 0), 0);
    const mid = data.rows.reduce((a, r) => a + (r[1] ?? 0), 0);
    const [sub = [], cont = [], total = []] = data.foot as [number[], number[], number[]];
    const n = (v: number | undefined) => v ?? Number.NaN;
    expect(Math.abs(n(sub[0]) - low)).toBeLessThanOrEqual(1);
    expect(Math.abs(n(sub[1]) - mid)).toBeLessThanOrEqual(1);
    expect(Math.abs(n(cont[0]) - n(sub[0]) * 0.1)).toBeLessThanOrEqual(1);
    expect(Math.abs(n(cont[1]) - n(sub[1]) * 0.1)).toBeLessThanOrEqual(1);
    expect(Math.abs(n(total[0]) - (n(sub[0]) + n(cont[0])))).toBeLessThanOrEqual(1);
    expect(Math.abs(n(total[1]) - (n(sub[1]) + n(cont[1])))).toBeLessThanOrEqual(1);
    await expect(page.getByRole("heading", { name: /권장 준비 금액/ })).toBeVisible();
  });

  test("TC-EX-05 개요 지도 화면: 12구간·마커 목록 표시 (FR-011, SC-009b)", async ({ page }) => {
    await page.goto("/map");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("main")).toContainText("Day 12");
    await expect(page.locator("main")).toContainText("Day 1");
  });

  test("TC-EX-06 기록 목록: 12개 Day 링크, 합성 기록이 있는 Day는 건수 표시 (SCR-010, 데이터 있음)", async ({ page }) => {
    await page.goto("/journal");
    await expect(page.locator("main a[href^='/journal/d2027-08-']")).toHaveCount(12);
    await page.locator("main a[href='/journal/d2027-08-05']").click();
    await expect(page).toHaveURL(/\/journal\/d2027-08-05$/);
    await expect(page.getByText("팀원1").first()).toBeVisible();
    await expect(page.getByText("팀원2").first()).toBeVisible();
  });
});

test.describe("내비게이션·상태", () => {
  test("TC-EX-07 하단 탭/헤더 링크 활성 상태와 이동 (NAV-002~010, 뒤로 가기)", async ({ page, isMobile }) => {
    await page.goto("/");
    await ready(page);
    const nav = isMobile ? page.locator("nav").filter({ has: page.getByRole("link", { name: "준비물" }) }).last() : page.locator("header");
    for (const [label, path] of [["일정", "/itinerary"], ["예산", "/budget"], ["지도", "/map"], ["준비물", "/packing"]] as const) {
      await nav.getByRole("link", { name: label, exact: true }).first().click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      if (isMobile) await expect(nav.getByRole("link", { name: label, exact: true }).first()).toHaveAttribute("aria-current", "page");
    }
    await page.goBack();
    await expect(page).toHaveURL(/\/map$/);
    await page.goForward();
    await expect(page).toHaveURL(/\/packing$/);
  });

  test("TC-EX-08 일정 필터 탭 상태가 aria-selected로 전환되고 뒤로 가기 후에도 목록 유지 (SCR-002-EL-04)", async ({ page }) => {
    await page.goto("/itinerary");
    const trek = page.getByRole("tab", { name: "트레킹" });
    await trek.click();
    await expect(trek).toHaveAttribute("aria-selected", "true");
    await page.locator("main article").first().getByRole("link").first().click();
    await expect(page).toHaveURL(/\/day\//);
    await page.goBack();
    await expect(page.locator("main article").first()).toBeVisible();
    await page.reload();
    await expect(page.locator("main article")).toHaveCount(15);
  });

  test("TC-EX-09 Day 이전/다음 링크: Day 1은 이전 비활성, Day 12는 다음 비활성 (SCR-003-EL-25·26, 경계값)", async ({ page }) => {
    await page.goto("/day/d2027-08-04");
    await expect(page.getByText("첫 번째 Day")).toBeVisible();
    await expect(page.getByRole("link", { name: /다음 · Day 2/ })).toBeVisible();
    await page.goto("/day/d2027-08-15");
    await expect(page.getByText("마지막 Day")).toBeVisible();
  });

  test("TC-EX-10 비로그인 계정 메뉴는 '로그인' 링크만, 현재 경로를 next로 전달 (SCR-018-EL-01)", async ({ page }) => {
    await page.goto("/budget");
    await ready(page);
    await expect(accountButton(page)).toHaveCount(0);
    await expect(page.locator("header").getByRole("link", { name: "로그인", exact: true })).toHaveAttribute("href", "/login?next=%2Fbudget");
  });

  test("TC-EX-11 오프라인 안내 화면 /offline: 캐시 없음 문구와 홈 복귀 (SCR-013)", async ({ page }) => {
    await page.goto("/offline");
    await expect(page.getByText("인터넷 연결 후 한 번 열어 주세요")).toBeVisible();
    await expect(page.getByText("112").first()).toBeVisible();
  });

  test("TC-EX-12 홈은 모든 화면 크기에서 핵심 지표 5개와 빠른 링크 5개 표시 (SCR-001 반응형, SC-005)", async ({ page, viewport }) => {
    await page.goto("/");
    const metrics = page.locator("dl[aria-label='원정 지표']");
    await expect(metrics.locator("dt")).toHaveCount(5);
    await expect(page.getByRole("navigation", { name: "빠른 링크" }).getByRole("link")).toHaveCount(5);
    expect(await noHorizontalScroll(page)).toBeLessThanOrEqual(0);
    expect([360, 1440]).toContain(viewport?.width);
  });

  test("TC-EX-13 키보드 탐색: 로그인 폼 Tab 순서와 비밀번호 표시 토글 (접근성 NFR)", async ({ page }) => {
    await page.goto("/login");
    await ready(page);
    await page.waitForLoadState("networkidle");
    await page.getByLabel("이메일").focus();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("비밀번호", { exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    const toggle = page.getByRole("button", { name: "비밀번호 표시" });
    await expect(toggle).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
  });
});

test.describe("정리 검증", () => {
  test("TC-EX-99 테스트가 만든 데이터 정리 확인: 가입 계정·기록·예약·준비물이 기준선과 일치", async () => {
    const report = await restoreBaseline();
    expect(report.leftovers, "복원 실패 항목").toEqual([]);
    expect(await leftoverQaUsers()).toEqual([]);
    const second = await restoreBaseline();
    expect(second.actions, "두 번째 복원에서 변경이 없어야 함").toEqual([]);
    const svc = serviceClient();
    const memo = await svc.from("bookings").select("lodging_id").like("private_memo", "QA%");
    expect(memo.data ?? []).toEqual([]);
    const notes = await svc.from("lodgings").select("id").like("notes", "QA-%");
    expect(notes.data ?? []).toEqual([]);
  });
});
