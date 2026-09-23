import { describe, expect, it } from "vitest";
import {
  applyRealtimeRow,
  errorMessage,
  initialState,
  loadSnapshot,
  mergeBookings,
  offlineMessage,
  parseBookingsPayload,
  POLL_MS,
  saveSnapshot,
  shouldPoll,
  SNAPSHOT_KEY,
  toPublicRow,
  type LiveState,
} from "@/lib/bookings/live";
import type { PublicBooking } from "@/lib/bookings/public";

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length(): number {
    return this.map.size;
  }
  clear(): void {
    this.map.clear();
  }
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

const booking = (over: Partial<PublicBooking> = {}): PublicBooking => ({
  lodgingId: "mottets",
  status: "inquiry",
  alternativeLodging: null,
  alternativeLodgingId: null,
  updatedAt: "2026-09-16T10:00:00.000Z",
  ...over,
});

const base = (over: Partial<LiveState> = {}): LiveState => ({
  bookings: { mottets: booking() },
  fetchedAt: "2026-09-16T10:00:00.000Z",
  source: "server",
  error: false,
  online: true,
  ...over,
});

describe("booking live logic (SC-004, FR-013, Edge 예약 상태 서버 오류)", () => {
  it("initialState indexes rows by lodgingId and keeps the server render time", () => {
    const s = initialState([booking(), booking({ lodgingId: "elisabetta", updatedAt: "2026-09-17T09:00:00.000Z" })], "2026-09-17T09:30:00.000Z");
    expect(Object.keys(s.bookings).sort()).toEqual(["elisabetta", "mottets"]);
    expect(s.fetchedAt).toBe("2026-09-17T09:30:00.000Z");
    expect(s.source).toBe("server");
    expect(s.error).toBe(false);
  });

  it("mergeBookings replaces only rows with a newer updatedAt", () => {
    const s = mergeBookings(
      base(),
      [
        booking({ status: "confirmed", updatedAt: "2026-09-15T10:00:00.000Z" }),
        booking({ lodgingId: "elisabetta", status: "waitlist", updatedAt: "2026-09-17T08:00:00.000Z" }),
      ],
      "poll",
      "2026-09-17T12:00:00.000Z",
    );
    expect(s.bookings.mottets?.status).toBe("inquiry");
    expect(s.bookings.elisabetta?.status).toBe("waitlist");
    expect(s.fetchedAt).toBe("2026-09-17T12:00:00.000Z");
    expect(s.source).toBe("poll");
  });

  it("mergeBookings takes the newer row and clears a previous error", () => {
    const s = mergeBookings(base({ error: true }), [booking({ status: "confirmed", updatedAt: "2026-09-17T11:00:00.000Z" })], "poll", "2026-09-17T11:00:01.000Z");
    expect(s.bookings.mottets?.status).toBe("confirmed");
    expect(s.error).toBe(false);
  });

  it("mergeBookings adds rows with a null updatedAt only when unknown", () => {
    const added = mergeBookings(base(), [booking({ lodgingId: "bonhomme", updatedAt: null })], "poll", "2026-09-17T12:00:00.000Z");
    expect(added.bookings.bonhomme?.lodgingId).toBe("bonhomme");
    const kept = mergeBookings(base(), [booking({ status: "confirmed", updatedAt: null })], "poll", "2026-09-17T12:00:00.000Z");
    expect(kept.bookings.mottets?.status).toBe("inquiry");
  });

  it("applyRealtimeRow merges a valid row and ignores an unknown status", () => {
    const row = {
      lodging_id: "mottets",
      status: "confirmed",
      alternative_lodging: null,
      alternative_lodging_id: null,
      updated_at: "2026-09-17T13:00:00.000Z",
    };
    const s = applyRealtimeRow(base(), row, "2026-09-17T13:00:01.000Z");
    expect(s.bookings.mottets?.status).toBe("confirmed");
    expect(s.source).toBe("realtime");
    expect(s.fetchedAt).toBe("2026-09-17T13:00:01.000Z");

    const prev = base();
    expect(applyRealtimeRow(prev, { ...row, status: "cancelled" })).toBe(prev);
  });

  it("toPublicRow validates realtime payloads", () => {
    expect(toPublicRow({ lodging_id: "mottets", status: "confirmed", updated_at: "2026-09-17T13:00:00.000Z" })).toEqual({
      lodging_id: "mottets",
      status: "confirmed",
      alternative_lodging: null,
      alternative_lodging_id: null,
      updated_at: "2026-09-17T13:00:00.000Z",
    });
    expect(toPublicRow({})).toBeNull();
    expect(toPublicRow(null)).toBeNull();
    expect(toPublicRow({ lodging_id: 1, status: "confirmed" })).toBeNull();
  });

  it("parseBookingsPayload keeps valid rows and rejects a malformed body", () => {
    const rows = parseBookingsPayload({ bookings: [booking(), { lodgingId: "x", status: "nope" }, 7], configured: true });
    expect(rows).toHaveLength(1);
    expect(rows?.[0]?.lodgingId).toBe("mottets");
    expect(parseBookingsPayload({ ok: true })).toBeNull();
    expect(parseBookingsPayload("nope")).toBeNull();
  });

  it("shouldPoll only when online, visible and not subscribed (SC-004)", () => {
    expect(POLL_MS).toBe(30_000);
    expect(shouldPoll({ online: true, visible: true, subscribed: false })).toBe(true);
    expect(shouldPoll({ online: true, visible: true, subscribed: true })).toBe(false);
    expect(shouldPoll({ online: true, visible: false, subscribed: false })).toBe(false);
    expect(shouldPoll({ online: false, visible: true, subscribed: false })).toBe(false);
  });

  it("saves and restores a snapshot through Storage", () => {
    const storage = new MemoryStorage();
    saveSnapshot(storage, base());
    expect(storage.getItem(SNAPSHOT_KEY)).toContain("mottets");
    expect(loadSnapshot(storage)).toEqual({ fetchedAt: "2026-09-16T10:00:00.000Z", bookings: [booking()] });
  });

  it("snapshot helpers tolerate no storage, no entry and broken JSON", () => {
    const storage = new MemoryStorage();
    expect(loadSnapshot(null)).toBeNull();
    expect(loadSnapshot(storage)).toBeNull();
    saveSnapshot(null, base());
    saveSnapshot(storage, base({ fetchedAt: null }));
    expect(storage.getItem(SNAPSHOT_KEY)).toBeNull();
    storage.setItem(SNAPSHOT_KEY, "{oops");
    expect(loadSnapshot(storage)).toBeNull();
    storage.setItem(SNAPSHOT_KEY, JSON.stringify({ fetchedAt: 1, bookings: [] }));
    expect(loadSnapshot(storage)).toBeNull();
  });

  it("errorMessage and offlineMessage show the last update time (Edge 예약 상태 서버 오류)", () => {
    expect(errorMessage(null)).toBe("예약 상태를 불러올 수 없습니다 · 마지막 갱신 없음");
    expect(errorMessage("2026-09-17T08:30:00.000Z")).toMatch(/^예약 상태를 불러올 수 없습니다 · 마지막 갱신 /);
    expect(offlineMessage(null)).toBe("오프라인 · 마지막 갱신 없음");
    expect(offlineMessage("2026-09-17T08:30:00.000Z")).toMatch(/^오프라인 · 마지막 갱신 /);
  });
});
