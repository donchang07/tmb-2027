import { z } from "zod";
import { days } from "@/data/seed/days";

export const JOURNAL_MAX_TEXT = 200;
export const JOURNAL_MAX_BYTES = 10 * 1024 * 1024;
export const JOURNAL_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
export const JOURNAL_REJECT_MESSAGE = "JPG·PNG·WebP 10MB 이하만 가능합니다";

const TREK_DAY_IDS = days.filter((d) => d.type === "trek").map((d) => d.id) as [string, ...string[]];

export const JournalInputSchema = z.object({
  dayId: z.enum(TREK_DAY_IDS),
  text: z.string().trim().min(1).max(JOURNAL_MAX_TEXT),
});
export type JournalInput = z.infer<typeof JournalInputSchema>;

export function validatePhoto(meta: { type: string; size: number } | null): { ok: true } | { ok: false; message: string } {
  if (!meta) return { ok: true };
  if (!(JOURNAL_MIME as readonly string[]).includes(meta.type)) return { ok: false, message: JOURNAL_REJECT_MESSAGE };
  if (meta.size > JOURNAL_MAX_BYTES || meta.size <= 0) return { ok: false, message: JOURNAL_REJECT_MESSAGE };
  return { ok: true };
}

export function sniffImageMime(head: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return "image/jpeg";
  if (head.length >= 8 && head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) return "image/png";
  if (
    head.length >= 12 &&
    head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46 &&
    head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50
  )
    return "image/webp";
  return null;
}

export function extFor(mime: string): "jpg" | "png" | "webp" {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export const DUPLICATE_MESSAGE = "이 Day에는 이미 기록을 남겼습니다";
export const DISPLAY_NAME_MAX = 20;
export const DISPLAY_NAME_MESSAGE = "표시명은 1~20자이며 이메일 형식(@)은 쓸 수 없습니다";

export function validateDisplayName(value: unknown): { ok: true; value: string } | { ok: false; message: string } {
  if (typeof value !== "string") return { ok: false, message: DISPLAY_NAME_MESSAGE };
  const trimmed = value.trim().replace(/\s{2,}/g, " ");
  if (trimmed.length < 1 || trimmed.length > DISPLAY_NAME_MAX) return { ok: false, message: DISPLAY_NAME_MESSAGE };
  if (trimmed.includes("@")) return { ok: false, message: DISPLAY_NAME_MESSAGE };
  return { ok: true, value: trimmed };
}
