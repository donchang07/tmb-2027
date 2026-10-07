import { createClient } from "@supabase/supabase-js";
import type { Page } from "@playwright/test";
import { expect, test } from "./qa-support/fixtures";
import { accounts, need } from "./qa-support/env";
import { captureBaseline, leftoverQaUsers, restoreBaseline } from "./qa-support/baseline";
import { injectSession } from "./qa-support/cookies";
import { passwordSession, serviceClient, supabaseUrl, userIdByEmail } from "./qa-support/supabase";
import {
  MSG,
  PACKING_TOTAL,
  accountButton,
  authCookieNames,
  checkItems,
  headerLogin,
  lodgingRow,
  logoutViaMenu,
  packingBox,
  ready,
  uiLogin,
} from "./qa-support/ui";

// P1: 예외·경계·권한·세션·네트워크 오류 케이스 (docs/PRD.md 8장 Edge Cases, 5.4, SCR-007~018)

test.beforeAll(async () => {
  await captureBaseline();
});
test.afterAll(async () => {
  await restoreBaseline();
});

const isAction = (r: { method(): string; headers(): Record<string, string> }) => r.method() === "POST" && "next-action" in r.headers();

async function openEditor(page: Page, name: string) {
  await page.goto("/admin/bookings");
  await expect(page.getByRole("heading", { level: 1, name: "14박 예약·숙박 편집" })).toBeVisible();
  await lodgingRow(page, name).getByRole("button", { name: "편집" }).click();
  const panel = page.locator("#lodging-edit-panel");
  await expect(panel.getByLabel("공개 상태")).toBeVisible();
  return panel;
}

