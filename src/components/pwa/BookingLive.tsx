"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { PublicBooking } from "@/lib/bookings/public";
import {
  applyRealtimeRow,
  initialState,
  loadSnapshot,
  mergeBookings,
  parseBookingsPayload,
  POLL_MS,
  saveSnapshot,
  shouldPoll,
  toPublicRow,
  type LiveState,
} from "@/lib/bookings/live";
import { createBrowserClient } from "@/lib/supabase/browser";

type BookingLiveValue = { state: LiveState; get: (lodgingId: string) => PublicBooking | undefined };

const EMPTY_STATE: LiveState = { bookings: {}, fetchedAt: null, source: "server", error: false, online: true };
const BookingLiveContext = createContext<BookingLiveValue>({ state: EMPTY_STATE, get: () => undefined });

export function useBookingLive(): BookingLiveValue {
  return useContext(BookingLiveContext);
}

function browserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function BookingLive({ initial, fetchedAt, children }: { initial: PublicBooking[]; fetchedAt: string; children: React.ReactNode }) {
  const [state, setState] = useState<LiveState>(() => initialState(initial, fetchedAt));
  const subscribedRef = useRef(false);

  useEffect(() => {
    const snapshot = loadSnapshot(browserStorage());
    setState((s) => {
      const next = snapshot && (s.fetchedAt === null || Date.parse(snapshot.fetchedAt) > Date.parse(s.fetchedAt)) ? mergeBookings(s, snapshot.bookings, "snapshot", snapshot.fetchedAt) : s;
      return next.online === navigator.onLine ? next : { ...next, online: navigator.onLine };
    });

    const goOnline = () => setState((s) => ({ ...s, online: true }));
    const goOffline = () => setState((s) => ({ ...s, online: false }));
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    const supabase = createBrowserClient();
    if (!supabase) return;
    const channel = supabase
      .channel("bookings_public")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings_public" }, (payload) => {
        const row = toPublicRow(payload.new);
        if (row) setState((s) => applyRealtimeRow(s, row));
      })
      .subscribe((status) => {
        subscribedRef.current = status === "SUBSCRIBED";
      });
    return () => {
      subscribedRef.current = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!shouldPoll({ online: navigator.onLine, visible: document.visibilityState === "visible", subscribed: subscribedRef.current })) return;
      void fetch("/api/bookings", { cache: "no-store" })
        .then(async (res) => {
          if (!res.ok) throw new Error(`booking fetch ${res.status}`);
          const rows = parseBookingsPayload((await res.json()) as unknown);
          if (!rows) throw new Error("booking payload invalid");
          setState((s) => mergeBookings(s, rows, "poll"));
        })
        .catch(() => setState((s) => ({ ...s, error: true })));
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    saveSnapshot(browserStorage(), state);
  }, [state]);

  const get = useCallback((lodgingId: string) => state.bookings[lodgingId], [state]);
  const value = useMemo<BookingLiveValue>(() => ({ state, get }), [state, get]);

  return <BookingLiveContext.Provider value={value}>{children}</BookingLiveContext.Provider>;
}
