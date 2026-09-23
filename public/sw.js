/* TMB 2027 Service Worker — 규칙·상수(SW_VERSION, PRECACHE_URLS, BYPASS/STATIC, MANIFEST_CACHE, MANIFEST_KEY)는
   src/lib/sw-rules.ts 와 동일하게 유지 */
const SW_VERSION = "tmb-2027-v3";
// 이 SW는 프로덕션 빌드에서만 등록된다(SwRegister). dev 서버의 청크는 파일명에 해시가 없어 캐시하면 안 된다.
const STATIC_CACHE = `static-${SW_VERSION}`;
const PAGES_CACHE = `pages-${SW_VERSION}`;
const MANIFEST_CACHE = `manifest-${SW_VERSION}`;
const MANIFEST_KEY = "/__cache-manifest";
const PRECACHE_URLS = ["/offline", "/manifest.webmanifest", "/icons/icon-192.svg", "/icons/icon-512.svg"];
// sw-rules.ts 의 사용자별 헤더·network-first 상수(3초, /day/*·/packing)와 동일
const USER_SCOPED_HEADER = "x-tmb-user-scoped";
const FRESH_PAGE_TIMEOUT_MS = 3000;
const FRESH_PAGE_PATTERNS = [/^\/day\//, /^\/packing$/];

const BYPASS_PREFIXES = ["/api/", "/admin", "/auth/", "/journal", "/_next/webpack-hmr", "/__nextjs"];
const STATIC_PREFIXES = ["/_next/static/", "/icons/"];
const STATIC_EXT = /\.(svg|png|jpg|jpeg|webp|ico|woff2?|css|js|gpx)$/i;

const ROUTE_RULES = [
  { pattern: /^\/api\/bookings$/, strategy: "swr" },
  { pattern: /^\/api\/admin(\/|$)/, strategy: "network-only" },
  { pattern: /^\/admin(\/|$)/, strategy: "network-only" },
  { pattern: /^\/auth(\/|$)/, strategy: "network-only" },
  { pattern: /^\/login$/, strategy: "network-only" },
  { pattern: /^\/signup$/, strategy: "network-only" },
];

function matchRule(pathname) {
  for (const rule of ROUTE_RULES) if (rule.pattern.test(pathname)) return rule.strategy;
  return null;
}

function shouldBypass(url, method) {
  if (method !== "GET") return true;
  if (url.protocol !== "http:" && url.protocol !== "https:") return true;
  return BYPASS_PREFIXES.some((p) => url.pathname.startsWith(p));
}

function isStaticAsset(url) {
  if (url.pathname === "/manifest.webmanifest") return true;
  if (STATIC_PREFIXES.some((p) => url.pathname.startsWith(p))) return true;
  return STATIC_EXT.test(url.pathname);
}

function classify(url, method, mode) {
  const isHttpGet = method === "GET" && (url.protocol === "http:" || url.protocol === "https:");
  if (isHttpGet && matchRule(url.pathname) === "swr") return "swr";
  if (shouldBypass(url, method)) return "bypass";
  if (matchRule(url.pathname) === "network-only") return "network-only";
  if (isStaticAsset(url)) return "static";
  if (mode === "navigate") return "page";
  return "data";
}

function pageStrategy(pathname) {
  return FRESH_PAGE_PATTERNS.some((p) => p.test(pathname)) ? "network-first" : "cache-first";
}

function isCacheableResponse(res) {
  return !!res && res.ok && res.type !== "opaqueredirect" && res.headers.get(USER_SCOPED_HEADER) !== "1";
}

async function readManifest() {
  const cache = await caches.open(MANIFEST_CACHE);
  const res = await cache.match(MANIFEST_KEY);
  if (!res) return { version: SW_VERSION, cachedAt: null, routes: {}, sourceUpdatedAt: null };
  try {
    return await res.json();
  } catch {
    return { version: SW_VERSION, cachedAt: null, routes: {}, sourceUpdatedAt: null };
  }
}

/** manifest read-modify-write 직렬화 — 경로 기록과 예약 스냅샷 기록이 서로를 덮어쓰지 않도록 단일 체인으로 묶는다 */
let manifestChain = Promise.resolve();

function updateManifest(mutate) {
  manifestChain = manifestChain
    .then(async () => {
      const manifest = await readManifest();
      manifest.version = SW_VERSION;
      mutate(manifest);
      const cache = await caches.open(MANIFEST_CACHE);
      await cache.put(MANIFEST_KEY, new Response(JSON.stringify(manifest), { headers: { "Content-Type": "application/json" } }));
    })
    .catch(() => {
      // manifest 기록 실패는 응답에 영향을 주지 않음
    });
  return manifestChain;
}

async function recordRoute(pathname, response) {
  const lastModified = response && response.headers.get("last-modified");
  await updateManifest((manifest) => {
    const now = new Date().toISOString();
    manifest.cachedAt = now;
    manifest.routes[pathname] = now;
    if (lastModified) manifest.sourceUpdatedAt = new Date(lastModified).toISOString();
  });
}

async function recordBookingSnapshot(response) {
  try {
    const body = await response.json();
    if (!body || !Array.isArray(body.bookings)) return;
    await updateManifest((manifest) => {
      manifest.lastBookingSnapshot = { fetchedAt: new Date().toISOString(), bookings: body.bookings };
    });
  } catch {
    // 스냅샷 기록 실패는 응답에 영향을 주지 않음
  }
}

async function notifyClients(message) {
  const all = await self.clients.matchAll({ includeUncontrolled: true, type: "window" });
  for (const c of all) c.postMessage(message);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => Promise.allSettled(PRECACHE_URLS.map((u) => cache.add(u))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.endsWith(SW_VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function handleStatic(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res.ok) cache.put(request, res.clone());
  return res;
}

async function handlePage(request) {
  const url = new URL(request.url);
  const cache = await caches.open(PAGES_CACHE);
  const cached = await cache.match(url.pathname);
  const network = fetch(request)
    .then(async (res) => {
      if (isCacheableResponse(res)) {
        try {
          await cache.put(url.pathname, res.clone());
          await recordRoute(url.pathname, res);
        } catch {
          // 캐시 저장 실패(용량 등)는 응답에 영향을 주지 않음
        }
      }
      return res;
    })
    .catch(() => null);

  if (cached) {
    network.then((res) => {
      if (!res) notifyClients({ type: "offline_cache_served", url: url.pathname });
    });
    return cached;
  }
  const res = await network;
  if (res) return res;
  notifyClients({ type: "offline_cache_miss", url: url.pathname });
  const offline = await caches.match("/offline");
  return offline || new Response("<h1>오프라인</h1><p>인터넷 연결 후 한 번 열어 주세요.</p>", { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

async function offlineFallback(pathname) {
  notifyClients({ type: "offline_cache_miss", url: pathname });
  const offline = await caches.match("/offline");
  return offline || new Response("<h1>오프라인</h1><p>인터넷 연결 후 한 번 열어 주세요.</p>", { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

/** /day/*·/packing — 네트워크 우선(3초), 사용자별 응답(x-tmb-user-scoped)은 저장하지 않는다(DATA-012, I-025) */
async function handlePageFresh(request) {
  const url = new URL(request.url);
  const cache = await caches.open(PAGES_CACHE);
  const cached = await cache.match(url.pathname);
  const network = fetch(request)
    .then(async (res) => {
      if (isCacheableResponse(res)) {
        try {
          await cache.put(url.pathname, res.clone());
          await recordRoute(url.pathname, res);
        } catch {
          // 캐시 저장 실패(용량 등)는 응답에 영향을 주지 않음
        }
      }
      return { outcome: "ok", res };
    })
    .catch(() => ({ outcome: "error", res: null }));
  const timer = new Promise((resolve) => setTimeout(() => resolve({ outcome: "timeout", res: null }), FRESH_PAGE_TIMEOUT_MS));
  const first = await Promise.race([network, timer]);

  if (first.outcome === "ok") return first.res;
  if (cached) {
    if (first.outcome === "error") notifyClients({ type: "offline_cache_served", url: url.pathname });
    return cached;
  }
  if (first.outcome === "timeout") {
    const late = await network;
    if (late.res) return late.res;
  }
  return offlineFallback(url.pathname);
}

/** /login·/signup — 캐시 없이 네트워크만, 실패 시 /offline */
async function handleNetworkOnly(request) {
  try {
    return await fetch(request);
  } catch {
    if (request.mode === "navigate") return offlineFallback(new URL(request.url).pathname);
    return new Response("", { status: 503 });
  }
}

async function clearPages() {
  await caches.delete(PAGES_CACHE);
  await updateManifest((manifest) => {
    manifest.routes = {};
    manifest.cachedAt = null;
  });
}

async function handleData(request) {
  const cache = await caches.open(PAGES_CACHE);
  try {
    const res = await fetch(request);
    if (isCacheableResponse(res)) cache.put(request, res.clone());
    return res;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response("", { status: 503 });
  }
}

/** /api/bookings — 캐시 우선 응답 + 백그라운드 갱신(SWR), 성공 시 manifest.lastBookingSnapshot 기록 */
async function handleBookingSwr(request) {
  const cache = await caches.open(PAGES_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then(async (res) => {
      if (res.ok) {
        try {
          await cache.put(request, res.clone());
          await recordBookingSnapshot(res.clone());
        } catch {
          // 캐시 저장 실패(용량 등)는 응답에 영향을 주지 않음
        }
      }
      return res;
    })
    .catch(() => null);

  if (cached) return cached;
  const res = await network;
  if (res) return res;
  notifyClients({ type: "offline_cache_miss", url: new URL(request.url).pathname });
  return new Response(JSON.stringify({ bookings: [], configured: false, offline: true }), {
    status: 503,
    headers: { "Content-Type": "application/json" },
  });
}

/** 첫 방문은 SW가 아직 제어하지 않아 내비게이션·정적 자산이 fetch 핸들러를 거치지 않는다 — 클라이언트 요청으로 그 페이지와 자산을 캐시에 채운다(FR-013) */
async function cachePage(rawUrl) {
  const url = new URL(rawUrl, self.location.origin);
  if (url.origin !== self.location.origin) return;
  if (classify(url, "GET", "navigate") !== "page") return;
  const cache = await caches.open(PAGES_CACHE);
  if (await cache.match(url.pathname)) return;
  const res = await fetch(url.href, { credentials: "same-origin" });
  if (!isCacheableResponse(res)) return;
  await cache.put(url.pathname, res.clone());
  await recordRoute(url.pathname, res);
}

async function cacheAssets(rawUrls) {
  const cache = await caches.open(STATIC_CACHE);
  await Promise.allSettled(
    rawUrls.map(async (raw) => {
      if (typeof raw !== "string") return;
      const url = new URL(raw, self.location.origin);
      if (url.origin !== self.location.origin || !isStaticAsset(url)) return;
      if (await cache.match(url.href)) return;
      const res = await fetch(url.href);
      if (res.ok) await cache.put(url.href, res.clone());
    }),
  );
}

self.addEventListener("message", (event) => {
  const data = event.data;
  if (data && data.type === "clear_pages") {
    event.waitUntil(clearPages().catch(() => undefined));
    return;
  }
  if (!data || data.type !== "cache_page" || typeof data.url !== "string") return;
  const assets = Array.isArray(data.assets) ? data.assets : [];
  event.waitUntil(Promise.all([cachePage(data.url), cacheAssets(assets)]).catch(() => undefined));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const strategy = classify(url, request.method, request.mode);
  if (strategy === "bypass") return;
  if (strategy === "swr") event.respondWith(handleBookingSwr(request));
  else if (strategy === "static") event.respondWith(handleStatic(request));
  else if (strategy === "network-only") event.respondWith(handleNetworkOnly(request));
  else if (strategy === "page") event.respondWith(pageStrategy(url.pathname) === "network-first" ? handlePageFresh(request) : handlePage(request));
  else event.respondWith(handleData(request));
});
