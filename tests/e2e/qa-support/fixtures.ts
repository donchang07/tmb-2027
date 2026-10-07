import { mkdirSync } from "node:fs";
import path from "node:path";
import { expect, test as base, type BrowserContext, type Page, type TestInfo } from "@playwright/test";
import { injectSession } from "./cookies";
import { adminSession, passwordSession } from "./supabase";
import { accounts } from "./env";

export type Diagnostics = {
  consoleErrors: string[];
  failedRequests: string[];
  abortedRequests: string[];
  attach(context: BrowserContext): void;
  allow(pattern: RegExp): void;
  allowStatus(...codes: number[]): void;
  unexpected(): string[];
  external(): string[];
};

// 앱 소유가 아닌 외부 CDN(폰트 등)의 네트워크 계층 오류(net::ERR_*)는 앱 결함이 아니므로 별도 목록(externalFailures)으로 첨부만 한다. HTTP 4xx/5xx는 계속 예상 밖 오류로 단언한다.
const EXTERNAL_NETWORK = new RegExp("net::ERR_[A-Z_]+.*https://cdnjs[.]cloudflare[.]com/");

const SHOT_DIR = path.resolve("qa", "screenshots");

function createDiagnostics(): Diagnostics {
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  const abortedRequests: string[] = [];
  const allowed: RegExp[] = [];
  const seen = new WeakSet<BrowserContext>();
  const short = (u: string) => {
    try {
      const x = new URL(u);
      return `${x.origin}${x.pathname}`;
    } catch {
      return u;
    }
  };
  return {
    consoleErrors,
    failedRequests,
    abortedRequests,
    attach(context) {
      if (seen.has(context)) return;
      seen.add(context);
      context.on("console", (m) => {
        if (m.type() === "error") consoleErrors.push(`${m.text()} @ ${short(m.location().url || "")}`);
      });
      const watchPage = (p: Page) => p.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));
      context.pages().forEach(watchPage);
      context.on("page", watchPage);
      context.on("response", (r) => {
        if (r.status() >= 400) failedRequests.push(`${r.status()} ${r.request().method()} ${short(r.url())}`);
      });
      context.on("requestfailed", (r) => {
        const err = r.failure()?.errorText ?? "failed";
        const line = `${err} ${r.method()} ${short(r.url())}`;
        if (/ERR_ABORTED|cancel/i.test(err)) abortedRequests.push(line);
        else failedRequests.push(line);
      });
    },
    allow(pattern) {
      allowed.push(pattern);
    },
    allowStatus(...codes) {
      for (const c of codes) {
        allowed.push(new RegExp(`^${c} `));
        allowed.push(new RegExp(`status of ${c}\b`));
      }
    },
    unexpected() {
      return [...consoleErrors, ...failedRequests].filter((l) => !allowed.some((re) => re.test(l)) && !EXTERNAL_NETWORK.test(l));
    },
    external() {
      return [...consoleErrors, ...failedRequests].filter((l) => EXTERNAL_NETWORK.test(l));
    },
  };
}

export type Role = "anon" | "userA" | "userB" | "admin" | "member1" | "member2" | "member3";

export const test = base.extend<{
  strictDiag: boolean;
  diag: Diagnostics;
  shot: (id: string, page: Page) => Promise<string>;
  newRoleContext: (role: Role) => Promise<{ context: BrowserContext; page: Page }>;
}>({
  strictDiag: [false, { option: true }],
  diag: [
    async ({ context, strictDiag }, use, testInfo: TestInfo) => {
      const d = createDiagnostics();
      d.attach(context);
      await use(d);
      const payload = { consoleErrors: d.consoleErrors, failedRequests: d.failedRequests, abortedRequests: d.abortedRequests, unexpected: d.unexpected(), externalFailures: d.external() };
      await testInfo.attach("diagnostics.json", { body: JSON.stringify(payload, null, 2), contentType: "application/json" });
      if (strictDiag) expect(d.unexpected(), "예상하지 못한 콘솔 오류·실패 요청").toEqual([]);
    },
    { auto: true },
  ],
  shot: async ({}, use, testInfo) => {
    mkdirSync(SHOT_DIR, { recursive: true });
    await use(async (id, page) => {
      const file = path.join(SHOT_DIR, `${id}__${testInfo.project.name}.png`);
      await page.screenshot({ path: file, fullPage: true });
      await testInfo.attach(`${id}.png`, { path: file, contentType: "image/png" });
      return path.relative(process.cwd(), file).split(path.sep).join("/");
    });
  },
  newRoleContext: async ({ browser, diag, baseURL, viewport, userAgent, isMobile, hasTouch, deviceScaleFactor }, use) => {
    const opened: BrowserContext[] = [];
    await use(async (role) => {
      const context = await browser.newContext({ baseURL, viewport, userAgent, isMobile, hasTouch, deviceScaleFactor });
      opened.push(context);
      diag.attach(context);
      if (role !== "anon") {
        const session =
          role === "admin"
            ? await adminSession()
            : await passwordSession(
                role === "userA" ? accounts.userA() : role === "userB" ? accounts.userB() : accounts.member(Number(role.slice(-1)) as 1 | 2 | 3),
              );
        await injectSession(context, baseURL ?? "https://utmb2027.vercel.app", session);
      }
      const page = await context.newPage();
      return { context, page };
    });
    for (const c of opened) await c.close().catch(() => undefined);
  },
});

export { expect };

export async function loginAs(context: BrowserContext, baseURL: string, role: Exclude<Role, "anon">): Promise<void> {
  const session =
    role === "admin"
      ? await adminSession()
      : await passwordSession(
          role === "userA" ? accounts.userA() : role === "userB" ? accounts.userB() : accounts.member(Number(role.slice(-1)) as 1 | 2 | 3),
        );
  await injectSession(context, baseURL, session);
}
