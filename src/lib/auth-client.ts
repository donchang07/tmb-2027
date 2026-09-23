"use client";

import { useSyncExternalStore } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { detectAuthTransition } from "@/lib/auth-rules";
import { clearAccountStorage } from "@/lib/packing-sync";
import { createBrowserClient } from "@/lib/supabase/browser";
import { PAGES_CACHE_PREFIX } from "@/lib/sw-rules";

// Design Ref: §3.1 DATA-017, §5.3.1 — 세션 스토어(쿠키 로컬 읽기), 로그인·로그아웃·만료 시 SW page 캐시 삭제

export type AuthView =
  | { status: "loading" }
  | { status: "unconfigured" }
  | { status: "guest"; expired: boolean }
  | { status: "user"; userId: string; email: string };

export const LAST_UID_KEY = "tmb2027:auth:last-uid";

const LOADING: AuthView = { status: "loading" };

let snapshot: AuthView = LOADING;
let started = false;
let client: SupabaseClient | null | undefined;
const listeners = new Set<() => void>();

function readLastUid(): string | null {
  try {
    return window.localStorage.getItem(LAST_UID_KEY);
  } catch {
    return null;
  }
}

function writeLastUid(uid: string | null): void {
  try {
    if (uid) window.localStorage.setItem(LAST_UID_KEY, uid);
    else window.localStorage.removeItem(LAST_UID_KEY);
  } catch {
    // 저장소 차단 시 메모리 상태만 사용
  }
}

function emit(next: AuthView): void {
  snapshot = next;
  for (const l of listeners) l();
}

export function getAuthClient(): SupabaseClient | null {
  if (client === undefined) client = createBrowserClient();
  return client;
}

export async function clearSwPageCache(): Promise<void> {
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    navigator.serviceWorker.controller?.postMessage({ type: "clear_pages" });
  }
  if (typeof caches === "undefined") return;
  try {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith(PAGES_CACHE_PREFIX)).map((k) => caches.delete(k)));
  } catch {
    // 캐시 삭제 실패는 이동을 막지 않음
  }
}

function resolve(session: Session | null): void {
  const prev = readLastUid();
  const nextUid = session?.user.id ?? null;
  const transition = detectAuthTransition(prev, nextUid);
  if (transition === "login" || transition === "switch" || transition === "logout-or-expired") void clearSwPageCache();
  writeLastUid(nextUid);
  if (session && nextUid) {
    const email = session.user.email ?? "";
    if (snapshot.status === "user" && snapshot.userId === nextUid && snapshot.email === email) return;
    emit({ status: "user", userId: nextUid, email });
    return;
  }
  const expired = transition === "logout-or-expired" || (snapshot.status === "guest" && snapshot.expired);
  if (snapshot.status === "guest" && snapshot.expired === expired) return;
  emit({ status: "guest", expired });
}

function start(): void {
  if (started) return;
  started = true;
  const supabase = getAuthClient();
  if (!supabase) {
    emit({ status: "unconfigured" });
    return;
  }
  supabase.auth
    .getSession()
    .then(({ data }) => resolve(data.session))
    .catch(() => resolve(null));
  supabase.auth.onAuthStateChange((_event, session) => resolve(session));
}

export const authStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    start();
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot(): AuthView {
    return snapshot;
  },
  getServerSnapshot(): AuthView {
    return LOADING;
  },
};

export function useAuthUser(): AuthView {
  return useSyncExternalStore(authStore.subscribe, authStore.getSnapshot, authStore.getServerSnapshot);
}

export function dismissExpired(): void {
  if (snapshot.status === "guest" && snapshot.expired) emit({ status: "guest", expired: false });
}

export async function prepareSignOut(): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return false;
  const lastUid = readLastUid();
  if (lastUid) clearAccountStorage(lastUid);
  writeLastUid(null);
  await clearSwPageCache();
  return true;
}
