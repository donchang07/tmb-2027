import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const dir = path.resolve(__dirname, "../../supabase/migrations");
const read = (name: string) => readFileSync(path.join(dir, name), "utf8");
const squash = (sql: string) => sql.replace(/\s+/g, " ");

describe("000005 packing_checks (FR-022, FR-023, DATA-018)", () => {
  const sql = squash(read("20260923000005_packing_checks.sql"));

  it("defines the table with owner default, cascade and composite key", () => {
    expect(sql).toContain("user_id uuid not null default auth.uid() references auth.users (id) on delete cascade");
    expect(sql).toContain("primary key (user_id, item_id)");
    expect(sql).toContain("char_length(item_id) between 1 and 64");
    expect(sql).toContain("checked boolean not null default true");
  });

  it("enables RLS with four owner-only policies", () => {
    expect(sql).toContain("alter table public.packing_checks enable row level security");
    expect(sql).toMatch(/for select to authenticated using \(user_id = auth\.uid\(\)\)/);
    expect(sql).toMatch(/for insert to authenticated with check \(user_id = auth\.uid\(\)\)/);
    expect(sql).toMatch(/for update to authenticated using \(user_id = auth\.uid\(\)\) with check \(user_id = auth\.uid\(\)\)/);
    expect(sql).toMatch(/for delete to authenticated using \(user_id = auth\.uid\(\)\)/);
    expect(sql.match(/create policy/g)).toHaveLength(4);
  });

  it("revokes anon and grants only the four DML privileges to authenticated", () => {
    expect(sql).toContain("revoke all on public.packing_checks from anon");
    expect(sql).toContain("grant select, insert, update, delete on public.packing_checks to authenticated");
  });

  it("uses a security invoker latest-wins upsert function", () => {
    expect(sql).toContain("security invoker");
    expect(sql).not.toContain("security definer");
    expect(sql).toContain("where p.updated_at < excluded.updated_at");
    expect(sql).toContain("least(c.updated_at, now())");
    expect(sql).toContain("revoke all on function public.upsert_packing_checks(jsonb) from public, anon");
    expect(sql).toContain("grant execute on function public.upsert_packing_checks(jsonb) to authenticated");
  });
});

describe("000006 signup guard hook (FR-030, SC-020)", () => {
  const sql = squash(read("20260923000006_signup_guard_hook.sql"));

  it("rejects team_members emails with 403", () => {
    expect(sql).toContain("from public.team_members m where m.email = v_email");
    expect(sql).toContain("'http_code', 403");
    expect(sql).toContain("signup_not_allowed");
  });

  it("restricts execution to supabase_auth_admin", () => {
    expect(sql).toContain("grant execute on function public.hook_before_user_created(jsonb) to supabase_auth_admin");
    expect(sql).toContain("revoke execute on function public.hook_before_user_created(jsonb) from authenticated, anon, public");
    expect(sql).toContain("grant select on table public.team_members to supabase_auth_admin");
  });

  it("keeps role helper functions defined only in 000001", () => {
    const files = readdirSync(dir).filter((f) => f.endsWith(".sql"));
    for (const fn of ["is_admin", "is_team_member", "jwt_email"]) {
      const defining = files.filter((f) => new RegExp(`function public\\.${fn}\\s*\\(`).test(read(f)));
      expect(defining, fn).toEqual(["20260916000001_bookings.sql"]);
    }
  });
});
