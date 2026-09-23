import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BookingInputSchema, canEdit, statusForSession, toPublicBooking, validateLodgingInput, type BookingRow } from "@/lib/bookings/admin";
import { lodgings } from "@/data/seed/lodgings";
import { safeNext } from "@/lib/safe-next";

const row: BookingRow = {
  lodging_id: "mottets",
  status: "confirmed",
  confirmation_ref: "ABC-123",
  private_memo: "secret",
  alternative_lodging: null,
  alternative_lodging_id: null,
  updated_at: "2026-09-16T10:00:00.000Z",
  updated_by: "uuid",
  version: 3,
};

describe("booking admin logic (FR-010, SC-004, SC-007)", () => {
  it("canEdit requires a non-empty case-insensitive match", () => {
    expect(canEdit("Leader@Example.com", "leader@example.com")).toBe(true);
    expect(canEdit("a@example.com", "b@example.com")).toBe(false);
    expect(canEdit(null, "leader@example.com")).toBe(false);
    expect(canEdit("leader@example.com", null)).toBe(false);
    expect(canEdit("", "")).toBe(false);
  });

  it("BookingInputSchema accepts valid input and rejects invalid", () => {
    const ok = BookingInputSchema.safeParse({
      lodgingId: "mottets",
      status: "confirmed",
      confirmationRef: "  ABC ",
      privateMemo: "",
      alternativeLodging: null,
      version: "3",
    });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.confirmationRef).toBe("ABC");
      expect(ok.data.privateMemo).toBeNull();
      expect(ok.data.version).toBe(3);
    }
    expect(BookingInputSchema.safeParse({ lodgingId: "mottets", status: "booked", confirmationRef: null, privateMemo: null, alternativeLodging: null, version: 1 }).success).toBe(false);
    expect(BookingInputSchema.safeParse({ lodgingId: "nope", status: "confirmed", confirmationRef: null, privateMemo: null, alternativeLodging: null, version: 1 }).success).toBe(false);
    expect(BookingInputSchema.safeParse({ lodgingId: "mottets", status: "confirmed", confirmationRef: "x".repeat(101), privateMemo: null, alternativeLodging: null, version: 1 }).success).toBe(false);
    expect(BookingInputSchema.safeParse({ lodgingId: "mottets", status: "confirmed", confirmationRef: null, privateMemo: null, alternativeLodging: null, version: 0 }).success).toBe(false);
  });

  it("BookingInputSchema accepts a referenced alternative lodging but rejects itself", () => {
    const base = { lodgingId: "mottets", status: "alternative", confirmationRef: null, privateMemo: null, alternativeLodging: null, version: 1 };
    const ok = BookingInputSchema.safeParse({ ...base, alternativeLodgingId: "la-balme" });
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data.alternativeLodgingId).toBe("la-balme");
    const empty = BookingInputSchema.safeParse({ ...base, alternativeLodgingId: "" });
    expect(empty.success).toBe(true);
    if (empty.success) expect(empty.data.alternativeLodgingId).toBeNull();
    expect(BookingInputSchema.safeParse({ ...base, alternativeLodgingId: "mottets" }).success).toBe(false);
    expect(BookingInputSchema.safeParse({ ...base, alternativeLodgingId: "nope" }).success).toBe(false);
  });

  it("validateLodgingInput enforces phone length, URL, price order, ISO recheck date and kind (FR-010, 8.7)", () => {
    const base = {
      id: "geneva-hotel",
      kind: "undecided",
      address: "",
      bookingUrl: "",
      contactUrl: "",
      verifiedPhone: "",
      phoneVerifiedAt: "",
      roomType: "",
      priceLow: "150",
      priceHigh: "180",
      currency: "EUR",
      season: "3성 실당 €150~180 추정",
      capacityNote: "",
      checkedAt: "2026-09-16",
      recheckAt: "",
      alternative: "",
      notes: "",
      version: "1",
    };
    const ok = validateLodgingInput(base);
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.value.priceLow).toBe(150);
      expect(ok.value.bookingUrl).toBeNull();
      expect(ok.value.recheckAt).toBeNull();
    }
    expect(validateLodgingInput({ ...base, verifiedPhone: "0".repeat(31) }).ok).toBe(false);
    expect(validateLodgingInput({ ...base, bookingUrl: "not-a-url" }).ok).toBe(false);
    expect(validateLodgingInput({ ...base, priceLow: "300", priceHigh: "100" }).ok).toBe(false);
    expect(validateLodgingInput({ ...base, priceLow: "-1" }).ok).toBe(false);
    expect(validateLodgingInput({ ...base, recheckAt: "2026/12/01" }).ok).toBe(false);
    expect(validateLodgingInput({ ...base, kind: "cabin" }).ok).toBe(false);
    expect(validateLodgingInput({ ...base, id: "nope" }).ok).toBe(false);
    expect(validateLodgingInput({ ...base, version: "0" }).ok).toBe(false);
  });

  it("toPublicBooking strips private fields", () => {
    const pub = toPublicBooking(row);
    expect(Object.keys(pub).sort()).toEqual(["alternativeLodging", "alternativeLodgingId", "lodgingId", "status", "updatedAt"]);
    expect(JSON.stringify(pub)).not.toContain("ABC-123");
    expect(JSON.stringify(pub)).not.toContain("secret");
  });

  it("safeNext blocks protocol-relative and backslash redirects", () => {
    expect(safeNext("/admin/bookings")).toBe("/admin/bookings");
    expect(safeNext("//evil.com")).toBe("/admin");
    expect(safeNext("/\\evil.com")).toBe("/admin");
    expect(safeNext("https://evil.com")).toBe("/admin");
    expect(safeNext(undefined, "/x")).toBe("/x");
  });

  it("statusForSession maps to 401/403/503/200", () => {
    expect(statusForSession("anonymous")).toBe(401);
    expect(statusForSession("forbidden")).toBe(403);
    expect(statusForSession("unconfigured")).toBe(503);
    expect(statusForSession("admin")).toBe(200);
  });
});

