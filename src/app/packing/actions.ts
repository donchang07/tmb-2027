"use server";

import { z } from "zod";
import { packingItems } from "@/data/seed/packing";
import { logEvent } from "@/lib/log";
import { normalizeLatest } from "@/lib/packing-sync";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PACKING_ITEM_IDS = packingItems.map((i) => i.id) as [string, ...string[]];

const ChangeSchema = z
  .object({
    itemId: z.enum(PACKING_ITEM_IDS),
    checked: z.boolean(),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .strip();

const SaveSchema = z.object({ changes: z.array(ChangeSchema).min(1).max(PACKING_ITEM_IDS.length) });

export type PackingSyncResult = { ok: true; applied: number } | { ok: false; reason: "invalid" | "unauthorized" | "unconfigured" | "error" };

function hasOwnerKey(input: unknown): boolean {
  if (typeof input !== "object" || input === null) return false;
  if ("userId" in input || "user_id" in input) return true;
  const changes = (input as { changes?: unknown }).changes;
  return Array.isArray(changes) && changes.some((c) => typeof c === "object" && c !== null && ("userId" in c || "user_id" in c));
}

export async function savePackingChecksAction(input: unknown): Promise<PackingSyncResult> {
  if (hasOwnerKey(input)) logEvent("owner_access_denied", "security", { reason: "owner_key_in_request" });
  const parsed = SaveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, reason: "unconfigured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    logEvent("auth_session_expired", "info", { reason: "packing_save" });
    return { ok: false, reason: "unauthorized" };
  }

  const changes = normalizeLatest(parsed.data.changes).map((c) => ({ item_id: c.itemId, checked: c.checked, updated_at: c.updatedAt }));
  const { data, error } = await supabase.rpc("upsert_packing_checks", { changes });
  if (error) {
    logEvent("packing_sync_failed", "warn", { reason: error.code ?? "rpc_error" });
    return { ok: false, reason: "error" };
  }
  return { ok: true, applied: Array.isArray(data) ? data.length : 0 };
}
