import { z } from "zod";
import { BOOKING_STATUSES, type BookingStatus } from "@/lib/booking-status";
import { lodgings } from "@/data/seed/lodgings";
import { LodgingKind, type Lodging } from "@/lib/schema";
import { getLodgingsAsync, type LodgingRow } from "@/lib/lodgings";
import { logEvent } from "@/lib/log";
import { getAdminEmail } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PublicBooking } from "@/lib/bookings/public";

export type SessionState = "unconfigured" | "anonymous" | "forbidden" | "admin";
export type AdminSession = { state: SessionState; email: string | null };

export function canEdit(sessionEmail: string | null | undefined, adminEmail: string | null | undefined): boolean {
  const a = sessionEmail?.trim().toLowerCase();
  const b = adminEmail?.trim().toLowerCase();
  return !!a && !!b && a === b;
}

export async function getAdminSession(): Promise<AdminSession> {
  const supabase = await createSupabaseServerClient();
  const adminEmail = getAdminEmail();
  if (!supabase || !adminEmail) return { state: "unconfigured", email: null };
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email?.toLowerCase() ?? null;
  if (!email) {
    logEvent("admin_auth_required", "info");
    return { state: "anonymous", email: null };
  }
  if (!canEdit(email, adminEmail)) {
    logEvent("admin_forbidden", "security", { user: email.split("@")[0] });
    return { state: "forbidden", email };
  }
  return { state: "admin", email };
}

const LODGING_IDS = lodgings.map((l) => l.id) as [string, ...string[]];

const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((v) => (v === "" ? null : v));

export const BookingInputSchema = z
  .object({
    lodgingId: z.enum(LODGING_IDS),
    status: z.enum(BOOKING_STATUSES),
    confirmationRef: nullableText(100),
    privateMemo: nullableText(1000),
    alternativeLodging: nullableText(200),
    alternativeLodgingId: z
      .union([z.enum(LODGING_IDS), z.literal(""), z.null()])
      .default(null)
      .transform((v) => (v === "" ? null : v)),
    version: z.coerce.number().int().min(1),
  })
  .superRefine((v, ctx) => {
    if (v.alternativeLodgingId && v.alternativeLodgingId === v.lodgingId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["alternativeLodgingId"], message: "대안 숙소는 자기 자신일 수 없습니다." });
    }
  });
export type BookingInput = z.infer<typeof BookingInputSchema>;

export type BookingRow = {
  lodging_id: string;
  status: BookingStatus;
  confirmation_ref: string | null;
  private_memo: string | null;
  alternative_lodging: string | null;
  alternative_lodging_id: string | null;
  updated_at: string;
  updated_by: string | null;
  version: number;
};

export function toPublicBooking(row: BookingRow): PublicBooking {
  return {
    lodgingId: row.lodging_id,
    status: row.status,
    alternativeLodging: row.alternative_lodging,
    alternativeLodgingId: row.alternative_lodging_id ?? null,
    updatedAt: row.updated_at,
  };
}

export function statusForSession(state: SessionState): 200 | 401 | 403 | 503 {
  switch (state) {
    case "admin":
      return 200;
    case "anonymous":
      return 401;
    case "forbidden":
      return 403;
    case "unconfigured":
      return 503;
  }
}

export type ListResult = { ok: true; rows: BookingRow[] } | { ok: false; state: SessionState | "error"; message?: string };

export async function listAdminBookings(): Promise<ListResult> {
  const session = await getAdminSession();
  if (session.state !== "admin") return { ok: false, state: session.state };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, state: "unconfigured" };
  const { data, error } = await supabase.from("bookings").select("*").order("lodging_id");
  if (error) {
    logEvent("booking_status_defaulted", "warn", { reason: error.message, scope: "admin_list" });
    return { ok: false, state: "error", message: error.message };
  }
  return { ok: true, rows: (data ?? []) as BookingRow[] };
}

export async function isLeaderRegistered(email: string): Promise<boolean | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("team_members").select("email").eq("email", email.toLowerCase()).eq("role", "leader").eq("enabled", true).maybeSingle();
  if (error) return null;
  return data !== null;
}

export async function getAdminBooking(lodgingId: string): Promise<BookingRow | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.from("bookings").select("*").eq("lodging_id", lodgingId).maybeSingle();
  return (data as BookingRow | null) ?? null;
}

export type SaveResult =
  | { ok: true; row: BookingRow }
  | { ok: false; reason: "unconfigured" | "unauthorized" | "forbidden" | "invalid" | "conflict" | "error"; message: string; row?: BookingRow | null };

export async function saveBooking(input: unknown): Promise<SaveResult> {
  const session = await getAdminSession();
  if (session.state === "unconfigured") return { ok: false, reason: "unconfigured", message: "편집 비활성 — Supabase·ADMIN_EMAIL 설정이 필요합니다." };
  if (session.state === "anonymous") return { ok: false, reason: "unauthorized", message: "리더 로그인이 필요합니다." };
  if (session.state === "forbidden") return { ok: false, reason: "forbidden", message: "이 정보에 접근할 수 없습니다." };

  const parsed = BookingInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid", message: "입력값을 확인해 주세요." };
  const v = parsed.data;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, reason: "unconfigured", message: "편집 비활성 — Supabase 설정이 필요합니다." };

  const { data, error } = await supabase
    .from("bookings")
    .update({
      status: v.status,
      confirmation_ref: v.confirmationRef,
      private_memo: v.privateMemo,
      alternative_lodging: v.alternativeLodging,
      alternative_lodging_id: v.alternativeLodgingId,
    })
    .eq("lodging_id", v.lodgingId)
    .eq("version", v.version)
    .select("*")
    .maybeSingle();

  if (error) return { ok: false, reason: "error", message: `저장 실패: ${error.message}` };
  if (!data) {
    const latest = await getAdminBooking(v.lodgingId);
    if (!latest) {
      return {
        ok: false,
        reason: "forbidden",
        message: "이 예약을 편집할 권한이 없습니다. team_members에 리더 이메일이 등록됐는지 확인하세요.",
      };
    }
    if (latest.version !== v.version) {
      logEvent("booking_conflict", "warn", { lodgingId: v.lodgingId, expected: v.version, actual: latest.version });
      return { ok: false, reason: "conflict", message: "다른 변경이 먼저 저장되었습니다. 최신 값을 불러왔습니다.", row: latest };
    }
    return { ok: false, reason: "error", message: "저장에 실패했습니다. 다시 시도해 주세요.", row: latest };
  }
  return { ok: true, row: data as BookingRow };
}