test.describe("P1 인증·입력 검증", () => {
  test("TC-P1-01 로그인 빈 값 제출: 필드 오류·이메일 포커스 (SCR-015, 빈 값)", async ({ page }) => {
    await page.goto("/login");
    await ready(page);
    await page.getByRole("button", { name: "로그인", exact: true }).click();
    await expect(page.getByText("이메일을 입력해 주세요.")).toBeVisible();
    await expect(page.getByText("비밀번호를 입력해 주세요.")).toBeVisible();
    await expect(page.getByLabel("이메일")).toBeFocused();
    expect(await authCookieNames(page.context())).toEqual([]);
  });

  test("TC-P1-02 회원가입 입력 검증: 이메일 형식·비밀번호 7자 경계·확인 불일치 (SCR-016, FR-019, 잘못된 입력·경계값)", async ({ page }) => {
    await page.goto("/signup");
    await ready(page);
    await page.getByLabel("이메일").fill("not-an-email");
    await page.getByLabel("비밀번호", { exact: true }).fill("12345678");
    await page.getByLabel("비밀번호 확인").fill("12345678");
    await page.getByRole("button", { name: "가입하기" }).click();
    await expect(page.getByText("이메일 형식이 올바르지 않습니다.")).toBeVisible();
    await page.getByLabel("이메일").fill("someone@example.com");
    await page.getByLabel("비밀번호", { exact: true }).fill("1234567");
    await page.getByLabel("비밀번호 확인").fill("1234567");
    await page.getByRole("button", { name: "가입하기" }).click();
    await expect(page.getByText("비밀번호는 8자 이상이어야 합니다.")).toBeVisible();
    await page.getByLabel("비밀번호", { exact: true }).fill("12345678");
    await page.getByLabel("비밀번호 확인").fill("12345679");
    await page.getByRole("button", { name: "가입하기" }).click();
    await expect(page.getByText("비밀번호가 서로 다릅니다.")).toBeVisible();
    expect(await authCookieNames(page.context())).toEqual([]);
  });

  test("TC-P1-03 비밀번호 73자(상한 72 초과)는 계정을 만들지 않음 (FR-019, 경계값)", async ({ page }) => {
    const email = `qa-long-${Date.now().toString(36)}@${accounts.emailDomain()}`;
    try {
      await page.goto("/signup");
      await ready(page);
      const pw = "a1".repeat(36) + "b";
      expect(pw.length).toBe(73);
      await page.getByLabel("이메일").fill(email);
      await page.getByLabel("비밀번호", { exact: true }).fill(pw);
      await page.getByLabel("비밀번호 확인").fill(pw);
      await page.getByRole("button", { name: "가입하기" }).click();
      await expect(page.getByText("비밀번호는 72자 이하여야 합니다.")).toBeVisible();
      expect(await authCookieNames(page.context())).toEqual([]);
      expect(await userIdByEmail(email)).toBeNull();
    } finally {
      await restoreBaseline();
    }
  });

  test("TC-P1-04 가입 → 즉시 로그인 → 중복 가입 거부 → 중복 클릭에도 계정 1개 (SCR-016, FR-019, SC-016, 중복 등록·중복 클릭)", async ({ page }) => {
    test.setTimeout(120_000);
    const email = `qa-${Date.now().toString(36)}-${test.info().project.name.slice(0, 3)}@${accounts.emailDomain()}`;
    const pw = "qa-pass-1234"; // 12자
    try {
      await page.goto("/signup?next=/packing");
      await ready(page);
      await page.getByLabel("이메일").fill(email);
      await page.getByLabel("비밀번호", { exact: true }).fill(pw);
      await page.getByLabel("비밀번호 확인").fill(pw);
      await page.getByRole("button", { name: "가입하기" }).dblclick();
      await page.waitForURL((u) => u.pathname === "/packing");
      await expect(page.getByText(MSG.accountSubtitle)).toBeVisible();
      expect(await userIdByEmail(email)).not.toBeNull();
      const svc = serviceClient();
      const { data } = await svc.auth.admin.listUsers({ page: 1, perPage: 200 });
      expect((data?.users ?? []).filter((u) => u.email === email).length).toBe(1);

      await logoutViaMenu(page);
      await page.goto("/signup");
      await page.getByLabel("이메일").fill(email);
      await page.getByLabel("비밀번호", { exact: true }).fill(pw);
      await page.getByLabel("비밀번호 확인").fill(pw);
      await page.getByRole("button", { name: "가입하기" }).click();
      await expect(page.locator("main").getByRole("alert")).toContainText("이 이메일로 가입할 수 없습니다. 이미 계정이 있으면 로그인해 주세요.");
      await expect(page.getByLabel("이메일")).toHaveValue(email);
    } finally {
      await restoreBaseline();
      expect(await leftoverQaUsers()).toEqual([]);
    }
  });

  test("TC-P1-05 팀원 이메일로는 가입 불가 (FR-030, SC-020, D-017, 권한 없는 접근)", async ({ page }) => {
    await page.goto("/signup");
    await ready(page);
    const m = accounts.member(1);
    await page.getByLabel("이메일").fill(m.email);
    await page.getByLabel("비밀번호", { exact: true }).fill("qa-pass-1234");
    await page.getByLabel("비밀번호 확인").fill("qa-pass-1234");
    await page.getByRole("button", { name: "가입하기" }).click();
    await expect(page.locator("main").getByRole("alert")).toContainText("이 이메일로 가입할 수 없습니다.");
    expect(await authCookieNames(page.context())).toEqual([]);
  });

  test("TC-P1-06 오픈 리다이렉트 next(//evil.com, /\\evil.com)는 무시하고 홈으로 (5.4 safeNext, FR-021)", async ({ page, baseURL }) => {
    test.setTimeout(120_000);
    const A = accounts.userA();
    for (const next of ["//evil.com", "/\\evil.com"]) {
      await uiLogin(page, A.email, A.password, `/login?next=${encodeURIComponent(next)}`);
      await page.waitForURL((u) => u.pathname === "/" || u.hostname !== new URL(baseURL ?? "https://utmb2027.vercel.app").hostname);
      expect(new URL(page.url()).origin).toBe(new URL(baseURL ?? page.url()).origin);
      expect(new URL(page.url()).pathname).toBe("/");
      await logoutViaMenu(page);
    }
  });

  test("TC-P1-07 인증 콜백 코드 없음·잘못된 코드 → 경로별 로그인 화면과 오류 문구 (SCR-017, SC-020)", async ({ page }) => {
    const msg = "다른 기기에서 링크를 열었다면 이 기기에서 다시 요청해 주세요.";
    await page.goto("/auth/callback?code=invalid-code&next=/journal");
    await expect(page).toHaveURL(/\/journal\/login\?error=auth/);
    await expect(page.getByText(msg, { exact: false })).toBeVisible();
    await page.goto("/auth/callback?code=invalid-code&next=/admin/bookings");
    await expect(page).toHaveURL(/\/admin\?error=auth/);
    await expect(page.getByText(msg, { exact: false })).toBeVisible();
    await page.goto("/auth/callback?code=invalid-code&next=/packing");
    await expect(page).toHaveURL(/\/login\?error=auth/);
    await expect(page.getByText(msg, { exact: false })).toBeVisible();
  });

  test("TC-P1-08 [차단] 콜백 성공 시 기본 이동 경로 '/' (SYNC-01)", async () => {
    test.skip(true, "유효한 PKCE code는 실제 이메일 발송 없이 얻을 수 없음(제외 항목). SYNC-01은 작성자 결정 대기 상태이기도 함");
  });

  test("TC-P1-09 리더·팀원 magic link 폼은 존재하고 빈 값 제출 시 클라이언트 검증 (SCR-007·012, 이메일 미발송)", async ({ page }) => {
    await page.goto("/admin");
    const email = page.getByPlaceholder("leader@example.com");
    await expect(email).toBeVisible();
    await expect(email).toHaveAttribute("type", "email");
    await expect(email).toHaveAttribute("required", "");
    await page.getByRole("button", { name: "로그인 링크 보내기" }).click();
    expect(await email.evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);
    await page.goto("/journal/login");
    await expect(page.getByRole("button", { name: /로그인 링크/ })).toBeVisible();
  });
});

