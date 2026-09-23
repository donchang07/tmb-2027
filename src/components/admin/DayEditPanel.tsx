"use client";

import { useState } from "react";
import type { BookingRow } from "@/lib/bookings/admin";
import type { Lodging } from "@/lib/schema";
import { BookingEditor, type EditorLodging } from "@/components/admin/BookingEditor";
import { LodgingFields } from "@/components/admin/LodgingFields";

export function DayEditPanel({
  lodging,
  dayLabel,
  booking,
  lodgings,
}: {
  lodging: Lodging;
  dayLabel: string;
  booking: BookingRow | null;
  lodgings: EditorLodging[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="card p-4" aria-labelledby="day-edit-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="day-edit-heading" className="font-bold">
          리더 편집
        </h3>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="day-edit-body"
          className="tap rounded-lg border border-alpine/40 px-3 text-sm font-semibold text-alpine"
        >
          {open ? "접기" : "펼치기"}
        </button>
      </div>
      <div id="day-edit-body" hidden={!open} className="mt-3 space-y-4">
        <BookingEditor lodging={{ id: lodging.id, nameOriginal: lodging.nameOriginal, dayLabel }} row={booking} lodgings={lodgings} />
        <LodgingFields lodging={lodging} />
      </div>
    </section>
  );
}
