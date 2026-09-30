import Link from "next/link";
import { visibleQuickLinks, type NavKey } from "@/lib/phases";
import { Photo } from "@/components/ui/Photo";
import { PHOTOS } from "@/lib/photos";

const TILE_PHOTO: Record<NavKey, string> = {
  itinerary: PHOTOS.itinerary,
  budget: PHOTOS.budget,
  map: PHOTOS.map,
  packing: PHOTOS.packing,
  journal: PHOTOS.journal,
};

export function QuickLinks() {
  return (
    <nav
      aria-label="빠른 링크"
      data-stagger
      className="grid auto-rows-[minmax(110px,auto)] grid-cols-2 gap-2 sm:auto-rows-[170px] sm:grid-cols-4 sm:gap-3"
    >
      {visibleQuickLinks().map((l, i) => {
        const lead = i === 0;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`tap ix-tile relative block overflow-hidden rounded-[12px] text-white ${
              lead ? "col-span-2 min-h-[140px] sm:row-span-2" : ""
            }`}
          >
            <Photo src={TILE_PHOTO[l.key]} className="absolute inset-0" />
            <span aria-hidden="true" className="scrim" />
            <span className={`absolute flex flex-col ${lead ? "bottom-3.5 left-4 sm:bottom-[22px] sm:left-6" : "bottom-2.5 left-3 sm:bottom-4 sm:left-[18px]"}`}>
              <span className={`font-bold ${lead ? "text-[19px] sm:text-[26px]" : "text-base sm:text-[19px]"}`}>{l.label}</span>
              <span className={lead ? "text-[13px] sm:text-[15px]" : "text-xs sm:text-sm"}>{l.desc}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
