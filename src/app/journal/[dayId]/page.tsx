import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMemberProfile, getTeamSession, hasEntry, listEntries } from "@/lib/journal";
import { getDay } from "@/lib/itinerary";
import { formatKoDate } from "@/lib/dates";
import { DUPLICATE_MESSAGE } from "@/lib/journal-rules";
import { Badge } from "@/components/ui/Badge";
import { StatusNote } from "@/components/ui/StatusNote";
import { JournalAccessNote } from "@/components/journal/JournalAccessNote";
import { DisplayNameForm } from "@/components/journal/DisplayNameForm";
import { JournalForm } from "@/components/journal/JournalForm";
import { JournalTimeline } from "@/components/journal/JournalTimeline";

type Params = { dayId: string };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { dayId } = await params;
  const day = getDay(dayId);
  return { title: day ? `Day ${day.trekDayNumber} 기록 — TMB 2027` : "기록 — TMB 2027" };
}

export default async function JournalDayPage({ params }: { params: Promise<Params> }) {
  const { dayId } = await params;
  const day = getDay(dayId);
  if (!day || day.type !== "trek") notFound();

  const session = await getTeamSession();
  const profile = await getMemberProfile(session);
  const dayLabel = `Day ${day.trekDayNumber}`;
  const entries = await listEntries(day.id);
  const alreadyWrote = profile.state === "member" && session.userId ? await hasEntry(day.id, session.userId) : false;

  return (
    <div className="space-y-4">
      <header>
        <div className="flex flex-wrap items-center gap-2 text-sm text-rock">
          <span className="font-semibold text-ink">{formatKoDate(day.date)}</span>
          <Badge tone="alpine">{dayLabel}</Badge>
        </div>
        <h1 className="mt-1 text-2xl font-bold">{day.nameKo}</h1>
        <p className="text-rock">{day.nameOriginal}</p>
        <Link href={`/day/${day.id}`} className="tap mt-1 inline-flex items-center text-sm font-medium text-alpine underline-offset-2 hover:underline">
          Day 상세 보기
        </Link>
      </header>

      <JournalAccessNote profile={profile} next={`/journal/${day.id}`} />

      {profile.state === "member" && !profile.displayName ? <DisplayNameForm dayId={day.id} current={null} /> : null}
      {profile.state === "member" && profile.displayName ? (
        alreadyWrote ? (
          <StatusNote tone="info" title="이미 기록을 남겼습니다">
            {DUPLICATE_MESSAGE} — Day별 1건까지 작성할 수 있습니다.
          </StatusNote>
        ) : (
          <JournalForm dayId={day.id} />
        )
      ) : null}

      <JournalTimeline entries={entries} dayLabel={dayLabel} />
    </div>
  );
}
