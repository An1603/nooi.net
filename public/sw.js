// NOOI — PWA Service Worker
// Version: 3.0.0 — Auto-update notify + new brand icons

const CACHE_NAME = "nooi-v4";
const APP_ROUTES = [
  "/",
  "/manifest.json",
  "/favicon.ico",
  "/favicon.png",
  "/pwa/icon-192.png",
  "/pwa/icon-512.png",
];

// ── Install: cache shell assets ──
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_ROUTES).catch((err) => {
        console.warn("[SW] Some routes failed to cache:", err);
      });
    })
  );
  self.skipWaiting();
});

// ── Activate: clean old caches + notify clients ──
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Clean old caches
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );

      // Clear all cached app pages (fresh start)
      const cache = await caches.open(CACHE_NAME);
      const requests = await cache.keys();
      await Promise.all(
        requests.map((req) => {
          if (new URL(req.url).pathname.startsWith("/app/")) {
            return cache.delete(req);
          }
        })
      );

      // Notify all clients: new version available
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((client) => {
        client.postMessage({ type: "SW_UPDATED", version: CACHE_NAME });
      });
    })()
  );
  self.clients.claim();
});

// ── Listen for SKIP_WAITING from client ──
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ── Fetch: network-first for app, cache-first for static ──
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // ── App routes: NETWORK-FIRST (critical for auth) ──
  if (request.mode === "navigate" && url.pathname.startsWith("/app")) {
    event.respondWith(
      fetch(request).then((response) => {
        if (response.ok && response.status < 300) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        return caches.match(request).then((cached) => cached || caches.match("/"));
      })
    );
    return;
  }

  // ── Main site navigation: network-first ──
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((cached) => cached || caches.match("/"))
      )
    );
    return;
  }

  // ── Static assets: cache-first ──
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request).then((response) => {
        if (response.ok && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
