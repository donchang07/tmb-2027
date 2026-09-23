import { describe, expect, it } from "vitest";
import { getLodgingsAsync, rowToLodging, type LodgingRow } from "@/lib/lodgings";
import { getLodgings } from "@/lib/itinerary";
import { LodgingKind } from "@/lib/schema";

const row: LodgingRow = {
  id: "geneva-hotel",
  day_id: "d2027-08-03",
  name_original: "제네바 호텔(미정)",
  kind: "undecided",
  location: "Genève Cornavin, 375 m",
  country: "CH",
  booking_channel: "other",
  address: "Place de Cornavin",
  lat: 46.21,
  lng: 6.142,
  booking_url: null,
  contact_url: null,
  verified_phone: "+41 22 000 0000",
  phone_verified_at: "2026-10-01",
  phone_verified_by: "leader@example.com",
  room_type: "트윈 5실",
  price_low: "150",
  price_high: "180",
  currency: "EUR",
  season: "3성 실당 €150~180 추정",
  capacity_note: "10명 = 트윈 5실",
  alternative: null,
  candidates: [{ name: "Hotel Astoria", stars: "3성", note: "역 앞 100 m", url: null }],
  checked_at: "2026-09-16",
  recheck_at: "2026-12-01",
  notes: null,
  version: 4,
};

describe("lodging seed (FR-010, N-007, 부록 C-2)", () => {
  it("carries 14 lodgings with a valid kind", () => {
    const all = getLodgings();
    expect(all).toHaveLength(14);
    for (const l of all) expect(LodgingKind.options).toContain(l.kind);
  });

  it("maps the Geneva hotel to 8/3 and the two Chamonix nights to 8/15 and 8/16 (D-007)", () => {
    const byId = new Map(getLodgings().map((l) => [l.id, l]));
    expect(byId.get("geneva-hotel")?.dayId).toBe("d2027-08-03");
    expect(byId.get("chamonix-hotel")?.dayId).toBe("d2027-08-15");
    expect(byId.get("chamonix-hotel-2")?.dayId).toBe("d2027-08-16");
    expect(byId.has("zurich-hotel")).toBe(false);
    for (const id of ["geneva-hotel", "chamonix-hotel", "chamonix-hotel-2"]) expect(byId.get(id)?.kind).toBe("undecided");
    expect(byId.get("chamonix-hotel-2")?.notes).toContain("2박 연속");
    expect(byId.get("chamonix-hotel-2")?.country).toBe("FR");
  });

  it("lists 4 candidate hotels for Geneva only (C-2, v3.1)", () => {
    const byId = new Map(getLodgings().map((l) => [l.id, l]));
    const geneva = byId.get("geneva-hotel")!;
    expect(geneva.candidates).toHaveLength(4);
    expect(geneva.candidates[0]).toMatchObject({ name: "Hotel Astoria", stars: "3성" });
    expect(byId.get("chamonix-hotel")!.candidates).toEqual([]);
    expect(byId.get("chamonix-hotel-2")!.candidates).toEqual([]);
    for (const c of geneva.candidates) expect(c.note.length).toBeGreaterThan(0);
  });

  it("every trek lodging defaults the new nullable fields", () => {
    const l = getLodgings().find((x) => x.id === "mottets")!;
    expect(l.address).toBeNull();
    expect(l.phoneVerifiedAt).toBeNull();
    expect(l.recheckAt).toBeNull();
    expect(l.candidates).toEqual([]);
    expect(l.version).toBe(1);
  });
});

describe("rowToLodging (DB → Lodging)", () => {
  it("converts snake_case columns and coerces numeric strings", () => {
    const lodging = rowToLodging(row);
    expect(lodging).not.toBeNull();
    expect(lodging).toMatchObject({
      id: "geneva-hotel",
      dayId: "d2027-08-03",
      nameOriginal: "제네바 호텔(미정)",
      kind: "undecided",
      bookingChannel: "other",
      address: "Place de Cornavin",
      priceLow: 150,
      priceHigh: 180,
      phoneVerifiedAt: "2026-10-01",
      phoneVerifiedBy: "leader@example.com",
      roomType: "트윈 5실",
      capacityNote: "10명 = 트윈 5실",
      recheckAt: "2026-12-01",
      version: 4,
    });
    expect(lodging!.candidates[0]!.name).toBe("Hotel Astoria");
    expect(lodging!.notes).toBeUndefined();
  });

  it("returns null for a row that fails the schema", () => {
    expect(rowToLodging({ ...row, kind: "cabin" })).toBeNull();
    expect(rowToLodging({ ...row, checked_at: "2026/09/16" })).toBeNull();
    expect(rowToLodging({ ...row, name_original: "" })).toBeNull();
  });

  it("tolerates missing optional columns", () => {
    const lodging = rowToLodging({ ...row, address: null, lat: null, lng: null, price_low: null, price_high: null, season: null, candidates: null });
    expect(lodging).not.toBeNull();
    expect(lodging!.priceLow).toBeNull();
    expect(lodging!.season).toBe("");
    expect(lodging!.candidates).toEqual([]);
  });
});

describe("getLodgingsAsync fallback (Supabase 미설정)", () => {
  it("returns the 14 seed lodgings when Supabase env is absent", async () => {
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeUndefined();
    const all = await getLodgingsAsync();
    expect(all).toHaveLength(14);
    expect(all.map((l) => l.id)).toContain("chamonix-hotel-2");
  });
});

describe("public lodging columns (NFR 개인정보)", () => {
  it("never selects phone_verified_by or updated_by for anonymous readers", async () => {
    const { PUBLIC_LODGING_COLUMNS } = await import("@/lib/lodgings");
    expect(PUBLIC_LODGING_COLUMNS).not.toContain("phone_verified_by");
    expect(PUBLIC_LODGING_COLUMNS).not.toContain("updated_by");
    expect(PUBLIC_LODGING_COLUMNS).toContain("verified_phone");
  });
  it("saveLodging stores a role label instead of the leader email", () => {
    const src = require("node:fs").readFileSync(require("node:path").resolve(__dirname, "../../src/lib/bookings/admin.ts"), "utf8");
    expect(src).toMatch(/phone_verified_by: v\.phoneVerifiedAt \? "leader" : null/);
    expect(src).not.toMatch(/phone_verified_by:.*session\.email/);
  });
});

describe("Day 12 lodging guidance (PRD v3.0 C-3, D-006)", () => {
  it("recommends a hotel near the Aiguille du Midi station in seed and migration alike", () => {
    const seed = getLodgings().find((l) => l.id === "chamonix-hotel");
    expect(seed?.notes).toContain("승강장) 도보 10분 이내 권장");
    const sql = require("node:fs").readFileSync(require("node:path").resolve(__dirname, "../../supabase/migrations/20260917000003_lodgings.sql"), "utf8");
    expect(sql).toContain(seed!.notes);
  });
});

describe("migration seed matches the v3.1 hotel set", () => {
  it("has no zurich-hotel and inserts chamonix-hotel-2 with the D-007 note", () => {
    const sql = require("node:fs").readFileSync(require("node:path").resolve(__dirname, "../../supabase/migrations/20260917000003_lodgings.sql"), "utf8");
    expect(sql).not.toContain("zurich-hotel");
    expect(sql).toContain("('chamonix-hotel-2', 'd2027-08-16'");
    expect(sql).toContain("insert into public.bookings (lodging_id) values ('geneva-hotel'), ('chamonix-hotel-2')");
    const seed = getLodgings().find((l) => l.id === "chamonix-hotel-2")!;
    expect(sql).toContain(seed.notes!);
  });
});
