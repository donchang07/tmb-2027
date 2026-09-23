import type { Metadata } from "next";
import { PackingList, PackingSubtitle } from "@/components/packing/PackingList";
import { PACKING_CATEGORIES, packingItems } from "@/data/seed/packing";

export const metadata: Metadata = { title: "준비물 — TMB 2027" };

export default function PackingPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">준비물</h1>
        <PackingSubtitle />
      </header>
      <PackingList categories={PACKING_CATEGORIES} items={packingItems} />
    </div>
  );
}
