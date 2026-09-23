"use client";

import { useState } from "react";
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
}: {
  days: Day[];
  lodgings: Lodging[];
  legsByDay: Record<string, TravelLeg[]>;
  todayId: string | null;
  bookingStatuses?: Record<string, BookingStatus>;
  bookingUpdatedAt?: Record<string, string | null>;
  missingByDay?: Record<string, string[]>;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const visible = days.filter((d) => filter === "all" || d.type === filter);

  return (
    <div>
      <div role="tablist" aria-label="일정 필터" className="mb-4 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            role="tab"
            type="button"
            aria-selected={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={`tap rounded-full px-4 text-sm font-medium ${
              filter === f.key ? "bg-alpine text-white" : "bg-white text-rock border border-rock/30"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <p className="card p-6 text-center text-rock">일정 없음</p>
      ) : (
        <ol className="space-y-3">
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