describe("bookings migration (I-004 RLS)", () => {
  const sql = readFileSync(path.resolve(__dirname, "../../supabase/migrations/20260916000001_bookings.sql"), "utf8");

  it("enables RLS on bookings and team_members and defines is_admin", () => {
    expect(sql.match(/enable row level security/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(sql).toContain("create or replace function public.is_admin()");
    expect(sql).toContain("revoke all on public.bookings from anon");
  });

  it("exposes only status fields through bookings_public", () => {
    const view = sql.match(/create view public\.bookings_public as\s+select ([^;]+) from public\.bookings;/i);
    expect(view).not.toBeNull();
    const cols = view![1]!.split(",").map((c) => c.trim());
    expect(cols).toEqual(["lodging_id", "status", "alternative_lodging", "updated_at"]);
    expect(cols).not.toContain("confirmation_ref");
    expect(cols).not.toContain("private_memo");
    expect(sql).toContain("security_invoker = off");
    expect(sql).not.toMatch(/alter table [^\n]*force row level security/i);
    expect(sql).toContain("grant select on public.bookings_public to anon, authenticated");
  });

  it("seeds the 12 trek lodging ids", () => {
    const trekLodgings = lodgings.filter((l) => l.id !== "geneva-hotel" && l.id !== "chamonix-hotel-2");
    expect(trekLodgings).toHaveLength(12);
    for (const l of trekLodgings) expect(sql).toContain(`('${l.id}')`);
  });
});

describe("lodgings migration (FR-010, I-006, SC-004)", () => {
  const sql = readFileSync(path.resolve(__dirname, "../../supabase/migrations/20260917000003_lodgings.sql"), "utf8");

  it("creates the lodgings table with RLS, public select and leader write", () => {
    expect(sql).toContain("create type public.lodging_kind as enum");
    expect(sql).toContain("create table public.lodgings");
    expect(sql).toContain("alter table public.lodgings enable row level security");
    expect(sql).toMatch(/create policy "lodgings public select" on public\.lodgings\s+for select to anon, authenticated using \(true\)/);
    expect(sql).toMatch(/create policy "lodgings admin write" on public\.lodgings\s+for all to authenticated using \(public\.is_admin\(\)\)/);
    expect(sql).toContain("candidates jsonb not null default '[]'::jsonb");
    expect(sql).toContain("revoke all on public.lodgings from anon, authenticated");
    expect(sql).toMatch(/grant select \(id, day_id[^)]*\) on public\.lodgings to anon/);
    expect(sql).not.toMatch(/grant select \([^)]*phone_verified_by[^)]*\) on public\.lodgings to anon/);
    expect(sql).toContain("grant insert, update on public.lodgings to authenticated");
    expect(sql).toContain("recheck_at date");
    expect(sql).toContain("phone_verified_at date");
  });

  it("imports all 14 lodgings (I-006)", () => {
    expect(sql).toContain("insert into public.lodgings");
    for (const l of lodgings) expect(sql, l.id).toContain(`('${l.id}', '${l.dayId}'`);
    expect(lodgings).toHaveLength(14);
  });

  it("adds alternative_lodging_id and the two travel-day booking rows", () => {
    expect(sql).toContain("alter table public.bookings add column alternative_lodging_id text references public.lodgings (id)");
    expect(sql).toContain("insert into public.bookings (lodging_id) values ('geneva-hotel'), ('chamonix-hotel-2')");
  });

  it("replaces the public view with a realtime-capable mirror table (SC-004)", () => {
    expect(sql).toContain("drop view if exists public.bookings_public");
    expect(sql).toContain("create table public.bookings_public");
    expect(sql).toContain("alter table public.bookings_public enable row level security");
    expect(sql).toMatch(/create policy "bookings_public read" on public\.bookings_public/);
    expect(sql).toContain("revoke insert, update, delete on public.bookings_public from anon, authenticated");
    expect(sql).toContain("create or replace function public.bookings_mirror()");
    expect(sql).toContain("create trigger bookings_mirror");
    expect(sql).toContain("alter publication supabase_realtime add table public.bookings_public");
  });

  it("keeps private booking columns out of the public mirror", () => {
    const table = sql.match(/create table public\.bookings_public \(([^;]+)\);/);
    expect(table).not.toBeNull();
    expect(table![1]).not.toContain("confirmation_ref");
    expect(table![1]).not.toContain("private_memo");
  });
});
