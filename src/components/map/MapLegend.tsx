import Link from "next/link";
import { getMarkerSummary, getRouteSegments } from "@/lib/route";
import { getDay } from "@/lib/itinerary";
import { dayPhoto } from "@/lib/photos";
import { Photo } from "@/components/ui/Photo";

export function MapLegend() {
  const segments = getRouteSegments();
  const markers = getMarkerSummary();
  return (
    <div className="flex flex-col gap-3.5 sm:gap-4">
      <div className="card p-3 sm:p-[18px]">
        <h2 className="flex items-baseline justify-between gap-3 font-bold">
          기호{" "}
          <span className="whitespace-nowrap text-[13px] font-normal text-ink-3">
            숙박 {markers.lodging} · 고개 {markers.passes.length}
          </span>
        </h2>
        <ul className="mt-2.5 grid grid-cols-2 gap-2 text-[13px] sm:text-sm">
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="inline-block h-0 w-0 border-x-[7px] border-b-[12px] border-x-transparent border-b-amber" /> 고개
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="inline-block h-3.5 w-3.5 rounded-[50%] border-[3px] border-forest-900 bg-white" /> 숙박
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="inline-block h-3 w-3 rotate-45 bg-forest-900" /> 출발·도착
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-[50%] border-[1.5px] border-ink-3 bg-white" /> 마을
          </li>
        </ul>
      </div>
      <div className="card p-1.5 sm:p-2">
        <h2 className="px-2 py-2 font-bold sm:px-2.5">12개 Day</h2>
        <ol data-stagger>
          {segments.map((s) => {
            const day = getDay(s.dayId);
            return (
              <li key={s.dayId}>
                <Link
                  href={`/day/${s.dayId}`}
                  className="tap ix-row grid grid-cols-[5px_48px_minmax(0,1fr)] items-center gap-2.5 rounded-[9px] px-2 py-1.5 text-sm sm:grid-cols-[6px_56px_minmax(0,1fr)] sm:gap-3 sm:px-2.5"
                >
                  <span
                    aria-hidden="true"
                    className="block h-9 rounded-[3px] sm:h-10"
                    style={{ backgroundColor: s.color }}
                  />
                  <Photo src={dayPhoto(s.dayId)} className="h-9 rounded-[8px] sm:h-10" />
                  <span className="flex min-w-0 items-baseline gap-1.5">
                    <span className="shrink-0 font-bold">Day {s.trekDayNumber}</span>
                    <span className="min-w-0 flex-1 truncate text-ink-2">{day?.nameKo ?? s.dayId}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
