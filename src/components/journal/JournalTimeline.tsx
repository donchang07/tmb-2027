import type { JournalEntry } from "@/lib/journal";
import { formatKoDateTime } from "@/lib/dates";

export function JournalTimeline({ entries, dayLabel }: { entries: JournalEntry[]; dayLabel: string }) {
  if (entries.length === 0) {
    return <p className="card p-6 text-center text-rock">아직 기록이 없습니다.</p>;
  }
  return (
    <ol className="space-y-3" aria-label={`${dayLabel} 팀 타임라인`}>
      {entries.map((e) => (
        <li key={e.id} className="card overflow-hidden">
          {e.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={e.imageUrl} alt={`${dayLabel} 기록 사진`} loading="lazy" className="max-h-96 w-full object-cover" />
          ) : null}
          <div className="p-4">
            <p className="whitespace-pre-wrap break-words">{e.text}</p>
            <p className="mt-2 text-xs text-rock">
              {e.authorLabel} · {formatKoDateTime(e.createdAt)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
