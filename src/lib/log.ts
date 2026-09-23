export type LogLevel = "info" | "warn" | "security";

export type LogCode =
  | "trip_date_outside"
  | "day_field_missing"
  | "booking_status_defaulted"
  | "booking_fetch_failed"
  | "lodging_phone_unverified"
  | "lodging_undecided"
  | "external_link_failed"
  | "offline_cache_served"
  | "offline_cache_miss"
  | "lodging_unavailable"
  | "admin_auth_required"
  | "admin_forbidden"
  | "booking_conflict"
  | "unsaved_changes"
  | "budget_stale"
  | "journal_upload_rejected"
  | "cablecar_suspended"
  | "nav_hidden_by_phase"
  | "auth_login_succeeded"
  | "auth_login_failed"
  | "auth_signup_requested"
  | "auth_signup_failed"
  | "auth_callback_failed"
  | "auth_logout"
  | "auth_session_expired"
  | "auth_next_rejected"
  | "packing_sync_failed"
  | "packing_local_migrated"
  | "owner_access_denied"
  | "supabase_unconfigured";

export function logEvent(code: LogCode, level: LogLevel, meta: Record<string, unknown> = {}): void {
  if (process.env.NODE_ENV === "test" || process.env.VITEST) return;
  const entry = JSON.stringify({ ts: new Date().toISOString(), code, level, ...meta });
  if (level === "info") console.info(entry);
  else console.warn(entry);
  if (level !== "security" || typeof window !== "undefined") return;
  void import("@/lib/notify")
    .then(({ notifySecurity }) => notifySecurity(code, meta))
    .catch((e: unknown) => console.warn(JSON.stringify({ code: "security_notify_failed", reason: String(e) })));
}
