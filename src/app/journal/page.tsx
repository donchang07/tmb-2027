import type { Metadata } from "next";
import Link from "next/link";
import { countEntriesByDay, getMemberProfile } from "@/lib/journal";
import { getTrekDays } from "@/lib/itinerary";
import { formatKoDate } from "@/lib/dates";
import { JournalAccessNote } from "@/components/journal/JournalAccessNote";

export const metadata: Metadata = { title: "여행 기록 — TMB 2027" };
export const dynamic = "force-dynamic";

export default async function JournalIndexPage() {
  const [profile, counts] = await Promise.all([getMemberProfile(), countEntriesByDay()]);
  const days = getTrekDays();
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">여행 기록</h1>
        <p className="text-sm text-rock">Day별 사진 1장 + 200자 · 팀원 1인당 Day 1건</p>
      </header>
      <JournalAccessNote profile={profile} next="/journal" />
      <ol className="card divide-y divide-rock/10">
        {days.map((d) => (
          <li key={d.id}>
            <Link href={`/journal/${d.id}`} className="tap flex items-center gap-3 px-4 py-2 text-sm hover:text-alpine">
              <span className="w-14 shrink-0 font-semibold">Day {d.trekDayNumber}</span>
              <span className="w-20 shrink-0 text-rock">{formatKoDate(d.date)}</span>
              <span className="min-w-0 flex-1 truncate">{d.nameKo}</span>
              <span className="shrink-0 text-rock">{counts ? `${counts.get(d.id) ?? 0}건` : "—"}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
