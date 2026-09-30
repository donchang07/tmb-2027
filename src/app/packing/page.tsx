import type { Metadata } from "next";
import { PackingList, PackingSubtitle } from "@/components/packing/PackingList";
import { Photo } from "@/components/ui/Photo";
import { PHOTOS } from "@/lib/photos";
import { PACKING_CATEGORIES, packingItems } from "@/data/seed/packing";

export const metadata: Metadata = { title: "준비물 — TMB 2027" };

export default function PackingPage() {
  return (
    <PackingList
      categories={PACKING_CATEGORIES}
      items={packingItems}
      header={
        <>
          <Photo src={PHOTOS.packing} className="h-[140px] sm:h-[200px]" />
          <header>
            <h1 data-enter="1" className="text-[32px] font-extrabold leading-tight tracking-[-0.035em] sm:text-[40px]">
              준비물
            </h1>
            <PackingSubtitle />
          </header>
        </>
      }
    />
  );
}
