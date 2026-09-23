import { cache } from "react";
import { LodgingSchema, type Day, type Lodging } from "@/lib/schema";
import { getLodgings } from "@/lib/itinerary";
import { logEvent } from "@/lib/log";
import { createSupabaseAnonClient } from "@/lib/supabase/server";

export type LodgingRow = {
  id: string;
  day_id: string;
  name_original: string;
  kind: string;
  location: string;
  country: string;
  booking_channel: string;
  address: string | null;
  lat: number | string | null;
  lng: number | string | null;
  booking_url: string | null;
  contact_url: string | null;
  verified_phone: string | null;
  phone_verified_at: string | null;
  phone_verified_by?: string | null;
  room_type: string | null;
  price_low: number | string | null;
  price_high: number | string | null;
  currency: string;
  season: string | null;
  capacity_note: string | null;
  alternative: string | null;
  candidates: unknown;
  checked_at: string;
  recheck_at: string | null;
  notes: string | null;
  version: number;
};

function num(v: number | string | null): number | null {
  if (v === null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export function rowToLodging(row: LodgingRow): Lodging | null {
  const parsed = LodgingSchema.safeParse({
    id: row.id,
    nameOriginal: row.name_original,
    kind: row.kind,
    location: row.location,
    country: row.country,
    dayId: row.day_id,
    bookingChannel: row.booking_channel,
    address: row.address,
    lat: num(row.lat),
    lng: num(row.lng),
    bookingUrl: row.booking_url,
    contactUrl: row.contact_url,
    verifiedPhone: row.verified_phone,
    phoneVerifiedAt: row.phone_verified_at,
    phoneVerifiedBy: row.phone_verified_by ?? null,
    roomType: row.room_type,
    priceLow: num(row.price_low),
    priceHigh: num(row.price_high),
    currency: row.currency,
    season: row.season ?? "",
    capacityNote: row.capacity_note,
    checkedAt: row.checked_at,
    recheckAt: row.recheck_at,
    alternative: row.alternative,
    candidates: Array.isArray(row.candidates) ? row.candidates : [],
    notes: row.notes ?? undefined,
    version: row.version,
  });
  return parsed.success ? parsed.data : null;
}

// Design Ref: NFR 개인정보 — phone_verified_by·updated_by는 anon grant 대상이 아니므로 공개 조회에서 제외
export const PUBLIC_LODGING_COLUMNS =
  "id,day_id,name_original,kind,location,country,booking_channel,address,lat,lng,booking_url,contact_url,verified_phone,phone_verified_at,room_type,price_low,price_high,currency,season,capacity_note,alternative,candidates,checked_at,recheck_at,notes,version";

export const getLodgingsAsync = cache(async (): Promise<Lodging[]> => {
  const supabase = createSupabaseAnonClient();
  if (!supabase) return getLodgings();
  const { data, error } = await supabase.from("lodgings").select(PUBLIC_LODGING_COLUMNS);
  if (error || !data || data.length === 0) {
    logEvent("booking_status_defaulted", "warn", {
      reason: error ? `lodgings_fallback_seed: ${error.message}` : "lodgings_fallback_seed",
    });
    return getLodgings();
  }
  const rows = (data as LodgingRow[]).map(rowToLodging).filter((l): l is Lodging => l !== null);
  if (rows.length === 0) {
    logEvent("booking_status_defaulted", "warn", { reason: "lodgings_fallback_seed" });
    return getLodgings();
  }
  return rows;
});

export async function getLodgingAsync(id: string): Promise<Lodging | undefined> {
  return (await getLodgingsAsync()).find((l) => l.id === id);
}

export async function getLodgingForDayAsync(day: Day): Promise<Lodging | undefined> {
  return day.lodgingId ? getLodgingAsync(day.lodgingId) : undefined;
}
