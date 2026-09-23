import type { SupabaseClient } from "@supabase/supabase-js";
import { PACKING_STORE_VERSION, type PackingState } from "@/lib/packing-store";

// Design Ref: §3.1 DATA-014·018, §5.3.4 — 계정 체크 병합·대기열·기기 사본(순수 함수 + localStorage 래퍼)

export type CheckChange = { itemId: string; checked: boolean; updatedAt: string };
export type CheckMap = Record<string, { checked: boolean; updatedAt: string }>;
export type AccountCopy = { version: 1; userId: string; rows: CheckMap; syncedAt: string | null };
export type PackingCheckRow = { item_id: string; checked: boolean; updated_at: string };

export const ACCOUNT_COPY_PREFIX = "tmb2027:packing:acct:v1:";
export const QUEUE_PREFIX = "tmb2027:packing:queue:v1:";
export const MIGRATED_PREFIX = "tmb2027:packing:migrated:v1:";

function isNewer(a: string, b: string): boolean {
  return Date.parse(a) > Date.parse(b);
}

export function rowsToMap(rows: readonly PackingCheckRow[], validIds: Set<string>): CheckMap {
  const out: CheckMap = {};
  for (const r of rows) {
    if (!validIds.has(r.item_id)) continue;
    const prev = out[r.item_id];
    if (prev && !isNewer(r.updated_at, prev.updatedAt)) continue;
    out[r.item_id] = { checked: r.checked, updatedAt: r.updated_at };
  }
  return out;
}

export function mergeLatest(a: CheckMap, b: CheckMap): CheckMap {
  const out: CheckMap = { ...a };
  for (const [id, v] of Object.entries(b)) {
    const cur = out[id];
    if (!cur || !isNewer(cur.updatedAt, v.updatedAt)) out[id] = v;
  }
  return out;
}

export function applyQueue(base: CheckMap, queue: CheckMap): CheckMap {
  return mergeLatest(base, queue);
}

export function enqueue(queue: CheckMap, change: CheckChange): CheckMap {
  const cur = queue[change.itemId];
  if (cur && isNewer(cur.updatedAt, change.updatedAt)) return queue;
  return { ...queue, [change.itemId]: { checked: change.checked, updatedAt: change.updatedAt } };
}

export function enqueueAll(queue: CheckMap, changes: readonly CheckChange[]): CheckMap {
  return changes.reduce(enqueue, queue);
}

export function ackQueue(queue: CheckMap, sent: readonly CheckChange[]): CheckMap {
  const out: CheckMap = { ...queue };
  for (const s of sent) {
    const cur = out[s.itemId];
    if (cur && !isNewer(cur.updatedAt, s.updatedAt)) delete out[s.itemId];
  }
  return out;
}

export function queueToChanges(queue: CheckMap): CheckChange[] {
  return Object.entries(queue).map(([itemId, v]) => ({ itemId, checked: v.checked, updatedAt: v.updatedAt }));
}

export function unionMigration(local: PackingState, account: CheckMap, now: string): CheckChange[] {
  return Object.keys(local.checked)
    .filter((id) => account[id]?.checked !== true)
    .map((itemId) => ({ itemId, checked: true, updatedAt: now }));
}

export function clearAllChanges(view: CheckMap, now: string): CheckChange[] {
  return Object.entries(view)
    .filter(([, v]) => v.checked)
    .map(([itemId]) => ({ itemId, checked: false, updatedAt: now }));
}

export function lastSavedAt(map: CheckMap): string | null {
  let max: string | null = null;
  for (const v of Object.values(map)) if (max === null || isNewer(v.updatedAt, max)) max = v.updatedAt;
  return max;
}

export function toPackingState(map: CheckMap): PackingState {
  const checked: Record<string, true> = {};
  for (const [id, v] of Object.entries(map)) if (v.checked) checked[id] = true;
  return { version: PACKING_STORE_VERSION, checked, updatedAt: lastSavedAt(map) };
}

export function normalizeLatest(changes: readonly CheckChange[]): CheckChange[] {
  return queueToChanges(enqueueAll({}, changes));
}

export async function fetchPackingChecks(client: SupabaseClient, validIds: Set<string>): Promise<CheckMap> {
  const { data, error } = await client.from("packing_checks").select("item_id, checked, updated_at");
  if (error) throw new Error(error.message);
  return rowsToMap((data ?? []) as PackingCheckRow[], validIds);
}

function parseCheckMap(value: unknown, validIds: Set<string>): CheckMap {
  const out: CheckMap = {};
  if (typeof value !== "object" || value === null) return out;
  for (const [id, v] of Object.entries(value as Record<string, unknown>)) {
    if (!validIds.has(id) || typeof v !== "object" || v === null) continue;
    const row = v as { checked?: unknown; updatedAt?: unknown };
    if (typeof row.checked === "boolean" && typeof row.updatedAt === "string") out[id] = { checked: row.checked, updatedAt: row.updatedAt };
  }
  return out;
}

const memory = new Map<string, string>();

function storageGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
}

function storageSet(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    memory.set(key, value);
    return false;
  }
}

function storageRemove(key: string): void {
  memory.delete(key);
  try {
    window.localStorage.removeItem(key);
  } catch {
    // 저장소 차단 시 메모리 사본만 제거
  }
}

function readJson(key: string): unknown {
  const raw = storageGet(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function readAccountCopy(userId: string, validIds: Set<string>): AccountCopy | null {
  const data = readJson(ACCOUNT_COPY_PREFIX + userId);
  if (typeof data !== "object" || data === null) return null;
  const obj = data as { version?: unknown; userId?: unknown; rows?: unknown; syncedAt?: unknown };
  if (obj.version !== 1 || obj.userId !== userId) return null;
  return { version: 1, userId, rows: parseCheckMap(obj.rows, validIds), syncedAt: typeof obj.syncedAt === "string" ? obj.syncedAt : null };
}

export function writeAccountCopy(userId: string, rows: CheckMap, syncedAt: string): boolean {
  const copy: AccountCopy = { version: 1, userId, rows, syncedAt };
  return storageSet(ACCOUNT_COPY_PREFIX + userId, JSON.stringify(copy));
}

export function readQueue(userId: string, validIds: Set<string>): CheckMap {
  return parseCheckMap(readJson(QUEUE_PREFIX + userId), validIds);
}

export function writeQueue(userId: string, queue: CheckMap): boolean {
  if (Object.keys(queue).length === 0) {
    storageRemove(QUEUE_PREFIX + userId);
    return true;
  }
  return storageSet(QUEUE_PREFIX + userId, JSON.stringify(queue));
}

export function isMigrated(userId: string): boolean {
  return storageGet(MIGRATED_PREFIX + userId) === "1";
}

export function markMigrated(userId: string): boolean {
  return storageSet(MIGRATED_PREFIX + userId, "1");
}

export function clearAccountStorage(userId: string): void {
  storageRemove(ACCOUNT_COPY_PREFIX + userId);
  storageRemove(QUEUE_PREFIX + userId);
}
