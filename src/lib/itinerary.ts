import { z } from "zod";
import { days as rawDays } from "@/data/seed/days";
import { lodgings as rawLodgings } from "@/data/seed/lodgings";
import { travelLegs as rawLegs } from "@/data/seed/travel-legs";
import { trip as rawTrip } from "@/data/seed/trip";
import { DaySchema, LodgingSchema, TravelLegSchema, TripSchema } from "@/lib/schema";
import type { Day, Lodging, TravelLeg, Trip } from "@/lib/schema";
import { logEvent } from "@/lib/log";

export const REQUIRED_DAY_FIELDS = [
  "distanceKm",
  "gainM",
  "lossM",
  "duration",
  "lunch",
  "lodgingId",
  "mapUrl",
  "contact",
] as const;
export type RequiredDayField = (typeof REQUIRED_DAY_FIELDS)[number];

let validated = false;
let seedLodgings: Lodging[] = [];

export function validateSeed(): { ok: true } {
  if (validated) return { ok: true };
  TripSchema.parse(rawTrip);
  z.array(DaySchema).parse(rawDays);
  seedLodgings = z.array(LodgingSchema).parse(rawLodgings);
  z.array(TravelLegSchema).parse(rawLegs);

  const ids = new Set<string>();
  const dates = new Set<string>();
  for (const d of rawDays) {
    if (ids.has(d.id) || dates.has(d.date)) throw new Error(`duplicate day: ${d.id}`);
    ids.add(d.id);
    dates.add(d.date);
    if (d.lodgingId && !rawLodgings.some((l) => l.id === d.lodgingId)) {
      throw new Error(`unknown lodgingId ${d.lodgingId} on ${d.id}`);
    }
  }
  for (const leg of rawLegs) {
    if (!ids.has(leg.dayId)) throw new Error(`unknown dayId ${leg.dayId} on ${leg.id}`);
  }
  validated = true;
  return { ok: true };
}

export function getTrip(): Trip {
  validateSeed();
  return rawTrip;
}

export function getDays(): Day[] {
  validateSeed();
  return [...rawDays].sort((a, b) => a.sequence - b.sequence);
}

export function getDay(id: string): Day | undefined {
  return getDays().find((d) => d.id === id);
}

export function getTrekDays(): Day[] {
  return getDays().filter((d) => d.type === "trek");
}

export function getTravelDays(): Day[] {
  return getDays().filter((d) => d.type === "travel");
}

export function getLodgings(): Lodging[] {
  validateSeed();
  return seedLodgings;
}

export function getLodging(id: string): Lodging | undefined {
  return getLodgings().find((l) => l.id === id);
}

export function getLodgingForDay(day: Day): Lodging | undefined {
  return day.lodgingId ? getLodging(day.lodgingId) : undefined;
}

export function getTravelLegs(dayId: string): TravelLeg[] {
  validateSeed();
  return rawLegs.filter((l) => l.dayId === dayId).sort((a, b) => a.sequence - b.sequence);
}

export function getDaysWithLegs(): Day[] {
  const withLegs = new Set(rawLegs.map((l) => l.dayId));
  return getDays().filter((d) => withLegs.has(d.id));
}

export function computeTotals(days: Day[]): { distanceKm: number; gainM: number; lossM: number } {
  const trek = days.filter((d) => d.type === "trek");
  const sum = (pick: (d: Day) => number | undefined) => trek.reduce((acc, d) => acc + (pick(d) ?? 0), 0);
  return {
    distanceKm: Math.round(sum((d) => d.distanceKm) * 10) / 10,
    gainM: sum((d) => d.gainM),
    lossM: sum((d) => d.lossM),
  };
}

export function getContact(lodging: Lodging | undefined): { kind: "phone" | "url" | "none"; value: string | null } {
  if (!lodging) return { kind: "none", value: null };
  if (lodging.verifiedPhone) return { kind: "phone", value: lodging.verifiedPhone };
  if (lodging.contactUrl) return { kind: "url", value: lodging.contactUrl };
  if (lodging.bookingUrl) return { kind: "url", value: lodging.bookingUrl };
  return { kind: "none", value: null };
}

export function getMissingFields(day: Day, lodging: Lodging | undefined): RequiredDayField[] {
  if (day.type !== "trek") return [];
  const missing: RequiredDayField[] = [];
  for (const key of REQUIRED_DAY_FIELDS) {
    if (key === "contact") {
      if (lodging?.kind === "undecided") continue;
      if (getContact(lodging).kind === "none") missing.push(key);
      continue;
    }
    const v = day[key];
    if (v === undefined || v === "") missing.push(key);
  }
  if (missing.length > 0) logEvent("day_field_missing", "warn", { dayId: day.id, missing });
  return missing;
}
