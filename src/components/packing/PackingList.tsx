"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PackingCategory, PackingItem } from "@/data/seed/packing";
import { savePackingChecksAction, type PackingSyncResult } from "@/app/packing/actions";
import { clearAll, emptyState, loadState, progress, saveState, toggle, type PackingState } from "@/lib/packing-store";
import {
  ackQueue,
  applyQueue,
  clearAllChanges,
  enqueueAll,
  fetchPackingChecks,
  isMigrated,
  lastSavedAt,
  markMigrated,
  queueToChanges,
  readAccountCopy,
  readQueue,
  toPackingState,
  unionMigration,
  writeAccountCopy,
  writeQueue,
  type CheckChange,
  type CheckMap,
} from "@/lib/packing-sync";
import { getAuthClient, useAuthUser } from "@/lib/auth-client";
import { formatKoDateTime } from "@/lib/dates";
import { logEvent } from "@/lib/log";
import { StatusNote } from "@/components/ui/StatusNote";
import { CardSkeleton } from "@/components/ui/Skeleton";

type Props = { categories: PackingCategory[]; items: PackingItem[]; header?: React.ReactNode };

const LINK_CLASS = "btn btn-primary";

function Layout({ header, aside, children }: { header?: React.ReactNode; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid gap-3.5 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start lg:gap-6">
      <div className="flex min-w-0 flex-col gap-3.5 lg:sticky lg:top-[92px] lg:gap-4">
        {header}
        {aside}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function PackingList(props: Props) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: true }, mutations: { retry: 0 } },
      }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <PackingListBody {...props} />
    </QueryClientProvider>
  );
}

export function PackingSubtitle() {
  const auth = useAuthUser();
  return (
    <p className="mt-1 text-sm text-ink-2 sm:mt-1.5 sm:text-[15px]">
      {auth.status === "user" ? "체크 상태는 내 계정에 저장됩니다 · 12일 산장 트레킹 기준" : "체크 상태는 이 기기에만 저장됩니다 · 12일 산장 트레킹 기준"}
    </p>
  );
}

function PackingListBody(props: Props) {
  const auth = useAuthUser();
  if (auth.status === "loading")
    return (
      <Layout header={props.header}>
        <CardSkeleton count={4} />
      </Layout>
    );
  if (auth.status === "user") return <AccountChecklist key={auth.userId} userId={auth.userId} {...props} />;
  return <GuestChecklist {...props} showAccountPrompt={auth.status === "guest"} />;
}

