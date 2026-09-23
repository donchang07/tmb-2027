import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as journalRules from "@/lib/journal-rules";
import { DUPLICATE_MESSAGE, extFor, JOURNAL_MAX_BYTES, JournalInputSchema, sniffImageMime, validateDisplayName, validatePhoto } from "@/lib/journal-rules";

describe("journal input validation (FR-016, SC-012)", () => {
  it("accepts 1..200 chars on trek days and rejects otherwise", () => {
    expect(JournalInputSchema.safeParse({ dayId: "d2027-08-04", text: "a".repeat(200) }).success).toBe(true);
    expect(JournalInputSchema.safeParse({ dayId: "d2027-08-04", text: "a".repeat(201) }).success).toBe(false);
    expect(JournalInputSchema.safeParse({ dayId: "d2027-08-04", text: "   " }).success).toBe(false);
    expect(JournalInputSchema.safeParse({ dayId: "d2027-08-03", text: "travel day" }).success).toBe(false);
    expect(JournalInputSchema.safeParse({ dayId: "nope", text: "x" }).success).toBe(false);
  });

  it("validates photo type and 10MB limit", () => {
    expect(validatePhoto(null).ok).toBe(true);
    for (const type of ["image/jpeg", "image/png", "image/webp"]) {
      expect(validatePhoto({ type, size: JOURNAL_MAX_BYTES }).ok).toBe(true);
    }
    expect(validatePhoto({ type: "image/jpeg", size: JOURNAL_MAX_BYTES + 1 }).ok).toBe(false);
    expect(validatePhoto({ type: "image/gif", size: 1000 }).ok).toBe(false);
    expect(validatePhoto({ type: "application/pdf", size: 1000 }).ok).toBe(false);
    expect(validatePhoto({ type: "image/png", size: 0 }).ok).toBe(false);
    const rejected = validatePhoto({ type: "image/gif", size: 1 });
    if (!rejected.ok) expect(rejected.message).toBe("JPG·PNG·WebP 10MB 이하만 가능합니다");
  });

  it("sniffs image magic bytes", () => {
    expect(sniffImageMime(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffImageMime(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(sniffImageMime(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]))).toBe("image/webp");
    expect(sniffImageMime(new Uint8Array([0x47, 0x49, 0x46, 0x38]))).toBeNull();
    expect(sniffImageMime(new Uint8Array([]))).toBeNull();
  });

  it("derives upload extension", () => {
    expect(extFor("image/png")).toBe("png");
    expect(extFor("image/webp")).toBe("webp");
    expect(extFor("image/jpeg")).toBe("jpg");
  });
});

describe("display name (N-008 이메일 미노출, 부록 A-4 TeamMember.displayName)", () => {
  it("accepts 1..20 chars after trimming and collapsing spaces", () => {
    expect(validateDisplayName("동인")).toEqual({ ok: true, value: "동인" });
    expect(validateDisplayName("  동인  ")).toEqual({ ok: true, value: "동인" });
    expect(validateDisplayName("장  동인")).toEqual({ ok: true, value: "장 동인" });
    expect(validateDisplayName("a".repeat(20))).toEqual({ ok: true, value: "a".repeat(20) });
  });

  it("rejects empty, over 20 chars, email-shaped and non-string input", () => {
    expect(validateDisplayName("").ok).toBe(false);
    expect(validateDisplayName("   ").ok).toBe(false);
    expect(validateDisplayName("a".repeat(21)).ok).toBe(false);
    expect(validateDisplayName("leader@example.com").ok).toBe(false);
    expect(validateDisplayName(null).ok).toBe(false);
    expect(validateDisplayName(123).ok).toBe(false);
  });

  it("exposes the one-entry-per-day message and no email-derived label helper", () => {
    expect(DUPLICATE_MESSAGE).toBe("이 Day에는 이미 기록을 남겼습니다");
    expect("authorLabelFrom" in journalRules).toBe(false);
  });
});

describe("journal public migration (N-008, N-011)", () => {
  const sql = readFileSync(path.resolve(__dirname, "../../supabase/migrations/20260917000004_journal_public.sql"), "utf8");

  it("opens journal_entries to anonymous readers", () => {
    expect(sql).toContain('drop policy if exists "journal member select" on public.journal_entries');
    expect(sql).toContain("for select to anon, authenticated using (true)");
  });

  it("limits the anonymous grant to public columns (author_id 비노출)", () => {
    expect(sql).toContain("grant select (id, day_id, author_label, text, image_path, created_at) on public.journal_entries to anon");
    expect(sql).not.toContain("grant select on public.journal_entries to anon");
  });

  it("locks team_members updates to the display_name column (권한 상승 차단)", () => {
    expect(sql).toContain("revoke update on public.team_members from authenticated");
    expect(sql).toContain("grant update (display_name) on public.team_members to authenticated");
  });

  it("adds display_name and one entry per member per day", () => {
    expect(sql).toContain("add column if not exists display_name text check (display_name is null or char_length(display_name) between 1 and 20)");
    expect(sql).toContain("email = public.jwt_email()");
    expect(sql).toContain("create unique index if not exists journal_entries_one_per_member_day on public.journal_entries (day_id, author_id)");
  });

  it("is re-runnable and clears duplicates before the unique index", () => {
    expect(sql).toContain("delete from public.journal_entries a");
    expect(sql).toContain("where a.day_id = b.day_id and a.author_id = b.author_id and a.created_at < b.created_at");
    expect(sql).toContain('drop policy if exists "journal public select" on public.journal_entries');
    expect(sql).toContain('drop policy if exists "team_members self update display_name" on public.team_members');
    expect(sql).toContain('drop policy if exists "journal photos public read" on storage.objects');
  });

  it("makes the photo bucket public and readable by anon", () => {
    expect(sql).toContain("update storage.buckets set public = true where id = 'journal-photos'");
    expect(sql).toContain('drop policy if exists "journal photos member read" on storage.objects');
    expect(sql).toContain("using (bucket_id = 'journal-photos')");
  });
});

describe("journal migration (RLS + storage limits)", () => {
  const sql = readFileSync(path.resolve(__dirname, "../../supabase/migrations/20260916000002_journal.sql"), "utf8");

  it("protects journal_entries with RLS and team membership", () => {
    expect(sql).toContain("alter table public.journal_entries enable row level security");
    expect(sql).toContain("public.is_team_member()");
    expect(sql).toContain("revoke all on public.journal_entries from anon");
    expect(sql).toContain("char_length(text) between 1 and 200");
  });

  it("creates a private bucket with 10MB and 3 MIME types and own-folder upload policy", () => {
    expect(sql).toContain("10485760");
    expect(sql).toContain("'image/jpeg', 'image/png', 'image/webp'");
    expect(sql).toMatch(/'journal-photos', 'journal-photos', false/);
    expect(sql).toContain("(storage.foldername(name))[1] = auth.uid()::text");
  });
});