test.describe("P1 세션·이탈·뒤로 가기", () => {
  test("TC-P1-10 세션 쿠키 삭제 후 이동: 만료 배너 → 다시 로그인 → 원래 화면 복귀 (SCR-018-EL-05, SC-021, 세션 만료)", async ({ newRoleContext, shot }) => {
    test.setTimeout(120_000);
    const { page, context } = await newRoleContext("userA");
    await page.goto("/itinerary");
    await expect(accountButton(page)).toBeVisible();
    await context.clearCookies();
    await page.goto("/budget");
    await expect(page.getByText(MSG.expired)).toBeVisible();
    await shot("TC-P1-10-expired-banner", page);
    await page.getByRole("link", { name: "다시 로그인" }).click();
    await expect(page).toHaveURL(/\/login\?reason=expired&next=%2Fbudget/);
    await expect(page.getByText("로그인 시간이 만료되었습니다. 다시 로그인해 주세요.")).toBeVisible();
    const A = accounts.userA();
    await page.getByLabel("이메일").fill(A.email);
    await page.getByLabel("비밀번호", { exact: true }).fill(A.password);
    await page.getByRole("button", { name: "로그인", exact: true }).click();
    await page.waitForURL((u) => u.pathname === "/budget");
  });

  test("TC-P1-11 만료된 액세스 토큰 + 무효 리프레시 토큰 쿠키 → 비로그인으로 안전하게 처리 (5.4, 세션 만료)", async ({ browser, baseURL, diag }) => {
    diag.allowStatus(400, 401, 403);
    const session = await passwordSession(accounts.userA());
    const context = await browser.newContext({ baseURL });
    diag.attach(context);
    await injectSession(context, baseURL ?? "", { ...session, access_token: "x.y.z", refresh_token: "invalid-refresh-token", expires_at: 1, expires_in: 0 });
    const page = await context.newPage();
    const res = await page.goto("/packing");
    expect(res?.status()).toBe(200);
    await ready(page);
    await expect(page.getByText(/체크 상태는/)).toBeVisible();
    await expect(page.getByText(MSG.accountSubtitle)).toHaveCount(0);
    await page.goto("/admin/bookings");
    await expect(page).toHaveURL(/\/admin(\?|$)/);
    await context.close();
  });

  test("TC-P1-12 손상된 인증 쿠키 값은 오류 화면 없이 비로그인 처리 (잘못된 입력)", async ({ browser, baseURL, diag }) => {
    diag.allowStatus(400, 401, 403);
    const context = await browser.newContext({ baseURL });
    diag.attach(context);
    const ref = new URL(supabaseUrl()).hostname.split(".")[0];
    await context.addCookies([{ name: `sb-${ref}-auth-token`, value: "base64-@@not-valid@@", url: baseURL ?? "https://utmb2027.vercel.app" }]);
    const page = await context.newPage();
    for (const path of ["/", "/packing", "/admin", "/login"]) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBeLessThan(500);
    }
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await context.close();
  });

  test("TC-P1-13 로그아웃 후 뒤로 가기: 계정 데이터가 다시 보이지 않음 (SCR-018-EL-04, SC-020, 새로고침·뒤로 가기)", async ({ newRoleContext }) => {
    const { page } = await newRoleContext("userA");
    const svc = serviceClient();
    const aId = (await userIdByEmail(accounts.userA().email)) ?? "";
    try {
      await page.goto("/packing");
      await expect(page.getByText(MSG.accountSubtitle)).toBeVisible();
      await packingBox(page, "docs-passport").check();
      await expect(page.getByTestId("packing-sync-status")).toContainText(MSG.syncSaved);
      await logoutViaMenu(page);
      await page.goBack();
      await expect(page.getByText(MSG.deviceSubtitle)).toBeVisible();
      await expect(page.getByText(MSG.accountSubtitle)).toHaveCount(0);
      await expect(accountButton(page)).toHaveCount(0);
      expect(aId).not.toBe("");
    } finally {
      await svc.from("packing_checks").delete().eq("user_id", aId);
      await restoreBaseline();
    }
  });

  test("TC-P1-14 관리자 세션은 새로고침·직접 URL 재진입에도 유지 (FR-020, 새로고침)", async ({ newRoleContext }) => {
    const { page } = await newRoleContext("admin");
    await page.goto("/admin/bookings");
    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: "14박 예약·숙박 편집" })).toBeVisible();
    await page.goto("/admin");
    await expect(page.getByText("리더로 로그인됨")).toBeVisible();
    await page.goBack();
    await expect(page.getByRole("heading", { level: 1, name: "14박 예약·숙박 편집" })).toBeVisible();
  });

  test("TC-P1-15 두 계정 동시 세션 독립: A 로그아웃이 B에 영향 없음 (FR-029, SC-017)", async ({ newRoleContext }) => {
    const a = await newRoleContext("userA");
    const b = await newRoleContext("userB");
    await a.page.goto("/");
    await b.page.goto("/");
    await expect(accountButton(a.page)).toContainText(accounts.userA().email.slice(0, 12));
    await expect(accountButton(b.page)).toContainText(accounts.userB().email.slice(0, 12));
    await logoutViaMenu(a.page);
    await expect(headerLogin(a.page)).toBeVisible();
    await b.page.reload();
    await expect(accountButton(b.page)).toContainText(accounts.userB().email.slice(0, 12));
  });
});

