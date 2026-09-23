import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LegTimeline } from "@/components/travel/LegTimeline";
import { LodgingCard } from "@/components/day/LodgingCard";
import { Badge } from "@/components/ui/Badge";
import { getDay, getTravelLegs } from "@/lib/itinerary";
import { getLodgingForDayAsync } from "@/lib/lodgings";
import { getPublicBookings } from "@/lib/bookings/public";
import { formatKoDate } from "@/lib/dates";
import { COUNTRY_LABEL, STATUS_LABEL } from "@/lib/format";

type Params = { dayId: string };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { dayId } = await params;
  const day = getDay(dayId);
  return { title: day ? `${day.nameKo} — 이동일 — TMB 2027` : "이동일 — TMB 2027" };
}

export default async function TravelDayPage({ params }: { params: Promise<Params> }) {
  const { dayId } = await params;
  const day = getDay(dayId);
  const legs = getTravelLegs(dayId);
  if (!day || legs.length === 0) notFound();

  const lodging = await getLodgingForDayAsync(day);
  const booking = lodging ? (await getPublicBookings()).find((b) => b.lodgingId === lodging.id) : undefined;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 text-sm text-rock">
        <span className="font-semibold text-ink">{formatKoDate(day.date)}</span>
        <Badge>{day.type === "travel" ? "이동일" : `Day ${day.trekDayNumber} 아침 이동`}</Badge>
        {day.country.map((c) => (
          <Badge key={c}>{COUNTRY_LABEL[c] ?? c}</Badge>
        ))}
      </div>
      <h1 className="mt-2 text-2xl font-bold">{day.nameKo}</h1>
      <p className="text-rock">{day.nameOriginal}</p>
      {day.notes ? <p className="mt-2 text-sm">{day.notes}</p> : null}

      <section className="mt-6" aria-labelledby="legs-heading">
        <h2 id="legs-heading" className="mb-3 text-lg font-bold">
          구간 타임라인
        </h2>
        <LegTimeline legs={legs} />
      </section>

      {lodging ? (
        <section className="mt-6" aria-labelledby="lodging-heading">
          <h2 id="lodging-heading" className="mb-3 text-lg font-bold">
            숙박
          </h2>
          <LodgingCard
            lodging={lodging}
            status={booking?.status ?? "unbooked"}
            statusUpdatedAt={booking?.updatedAt ?? null}
            approvedAlternative={booking?.alternativeLodging ?? null}
          />
        </section>
      ) : null}

      <section className="mt-6 card p-4" aria-labelledby="data-heading">
        <h2 id="data-heading" className="font-bold">
          데이터 상태
        </h2>
        <p className="mt-1 text-sm text-rock">
          일정 상태: {STATUS_LABEL[day.verificationStatus]} · 기준일 {day.sourceCheckedAt} · 항공권·교통 예약 직전과 출발 30일 전 재확인
        </p>
      </section>

      <div className="mt-6 flex flex-wrap gap-2">
        {day.type === "trek" ? (
          <Link href={`/day/${day.id}`} className="tap inline-flex items-center rounded-lg bg-alpine px-4 text-sm font-semibold text-white">
            Day {day.trekDayNumber} 상세 보기
          </Link>
        ) : null}
        <Link href="/itinerary" className="tap inline-flex items-center rounded-lg border border-rock/30 px-4 text-sm font-semibold text-rock">
          전체 일정
        </Link>
      </div>
    </div>
  );
}
