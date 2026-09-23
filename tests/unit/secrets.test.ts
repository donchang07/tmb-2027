import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "../..");
const MAX_BYTES = 1024 * 1024;

const EXCLUDED_DIRS = new Set(["node_modules", ".git", "test-results", "playwright-report", "out", ".vercel"]);
const EXCLUDED_PATHS = new Set([
  "supabase/.temp",
  ".bkit/audit",
  ".bkit/runtime",
  ".bkit/checkpoints",
  ".claude/agent-memory",
  ".claude/settings.local.json",
  "next-env.d.ts",
]);

function isIgnored(rel: string, name: string, isDir: boolean): boolean {
  if (EXCLUDED_PATHS.has(rel)) return true;
  if (isDir) return EXCLUDED_DIRS.has(name) || name.startsWith(".next");
  if (name.endsWith(".tsbuildinfo")) return true;
  return name.startsWith(".env") && name !== ".env.example";
}

function walk(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    const rel = path.relative(ROOT, abs).split(path.sep).join("/");
    if (isIgnored(rel, entry.name, entry.isDirectory())) continue;
    if (entry.isDirectory()) walk(abs, out);
    else if (entry.isFile()) out.push(rel);
  }
}

function trackedFiles(): string[] {
  if (existsSync(path.join(ROOT, ".git"))) {
    const out = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { cwd: ROOT, encoding: "utf8" });
    return out.split(/\r?\n/).filter(Boolean);
  }
  const files: string[] = [];
  walk(ROOT, files);
  return files;
}

function readText(rel: string): string | null {
  const abs = path.join(ROOT, rel);
  if (!existsSync(abs)) return null;
  const st = statSync(abs);
  if (!st.isFile() || st.size > MAX_BYTES) return null;
  const buf = readFileSync(abs);
  if (buf.includes(0)) return null;
  return buf.toString("utf8");
}

const PATTERNS: { name: string; re: RegExp }[] = [
  { name: "supabase secret key", re: /sb_secret_[A-Za-z0-9_-]{10,}/ },
  { name: "openai key", re: /sk-(proj-)?[A-Za-z0-9_-]{20,}/ },
  { name: "resend key", re: /re_[A-Za-z0-9_]{16,}/ },
  { name: "postgres url with password", re: /postgres(ql)?:\/\/[^:\s]+:[^@\s]+@/ },
];

const JWT = /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;

function hasServiceRoleJwt(text: string): boolean {
  for (const m of text.matchAll(JWT)) {
    const payload = m[0].split(".")[1] ?? "";
    try {
      const json: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
      if (typeof json === "object" && json !== null && (json as { role?: unknown }).role === "service_role") return true;
    } catch {
      continue;
    }
  }
  return false;
}

function envLocalValues(): { key: string; value: string }[] {
  const file = path.join(ROOT, ".env.local");
  if (!existsSync(file)) return [];
  const out: { key: string; value: string }[] = [];
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m || !m[1] || !m[2]) continue;
    const value = m[2].replace(/^["']|["']$/g, "");
    if (value.length >= 16) out.push({ key: m[1], value });
  }
  return out;
}

describe("repository secret scan (FR-028, SC-023)", () => {
  const files = trackedFiles();
  const texts = files.map((f) => ({ file: f, text: readText(f) })).filter((x): x is { file: string; text: string } => x.text !== null);

  it("scans the public file set without ignored paths", () => {
    expect(files.length).toBeGreaterThan(50);
    expect(files).not.toContain(".env.local");
    expect(files.some((f) => f.startsWith("node_modules/"))).toBe(false);
    expect(files).toContain(".env.example");
  });

  it("contains no secret-shaped tokens", () => {
    const hits: string[] = [];
    for (const { file, text } of texts) {
      for (const p of PATTERNS) if (p.re.test(text)) hits.push(`${file}: ${p.name}`);
      if (hasServiceRoleJwt(text)) hits.push(`${file}: service_role JWT`);
    }
    expect(hits).toEqual([]);
  });

  it("does not contain any .env.local value of 16+ characters", () => {
    const values = envLocalValues();
    const hits: string[] = [];
    for (const { key, value } of values) for (const { file, text } of texts) if (text.includes(value)) hits.push(`${file}: ${key}`);
    expect(hits).toEqual([]);
  });
});

describe(".gitignore and .env.example contract (FR-025, DATA-019)", () => {
  it("lists every required ignore rule", () => {
    const rules = readFileSync(path.join(ROOT, ".gitignore"), "utf8")
      .split(/\r?\n/)
      .map((l) => l.trim());
    for (const rule of [
      "node_modules",
      ".next",
      ".env",
      ".env.*",
      "!.env.example",
      ".env*.local",
      ".vercel",
      "supabase/.temp",
      ".claude/settings.local.json",
      ".claude/agent-memory/",
      ".bkit/audit/",
      ".bkit/runtime/",
      ".bkit/checkpoints/",
    ]) {
      expect(rules, rule).toContain(rule);
    }
  });

  it("keeps .env.example to the final public key list with empty values", () => {
    const lines = readFileSync(path.join(ROOT, ".env.example"), "utf8")
      .split(/\r?\n/)
      .filter((l) => l.trim() && !l.trim().startsWith("#"));
    const entries = lines.map((l) => l.split("="));
    expect(entries.map(([k]) => k).sort()).toEqual(
      ["ADMIN_EMAIL", "NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_URL", "RESEND_API_KEY", "SECURITY_MAIL_FROM"].sort(),
    );
    for (const [k, ...rest] of entries) expect(rest.join("="), String(k)).toBe("");
    expect(readFileSync(path.join(ROOT, ".env.example"), "utf8")).not.toMatch(/SERVICE_ROLE/);
  });

  it.skipIf(!existsSync(path.join(ROOT, ".git")))("git ignores local env, vercel, supabase temp and private agent files", () => {
    for (const p of [".env.local", ".env.test.local", ".vercel/x", "supabase/.temp/x", ".bkit/audit/x", ".claude/agent-memory/x"]) {
      expect(() => execFileSync("git", ["check-ignore", "-q", p], { cwd: ROOT }), p).not.toThrow();
    }
  });
});