test.describe("P1 관리자 편집 예외", () => {
  test.afterEach(async () => {
    await restoreBaseline();
  });

  test("TC-P1-20 저장 전 이탈 시 beforeunload 확인창, 취소하면 값 유지·DB 불변 (SCR-008-EL-16, Edge 저장 중 이탈, 작업 중간 이탈)", async ({ newRoleContext }) => {
    const { page } = await newRoleContext("admin");
    const svc = serviceClient();
    const panel = await openEditor(page, "Hôtel Edelweiss");
    await panel.getByLabel("공개 상태").selectOption({ label: "대기" });
    await panel.getByLabel("비공개 메모").fill("QA unsaved");
    await expect(panel.getByText("저장되지 않은 변경이 있습니다")).toBeVisible();
    const dialogs: string[] = [];
    page.on("dialog", async (d) => {
      dialogs.push(d.type());
      await d.dismiss();
    });
    await page.evaluate(() => {
      window.location.href = "/";
    });
    await expect.poll(() => dialogs.length, { timeout: 10_000 }).toBeGreaterThan(0);
    expect(dialogs[0]).toBe("beforeunload");
    await expect(page).toHaveURL(/\/admin\/bookings/);
    await expect(panel.getByLabel("비공개 메모")).toHaveValue("QA unsaved");
    const row = await svc.from("bookings").select("status, private_memo").eq("lodging_id", "edelweiss").single();
    expect(row.data?.status).toBe("unbooked");
    expect(row.data?.private_memo).toBeNull();
    page.removeAllListeners("dialog");
    page.on("dialog", (d) => void d.accept());
  });

  test("TC-P1-21 동시 편집 충돌: 먼저 저장된 값 우선, 두 번째는 충돌 문구 (Edge 동시 편집, SCR-008-EL-15)", async ({ newRoleContext }) => {
    test.setTimeout(120_000);
    const one = await newRoleContext("admin");
    const two = await newRoleContext("admin");
    const p1 = await openEditor(one.page, "Hôtel Edelweiss");
    const p2 = await openEditor(two.page, "Hôtel Edelweiss");
    await p1.getByLabel("공개 상태").selectOption({ label: "문의" });
    await p1.getByRole("button", { name: "저장", exact: true }).click();
    await expect(p1.getByRole("status").filter({ hasText: "저장됨" }).first()).toBeVisible();
    await p2.getByLabel("공개 상태").selectOption({ label: "대기" });
    await p2.getByRole("button", { name: "저장", exact: true }).click();
    await expect(p2.getByRole("alert")).toContainText("다른 변경이 먼저 저장되었습니다");
    const row = await serviceClient().from("bookings").select("status").eq("lodging_id", "edelweiss").single();
    expect(row.data?.status).toBe("inquiry");
  });

  test("TC-P1-22 저장 버튼 더블클릭: 버전은 1만 증가 (SCR-008-EL-15 중복 제출 방지, 중복 클릭)", async ({ newRoleContext }) => {
    const { page } = await newRoleContext("admin");
    const svc = serviceClient();
    const before = await svc.from("bookings").select("version").eq("lodging_id", "edelweiss").single();
    const panel = await openEditor(page, "Hôtel Edelweiss");
    await panel.getByLabel("공개 상태").selectOption({ label: "문의" });
    await panel.getByRole("button", { name: "저장", exact: true }).dblclick();
    await expect(panel.getByRole("status").filter({ hasText: "저장됨" }).first()).toBeVisible();
    const after = await svc.from("bookings").select("version, status").eq("lodging_id", "edelweiss").single();
    expect(after.data?.status).toBe("inquiry");
    expect((after.data?.version as number) - (before.data?.version as number)).toBe(1);
  });

  test("TC-P1-23 숙박 정보 검증: 최저가>최고가 거부 (SCR-008-EL-25, 잘못된 입력)", async ({ newRoleContext }) => {
    const { page } = await newRoleContext("admin");
    const svc = serviceClient();
    const before = await svc.from("lodgings").select("price_low, price_high, version").eq("id", "edelweiss").single();
    const panel = await openEditor(page, "Hôtel Edelweiss");
    await panel.getByLabel("최저가").fill("500");
    await panel.getByLabel("최고가").fill("100");
    await panel.getByRole("button", { name: "숙박 정보 저장" }).click();
    await expect(panel.getByText("최저가는 최고가보다 클 수 없습니다.")).toBeVisible();
    const after = await svc.from("lodgings").select("price_low, price_high, version").eq("id", "edelweiss").single();
    expect(after.data).toEqual(before.data);
  });

  test("TC-P1-24 숙박 정보 검증: 잘못된 URL·음수 가격은 서버가 거부 (SCR-008-EL-22·24, 잘못된 입력)", async ({ newRoleContext }) => {
    const { page } = await newRoleContext("admin");
    const svc = serviceClient();
    const before = await svc.from("lodgings").select("booking_url, price_low, version").eq("id", "edelweiss").single();
    const panel = await openEditor(page, "Hôtel Edelweiss");
    await page.evaluate(() => document.querySelectorAll("form").forEach((f) => (f.noValidate = true)));
    await panel.getByLabel("예약 링크").fill("not a url");
    await panel.getByRole("button", { name: "숙박 정보 저장" }).click();
    await expect(panel.getByText("올바른 URL이 아닙니다.")).toBeVisible();
    await panel.getByLabel("예약 링크").fill(before.data?.booking_url ?? "");
    await panel.getByLabel("최저가").fill("-5");
    await panel.getByRole("button", { name: "숙박 정보 저장" }).click();
    await expect(panel.getByText("가격은 0 이상이어야 합니다.")).toBeVisible();
    const after = await svc.from("lodgings").select("booking_url, price_low, version").eq("id", "edelweiss").single();
    expect(after.data).toEqual(before.data);
  });

  test("TC-P1-25 비공개 메모 경계: 1000자 저장 성공, 1001자는 저장되지 않음 (SCR-008-EL-14, 경계값)", async ({ newRoleContext }) => {
    const { page } = await newRoleContext("admin");
    const svc = serviceClient();
    const panel = await openEditor(page, "Hôtel Edelweiss");
    const setMemo = (len: number) =>
      panel.getByLabel("비공개 메모").evaluate((el: HTMLTextAreaElement, n: number) => {
        el.value = "m".repeat(n);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.form?.dispatchEvent(new Event("change", { bubbles: true }));
      }, len);
    await setMemo(1000);
    await panel.getByRole("button", { name: "저장", exact: true }).click();
    await expect(panel.getByRole("status").filter({ hasText: "저장됨" }).first()).toBeVisible();
    let row = await svc.from("bookings").select("private_memo").eq("lodging_id", "edelweiss").single();
    expect((row.data?.private_memo as string).length).toBe(1000);
    await setMemo(1001);
    await panel.getByRole("button", { name: /^저장/ }).first().click();
    await expect(panel.getByRole("alert")).toBeVisible();
    row = await svc.from("bookings").select("private_memo").eq("lodging_id", "edelweiss").single();
    expect((row.data?.private_memo as string).length).toBe(1000);
  });

  test("TC-P1-26 편집 중 세션 소멸 후 저장: 로그인 안내 문구, 저장되지 않음 (SCR-008 권한 없음 상태, 세션 만료)", async ({ newRoleContext }) => {
    const { page, context } = await newRoleContext("admin");
    const svc = serviceClient();
    const panel = await openEditor(page, "Hôtel Edelweiss");
    await panel.getByLabel("공개 상태").selectOption({ label: "문의" });
    await context.clearCookies();
    await panel.getByRole("button", { name: "저장", exact: true }).click();
    await expect(panel.getByRole("alert")).toBeVisible();
    await expect(panel.getByRole("alert").getByRole("link", { name: "로그인" })).toBeVisible();
    const row = await svc.from("bookings").select("status").eq("lodging_id", "edelweiss").single();
    expect(row.data?.status).toBe("unbooked");
  });

  test("TC-P1-27 저장 요청 네트워크 실패: 성공으로 표시하지 않고 DB 불변, 재시도 가능 (서버·네트워크 오류, SCR-008 시스템 오류)", async ({ newRoleContext }) => {
    const { page } = await newRoleContext("admin");
    const svc = serviceClient();
    const panel = await openEditor(page, "Hôtel Edelweiss");
    await panel.getByLabel("공개 상태").selectOption({ label: "문의" });
    await page.route("**/admin/bookings", (route) => (isAction(route.request()) ? route.abort("failed") : route.continue()));
    await panel.getByRole("button", { name: "저장", exact: true }).click();
    await page.waitForTimeout(1500);
    await expect(page.getByText("Application error"), "저장 요청 실패 시 화면 전체가 오류로 바뀌면 안 됨").toHaveCount(0);
    await expect(panel.getByText(/^저장됨/)).toHaveCount(0);
    const row = await svc.from("bookings").select("status").eq("lodging_id", "edelweiss").single();
    expect(row.data?.status).toBe("unbooked");
    await page.unroute("**/admin/bookings");
    await expect(panel.getByRole("button", { name: /^저장/ }).first()).toBeEnabled();
    await panel.getByRole("button", { name: /^저장/ }).first().click();
    await expect(panel.getByRole("status").filter({ hasText: "저장됨" }).first()).toBeVisible();
  });
});

