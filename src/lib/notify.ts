export type NotifyResult = { sent: boolean; reason?: "not_configured" | "request_failed" };

export type NotifyDeps = {
  fetch: typeof globalThis.fetch;
  env: Record<string, string | undefined>;
};

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export async function notifySecurity(
  code: string,
  meta: Record<string, unknown> = {},
  deps: NotifyDeps = { fetch: globalThis.fetch, env: process.env },
): Promise<NotifyResult> {
  const key = deps.env.RESEND_API_KEY;
  const to = deps.env.ADMIN_EMAIL;
  if (!key || !to) return { sent: false, reason: "not_configured" };

  const res = await deps.fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: deps.env.SECURITY_MAIL_FROM ?? "tmb2027@resend.dev",
      to,
      subject: `[TMB 2027] security: ${code}`,
      text: JSON.stringify(meta),
    }),
  });
  if (!res.ok) return { sent: false, reason: "request_failed" };
  return { sent: true };
}
