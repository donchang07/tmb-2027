"use server";

import { revalidatePath } from "next/cache";
import { saveBooking, saveLodging, type BookingRow } from "@/lib/bookings/admin";

export type SaveState = {
  status: "idle" | "saved" | "conflict" | "error" | "forbidden" | "unauthorized" | "invalid" | "unconfigured";
  message: string | null;
  row: BookingRow | null;
};

export async function saveBookingAction(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const text = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" ? v : null;
  };
  const result = await saveBooking({
    lodgingId: text("lodgingId"),
    status: text("status"),
    confirmationRef: text("confirmationRef"),
    privateMemo: text("privateMemo"),
    alternativeLodging: text("alternativeLodging"),
    alternativeLodgingId: text("alternativeLodgingId"),
    version: text("version"),
  });

  if (result.ok) {
    revalidatePath("/", "layout");
    return { status: "saved", message: "저장됨", row: result.row };
  }
  return { status: result.reason, message: result.message, row: result.row ?? null };
}

export type SaveLodgingState = {
  status: "idle" | "saved" | "conflict" | "error" | "forbidden" | "unauthorized" | "invalid" | "unconfigured";
  message: string | null;
};

export async function saveLodgingAction(_prev: SaveLodgingState, formData: FormData): Promise<SaveLodgingState> {
  const text = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" ? v : null;
  };
  const result = await saveLodging({
    id: text("id"),
    kind: text("kind"),
    address: text("address"),
    bookingUrl: text("bookingUrl"),
    contactUrl: text("contactUrl"),
    verifiedPhone: text("verifiedPhone"),
    phoneVerifiedAt: text("phoneVerifiedAt"),
    roomType: text("roomType"),
    priceLow: text("priceLow"),
    priceHigh: text("priceHigh"),
    currency: text("currency"),
    season: text("season"),
    capacityNote: text("capacityNote"),
    checkedAt: text("checkedAt"),
    recheckAt: text("recheckAt"),
    alternative: text("alternative"),
    notes: text("notes"),
    version: text("version"),
  });

  if (result.ok) {
    revalidatePath("/", "layout");
    return { status: "saved", message: "저장됨" };
  }
  return { status: result.reason, message: result.message };
}