test.describe("P1 팀원 기록", () => {
  test.afterEach(async () => {
    await restoreBaseline();
  });

  test("TC-P1-30 팀원 기록 작성: 201자 거부·사진 형식/용량 오류·200자 저장·1일 1건·중복 클릭·공개 열람 (SCR-011, FR-016, SC-012)", async ({ newRoleContext, shot }) => {
    test.setTimeout(240_000);
    const DAY = "/journal/d2027-08-06";
    const svc = serviceClient();
    const m = await newRoleContext("member3");
    await m.page.goto(DAY);
    await expect(m.page.getByText(/팀원3님으로 로그인/)).toBeVisible();
    const textarea = m.page.locator("form textarea[name='text']");
    await expect(textarea).toBeVisible();

    const setText = (n: number) =>
      textarea.evaluate((el: HTMLTextAreaElement, len: number) => {
        el.value = "기".repeat(len);
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }, n);
    await setText(201);
    await m.page.getByRole("button", { name: "저장", exact: true }).click();
    await expect(m.page.getByText("기록은 1~200자여야 합니다.")).toBeVisible();
    expect(((await svc.from("journal_entries").select("id").eq("day_id", "d2027-08-06")).data ?? []).length).toBe(0);

    const photo = m.page.locator("form input[name='photo']");
    await photo.setInputFiles({ name: "a.txt", mimeType: "text/plain", buffer: Buffer.from("x") });
    await expect(m.page.getByText("JPG·PNG·WebP 10MB 이하만 가능합니다")).toBeVisible();
    await expect(m.page.getByRole("button", { name: "저장", exact: true })).toBeDisabled();
    await photo.setInputFiles({ name: "big.png", mimeType: "image/png", buffer: Buffer.alloc(11 * 1024 * 1024) });
    await expect(m.page.getByText("JPG·PNG·WebP 10MB 이하만 가능합니다")).toBeVisible();
    await expect(m.page.getByRole("button", { name: "저장", exact: true })).toBeDisabled();
    await photo.setInputFiles([]);

    await setText(200);
    await m.page.getByRole("button", { name: "저장", exact: true }).dblclick();
    await expect(m.page.getByText("이미 기록을 남겼습니다").first()).toBeVisible();
    const rows = await svc.from("journal_entries").select("id, text").eq("day_id", "d2027-08-06");
    expect((rows.data ?? []).length).toBe(1);
    expect(rows.data?.[0]?.text).toHaveLength(200);
    await shot("TC-P1-30-journal-saved", m.page);

    const guest = await newRoleContext("anon");
    await guest.page.goto(DAY);
    await expect(guest.page.getByText("팀원3").first()).toBeVisible();
    await expect(guest.page.locator("form textarea[name='text']")).toHaveCount(0);
    expect(await guest.page.content()).not.toContain(accounts.member(3).email);
  });

  test("TC-P1-31 기록 없는 Day: '아직 기록이 없습니다.' (SCR-011 빈 상태, 데이터 없음)", async ({ page }) => {
    await page.goto("/journal/d2027-08-09");
    await expect(page.getByText("아직 기록이 없습니다.")).toBeVisible();
  });

  test("TC-P1-32 팀원은 관리자 화면에 접근 불가, 계정 메뉴에 '관리자 화면' 없음 (5.1, SYNC-02)", async ({ newRoleContext }) => {
    const { page } = await newRoleContext("member1");
    await page.goto("/admin/bookings");
    await expect(page.getByText(MSG.forbidden)).toBeVisible();
    await expect(page.getByText("14박 예약·숙박 편집")).toHaveCount(0);
    await page.goto("/");
    await ready(page);
    await page.locator("header").getByRole("button", { name: /계정/ }).click();
    await expect(page.getByRole("menuitem", { name: "관리자 화면" })).toHaveCount(0);
  });
});

