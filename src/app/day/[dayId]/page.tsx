import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DayMetrics } from "@/components/day/DayMetrics";
import { RouteList } from "@/components/day/RouteList";
import { LodgingCard } from "@/components/day/LodgingCard";
import { MapLinkCard } from "@/components/day/MapLinkCard";
import { SafetyCard } from "@/components/day/SafetyCard";
import { DayNav } from "@/components/day/DayNav";
import { ElevationProfile } from "@/components/map/ElevationProfile";
import { LegTimeline } from "@/components/travel/LegTimeline";
import { Badge } from "@/components/ui/Badge";
import { StatusNote } from "@/components/ui/StatusNote";
import { DayEditPanel } from "@/components/admin/DayEditPanel";
import { getDay, getMissingFields, getTravelLegs, getTrekDays } from "@/lib/itinerary";
import { getLodgingForDayAsync, getLodgingsAsync } from "@/lib/lodgings";
import { getPublicBookings } from "@/lib/bookings/public";
import { getAdminBooking, getAdminSession } from "@/lib/bookings/admin";
import { formatKoDate } from "@/lib/dates";
import { COUNTRY_LABEL, STATUS_LABEL, langFor } from "@/lib/format";
import { linkify } from "@/lib/linkify";
import { getTrailUrlForDay } from "@/lib/route";
import { getGpxForDay } from "@/lib/gpx";

type Params = { dayId: string };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { dayId } = await params;
  const day = getDay(dayId);
  return { title: day ? `Day ${day.trekDayNumber} · ${day.nameKo} — TMB 2027` : "Day 상세 — TMB 2027" };
}

export default async function DayDetailPage({ params }: { params: Promise<Params> }) {
  const { dayId } = await params;
  const day = getDay(dayId);
  if (!day || day.type !== "trek") notFound();

  const lodging = await getLodgingForDayAsync(day);
  const missing = getMissingFields(day, lodging);
  const legs = getTravelLegs(day.id);
  const bookings = await getPublicBookings();
  const booking = lodging ? bookings.find((b) => b.lodgingId === lodging.id) : undefined;
  const session = await getAdminSession();
  const canEditDay = session.state === "admin" && lodging !== undefined;
  const adminBooking = canEditDay && lodging ? await getAdminBooking(lodging.id) : null;
  const editorLodgings = canEditDay
    ? (await getLodgingsAsync()).map((l) => {
        const d = getDay(l.dayId);
        return { id: l.id, nameOriginal: l.nameOriginal, dayLabel: d?.trekDayNumber ? `Day ${d.trekDayNumber}` : "이동일" };
      })
    : [];
  const trekDays = getTrekDays();
  const idx = trekDays.findIndex((d) => d.id === day.id);
  const prev = idx > 0 ? trekDays[idx - 1] : undefined;
  const next = idx >= 0 ? trekDays[idx + 1] : undefined;
  const from = day.routePoints[0];
  const to = day.routePoints[day.routePoints.length - 1];

  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-wrap items-center gap-2 text-sm text-rock">
          <span className="font-semibold text-ink">{formatKoDate(day.date)}</span>
          <Badge tone="alpine">Day {day.trekDayNumber}</Badge>
          {day.country.map((c) => (
            <Badge key={c}>{COUNTRY_LABEL[c] ?? c}</Badge>
          ))}
        </div>
        <h1 className="mt-2 text-2xl font-bold leading-snug">{day.nameKo}</h1>
        <p className="text-rock" lang={langFor(day.country)}>
          {day.nameOriginal}
        </p>
      </header>

      {legs.length > 0 ? (
        <section aria-labelledby="morning-heading">
          <h2 id="morning-heading" className="mb-3 text-lg font-bold">
            아침 이동
          </h2>
          <div className="card p-4">
            <LegTimeline legs={legs} />
          </div>
          <Link
            href={`/travel/${day.id}`}
            className="tap mt-2 inline-flex items-center text-sm font-medium text-alpine underline-offset-2 hover:underline"
          >
            이동 상세 보기 ({legs.length}구간)
          </Link>
        </section>
      ) : null}

      {missing.length > 0 ? (
        <StatusNote
          tone="warn"
          title={`이 항목은 확인 중입니다 · 기준일 ${day.sourceCheckedAt}`}
          action={
            <Link href="/admin" className="tap inline-flex items-center rounded-lg border border-amber-400 px-3 text-sm font-semibold">
              관리자 점검
            </Link>
          }
        >
          누락: {missing.join(", ")}. 나머지 정보는 아래에 표시됩니다.
        </StatusNote>
      ) : null}

      <DayMetrics day={day} />

      <section aria-labelledby="route-heading">
        <h2 id="route-heading" className="mb-3 text-lg font-bold">
          경로
        </h2>
        <div className="card p-4">
          <RouteList points={day.routePoints} lang={langFor(day.country)} />
          <ElevationProfile day={day} />
        </div>
      </section>

      <section aria-labelledby="meal-heading" className="space-y-3">
        <h2 id="meal-heading" className="text-lg font-bold">
          식사·숙박
        </h2>
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-rock">점심</h3>
          <p className="mt-1 text-sm">{day.lunch ? linkify(day.lunch) : "확인 필요"}</p>
        </div>
        <LodgingCard
          lodging={lodging}
          status={booking?.status ?? "unbooked"}
          statusUpdatedAt={booking?.updatedAt ?? null}
          approvedAlternative={booking?.alternativeLodging ?? null}
        />
        {canEditDay && lodging ? (
          <DayEditPanel
            lodging={lodging}
            dayLabel={day.trekDayNumber ? `Day ${day.trekDayNumber}` : "이동일"}
            booking={adminBooking}
            lodgings={editorLodgings}
          />
        ) : null}
      </section>

      <section aria-labelledby="map-heading">
        <h2 id="map-heading" className="mb-3 text-lg font-bold">
          지도
        </h2>
        <MapLinkCard mapUrl={day.mapUrl} trailUrl={getTrailUrlForDay(day.id)} gpx={getGpxForDay(day.id)} from={from} to={to} />
      </section>

      <section aria-labelledby="safety-heading">
        <h2 id="safety-heading" className="mb-3 text-lg font-bold">
          안전
        </h2>
        <SafetyCard fallback={day.fallback} emergency={day.emergency} checkedAt={day.sourceCheckedAt} />
      </section>

      <section className="card p-4" aria-labelledby="status-heading">
        <h2 id="status-heading" className="font-bold">
          데이터 상태
        </h2>
        <p className="mt-1 text-sm text-rock">
          {STATUS_LABEL[day.verificationStatus]} · 기준일 {day.sourceCheckedAt} · 거리·고도는 GPX ±10% 허용 근사값
        </p>
        {day.notes ? <p className="mt-2 text-sm">{day.notes}</p> : null}
      </section>

      <Link href={`/journal/${day.id}`} className="card tap flex items-center justify-between p-4 text-sm font-semibold text-alpine hover:border-alpine">
        <span>팀 기록 보기</span>
        <span aria-hidden="true">→</span>
      </Link>

      <DayNav prev={prev} next={next} />
    </div>
  );
}
