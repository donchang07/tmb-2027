import { describe, expect, it } from "vitest";
import { isMissingDetailPath } from "@/lib/detail-routes";

describe("isMissingDetailPath (F-2, SCR-014)", () => {
  it("accepts known trek, travel and journal days", () => {
    expect(isMissingDetailPath("/day/d2027-08-04")).toBe(false);
    expect(isMissingDetailPath("/travel/d2027-08-03")).toBe(false);
    expect(isMissingDetailPath("/journal/d2027-08-04")).toBe(false);
    expect(isMissingDetailPath("/journal/login")).toBe(false);
  });

  it("flags unknown ids and wrong day types", () => {
    expect(isMissingDetailPath("/day/xyz")).toBe(true);
    expect(isMissingDetailPath("/travel/xyz")).toBe(true);
    expect(isMissingDetailPath("/journal/xyz")).toBe(true);
    expect(isMissingDetailPath("/day/d2027-09-30")).toBe(true);
    expect(isMissingDetailPath("/day/d2027-08-03")).toBe(true);
    expect(isMissingDetailPath("/travel/d2027-08-05")).toBe(true);
  });

  it("ignores other paths", () => {
    expect(isMissingDetailPath("/itinerary")).toBe(false);
    expect(isMissingDetailPath("/journal")).toBe(false);
    expect(isMissingDetailPath("/admin/bookings")).toBe(false);
  });
});
