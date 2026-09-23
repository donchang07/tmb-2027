import { describe, expect, it } from "vitest";
import { TravelMode } from "@/lib/schema";
import type { LogCode } from "@/lib/log";
import {
  computeTotals,
  getContact,
  getDays,
  getLodgings,
  getMissingFields,
  getTravelDays,
  getTravelLegs,
  getTrekDays,
  getTrip,
  validateSeed,
} from "@/lib/itinerary";

describe("seed validation (FR-001, FR-002, FR-005, FR-008, FR-017 / SC-002, SC-008, SC-013)", () => {
  it("passes zod + referential validation", () => {
    expect(validateSeed()).toEqual({ ok: true });
  });

  it("has 15 days sorted ascending without duplicates (FR-001)", () => {
    const days = getDays();
    expect(days).toHaveLength(15);
    const dates = days.map((d) => d.date);
    expect(dates[0]).toBe("2027-08-03");
    expect(dates[14]).toBe("2027-08-17");
    expect(new Set(dates).size).toBe(15);
    for (let i = 1; i < dates.length; i++) expect(dates[i]! > dates[i - 1]!).toBe(true);
    days.forEach((d, i) => expect(d.sequence).toBe(i + 1));
  });

  it("has 12 trek days and 3 travel days (SC-008)", () => {
    expect(getTrekDays()).toHaveLength(12);
    expect(getTravelDays()).toHaveLength(3);
    const nums = getTrekDays().map((d) => d.trekDayNumber);
    expect(nums).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it("totals equal 163.0 km / +9,750 m / -9,725 m and match trip seed (FR-008, SC-008)", () => {
    const totals = computeTotals(getDays());
    const trip = getTrip();
    expect(totals.distanceKm).toBe(163);
    expect(totals.gainM).toBe(9750);
    expect(totals.lossM).toBe(9725);
    expect(totals.distanceKm).toBe(trip.distanceKm);
    expect(totals.gainM).toBe(trip.gainM);
    expect(totals.lossM).toBe(trip.lossM);
  });

  it("trip seed carries the Europe/Paris timezone (A-1)", () => {
    expect(getTrip().timezone).toBe("Europe/Paris");
  });

  it("Day 9 and Day 10 match the 2026-09-16 re-survey (FR-002, SC-008)", () => {
    const byNumber = (n: number) => getTrekDays().find((d) => d.trekDayNumber === n);
    const day9 = byNumber(9);
    expect(day9).toMatchObject({ distanceKm: 16, gainM: 850, lossM: 1015, duration: "6 h", sourceCheckedAt: "2026-09-16" });
    const day10 = byNumber(10);
    expect(day10).toMatchObject({ distanceKm: 13.5, gainM: 1100, lossM: 975, duration: "6 h", sourceCheckedAt: "2026-09-16" });
    const names = day10!.routePoints.map((p) => p.nameOriginal);
    expect(names).toContain("Col des Posettes");
    expect(names.indexOf("Col des Posettes")).toBe(names.indexOf("Col de Balme") + 1);
    expect(names.indexOf("Aiguillette des Posettes")).toBe(names.indexOf("Col des Posettes") + 1);
    const posettes = day10!.routePoints.find((p) => p.nameOriginal === "Col des Posettes");
    expect(posettes).toMatchObject({ nameKo: "콜 데 포제트", altitudeM: 1997 });
  });

  it("all 12 trek days share the 112 emergency contact default (A-1, SC-010)", () => {
    for (const day of getTrekDays()) {
      expect(day.emergency?.startsWith("112 · 숙박 연락처"), day.id).toBe(true);
    }
  });

  it("both flight legs are needs_check with the brief-based note (FR-005, 부록 B)", () => {
    const flights = [...getTravelLegs("d2027-08-03"), ...getTravelLegs("d2027-08-17")].filter((l) => l.mode === "flight");
    expect(flights.map((l) => l.id)).toEqual(["leg-0803-1", "leg-0817-2"]);
    for (const leg of flights) {
      expect(leg.verificationStatus, leg.id).toBe("needs_check");
      expect(leg.notes ?? "").toContain("브리프 기준, 확인 필요");
    }
  });

  it("every trek day has the 8 required fields or explicit needs-check contact (FR-002, SC-002)", () => {
    const lodgings = getLodgings();
    for (const day of getTrekDays()) {
      const lodging = lodgings.find((l) => l.id === day.lodgingId);
      expect(lodging, `lodging for ${day.id}`).toBeDefined();
      expect(getMissingFields(day, lodging)).toEqual([]);
      if (lodging?.kind !== "undecided") expect(getContact(lodging).kind).not.toBe("none");
      expect(day.fallback?.length).toBeGreaterThan(0);
      expect(day.emergency).toContain("112");
    }
  });

  it("every day and lodging has Korean + original names (FR-017, SC-013)", () => {
    for (const d of getDays()) {
      expect(d.nameKo.length).toBeGreaterThan(0);
      expect(d.nameOriginal.length).toBeGreaterThan(0);
      expect(d.nameKo).not.toBe(d.nameOriginal);
    }
    for (const l of getLodgings()) {
      expect(l.nameOriginal.length).toBeGreaterThan(0);
    }
  });

  it("has 14 lodgings mapped 1:1 to the 12 trek days and 2 hotel travel days (N-007)", () => {
    const lodgings = getLodgings();
    expect(lodgings).toHaveLength(14);
    const trekIds = new Set(getTrekDays().map((d) => d.id));
    const hotelDayIds = new Set(["d2027-08-03", "d2027-08-16"]);
    for (const l of lodgings) expect(trekIds.has(l.dayId) || hotelDayIds.has(l.dayId), l.id).toBe(true);
    expect(new Set(lodgings.map((l) => l.dayId)).size).toBe(14);
    expect(lodgings.filter((l) => hotelDayIds.has(l.dayId)).map((l) => l.id)).toEqual(["geneva-hotel", "chamonix-hotel-2"]);
  });

  it("travel days each have >= 1 leg with duration and fallback (FR-005)", () => {
    for (const d of getTravelDays()) {
      const legs = getTravelLegs(d.id);
      expect(legs.length, d.id).toBeGreaterThanOrEqual(1);
      for (const leg of legs) {
        expect(leg.duration.length).toBeGreaterThan(0);
        expect(leg.fallback.length).toBeGreaterThan(0);
      }
      legs.forEach((leg, i) => expect(leg.sequence).toBe(i + 1));
    }
    expect(getTravelLegs("d2027-08-04").length).toBeGreaterThanOrEqual(2);
  });

  it("8/16 is the Aiguille du Midi cable-car round trip plus the second Chamonix night (SC-015, D-006, D-007)", () => {
    const legs = getTravelLegs("d2027-08-16");
    expect(legs).toHaveLength(2);
    expect(legs[0]?.mode).toBe("cablecar");
    expect(legs[0]?.departAt).toBe("07:00");
    expect(legs[0]?.arriveAt).toBe("10:00");
    expect(legs[0]?.bookingUrl).toContain("montblancnaturalresort.com");
    expect(legs[0]?.fallback).toContain("오후 슬롯");
    expect(legs[0]?.fallback).toContain("Montenvers");
    expect(legs[0]?.fallback).not.toContain("09:30 버스");
    expect(legs[0]?.verificationStatus).toBe("needs_check");
    expect(legs[1]?.mode).toBe("stay");
    expect(legs[1]?.destinationKo).toContain("2박째");
    const suspended: LogCode = "cablecar_suspended";
    expect(suspended).toBe("cablecar_suspended");
    const day = getDays().find((d) => d.id === "d2027-08-16");
    expect(day?.nameKo).toContain("에귀 뒤 미디");
    expect(day?.lodgingId).toBe("chamonix-hotel-2");
    expect(TravelMode.options).toContain("cablecar");
  });

  it("8/17 goes Chamonix → Geneva airport → Zurich airport → flight, leaving before 08:00 (SC-015, D-007, I-012)", () => {
    const legs = getTravelLegs("d2027-08-17");
    expect(legs).toHaveLength(3);
    expect(legs[0]?.mode).toBe("bus");
    expect(legs[0]?.departAt).toBe("08:00");
    expect(legs[0]?.destinationOriginal).toContain("Genève Aéroport");
    expect(legs[0]?.fallback).toContain("공유셔틀");
    expect(legs[1]?.mode).toBe("train");
    expect(legs[1]?.originOriginal).toBe("Genève-Aéroport");
    expect(legs[1]?.destinationOriginal).toBe("Zürich Flughafen");
    expect(legs[1]?.departAt).toBe("10:02");
    expect(legs[1]?.arriveAt).toBe("13:05");
    expect(legs[2]?.mode).toBe("flight");
    expect(legs[2]?.departAt).toBe("18:40");
    const day = getDays().find((d) => d.id === "d2027-08-17");
    expect(day?.nameKo).toContain("취리히 공항");
    expect(day?.lodgingId).toBeUndefined();
    expect(day?.verificationStatus).not.toBe("confirmed");
  });

  it("every trek day has >= 3 route points including start and end (FR-012 prep)", () => {
    for (const d of getTrekDays()) expect(d.routePoints.length, d.id).toBeGreaterThanOrEqual(3);
  });

  it("Day 2~11 carry a concrete weather/fatigue fallback re-checked on 2026-09-16 (FR-014, SC-010)", () => {
    const days = getTrekDays().filter((d) => d.trekDayNumber !== undefined && d.trekDayNumber >= 2 && d.trekDayNumber <= 11);
    expect(days).toHaveLength(10);
    for (const day of days) {
      expect(day.fallback, day.id).toBeDefined();
      expect(day.fallback!.length, day.id).toBeGreaterThanOrEqual(20);
      expect(day.fallback!.includes("확인 필요"), day.id).toBe(false);
      expect(/우천|악천후|강풍|피로/.test(day.fallback!), day.id).toBe(true);
      expect(day.sourceCheckedAt, day.id).toBe("2026-09-16");
    }
  });
});
