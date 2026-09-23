import { isBookingStatus } from "@/lib/booking-status";
import { formatKoDateTime } from "@/lib/dates";
import type { PublicBooking } from "@/lib/bookings/public";

export const POLL_MS = 30_000;
export const SNAPSHOT_KEY = "tmb.bookingSnapshot";

export type Snapshot = { fetchedAt: string; bookings: PublicBooking[] };
export type LiveSource = "server" | "realtime" | "poll" | "snapshot";
export type LiveState = {
  bookings: Record<string, PublicBooking>;
  fetchedAt: string | null;
  source: LiveSource;
  error: boolean;
  online: boolean;
};

export type PublicRow = {
  lodging_id: string;
  status: string;
  alternative_lodging: string | null;
  alternative_lodging_id: string | null;
  updated_at: string | null;
};

function isNewer(next: string | null, prev: string | null): boolean {
  if (next === null) return false;
  if (prev === null) return true;
  return Date.parse(next) > Date.parse(prev);
}

/** `fetchedAt`은 서버 렌더 시각 — 스냅샷·폴링의 `fetchedAt`(조회 시각)과 같은 의미로 비교된다 */
export function initialState(rows: PublicBooking[], fetchedAt: string, online = true): LiveState {
  const bookings: Record<string, PublicBooking> = {};
  for (const row of rows) bookings[row.lodgingId] = row;
  return { bookings, fetchedAt, source: "server", error: false, online };
}

export function mergeBookings(state: LiveState, rows: PublicBooking[], source: LiveSource, at: string = new Date().toISOString()): LiveState {
  const bookings = { ...state.bookings };
  for (const row of rows) {
    const prev = bookings[row.lodgingId];
    if (prev && !isNewer(row.updatedAt, prev.updatedAt)) continue;
    bookings[row.lodgingId] = row;
  }
  return { ...state, bookings, fetchedAt: at, source, error: false };
}

export function applyRealtimeRow(state: LiveState, row: PublicRow, at: string = new Date().toISOString()): LiveState {
  if (!isBookingStatus(row.status)) return state;
  const booking: PublicBooking = {
    lodgingId: row.lodging_id,
    status: row.status,
    alternativeLodging: row.alternative_lodging,
    alternativeLodgingId: row.alternative_lodging_id,
    updatedAt: row.updated_at,
  };
  return mergeBookings(state, [booking], "realtime", at);
}

export function shouldPoll(s: { online: boolean; visible: boolean; subscribed: boolean }): boolean {
  return s.online && s.visible && !s.subscribed;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export function toPublicRow(value: unknown): PublicRow | null {
  const o = asRecord(value);
  if (!o || typeof o.lodging_id !== "string" || typeof o.status !== "string") return null;
  return {
    lodging_id: o.lodging_id,
    status: o.status,
    alternative_lodging: nullableString(o.alternative_lodging),
    alternative_lodging_id: nullableString(o.alternative_lodging_id),
    updated_at: nullableString(o.updated_at),
  };
}

function toPublicBooking(value: unknown): PublicBooking | null {
  const o = asRecord(value);
  if (!o || typeof o.lodgingId !== "string" || !isBookingStatus(o.status)) return null;
  return {
    lodgingId: o.lodgingId,
    status: o.status,
    alternativeLodging: nullableString(o.alternativeLodging),
    alternativeLodgingId: nullableString(o.alternativeLodgingId),
    updatedAt: nullableString(o.updatedAt),
  };
}

/** `/api/bookings` 응답 본문 파싱 — 형식이 다르면 null */
export function parseBookingsPayload(value: unknown): PublicBooking[] | null {
  const o = asRecord(value);
  if (!o || !Array.isArray(o.bookings)) return null;
  const rows: PublicBooking[] = [];
  for (const item of o.bookings) {
    const booking = toPublicBooking(item);
    if (booking) rows.push(booking);
  }
  return rows;
}

export function saveSnapshot(storage: Storage | null, s: LiveState): void {
  if (!storage || !s.fetchedAt) return;
  const snapshot: Snapshot = { fetchedAt: s.fetchedAt, bookings: Object.values(s.bookings) };
  try {
    storage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    // 저장 실패(용량·프라이빗 모드)는 화면 동작에 영향을 주지 않음
  }
}

export function loadSnapshot(storage: Storage | null): Snapshot | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    const o = asRecord(JSON.parse(raw) as unknown);
    if (!o || typeof o.fetchedAt !== "string" || !Array.isArray(o.bookings)) return null;
    const bookings: PublicBooking[] = [];
    for (const item of o.bookings) {
      const booking = toPublicBooking(item);
      if (booking) bookings.push(booking);
    }
    return { fetchedAt: o.fetchedAt, bookings };
  } catch {
    return null;
  }
}

export function errorMessage(fetchedAt: string | null): string {
  return `예약 상태를 불러올 수 없습니다 · 마지막 갱신 ${fetchedAt ? formatKoDateTime(fetchedAt) : "없음"}`;
}

export function offlineMessage(fetchedAt: string | null): string {
  return `오프라인 · 마지막 갱신 ${fetchedAt ? formatKoDateTime(fetchedAt) : "없음"}`;
}
