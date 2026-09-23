import { NextResponse } from "next/server";
import { getPublicBookings } from "@/lib/bookings/public";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const bookings = await getPublicBookings();
  return NextResponse.json(
    { bookings, configured: isSupabaseConfigured() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
