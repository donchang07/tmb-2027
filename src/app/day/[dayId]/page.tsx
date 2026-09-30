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
import { Photo } from "@/components/ui/Photo";
import { PHOTOS, dayPhoto } from "@/lib/photos";
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
    <div>
      <Photo
        src={dayPhoto(day.id)}
        position="center 45%"
        className="bleed relative -mt-3 flex min-h-[300px] flex-col justify-end overflow-hidden rounded-none sm:-mt-10 sm:min-h-[420px]"
      >
        <div aria-hidden="true" className="scrim" />
        <header className="relative flex flex-col gap-2 px-4 pb-[18px] pt-24 text-white sm:gap-3 sm:px-12 sm:pb-9">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs font-semibold sm:text-sm">
            <span>{formatKoDate(day.date)}</span>
            <Badge tone="light">Day {day.trekDayNumber}</Badge>
            {day.country.map((c) => (
              <span key={c} className="whitespace-nowrap">
                {COUNTRY_LABEL[c] ?? c}
              </span>
            ))}
          </div>
          <h1 data-enter="1" className="max-w-[900px] text-[26px] font-extrabold leading-[1.25] tracking-[-0.02em] sm:text-[36px] sm:leading-[1.15] sm:tracking-[-0.03em] lg:text-[44px]">
            {day.nameKo}
          </h1>
          <p className="text-[13px] opacity-90 sm:text-base" lang={langFor(day.country)}>
            {day.nameOriginal}
          </p>
        </header>
      </Photo>

      {missing.length > 0 ? (
        <div className="mt-4 sm:mt-8">
          <StatusNote
            tone="warn"
            title={`이 항목은 확인 중입니다 · 기준일 ${day.sourceCheckedAt}`}
            action={
              <Link href="/admin" className="btn border border-warn-fg">
                관리자 점검
              </Link>
            }
          >
            누락: {missing.join(", ")}. 나머지 정보는 아래에 표시됩니다.
          </StatusNote>
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-3.5 sm:mt-8 sm:gap-6 lg:grid lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
        <div className="contents lg:flex lg:flex-col lg:gap-6">
          <div className="order-1">
            <DayMetrics day={day} />
          </div>

          {legs.length > 0 ? (
            <section aria-labelledby="morning-heading" className="card order-2 flex flex-col gap-3 p-[18px] sm:gap-[18px] sm:p-6">
              <h2 id="morning-heading" className="text-lg font-bold sm:text-[21px]">
                아침 이동
              </h2>
              <LegTimeline legs={legs} />
              <Link href={`/travel/${day.id}`} className="tap ix-link inline-flex items-center self-start text-sm font-semibold text-forest-700">
                이동 상세 보기 ({legs.length}구간)
              </Link>
            </section>
          ) : null}

          <section aria-labelledby="route-heading" className="card order-3 flex flex-col gap-3 p-[18px] sm:gap-[18px] sm:p-6">
            <h2 id="route-heading" className="text-lg font-bold sm:text-[21px]">
              경로
            </h2>
            <ElevationProfile day={day} />
            <RouteList points={day.routePoints} lang={langFor(day.country)} />
            <div aria-hidden="true" className="snap-row -mr-[18px] sm:mr-0 sm:grid sm:grid-cols-3 sm:gap-2.5 sm:overflow-visible">
              <Photo src={PHOTOS.routeA} className="h-[100px] w-[150px] sm:h-[140px] sm:w-auto" />
              <Photo src={PHOTOS.routeB} className="h-[100px] w-[150px] sm:h-[140px] sm:w-auto" />
              <Photo src={PHOTOS.routeC} className="h-[100px] w-[150px] sm:h-[140px] sm:w-auto" />
            </div>
          </section>

          <section aria-labelledby="map-heading" className="card order-5 flex flex-col gap-2.5 p-[18px] sm:gap-3.5 sm:p-6">
            <h2 id="map-heading" className="text-lg font-bold sm:text-[21px]">
              지도
            </h2>
            <MapLinkCard mapUrl={day.mapUrl} trailUrl={getTrailUrlForDay(day.id)} gpx={getGpxForDay(day.id)} from={from} to={to} />
          </section>
        </div>

        <div className="contents lg:flex lg:flex-col lg:gap-6">
          <section aria-labelledby="meal-heading" className="card order-4 flex flex-col gap-3 p-[18px] sm:gap-4 sm:p-6">
            <h2 id="meal-heading" className="text-lg font-bold sm:text-[21px]">
              식사·숙박
            </h2>
            <div>
              <h3 className="text-sm text-ink-3 sm:text-[15px]">점심</h3>
              <p className="mt-0.5 text-sm sm:text-[15px]">{day.lunch ? linkify(day.lunch) : "확인 필요"}</p>
            </div>
            <div className="border-t border-line-soft pt-3 sm:pt-4">
              <LodgingCard
                lodging={lodging}
                status={booking?.status ?? "unbooked"}
                statusUpdatedAt={booking?.updatedAt ?? null}
                approvedAlternative={booking?.alternativeLodging ?? null}
              />
            </div>
            {canEditDay && lodging ? (
              <DayEditPanel
                lodging={lodging}
                dayLabel={day.trekDayNumber ? `Day ${day.trekDayNumber}` : "이동일"}
                booking={adminBooking}
                lodgings={editorLodgings}
              />
            ) : null}
          </section>

          <section aria-labelledby="safety-heading" className="card-dark order-6 flex flex-col gap-2.5 p-[18px] sm:gap-3.5 sm:p-6">
            <h2 id="safety-heading" className="text-lg font-bold sm:text-[21px]">
              안전
            </h2>
            <SafetyCard fallback={day.fallback} emergency={day.emergency} checkedAt={day.sourceCheckedAt} />
          </section>

          <section className="card order-7 flex flex-col gap-2 p-[18px] sm:p-6" aria-labelledby="status-heading">
            <h2 id="status-heading" className="text-base font-bold sm:text-lg">
              데이터 상태
            </h2>
            <p className="text-[13px] text-ink-2 sm:text-sm">
              {STATUS_LABEL[day.verificationStatus]} · 기준일 {day.sourceCheckedAt} · 거리·고도는 GPX ±10% 허용 근사값
            </p>
            {day.notes ? <p className="text-[13px] text-ink-2 sm:text-sm">{day.notes}</p> : null}
          </section>

          <Link
            href={`/journal/${day.id}`}
            className="tap ix-tile relative order-8 flex h-[90px] items-center justify-between overflow-hidden rounded-[12px] px-4 font-bold text-white sm:h-[120px] sm:px-5 sm:text-lg"
          >
            <Photo src={PHOTOS.journalLink} className="absolute inset-0" />
            <span aria-hidden="true" className="scrim-side" />
            <span className="relative">팀 기록 보기</span>
            <span aria-hidden="true" className="relative">
              →
            </span>
          </Link>

          <div className="order-9">
            <DayNav prev={prev} next={next} />
          </div>
        </div>
      </div>
    </div>
  );
}