const isoDateText = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "날짜는 YYYY-MM-DD 형식이어야 합니다.");
const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);
const nullableUrl = z.preprocess(emptyToNull, z.string().url("올바른 URL이 아닙니다.").max(500).nullable()).default(null);
const nullableIsoDate = z.preprocess(emptyToNull, isoDateText.nullable()).default(null);
const nullableAmount = z.preprocess(emptyToNull, z.coerce.number().nonnegative("가격은 0 이상이어야 합니다.").nullable()).default(null);

export const LodgingInputSchema = z
  .object({
    id: z.enum(LODGING_IDS),
    kind: LodgingKind,
    address: nullableText(200).default(null),
    bookingUrl: nullableUrl,
    contactUrl: nullableUrl,
    verifiedPhone: nullableText(30).default(null),
    phoneVerifiedAt: nullableIsoDate,
    roomType: nullableText(100).default(null),
    priceLow: nullableAmount,
    priceHigh: nullableAmount,
    currency: z.enum(["EUR", "CHF"]),
    season: z.string().trim().max(300).default(""),
    capacityNote: nullableText(300).default(null),
    checkedAt: isoDateText,
    recheckAt: nullableIsoDate,
    alternative: nullableText(300).default(null),
    notes: nullableText(1000).default(null),
    version: z.coerce.number().int().min(1),
  })
  .superRefine((v, ctx) => {
    if (v.priceLow !== null && v.priceHigh !== null && v.priceLow > v.priceHigh) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["priceHigh"], message: "최저가는 최고가보다 클 수 없습니다." });
    }
  });
export type LodgingInput = z.infer<typeof LodgingInputSchema>;

export type LodgingValidation = { ok: true; value: LodgingInput } | { ok: false; message: string };

export function validateLodgingInput(input: unknown): LodgingValidation {
  const parsed = LodgingInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  return { ok: true, value: parsed.data };
}

export type SaveLodgingResult =
  | { ok: true; row: LodgingRow }
  | { ok: false; reason: "unconfigured" | "unauthorized" | "forbidden" | "invalid" | "conflict" | "error"; message: string };

export async function saveLodging(input: unknown): Promise<SaveLodgingResult> {
  const session = await getAdminSession();
  if (session.state === "unconfigured") return { ok: false, reason: "unconfigured", message: "편집 비활성 — Supabase·ADMIN_EMAIL 설정이 필요합니다." };
  if (session.state === "anonymous") return { ok: false, reason: "unauthorized", message: "리더 로그인이 필요합니다." };
  if (session.state === "forbidden") return { ok: false, reason: "forbidden", message: "이 정보에 접근할 수 없습니다." };

  const validated = validateLodgingInput(input);
  if (!validated.ok) return { ok: false, reason: "invalid", message: validated.message };
  const v = validated.value;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, reason: "unconfigured", message: "편집 비활성 — Supabase 설정이 필요합니다." };

  const { data, error } = await supabase
    .from("lodgings")
    .update({
      kind: v.kind,
      address: v.address,
      booking_url: v.bookingUrl,
      contact_url: v.contactUrl,
      verified_phone: v.verifiedPhone,
      phone_verified_at: v.phoneVerifiedAt,
      phone_verified_by: v.phoneVerifiedAt ? "leader" : null,
      room_type: v.roomType,
      price_low: v.priceLow,
      price_high: v.priceHigh,
      currency: v.currency,
      season: v.season,
      capacity_note: v.capacityNote,
      checked_at: v.checkedAt,
      recheck_at: v.recheckAt,
      alternative: v.alternative,
      notes: v.notes,
    })
    .eq("id", v.id)
    .eq("version", v.version)
    .select("*")
    .maybeSingle();

  if (error) return { ok: false, reason: "error", message: `저장 실패: ${error.message}` };
  if (!data) {
    logEvent("booking_conflict", "warn", { lodgingId: v.id, expected: v.version, scope: "lodging" });
    return { ok: false, reason: "conflict", message: "다른 변경이 먼저 저장되었거나 편집 권한이 없습니다. 새로고침 후 다시 시도하세요." };
  }
  return { ok: true, row: data as LodgingRow };
}

export type AdminRow = { lodging: Lodging; booking: BookingRow | null };
export type AdminRowsResult = { ok: boolean; rows: AdminRow[]; state?: SessionState | "error"; message?: string };

export async function listAdminRows(): Promise<AdminRowsResult> {
  const lodgingList = await getLodgingsAsync();
  const result = await listAdminBookings();
  const bookings = result.ok ? result.rows : [];
  const rows = lodgingList.map((lodging) => ({
    lodging,
    booking: bookings.find((b) => b.lodging_id === lodging.id) ?? null,
  }));
  if (!result.ok) return { ok: false, rows, state: result.state, message: result.message };
  return { ok: true, rows };
}
