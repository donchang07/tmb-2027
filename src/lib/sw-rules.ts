// public/sw.js 와 동일한 규칙. 변경 시 두 곳을 함께 갱신할 것.
export const SW_VERSION = "tmb-2027-v3";

// SW는 프로덕션 빌드에서만 등록한다. dev 서버의 /_next/static 청크는 파일명에 해시가 없어
// 코드가 바뀌면 캐시된 옛 청크가 새 HTML과 섞여 하이드레이션이 깨진다.
export function shouldRegisterSw(nodeEnv: string | undefined): boolean {
  return nodeEnv === "production";
}
export const MANIFEST_CACHE = `manifest-${SW_VERSION}`;
export const MANIFEST_KEY = "/__cache-manifest";
export const PRECACHE_URLS = ["/offline", "/manifest.webmanifest", "/icons/icon-192.svg", "/icons/icon-512.svg"];

// DATA-012·I-025: 사용자별 응답은 캐시하지 않고, /day·/packing 내비게이션은 network-first(3초)
export const USER_SCOPED_HEADER = "x-tmb-user-scoped";
export const NETWORK_FIRST_TIMEOUT_MS = 3000;
export const PAGES_CACHE_PREFIX = "pages-";
export const NETWORK_FIRST_PATTERNS: readonly RegExp[] = [/^\/day\//, /^\/packing$/];

export type Strategy = "bypass" | "static" | "page" | "data" | "swr" | "network-only";
export type RouteStrategy = "swr" | "network-only";

// 경로 규칙 테이블(I-002): 예약 조회는 SWR, 관리·인증은 network-only
export const ROUTE_RULES: readonly { pattern: RegExp; strategy: RouteStrategy }[] = [
  { pattern: /^\/api\/bookings$/, strategy: "swr" },
  { pattern: /^\/api\/admin(\/|$)/, strategy: "network-only" },
  { pattern: /^\/admin(\/|$)/, strategy: "network-only" },
  { pattern: /^\/auth(\/|$)/, strategy: "network-only" },
  { pattern: /^\/login$/, strategy: "network-only" },
  { pattern: /^\/signup$/, strategy: "network-only" },
];

export function matchRule(pathname: string): RouteStrategy | null {
  for (const rule of ROUTE_RULES) if (rule.pattern.test(pathname)) return rule.strategy;
  return null;
}

const BYPASS_PREFIXES = ["/api/", "/admin", "/auth/", "/journal", "/_next/webpack-hmr", "/__nextjs"];
const STATIC_PREFIXES = ["/_next/static/", "/icons/"];
const STATIC_EXT = /\.(svg|png|jpg|jpeg|webp|ico|woff2?|css|js|gpx)$/i;

export function shouldBypass(url: URL, method: string): boolean {
  if (method !== "GET") return true;
  if (url.protocol !== "http:" && url.protocol !== "https:") return true;
  return BYPASS_PREFIXES.some((p) => url.pathname.startsWith(p));
}

export function isStaticAsset(url: URL): boolean {
  if (url.pathname === "/manifest.webmanifest") return true;
  if (STATIC_PREFIXES.some((p) => url.pathname.startsWith(p))) return true;
  return STATIC_EXT.test(url.pathname);
}

export function classify(url: URL, method: string, mode: string): Strategy {
  const isHttpGet = method === "GET" && (url.protocol === "http:" || url.protocol === "https:");
  if (isHttpGet && matchRule(url.pathname) === "swr") return "swr";
  if (shouldBypass(url, method)) return "bypass";
  if (matchRule(url.pathname) === "network-only") return "network-only";
  if (isStaticAsset(url)) return "static";
  if (mode === "navigate") return "page";
  return "data";
}

export type PageStrategy = "network-first" | "cache-first";

export function pageStrategy(pathname: string): PageStrategy {
  return NETWORK_FIRST_PATTERNS.some((p) => p.test(pathname)) ? "network-first" : "cache-first";
}

export type ResponseLike = { ok: boolean; type: string; headers: { get(name: string): string | null } };

export function isCacheableResponse(res: ResponseLike): boolean {
  return res.ok && res.type !== "opaqueredirect" && res.headers.get(USER_SCOPED_HEADER) !== "1";
}

export type NetworkOutcome = "ok" | "error" | "timeout";
export type NetworkFirstResult = "network" | "cache" | "offline-fallback" | "wait-network";

export function resolveNetworkFirst(outcome: NetworkOutcome, hasCache: boolean): NetworkFirstResult {
  if (outcome === "ok") return "network";
  if (outcome === "error") return hasCache ? "cache" : "offline-fallback";
  return hasCache ? "cache" : "wait-network";
}
