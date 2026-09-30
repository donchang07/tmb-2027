import type { JournalEntry } from "@/lib/journal";
import { formatKoDateTime } from "@/lib/dates";

export function JournalTimeline({ entries, dayLabel }: { entries: JournalEntry[]; dayLabel: string }) {
  if (entries.length === 0) {
    return <p className="card p-6 text-center text-ink-3">아직 기록이 없습니다.</p>;
  }
  return (
    <ol data-stagger className="flex flex-col gap-3 sm:gap-4" aria-label={`${dayLabel} 팀 타임라인`}>
      {entries.map((e) => (
        <li
          key={e.id}
          className={`card overflow-hidden ${e.imageUrl ? "sm:grid sm:grid-cols-[260px_minmax(0,1fr)] lg:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]" : ""}`}
        >
          {e.imageUrl ? (
            <div className="relative h-[200px] bg-forest-600 sm:h-auto sm:min-h-[200px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={e.imageUrl} alt={`${dayLabel} 기록 사진`} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            </div>
          ) : null}
          <div className="flex flex-col gap-1.5 px-4 py-3.5 sm:gap-2.5 sm:p-5">
            <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed sm:text-[17px]">{e.text}</p>
            <p className="text-xs text-ink-3 sm:mt-auto sm:text-[13px]">
              <b className="font-bold text-forest-900">{e.authorLabel}</b> · {formatKoDateTime(e.createdAt)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
