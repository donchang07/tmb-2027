import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LegTimeline } from "@/components/travel/LegTimeline";
import { LodgingCard } from "@/components/day/LodgingCard";
import { Badge } from "@/components/ui/Badge";
import { Photo } from "@/components/ui/Photo";
import { PHOTOS, dayPhoto } from "@/lib/photos";
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
      <div className="flex flex-col-reverse gap-2.5 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end lg:gap-10">
        <header className="flex flex-col gap-2.5 sm:gap-3.5 lg:pb-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs font-semibold sm:text-sm">
            <span>{formatKoDate(day.date)}</span>
            <Badge tone="dark">{day.type === "travel" ? "이동일" : `Day ${day.trekDayNumber} 아침 이동`}</Badge>
            {day.country.map((c) => (
              <span key={c} className="whitespace-nowrap">
                {COUNTRY_LABEL[c] ?? c}
              </span>
            ))}
          </div>
          <h1 data-enter="1" className="text-[28px] font-extrabold leading-[1.2] tracking-[-0.03em] sm:text-[40px] sm:leading-[1.1] sm:tracking-[-0.035em] lg:text-5xl">
            {day.nameKo}
          </h1>
          <p className="text-[13px] text-ink-3 sm:text-base">{day.nameOriginal}</p>
          {day.notes ? <p className="text-sm leading-[1.6] text-ink-2 sm:text-base">{day.notes}</p> : null}
        </header>
        <Photo src={dayPhoto(day.id)} className="h-[190px] sm:h-[340px]" />
      </div>

      <div className="mt-4 flex flex-col gap-3.5 sm:mt-8 sm:gap-6 lg:grid lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
        <section className="card p-[18px] sm:p-7" aria-labelledby="legs-heading">
          <h2 id="legs-heading" className="mb-3 text-lg font-bold sm:mb-4 sm:text-[21px]">
            구간 타임라인
          </h2>
          <LegTimeline legs={legs} />
        </section>

        <div className="flex flex-col gap-3.5 sm:gap-6">
          {lodging ? (
            <section className="card overflow-hidden" aria-labelledby="lodging-heading">
              <Photo src={PHOTOS.lodging} className="h-[110px] rounded-none sm:h-[150px]" />
              <div className="p-4 sm:p-[22px]">
                <h2 id="lodging-heading" className="mb-2 text-base font-bold sm:text-lg">
                  숙박
                </h2>
                <LodgingCard
                  lodging={lodging}
                  status={booking?.status ?? "unbooked"}
                  statusUpdatedAt={booking?.updatedAt ?? null}
                  approvedAlternative={booking?.alternativeLodging ?? null}
                />
              </div>
            </section>
          ) : null}

          <section className="card p-4 sm:p-[22px]" aria-labelledby="data-heading">
            <h2 id="data-heading" className="text-base font-bold sm:text-lg">
              데이터 상태
            </h2>
            <p className="mt-1.5 text-[13px] text-ink-2 sm:text-sm">
              일정 상태: {STATUS_LABEL[day.verificationStatus]} · 기준일 {day.sourceCheckedAt} · 항공권·교통 예약 직전과 출발 30일 전 재확인
            </p>
          </section>

          <div className="flex flex-col gap-2.5">
            {day.type === "trek" ? (
              <Link href={`/day/${day.id}`} className="btn btn-primary py-3.5 font-bold">
                Day {day.trekDayNumber} 상세 보기
              </Link>
            ) : null}
            <Link href="/itinerary" className={`btn py-3.5 font-bold ${day.type === "trek" ? "btn-outline" : "btn-primary"}`}>
              전체 일정
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
