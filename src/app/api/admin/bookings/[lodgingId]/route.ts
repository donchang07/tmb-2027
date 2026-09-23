import { NextResponse } from "next/server";
import { getAdminBooking, getAdminSession, statusForSession } from "@/lib/bookings/admin";
import { getLodging } from "@/lib/itinerary";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(_request: Request, { params }: { params: Promise<{ lodgingId: string }> }) {
  const { lodgingId } = await params;
  const session = await getAdminSession();
  const status = statusForSession(session.state);
  if (status === 401) return NextResponse.json({ error: "admin_auth_required" }, { status, headers: NO_STORE });
  if (status === 403) return NextResponse.json({ error: "admin_forbidden" }, { status, headers: NO_STORE });
  if (status === 503) return NextResponse.json({ error: "admin_unconfigured" }, { status, headers: NO_STORE });
  if (!getLodging(lodgingId)) return NextResponse.json({ error: "not_found" }, { status: 404, headers: NO_STORE });

  const booking = await getAdminBooking(lodgingId);
  if (!booking) return NextResponse.json({ error: "not_found" }, { status: 404, headers: NO_STORE });
  return NextResponse.json({ booking }, { headers: NO_STORE });
}
