import type { Day } from "@/lib/schema";
import { logEvent } from "@/lib/log";

export const TRIP_TZ = "Europe/Paris";

export function toLocalDateISO(now: Date, tz: string = TRIP_TZ): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function daysBetween(aISO: string, bISO: string): number {
  const a = Date.parse(`${aISO}T00:00:00Z`);
  const b = Date.parse(`${bISO}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

export type TodayState =
  | { kind: "in_trip"; day: Day }
  | { kind: "before"; daysUntil: number; firstDay: Day }
  | { kind: "after"; lastDay: Day }
  | { kind: "empty" };

export function resolveTodayState(days: Day[], todayISO: string): TodayState {
  const sorted = [...days].sort((x, y) => x.sequence - y.sequence);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (!first || !last) return { kind: "empty" };

  const match = sorted.find((d) => d.date === todayISO);
  if (match) return { kind: "in_trip", day: match };

  if (todayISO < first.date) {
    const daysUntil = daysBetween(todayISO, first.date);
    logEvent("trip_date_outside", "info", { todayISO, relation: "before", daysUntil });
    return { kind: "before", daysUntil, firstDay: first };
  }

  logEvent("trip_date_outside", "info", { todayISO, relation: "after" });
  return { kind: "after", lastDay: last };
}

const WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"] as const;

export function formatKoDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const weekday = WEEKDAYS_KO[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${m}월 ${d}일 (${weekday})`;
}

export function formatKoDateTime(isoTimestamp: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: TRIP_TZ,
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoTimestamp));
}

export function isStale(checkedAtISO: string, todayISO: string, maxAgeDays: number): boolean {
  return daysBetween(checkedAtISO, todayISO) > maxAgeDays;
}
