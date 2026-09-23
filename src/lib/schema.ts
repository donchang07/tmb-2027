import { z } from "zod";

export const VerificationStatus = z.enum(["confirmed", "researched", "estimated", "needs_check"]);
export type VerificationStatus = z.infer<typeof VerificationStatus>;

export const Country = z.enum(["FR", "IT", "CH", "KR"]);
export type Country = z.infer<typeof Country>;

export const DayType = z.enum(["travel", "trek"]);
export type DayType = z.infer<typeof DayType>;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD");

export const RoutePointSchema = z.object({
  nameKo: z.string().min(1),
  nameOriginal: z.string().min(1),
  altitudeM: z.number().nullable(),
});
export type RoutePoint = z.infer<typeof RoutePointSchema>;

const TREK_REQUIRED = [
  "trekDayNumber",
  "distanceKm",
  "gainM",
  "lossM",
  "duration",
  "lunch",
  "lodgingId",
  "mapUrl",
  "fallback",
  "emergency",
] as const;

export const DaySchema = z
  .object({
    id: z.string().regex(/^d\d{4}-\d{2}-\d{2}$/),
    sequence: z.number().int().min(1).max(15),
    date: isoDate,
    type: DayType,
    trekDayNumber: z.number().int().min(1).max(12).optional(),
    nameKo: z.string().min(1),
    nameOriginal: z.string().min(1),
    country: z.array(Country).min(1),
    distanceKm: z.number().nonnegative().optional(),
    gainM: z.number().nonnegative().optional(),
    lossM: z.number().nonnegative().optional(),
    duration: z.string().optional(),
    lunch: z.string().optional(),
    lodgingId: z.string().optional(),
    mapUrl: z.string().url().optional(),
    fallback: z.string().optional(),
    emergency: z.string().optional(),
    routePoints: z.array(RoutePointSchema).default([]),
    notes: z.string().optional(),
    sourceUrl: z.string().url().optional(),
    sourceCheckedAt: isoDate,
    verificationStatus: VerificationStatus,
  })
  .superRefine((day, ctx) => {
    if (day.type !== "trek") return;
    for (const key of TREK_REQUIRED) {
      if (day[key] === undefined || day[key] === "") {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: `trek day requires ${key}` });
      }
    }
  });
export type Day = z.infer<typeof DaySchema>;

export const BookingChannel = z.enum(["portal", "own", "other"]);
export type BookingChannel = z.infer<typeof BookingChannel>;

export const LodgingKind = z.enum(["refuge", "village", "hotel", "undecided"]);
export type LodgingKind = z.infer<typeof LodgingKind>;

export const LodgingCandidateSchema = z.object({
  name: z.string().min(1),
  stars: z.string().nullable().default(null),
  note: z.string().default(""),
  url: z.string().url().nullable().default(null),
});
export type LodgingCandidate = z.infer<typeof LodgingCandidateSchema>;

export const LodgingSchema = z.object({
  id: z.string().min(1),
  nameOriginal: z.string().min(1),
  nameKo: z.string().min(1).optional(),
  kind: LodgingKind,
  location: z.string().min(1),
  country: Country,
  dayId: z.string(),
  bookingChannel: BookingChannel,
  address: z.string().nullable().default(null),
  lat: z.number().nullable().default(null),
  lng: z.number().nullable().default(null),
  bookingUrl: z.string().url().nullable(),
  contactUrl: z.string().url().nullable(),
  verifiedPhone: z.string().nullable(),
  phoneVerifiedAt: isoDate.nullable().default(null),
  phoneVerifiedBy: z.string().nullable().default(null),
  roomType: z.string().nullable().default(null),
  priceLow: z.number().nullable(),
  priceHigh: z.number().nullable(),
  currency: z.enum(["EUR", "CHF"]),
  season: z.string(),
  capacityNote: z.string().nullable().default(null),
  checkedAt: isoDate,
  recheckAt: isoDate.nullable().default(null),
  alternative: z.string().nullable(),
  candidates: z.array(LodgingCandidateSchema).default([]),
  notes: z.string().optional(),
  version: z.number().int().min(1).default(1),
});
export type Lodging = z.infer<typeof LodgingSchema>;
export type LodgingSeed = z.input<typeof LodgingSchema>;