function ChecklistBody({
  categories,
  items,
  header,
  state,
  hydrated,
  statusLine,
  onToggle,
  onClearAll,
  notices,
  footer,
}: Props & {
  state: PackingState;
  hydrated: boolean;
  statusLine: React.ReactNode;
  onToggle: (id: string) => void;
  onClearAll: () => void;
  notices?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { done, total, percent } = progress(state, items);
  const sorted = [...categories].sort((a, b) => a.order - b.order);

  return (
    <Layout
      header={header}
      aside={
        <>
          {notices}
          <div className="card-dark flex flex-col gap-2.5 p-4 sm:gap-3 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[26px] font-extrabold leading-tight sm:text-[32px]" data-testid="packing-progress">
                {done}/{total} <span className="whitespace-nowrap text-sm font-semibold text-on-dark-muted sm:text-base">({percent}%)</span>
              </p>
              <button type="button" onClick={onClearAll} disabled={!hydrated || done === 0} className="btn border border-on-dark-muted/40 text-sm text-bone">
                전체 해제
              </button>
            </div>
            <progress
              value={done}
              max={total}
              className="block h-2 w-full appearance-none overflow-hidden rounded-[4px] border-0 bg-dark-line [&::-moz-progress-bar]:bg-amber [&::-webkit-progress-bar]:bg-dark-line [&::-webkit-progress-value]:bg-amber"
              aria-label="준비물 진행률"
            />
            {statusLine}
          </div>
          {footer}
        </>
      }
    >
      <div data-stagger className="grid items-start gap-3.5 sm:grid-cols-2 sm:gap-4">
        {sorted.map((cat) => {
          const catItems = items.filter((i) => i.category === cat.id);
          return (
            <section key={cat.id} aria-labelledby={`cat-${cat.id}`} className="card px-4 py-3 sm:px-5 sm:py-[18px]">
              <h2 id={`cat-${cat.id}`} className="flex items-baseline justify-between gap-3 text-base font-bold sm:text-[17px]">
                {cat.label}{" "}
                <span className="whitespace-nowrap font-semibold text-ink-3">
                  ({catItems.filter((i) => state.checked[i.id]).length}/{catItems.length})
                </span>
              </h2>
              <ul className="mt-1 sm:mt-2">
                {catItems.map((it) => {
                  const checked = !!state.checked[it.id];
                  return (
                    <li key={it.id}>
                      <label className="tap flex cursor-pointer items-center gap-3 border-t border-bone py-2">
                        <span className="grid h-6 w-6 shrink-0 place-items-center">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={!hydrated}
                            onChange={() => onToggle(it.id)}
                            className="peer col-start-1 row-start-1 h-6 w-6 cursor-pointer appearance-none rounded-[7px] border-2 border-line-strong bg-white checked:border-forest-700 checked:bg-forest-700 disabled:opacity-50"
                            data-item-id={it.id}
                          />
                          <span
                            aria-hidden="true"
                            className="pointer-events-none col-start-1 row-start-1 text-[15px] leading-none text-white opacity-0 peer-checked:opacity-100"
                          >
                            ✓
                          </span>
                        </span>
                        <span className={`min-w-0 flex-1 text-[15px] ${checked ? "text-ink-3 line-through" : ""}`}>
                          {it.label}
                          {it.note ? <small className="block text-xs text-ink-3">{it.note}</small> : null}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </Layout>
  );
}

function GuestChecklist({ categories, items, header, showAccountPrompt }: Props & { showAccountPrompt: boolean }) {
  const validIds = useMemo(() => new Set(items.map((i) => i.id)), [items]);
  const [state, setState] = useState<PackingState>(emptyState);
  const [storageOk, setStorageOk] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadState(validIds);
    setState(loaded.state);
    setStorageOk(loaded.storageOk);
    setHydrated(true);
  }, [validIds]);

  const commit = (next: PackingState) => {
    setState(next);
    if (!saveState(next)) setStorageOk(false);
  };

  if (!hydrated)
    return (
      <Layout header={header}>
        <CardSkeleton count={4} />
      </Layout>
    );

  const { done } = progress(state, items);

  return (
    <ChecklistBody
      categories={categories}
      items={items}
      header={header}
      state={state}
      hydrated={hydrated}
      onToggle={(id) => commit(toggle(state, id, new Date().toISOString()))}
      onClearAll={() => commit(clearAll(new Date().toISOString()))}
      statusLine={
        <p className="text-[13px] text-on-dark-muted">
          {done > 0 && state.updatedAt ? `저장 ${formatKoDateTime(state.updatedAt)} · 이 기기에만 저장됩니다` : "아직 체크한 항목이 없습니다 — 첫 항목을 체크해 보세요"}
        </p>
      }
      notices={
        showAccountPrompt ? (
          <StatusNote
            tone="info"
            title="로그인하면 체크 상태가 내 계정에 저장되어 다른 기기에서도 이어집니다."
            action={
              <div className="flex flex-wrap gap-2">
                <Link href="/login?next=/packing" className={LINK_CLASS}>
                  로그인
                </Link>
                <Link href="/signup?next=/packing" className="btn btn-white">
                  회원가입
                </Link>
              </div>
            }
          />
        ) : null
      }
      footer={
        !storageOk ? (
          <StatusNote tone="warn" title="저장소에 기록할 수 없습니다">
            브라우저 저장소 접근이 차단되어 체크 상태를 이 화면에서만 임시 보관합니다. 새로고침하면 사라질 수 있습니다.
          </StatusNote>
        ) : null
      }
    />
  );
}

function subscribeOnline(listener: () => void): () => void {
  window.addEventListener("online", listener);
  window.addEventListener("offline", listener);
  return () => {
    window.removeEventListener("online", listener);
    window.removeEventListener("offline", listener);
  };
}

function useOnline(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
}

type SyncStatus = "idle" | "saving" | "saved" | "failed";

function AccountChecklist({ userId, categories, items, header }: Props & { userId: string }) {
  const validIds = useMemo(() => new Set(items.map((i) => i.id)), [items]);
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ["packing_checks", userId], [userId]);
  const [copy] = useState(() => readAccountCopy(userId, validIds));
  const [queue, setQueue] = useState<CheckMap>(() => readQueue(userId, validIds));
  const [sync, setSync] = useState<SyncStatus>("idle");
  const [expired, setExpired] = useState(false);
  const [migratedCount, setMigratedCount] = useState<number | null>(null);
  const online = useOnline();

  const queueRef = useRef(queue);
  const inFlight = useRef(false);
  const again = useRef(false);
  const migrationPending = useRef<number | null>(null);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const client = getAuthClient();
      if (!client) throw new Error("unconfigured");
      const rows = await fetchPackingChecks(client, validIds);
      writeAccountCopy(userId, rows, new Date().toISOString());
      return rows;
    },
    placeholderData: copy?.rows,
  });

  const mutation = useMutation({ mutationFn: (changes: CheckChange[]) => savePackingChecksAction({ changes }) });
  const { mutateAsync } = mutation;

  const updateQueue = useCallback(
    (next: CheckMap) => {
      queueRef.current = next;
      setQueue(next);
      writeQueue(userId, next);
    },
    [userId],
  );

  const flush = useCallback(async (): Promise<void> => {
    if (inFlight.current) {
      again.current = true;
      return;
    }
    const changes = queueToChanges(queueRef.current);
    if (changes.length === 0) return;
    inFlight.current = true;
    setSync("saving");
    let result: PackingSyncResult;
    try {
      result = await mutateAsync(changes);
    } catch {
      result = { ok: false, reason: "error" };
    }
    inFlight.current = false;

    if (result.ok || result.reason === "invalid") {
      updateQueue(ackQueue(queueRef.current, changes));
      setExpired(false);
      setSync(result.ok ? "saved" : "failed");
      if (result.ok && migrationPending.current !== null) {
        markMigrated(userId);
        logEvent("packing_local_migrated", "info", { count: migrationPending.current });
        setMigratedCount(migrationPending.current);
        migrationPending.current = null;
      }
      if (result.ok) void queryClient.invalidateQueries({ queryKey });
    } else {
      if (result.reason === "unauthorized") setExpired(true);
      setSync("failed");
      again.current = false;
      return;
    }
    if (again.current || Object.keys(queueRef.current).length > 0) {
      again.current = false;
      void flush();
    }
  }, [mutateAsync, queryClient, queryKey, updateQueue, userId]);

  const serverReady = query.isSuccess && !query.isPlaceholderData;
  const serverData = query.data;

  useEffect(() => {
    if (!serverReady || !serverData) return;
    if (!isMigrated(userId) && migrationPending.current === null) {
      const changes = unionMigration(loadState(validIds).state, serverData, new Date().toISOString());
      if (changes.length === 0) markMigrated(userId);
      else {
        migrationPending.current = changes.length;
        updateQueue(enqueueAll(queueRef.current, changes));
      }
    }
    if (Object.keys(queueRef.current).length > 0) void flush();
  }, [serverReady, serverData, userId, validIds, updateQueue, flush]);

  useEffect(() => {
    const onOnline = () => void flush();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [flush]);

  const base = query.data ?? copy?.rows;
  if (base === undefined && query.isPending)
    return (
      <Layout header={header}>
        <CardSkeleton count={4} />
      </Layout>
    );

  const view = applyQueue(base ?? {}, queue);
  const state = toPackingState(view);
  const savedAt = lastSavedAt(view);

  const change = (changes: CheckChange[]) => {
    if (changes.length === 0) return;
    updateQueue(enqueueAll(queueRef.current, changes));
    void flush();
  };

  const failed = sync === "failed" || (query.isError && sync !== "saving" && sync !== "saved");
  const statusText = !online
    ? `오프라인 · 마지막 저장 ${savedAt ? formatKoDateTime(savedAt) : "없음"}`
    : sync === "saving"
      ? "저장 중…"
      : failed
        ? "저장하지 못했습니다. 연결되면 다시 저장합니다."
        : savedAt
          ? `내 계정에 저장됨 · 마지막 저장 ${formatKoDateTime(savedAt)}`
          : "내 계정에 저장됨";

  return (
    <ChecklistBody
      categories={categories}
      items={items}
      header={header}
      state={state}
      hydrated
      onToggle={(id) => change([{ itemId: id, checked: !state.checked[id], updatedAt: new Date().toISOString() }])}
      onClearAll={() => change(clearAllChanges(view, new Date().toISOString()))}
      statusLine={
        <p role="status" className="text-[13px] text-on-dark-muted" data-testid="packing-sync-status">
          {statusText}
        </p>
      }
      notices={
        <>
          {expired ? (
            <StatusNote
              tone="warn"
              title="로그인 시간이 만료되었습니다. 다시 로그인하면 계정에 저장합니다."
              action={
                <Link href="/login?reason=expired&next=/packing" className={LINK_CLASS}>
                  다시 로그인
                </Link>
              }
            />
          ) : null}
          {migratedCount !== null ? (
            <StatusNote
              tone="info"
              title={`이 기기에 있던 체크 ${migratedCount}개를 내 계정으로 옮겼습니다.`}
              action={
                <button type="button" onClick={() => setMigratedCount(null)} className={LINK_CLASS}>
                  닫기
                </button>
              }
            />
          ) : null}
        </>
      }
    />
  );
}
