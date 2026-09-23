const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function hasUnsafeShape(value: string): boolean {
  return CONTROL_CHARS.test(value) || value.includes("\\") || value.startsWith("//");
}

export function isSafeNext(next: unknown, origin = "http://localhost"): next is string {
  if (typeof next !== "string" || next.length < 1 || next.length > 2048 || !next.startsWith("/")) return false;
  if (hasUnsafeShape(next) || hasUnsafeShape(safeDecode(next))) return false;
  try {
    return new URL(next, origin).origin === new URL(origin).origin;
  } catch {
    return false;
  }
}

export function safeNext(next: unknown, fallback = "/admin", origin = "http://localhost"): string {
  return isSafeNext(next, origin) ? next : fallback;
}
