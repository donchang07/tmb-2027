import type { Metadata } from "next";
import Link from "next/link";
import { countEntriesByDay, getMemberProfile } from "@/lib/journal";
import { getTrekDays } from "@/lib/itinerary";
import { formatKoDate } from "@/lib/dates";
import { PHOTOS, dayPhoto } from "@/lib/photos";
import { Photo } from "@/components/ui/Photo";
import { JournalAccessNote } from "@/components/journal/JournalAccessNote";

export const metadata: Metadata = { title: "여행 기록 — TMB 2027" };
export const dynamic = "force-dynamic";

export default async function JournalIndexPage() {
  const [profile, counts] = await Promise.all([getMemberProfile(), countEntriesByDay()]);
  const days = getTrekDays();
  return (
    <div className="flex flex-col gap-3 sm:gap-5">
      <header className="bleed -mt-3 sm:-mt-10 sm:mb-2">
        <Photo src={PHOTOS.journal} className="relative h-[190px] rounded-none sm:h-[300px]">
          <div className="scrim" />
          <div className="absolute inset-x-4 bottom-4 text-white sm:inset-x-12 sm:bottom-8">
            <h1 data-enter="1" className="text-[30px] font-extrabold leading-tight tracking-[-0.035em] sm:text-[48px]">
              여행 기록
            </h1>
            <p className="mt-0.5 text-[13px] sm:mt-1.5 sm:text-[17px]">Day별 사진 1장 + 200자 · 팀원 1인당 Day 1건</p>
          </div>
        </Photo>
      </header>
      <JournalAccessNote profile={profile} next="/journal" />
      <ol data-stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-3.5 lg:grid-cols-4">
        {days.map((d) => (
          <li key={d.id} className="min-w-0">
            <Link href={`/journal/${d.id}`} className="tap ix-tile card block h-full overflow-hidden">
              <Photo src={dayPhoto(d.id)} className="h-24 rounded-none sm:h-[130px]" />
              <span className="flex flex-col gap-0.5 px-3 py-2.5 sm:px-3.5 sm:py-3">
                <span className="flex items-baseline justify-between gap-2 text-[13px]">
                  <span className="whitespace-nowrap font-bold">Day {d.trekDayNumber}</span>
                  <span className="whitespace-nowrap font-bold text-forest-700">{counts ? `${counts.get(d.id) ?? 0}건` : "—"}</span>
                </span>
                <span className="text-[13px] text-ink-3">{formatKoDate(d.date)}</span>
                <span className="text-sm font-semibold leading-snug sm:text-[15px]">{d.nameKo}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
