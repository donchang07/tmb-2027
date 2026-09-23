import { describe, expect, it, vi } from "vitest";
import { notifySecurity } from "@/lib/notify";

const okResponse = { ok: true, status: 200 } as Response;

describe("notifySecurity (NFR 로그, I-007)", () => {
  it("does not call fetch when RESEND_API_KEY or ADMIN_EMAIL is missing", async () => {
    const fetchSpy = vi.fn();
    expect(await notifySecurity("admin_forbidden", {}, { fetch: fetchSpy, env: {} })).toEqual({ sent: false, reason: "not_configured" });
    expect(await notifySecurity("admin_forbidden", {}, { fetch: fetchSpy, env: { RESEND_API_KEY: "re_x" } })).toEqual({ sent: false, reason: "not_configured" });
    expect(await notifySecurity("admin_forbidden", {}, { fetch: fetchSpy, env: { ADMIN_EMAIL: "leader@example.com" } })).toEqual({
      sent: false,
      reason: "not_configured",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts once to Resend with a Bearer header when configured", async () => {
    const fetchSpy = vi.fn(async () => okResponse);
    const result = await notifySecurity(
      "admin_forbidden",
      { user: "someone" },
      { fetch: fetchSpy as unknown as typeof globalThis.fetch, env: { RESEND_API_KEY: "re_x", ADMIN_EMAIL: "leader@example.com" } },
    );
    expect(result).toEqual({ sent: true });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_x");
    const body = JSON.parse(String(init.body)) as { to: string; from: string; subject: string; text: string };
    expect(body.to).toBe("leader@example.com");
    expect(body.from).toBe("tmb2027@resend.dev");
    expect(body.subject).toBe("[TMB 2027] security: admin_forbidden");
    expect(body.text).toContain("someone");
  });

  it("reports a failed request instead of throwing", async () => {
    const fetchSpy = vi.fn(async () => ({ ok: false, status: 422 }) as Response);
    const result = await notifySecurity(
      "admin_forbidden",
      {},
      { fetch: fetchSpy as unknown as typeof globalThis.fetch, env: { RESEND_API_KEY: "re_x", ADMIN_EMAIL: "leader@example.com", SECURITY_MAIL_FROM: "alerts@tmb.example" } },
    );
    expect(result).toEqual({ sent: false, reason: "request_failed" });
    const [, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body)).from).toBe("alerts@tmb.example");
  });
});
