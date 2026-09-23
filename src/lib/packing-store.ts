import type { PackingItem } from "@/data/seed/packing";

export const PACKING_STORAGE_KEY = "tmb2027:packing:v1";
export const PACKING_STORE_VERSION = 1 as const;

export type PackingState = { version: typeof PACKING_STORE_VERSION; checked: Record<string, true>; updatedAt: string | null };

export function emptyState(): PackingState {
  return { version: PACKING_STORE_VERSION, checked: {}, updatedAt: null };
}

export function parseState(raw: string | null, validIds: Set<string>): PackingState {
  if (!raw) return emptyState();
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return emptyState();
    const obj = data as { version?: unknown; checked?: unknown; updatedAt?: unknown };
    if (obj.version !== PACKING_STORE_VERSION) return emptyState();
    const checked: Record<string, true> = {};
    if (typeof obj.checked === "object" && obj.checked !== null) {
      for (const [id, v] of Object.entries(obj.checked as Record<string, unknown>)) {
        if (v === true && validIds.has(id)) checked[id] = true;
      }
    }
    const updatedAt = typeof obj.updatedAt === "string" ? obj.updatedAt : null;
    return { version: PACKING_STORE_VERSION, checked, updatedAt };
  } catch {
    return emptyState();
  }
}

export function serializeState(state: PackingState): string {
  return JSON.stringify(state);
}

export function toggle(state: PackingState, id: string, now: string): PackingState {
  const checked = { ...state.checked };
  if (checked[id]) delete checked[id];
  else checked[id] = true;
  return { version: PACKING_STORE_VERSION, checked, updatedAt: now };
}

export function clearAll(now: string): PackingState {
  return { version: PACKING_STORE_VERSION, checked: {}, updatedAt: now };
}

export function progress(state: PackingState, items: PackingItem[]): { done: number; total: number; percent: number } {
  const total = items.length;
  const done = items.filter((it) => state.checked[it.id]).length;
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}

export function loadState(validIds: Set<string>): { state: PackingState; storageOk: boolean } {
  try {
    const raw = window.localStorage.getItem(PACKING_STORAGE_KEY);
    return { state: parseState(raw, validIds), storageOk: true };
  } catch {
    return { state: emptyState(), storageOk: false };
  }
}

export function saveState(state: PackingState): boolean {
  try {
    window.localStorage.setItem(PACKING_STORAGE_KEY, serializeState(state));
    return true;
  } catch {
    return false;
  }
}

export function stateFromChecked(checked: Record<string, true>, updatedAt: string | null): PackingState {
  return { version: PACKING_STORE_VERSION, checked: { ...checked }, updatedAt };
}