export const TravelMode = z.enum(["flight", "train", "bus", "walk", "transfer", "stay", "cablecar"]);
export type TravelMode = z.infer<typeof TravelMode>;

export const TravelLegSchema = z.object({
  id: z.string().min(1),
  dayId: z.string(),
  sequence: z.number().int().min(1),
  mode: TravelMode,
  originKo: z.string().min(1),
  originOriginal: z.string().min(1),
  destinationKo: z.string().min(1),
  destinationOriginal: z.string().min(1),
  departAt: z.string().nullable(),
  arriveAt: z.string().nullable(),
  duration: z.string().min(1),
  bookingUrl: z.string().url().nullable(),
  fallback: z.string().min(1),
  checkedAt: isoDate,
  verificationStatus: VerificationStatus,
  notes: z.string().optional(),
});
export type TravelLeg = z.infer<typeof TravelLegSchema>;

export const BudgetItemSchema = z.object({
  id: z.string().min(1),
  category: z.string().min(1),
  lowEur: z.number().nonnegative(),
  midEur: z.number().nonnegative(),
  basis: z.string().min(1),
  sourceCheckedAt: isoDate,
});
export type BudgetItem = z.infer<typeof BudgetItemSchema>;

export const ExchangeRateSchema = z.object({
  pair: z.enum(["CHF/EUR", "USD/EUR", "EUR/KRW"]),
  rate: z.number().positive(),
  checkedAt: isoDate,
});
export type ExchangeRate = z.infer<typeof ExchangeRateSchema>;

export const BudgetMetaSchema = z.object({
  contingencyRate: z.number().min(0).max(1),
  checkedAt: isoDate,
  validUntil: isoDate,
  assumptions: z.array(z.string()),
  notes: z.array(z.string()),
  recommendedLowEur: z.number().positive(),
  recommendedHighEur: z.number().positive(),
  inflationLow: z.number().min(0).max(1),
  inflationHigh: z.number().min(0).max(1),
  inflationYears: z.number().int().min(0),
});
export type BudgetMeta = z.infer<typeof BudgetMetaSchema>;

export const RouteNodeKind = z.enum(["start", "pass", "lodging", "town", "waypoint", "finish"]);
export type RouteNodeKind = z.infer<typeof RouteNodeKind>;

export const RouteNodeSchema = z.object({
  id: z.string().min(1),
  nameKo: z.string().min(1),
  nameOriginal: z.string().min(1),
  kind: RouteNodeKind,
  lat: z.number().min(45).max(47),
  lon: z.number().min(6).max(8),
  altitudeM: z.number().nullable(),
});
export type RouteNode = z.infer<typeof RouteNodeSchema>;

export const RouteSegmentSchema = z.object({
  dayId: z.string().regex(/^d\d{4}-\d{2}-\d{2}$/),
  trekDayNumber: z.number().int().min(1).max(12),
  nodeIds: z.array(z.string()).min(2),
  trailViaIds: z.array(z.string()).optional(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
});
export type RouteSegment = z.infer<typeof RouteSegmentSchema>;

export type ElevationPoint = {
  dayId: string;
  sequence: number;
  label: string;
  labelOriginal: string;
  altitudeM: number | null;
  role: "start" | "via" | "end";
};

export const TripSchema = z.object({
  id: z.literal("tmb-2027"),
  name: z.string(),
  slogan: z.string(),
  startDate: isoDate,
  endDate: isoDate,
  partySize: z.number().int().positive(),
  distanceKm: z.number(),
  gainM: z.number(),
  lossM: z.number(),
  timezone: z.literal("Europe/Paris"),
  checkedAt: isoDate,
  direction: z.literal("counterclockwise"),
});
export type Trip = z.infer<typeof TripSchema>;