test.describe("P1 준비물 예외", () => {
  test.afterEach(async () => {
    await restoreBaseline();
  });

  test("TC-P1-40 항목 34개 전부 체크: 34/34 저장·복원, 전체 해제 후 0/34·버튼 비활성 (SCR-009-EL-03·04, 데이터 많음·경계값)", async ({ newRoleContext }) => {
    test.setTimeout(180_000);
    const { page } = await newRoleContext("userA");
    const svc = serviceClient();
    const aId = (await userIdByEmail(accounts.userA().email)) ?? "";
    await svc.from("packing_checks").delete().eq("user_id", aId);
    await page.goto("/packing");
    await expect(page.getByText(MSG.accountSubtitle)).toBeVisible();
    await expect(page.getByRole("button", { name: "전체 해제" })).toBeDisabled();
    const ids = await page.locator("input[data-item-id]").evaluateAll((els) => els.map((e) => (e as HTMLInputElement).dataset.itemId ?? ""));
    expect(ids.length).toBe(PACKING_TOTAL);
    await checkItems(page, ids);
    await expect(page.getByTestId("packing-progress")).toContainText(`${PACKING_TOTAL}/${PACKING_TOTAL}`);
    await expect(page.getByTestId("packing-sync-status")).toContainText(MSG.syncSaved);
    await page.reload();
    await expect(page.getByTestId("packing-progress")).toContainText(`${PACKING_TOTAL}/${PACKING_TOTAL}`);
    expect(((await svc.from("packing_checks").select("item_id").eq("user_id", aId).eq("checked", true)).data ?? []).length).toBe(PACKING_TOTAL);
    await page.getByRole("button", { name: "전체 해제" }).click();
    await expect(page.getByTestId("packing-progress")).toContainText(`0/${PACKING_TOTAL}`);
    await expect(page.getByRole("button", { name: "전체 해제" })).toBeDisabled();
    await expect(page.getByTestId("packing-sync-status")).toContainText(MSG.syncSaved);
    expect(((await svc.from("packing_checks").select("item_id").eq("user_id", aId).eq("checked", true)).data ?? []).length).toBe(0);
  });

  test("TC-P1-41 같은 항목 5회 연타: 최종 상태 체크됨이 새로고침 후에도 일치 (FR-024 중복 요청 병합, 중복 클릭)", async ({ newRoleContext }) => {
    const { page } = await newRoleContext("userA");
    const svc = serviceClient();
    const aId = (await userIdByEmail(accounts.userA().email)) ?? "";
    await svc.from("packing_checks").delete().eq("user_id", aId);
    await page.goto("/packing");
    await expect(page.getByText(MSG.accountSubtitle)).toBeVisible();
    const box = packingBox(page, "gear-poles");
    await expect(box).toBeEnabled();
    for (let i = 0; i < 5; i += 1) await box.click();
    await expect(box).toBeChecked();
    await expect(page.getByTestId("packing-sync-status")).toContainText(MSG.syncSaved);
    await page.reload();
    await expect(packingBox(page, "gear-poles")).toBeChecked();
    const rows = await svc.from("packing_checks").select("item_id, checked").eq("user_id", aId);
    expect((rows.data ?? []).filter((r) => r.checked).map((r) => r.item_id)).toEqual(["gear-poles"]);
  });

  test("TC-P1-42 저장 요청 실패(네트워크): '저장하지 못했습니다' 후 복구되면 재전송 (SCR-009-EL-11, 서버·네트워크 오류)", async ({ newRoleContext }) => {
    test.setTimeout(120_000);
    const { page } = await newRoleContext("userA");
    const svc = serviceClient();
    const aId = (await userIdByEmail(accounts.userA().email)) ?? "";
    await svc.from("packing_checks").delete().eq("user_id", aId);
    await page.goto("/packing");
    await expect(page.getByText(MSG.accountSubtitle)).toBeVisible();
    await page.route("**/packing", (route) => (isAction(route.request()) ? route.abort("failed") : route.continue()));
    await packingBox(page, "gear-water").check();
    await expect(page.getByTestId("packing-sync-status")).toContainText("저장하지 못했습니다. 연결되면 다시 저장합니다.");
    expect(((await svc.from("packing_checks").select("item_id").eq("user_id", aId)).data ?? []).length).toBe(0);
    await page.unroute("**/packing");
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    await expect(page.getByTestId("packing-sync-status")).toContainText(MSG.syncSaved, { timeout: 30_000 });
    await page.reload();
    await expect(packingBox(page, "gear-water")).toBeChecked();
  });

  test("TC-P1-43 로그인 중 세션 만료 후 체크: 만료 안내와 '다시 로그인', 계정에는 저장되지 않음 (SCR-009-EL-13, 세션 만료)", async ({ newRoleContext }) => {
    const { page, context } = await newRoleContext("userA");
    const svc = serviceClient();
    const aId = (await userIdByEmail(accounts.userA().email)) ?? "";
    await svc.from("packing_checks").delete().eq("user_id", aId);
    await page.goto("/packing");
    await expect(page.getByText(MSG.accountSubtitle)).toBeVisible();
    await context.clearCookies();
    await packingBox(page, "docs-cards").check();
    await expect(page.getByText("로그인 시간이 만료되었습니다. 다시 로그인하면 계정에 저장합니다.")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("link", { name: "다시 로그인" }).first()).toBeVisible();
    expect(((await svc.from("packing_checks").select("item_id").eq("user_id", aId)).data ?? []).length).toBe(0);
  });

  test("TC-P1-44 REST 직접 호출: A 세션으로 B 명의 행 INSERT 거부 (FR-023, SC-019)", async () => {
    const session = await passwordSession(accounts.userA());
    const bId = (await userIdByEmail(accounts.userB().email)) ?? "";
    const client = createClient(supabaseUrl(), need("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${session.access_token}` } },
    });
    const ins = await client.from("packing_checks").insert({ user_id: bId, item_id: "docs-passport", checked: true }).select();
    expect(ins.error, "타인 user_id INSERT는 RLS 거부").not.toBeNull();
    // PRD 6.x 용량·한도: 항목 ID는 서버 액션의 zod 검증으로만 허용 → 본인 행 직접 INSERT는 DB가 막지 않는 것이 문서화된 한계. 즉시 삭제한다.
    const own = await client.from("packing_checks").insert({ item_id: "qa-not-a-real-item", checked: true }).select();
    await serviceClient().from("packing_checks").delete().eq("item_id", "qa-not-a-real-item");
    expect(own.error === null, "본인 행 직접 INSERT 허용 여부(PRD 문서화 한계와 일치)").toBe(true);
  });
});

