"use client";

import { useState, type ReactNode } from "react";
import type { Day, Lodging, TravelLeg } from "@/lib/schema";
import type { BookingStatus } from "@/lib/booking-status";
import { DayCard } from "@/components/itinerary/DayCard";
import { TravelDayCard } from "@/components/itinerary/TravelDayCard";

type Filter = "all" | "travel" | "trek";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "travel", label: "이동" },
  { key: "trek", label: "트레킹" },
];

export function ItineraryList({
  days,
  lodgings,
  legsByDay,
  todayId,
  bookingStatuses = {},
  bookingUpdatedAt = {},
  missingByDay = {},
  header,
  notice,
}: {
  days: Day[];
  lodgings: Lodging[];
  legsByDay: Record<string, TravelLeg[]>;
  todayId: string | null;
  bookingStatuses?: Record<string, BookingStatus>;
  bookingUpdatedAt?: Record<string, string | null>;
  missingByDay?: Record<string, string[]>;
  header?: ReactNode;
  notice?: ReactNode;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const visible = days.filter((d) => filter === "all" || d.type === filter);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        {header}
        <div role="tablist" aria-label="일정 필터" className="seg sm:flex-none">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              role="tab"
              type="button"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              className="seg-item"
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      {notice}
      {visible.length === 0 ? (
        <p className="card p-6 text-center text-ink-3">일정 없음</p>
      ) : (
        <ol data-stagger className="grid gap-2.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {visible.map((day) => (
            <li key={day.id}>
              {day.type === "trek" ? (
                <DayCard
                  day={day}
                  lodging={lodgings.find((l) => l.id === day.lodgingId)}
                  isToday={day.id === todayId}
                  bookingStatus={day.lodgingId ? bookingStatuses[day.lodgingId] ?? "unbooked" : "unbooked"}
                  bookingUpdatedAt={day.lodgingId ? bookingUpdatedAt[day.lodgingId] ?? null : null}
                  missingFields={missingByDay[day.id] ?? []}
                />
              ) : (
                <TravelDayCard day={day} legs={legsByDay[day.id] ?? []} isToday={day.id === todayId} />
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
