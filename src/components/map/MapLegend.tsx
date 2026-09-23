import Link from "next/link";
import { getMarkerSummary, getRouteSegments } from "@/lib/route";
import { getDay } from "@/lib/itinerary";

export function MapLegend() {
  const segments = getRouteSegments();
  const markers = getMarkerSummary();
  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h2 className="font-bold">
          기호 <span className="text-sm font-normal text-rock">숙박 {markers.lodging} · 고개 {markers.passes.length}</span>
        </h2>
        <ul className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="inline-block h-0 w-0 border-x-[7px] border-b-[12px] border-x-transparent border-b-safety" /> 고개
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="inline-block h-3.5 w-3.5 rounded-full bg-alpine" /> 숙박
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="inline-block h-3 w-3 rotate-45 bg-ink" /> 출발·도착
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="inline-block h-3.5 w-3.5 rounded-full border-2 border-rock bg-white" /> 마을
          </li>
        </ul>
      </div>
      <div className="card p-4">
        <h2 className="font-bold">12개 Day</h2>
        <ol className="mt-2 divide-y divide-rock/10">
          {segments.map((s) => {
            const day = getDay(s.dayId);
            return (
              <li key={s.dayId}>
                <Link href={`/day/${s.dayId}`} className="tap flex items-center gap-3 py-2 text-sm hover:text-alpine">
                  <span aria-hidden="true" className="inline-block h-3 w-8 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="w-12 shrink-0 font-semibold">Day {s.trekDayNumber}</span>
                  <span className="min-w-0 flex-1 truncate">{day?.nameKo ?? s.dayId}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