test.describe("P1 공개 화면 오류·오프라인", () => {
  test("TC-P1-50 예약 상태 조회 실패: 오류 문구와 마지막 갱신 시각, 화면은 유지 (SCR-003-EL-10, Edge 예약 상태 서버 오류, 서버 오류)", async ({ page, diag }) => {
    test.setTimeout(90_000);
    diag.allow(/.*/);
    await page.routeWebSocket(/realtime/, (ws) => void ws.close());
    await page.context().route(/\/api\/bookings(\?|$)/, (r) => r.fulfill({ status: 500, body: "{}" }));
    await page.context().route(/\/rest\/v1\/bookings_public/, (r) => r.abort("failed"));
    await page.goto("/day/d2027-08-05");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByText(/예약 상태를 불러올 수 없습니다/).first()).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("booking-status").first()).toBeVisible();
  });

  test("TC-P1-51 오프라인: 방문한 Day는 캐시로 열리고 배너 표시, 미방문 Day는 안내 (SCR-013, FR-013, SC-006)", async ({ page, context, diag }) => {
    test.setTimeout(90_000);
    diag.allow(/.*/);
    await page.goto("/");
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.goto("/day/d2027-08-04");
    await expect(page.locator("h1")).toContainText("레주슈");
    await page.waitForTimeout(800);
    await context.setOffline(true);
    await page.goto("/day/d2027-08-04");
    await expect(page.locator("h1")).toContainText("레주슈");
    await expect(page.getByRole("status").filter({ hasText: "오프라인 · 마지막 갱신" })).toBeVisible();
    await page.goto("/day/d2027-08-12");
    await expect(page.getByText("인터넷 연결 후 한 번 열어 주세요")).toBeVisible();
    await context.setOffline(false);
  });

  test("TC-P1-52 존재하지 않는 경로·잘못된 dayId는 404 안내와 홈 복귀 링크 (SCR-014, 잘못된 입력)", async ({ page }) => {
    for (const path of ["/no-such-page", "/day/xyz", "/travel/xyz", "/journal/xyz", "/day/d2027-09-30"]) {
      await page.goto(path);
      await expect(page.getByText("페이지를 찾을 수 없습니다"), path).toBeVisible();
      await expect(page.getByRole("link", { name: "홈으로" }), path).toHaveAttribute("href", "/");
    }
  });

  test("TC-P1-52b 존재하지 않는 경로·dayId의 HTTP 상태는 404 (SCR-011 'Next.js 404 페이지', SCR-014)", async ({ request }) => {
    for (const path of ["/no-such-page", "/day/xyz", "/travel/xyz", "/journal/xyz", "/day/d2027-09-30"]) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(404);
    }
  });

  test("TC-P1-53 관리자 API: 14개 숙박 ID 전부 비로그인 401/403, 존재하지 않는 ID는 5xx 아님 (SC-007, 권한 없는 접근)", async ({ request }) => {
    const ids = ["auberge-mont-blanc", "bertone", "chamonix-hotel", "chamonix-hotel-2", "edelweiss", "elena", "gai-soleil", "geneva-hotel", "la-balme", "la-boerne", "la-flegere", "maison-vieille", "mottets", "plein-air"];
    for (const id of ids) {
      const res = await request.get(`/api/admin/bookings/${id}`);
      expect([401, 403], id).toContain(res.status());
      const body = await res.text();
      expect(body).not.toMatch(/confirmation_ref|private_memo/);
    }
    const bad = await request.get("/api/admin/bookings/does-not-exist");
    expect(bad.status()).toBeLessThan(500);
  });

  test("TC-P1-54 공개 예약 API: 14건·상태 필드만·쓰기 메서드 거부 (SC-007, FR-010)", async ({ request }) => {
    const res = await request.get("/api/bookings");
    expect(res.status()).toBe(200);
    const json = (await res.json()) as { bookings: Record<string, unknown>[] };
    expect(json.bookings.length).toBe(14);
    const post = await request.post("/api/bookings", { data: { status: "confirmed" } });
    expect([404, 405]).toContain(post.status());
  });

  test("TC-P1-55 production 스모크: SCR-001·006·009·015 200, 콘솔 오류 0건 (SC-024)", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));
    for (const path of ["/", "/budget", "/packing", "/login"]) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(200);
      await page.waitForLoadState("networkidle");
    }
    expect(errors).toEqual([]);
  });

  test("TC-P1-56 기본 noindex·비밀값 미노출 (NFR 개인정보·보안, FR-028)", async ({ page, request }) => {
    const res = await request.get("/");
    const header = res.headers()["x-robots-tag"] ?? "";
    await page.goto("/");
    const meta = (await page.locator('meta[name="robots"]').getAttribute("content").catch(() => null)) ?? "";
    expect(`${header} ${meta}`).toMatch(/noindex/);
    const html = await page.content();
    expect(html).not.toMatch(/service_role|SUPABASE_SERVICE_ROLE_KEY|sb_secret_/);
  });
});
