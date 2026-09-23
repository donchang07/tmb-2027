import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ACCOUNT_COPY_PREFIX,
  ackQueue,
  applyQueue,
  clearAccountStorage,
  clearAllChanges,
  enqueue,
  isMigrated,
  lastSavedAt,
  markMigrated,
  mergeLatest,
  normalizeLatest,
  queueToChanges,
  readAccountCopy,
  readQueue,
  rowsToMap,
  toPackingState,
  unionMigration,
  writeAccountCopy,
  writeQueue,
  type CheckMap,
} from "@/lib/packing-sync";
import { stateFromChecked } from "@/lib/packing-store";

const T1 = "2026-09-23T01:00:00.000Z";
const T2 = "2026-09-23T02:00:00.000Z";
const T3 = "2026-09-23T03:00:00.000Z";
const valid = new Set(["a", "b", "c", "d", "e"]);

function installStorage(fail = false) {
  const store = new Map<string, string>();
  const localStorage = {
    getItem: (k: string) => {
      if (fail) throw new Error("blocked");
      return store.get(k) ?? null;
    },
    setItem: (k: string, v: string) => {
      if (fail) throw new Error("blocked");
      store.set(k, v);
    },
    removeItem: (k: string) => {
      if (fail) throw new Error("blocked");
      store.delete(k);
    },
  };
  vi.stubGlobal("window", { localStorage });
  return store;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("packing-sync merge rules (FR-024, SC-018)", () => {
  it("maps rows and drops unknown ids", () => {
    const map = rowsToMap(
      [
        { item_id: "a", checked: true, updated_at: T1 },
        { item_id: "zzz", checked: true, updated_at: T1 },
      ],
      valid,
    );
    expect(map).toEqual({ a: { checked: true, updatedAt: T1 } });
  });

  it("mergeLatest keeps the newer updatedAt per item and prefers b on ties", () => {
    const a: CheckMap = { a: { checked: true, updatedAt: T2 }, b: { checked: true, updatedAt: T1 }, c: { checked: true, updatedAt: T1 } };
    const b: CheckMap = { a: { checked: false, updatedAt: T1 }, b: { checked: false, updatedAt: T2 }, c: { checked: false, updatedAt: T1 } };
    expect(mergeLatest(a, b)).toEqual({
      a: { checked: true, updatedAt: T2 },
      b: { checked: false, updatedAt: T2 },
      c: { checked: false, updatedAt: T1 },
    });
    expect(applyQueue(a, b)).toEqual(mergeLatest(a, b));
  });

  it("enqueue keeps one latest change per item", () => {
    let q: CheckMap = {};
    q = enqueue(q, { itemId: "a", checked: true, updatedAt: T2 });
    q = enqueue(q, { itemId: "a", checked: false, updatedAt: T1 });
    expect(q.a).toEqual({ checked: true, updatedAt: T2 });
    q = enqueue(q, { itemId: "a", checked: false, updatedAt: T3 });
    expect(q.a).toEqual({ checked: false, updatedAt: T3 });
    expect(queueToChanges(q)).toEqual([{ itemId: "a", checked: false, updatedAt: T3 }]);
  });

  it("ackQueue removes only items not changed after they were sent", () => {
    const q: CheckMap = { a: { checked: true, updatedAt: T1 }, b: { checked: false, updatedAt: T3 } };
    const acked = ackQueue(q, [
      { itemId: "a", checked: true, updatedAt: T1 },
      { itemId: "b", checked: true, updatedAt: T2 },
    ]);
    expect(acked).toEqual({ b: { checked: false, updatedAt: T3 } });
  });

  it("unionMigration adds only local checks missing from the account", () => {
    const local = stateFromChecked({ a: true, b: true, c: true }, T1);
    const account: CheckMap = { c: { checked: true, updatedAt: T1 }, d: { checked: true, updatedAt: T1 } };
    const changes = unionMigration(local, account, T3);
    expect(changes).toHaveLength(2);
    expect(changes.map((c) => c.itemId).sort()).toEqual(["a", "b"]);
    expect(changes.every((c) => c.checked && c.updatedAt === T3)).toBe(true);
  });

  it("clearAllChanges unchecks every checked item", () => {
    const view: CheckMap = { a: { checked: true, updatedAt: T1 }, b: { checked: false, updatedAt: T1 }, c: { checked: true, updatedAt: T2 } };
    expect(clearAllChanges(view, T3)).toEqual([
      { itemId: "a", checked: false, updatedAt: T3 },
      { itemId: "c", checked: false, updatedAt: T3 },
    ]);
  });

  it("converts to packing state and reports the latest save time", () => {
    const view: CheckMap = { a: { checked: true, updatedAt: T1 }, b: { checked: false, updatedAt: T3 } };
    expect(toPackingState(view)).toEqual({ version: 1, checked: { a: true }, updatedAt: T3 });
    expect(lastSavedAt({})).toBeNull();
  });

  it("normalizes duplicate items in one batch to the latest change", () => {
    expect(
      normalizeLatest([
        { itemId: "a", checked: true, updatedAt: T1 },
        { itemId: "a", checked: false, updatedAt: T2 },
      ]),
    ).toEqual([{ itemId: "a", checked: false, updatedAt: T2 }]);
  });

  it("stateFromChecked copies the checked record", () => {
    const checked: Record<string, true> = { a: true };
    const s = stateFromChecked(checked, null);
    expect(s).toEqual({ version: 1, checked: { a: true }, updatedAt: null });
    expect(s.checked).not.toBe(checked);
  });
});

describe("packing-sync device storage (DATA-014)", () => {
  it("round-trips account copy, queue and migration flag per user", () => {
    const store = installStorage();
    writeAccountCopy("u1", { a: { checked: true, updatedAt: T1 }, zzz: { checked: true, updatedAt: T1 } }, T2);
    const copy = readAccountCopy("u1", valid);
    expect(copy?.rows).toEqual({ a: { checked: true, updatedAt: T1 } });
    expect(copy?.syncedAt).toBe(T2);
    expect(readAccountCopy("u2", valid)).toBeNull();

    writeQueue("u1", { b: { checked: false, updatedAt: T2 } });
    expect(readQueue("u1", valid)).toEqual({ b: { checked: false, updatedAt: T2 } });

    expect(isMigrated("u1")).toBe(false);
    markMigrated("u1");
    expect(isMigrated("u1")).toBe(true);

    clearAccountStorage("u1");
    expect(store.has(`${ACCOUNT_COPY_PREFIX}u1`)).toBe(false);
    expect(readQueue("u1", valid)).toEqual({});
    expect(isMigrated("u1")).toBe(true);
  });

  it("ignores malformed stored JSON", () => {
    const store = installStorage();
    store.set(`${ACCOUNT_COPY_PREFIX}u1`, "{not json");
    expect(readAccountCopy("u1", valid)).toBeNull();
  });

  it("falls back to in-memory storage when localStorage throws", () => {
    installStorage(true);
    expect(writeQueue("u9", { a: { checked: true, updatedAt: T1 } })).toBe(false);
    expect(readQueue("u9", valid)).toEqual({ a: { checked: true, updatedAt: T1 } });
    expect(markMigrated("u9")).toBe(false);
    expect(isMigrated("u9")).toBe(true);
  });
});
