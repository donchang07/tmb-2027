import { describe, expect, it } from "vitest";
import { computeTotals, getContact, getLodgings, getMissingFields } from "@/lib/itinerary";
import { LodgingKind } from "@/lib/schema";
import type { Day, Lodging } from "@/lib/schema";

const baseDay: Day = {
  id: "d2027-08-04",
  sequence: 2,
  date: "2027-08-04",
  type: "trek",
  trekDayNumber: 1,
  nameKo: "테스트",
  nameOriginal: "Test",
  country: ["FR"],
  distanceKm: 10.25,
  gainM: 100,
  lossM: 50,
  duration: "3 h",
  lunch: "점심",
  lodgingId: "x",
  mapUrl: "https://www.google.com/maps/dir/?api=1&origin=A&destination=B&travelmode=walking",
  fallback: "대안",
  emergency: "112",
  routePoints: [],
  sourceCheckedAt: "2026-09-09",
  verificationStatus: "estimated",
};

const lodging: Lodging = {
  id: "x",
  nameOriginal: "X",
  kind: "refuge",
  location: "loc",
  country: "FR",
  dayId: "d2027-08-04",
  bookingChannel: "own",
  address: null,
  lat: null,
  lng: null,
  bookingUrl: null,
  contactUrl: null,
  verifiedPhone: null,
  phoneVerifiedAt: null,
  phoneVerifiedBy: null,
  roomType: null,
  priceLow: null,
  priceHigh: null,
  currency: "EUR",
  season: "",
  capacityNote: null,
  checkedAt: "2026-09-09",
  recheckAt: null,
  alternative: null,
  candidates: [],
  version: 1,
};

describe("itinerary helpers", () => {
  it("getMissingFields reports missing keys including contact", () => {
    expect(getMissingFields(baseDay, lodging)).toEqual(["contact"]);
    const { lunch: _lunch, ...noLunch } = baseDay;
    expect(getMissingFields({ ...noLunch, routePoints: [] } as Day, { ...lodging, bookingUrl: "https://x.example" })).toEqual(["lunch"]);
    expect(getMissingFields({ ...baseDay, type: "travel" }, undefined)).toEqual([]);
  });

  it("getMissingFields does not count contact for an undecided lodging (FR-004, Edge 숙소 미정)", () => {
    expect(getMissingFields(baseDay, { ...lodging, kind: "undecided" })).toEqual([]);
    expect(getContact({ ...lodging, kind: "undecided" })).toEqual({ kind: "none", value: null });
  });

  it("seed lodgings carry a kind and chamonix-hotel is undecided (PRD A-2)", () => {
    const all = getLodgings();
    expect(all).toHaveLength(14);
    for (const l of all) expect(LodgingKind.options).toContain(l.kind);
    const chamonix = all.find((l) => l.id === "chamonix-hotel");
    expect(chamonix?.kind).toBe("undecided");
    expect(chamonix?.nameOriginal).toBe("샤모니의 호텔(미정)");
    expect(chamonix?.bookingUrl).toBeNull();
    expect(chamonix?.contactUrl).toBeNull();
    expect(all.filter((l) => l.kind === "refuge")).toHaveLength(7);
    expect(all.filter((l) => l.kind === "village")).toHaveLength(4);
    expect(all.filter((l) => l.kind === "undecided").map((l) => l.id)).toEqual(["geneva-hotel", "chamonix-hotel", "chamonix-hotel-2"]);
  });

  it("getContact prefers verified phone, then contactUrl, then bookingUrl", () => {
    expect(getContact({ ...lodging, verifiedPhone: "+33 1", contactUrl: "https://c.example" })).toEqual({ kind: "phone", value: "+33 1" });
    expect(getContact({ ...lodging, contactUrl: "https://c.example", bookingUrl: "https://b.example" })).toEqual({ kind: "url", value: "https://c.example" });
    expect(getContact({ ...lodging, bookingUrl: "https://b.example" })).toEqual({ kind: "url", value: "https://b.example" });
    expect(getContact(lodging)).toEqual({ kind: "none", value: null });
    expect(getContact(undefined)).toEqual({ kind: "none", value: null });
  });

  it("computeTotals rounds distance to 0.1 km and ignores travel days", () => {
    const travel: Day = { ...baseDay, id: "d2027-08-03", type: "travel", distanceKm: 999, gainM: 999, lossM: 999 };
    const totals = computeTotals([baseDay, { ...baseDay, id: "d2027-08-05", distanceKm: 5.13 }, travel]);
    expect(totals).toEqual({ distanceKm: 15.4, gainM: 200, lossM: 100 });
  });
});
