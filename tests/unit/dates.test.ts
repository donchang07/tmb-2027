import { describe, expect, it } from "vitest";
import { daysBetween, formatKoDate, isStale, resolveTodayState, toLocalDateISO } from "@/lib/dates";
import { getDays } from "@/lib/itinerary";

describe("Europe/Paris date resolution (FR-009)", () => {
  it("converts UTC instants to Paris local dates across midnight (CEST = UTC+2)", () => {
    expect(toLocalDateISO(new Date("2027-08-03T23:30:00Z"))).toBe("2027-08-04");
    expect(toLocalDateISO(new Date("2027-08-02T21:59:59Z"))).toBe("2027-08-02");
    expect(toLocalDateISO(new Date("2027-08-02T22:00:00Z"))).toBe("2027-08-03");
    expect(toLocalDateISO(new Date("2027-08-17T21:59:00Z"))).toBe("2027-08-17");
    expect(toLocalDateISO(new Date("2027-08-17T22:00:00Z"))).toBe("2027-08-18");
  });

  it("treats KST 08:00 as the Paris trip day and flips to after at Paris midnight (FR-009)", () => {
    const days = getDays();

    // 2027-08-03 08:00 KST = 2027-08-03 01:00 Europe/Paris
    const kstMorning = new Date("2027-08-02T23:00:00Z");
    expect(toLocalDateISO(kstMorning)).toBe("2027-08-03");
    const departure = resolveTodayState(days, toLocalDateISO(kstMorning));
    expect(departure.kind).toBe("in_trip");
    if (departure.kind === "in_trip") expect(departure.day.date).toBe("2027-08-03");

    const lastMinute = resolveTodayState(days, toLocalDateISO(new Date("2027-08-17T21:59:59Z")));
    expect(lastMinute.kind).toBe("in_trip");
    if (lastMinute.kind === "in_trip") expect(lastMinute.day.date).toBe("2027-08-17");

    const justAfter = resolveTodayState(days, toLocalDateISO(new Date("2027-08-17T22:00:00Z")));
    expect(justAfter.kind).toBe("after");
    if (justAfter.kind === "after") expect(justAfter.lastDay.date).toBe("2027-08-17");
  });

  it("resolves before / in_trip / after states", () => {
    const days = getDays();
    const before = resolveTodayState(days, "2027-07-24");
    expect(before.kind).toBe("before");
    if (before.kind === "before") {
      expect(before.daysUntil).toBe(10);
      expect(before.firstDay.id).toBe("d2027-08-03");
    }

    const first = resolveTodayState(days, "2027-08-03");
    expect(first.kind).toBe("in_trip");
    const mid = resolveTodayState(days, "2027-08-10");
    expect(mid.kind).toBe("in_trip");
    if (mid.kind === "in_trip") expect(mid.day.trekDayNumber).toBe(7);
    const last = resolveTodayState(days, "2027-08-17");
    expect(last.kind).toBe("in_trip");

    const after = resolveTodayState(days, "2027-08-18");
    expect(after.kind).toBe("after");
    if (after.kind === "after") expect(after.lastDay.id).toBe("d2027-08-17");
  });

  it("returns empty for no days", () => {
    expect(resolveTodayState([], "2027-08-10").kind).toBe("empty");
  });

  it("daysBetween / isStale / formatKoDate", () => {
    expect(daysBetween("2026-09-09", "2026-09-16")).toBe(7);
    expect(isStale("2026-09-09", "2027-09-10", 365)).toBe(true);
    expect(isStale("2026-09-09", "2026-12-01", 365)).toBe(false);
    expect(formatKoDate("2027-08-04")).toBe("8월 4일 (수)");
    expect(formatKoDate("2027-08-03")).toBe("8월 3일 (화)");
  });
});
