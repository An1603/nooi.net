// NOOI — PWA Service Worker
// Version: 2.1.0 — Fix: network-first cho app routes (tránh cache dashboard sau logout)

const CACHE_NAME = "nooi-v2";
const APP_ROUTES = [
  "/",
  "/manifest.json",
  "/favicon.ico",
  "/favicon.png",
  "/logo-icon.png",
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

// ── Activate: clean old caches ──
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  // Clear all cached app pages on activate (fresh start after logout)
  caches.open(CACHE_NAME).then((cache) => {
    cache.keys().then((keys) => {
      keys.forEach((request) => {
        if (request.url.includes("/app/")) {
          cache.delete(request);
        }
      });
    });
  });
  self.clients.claim();
});

// ── Fetch: network-first for app, cache-first for static ──
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // ── App routes: NETWORK-FIRST (critical for auth) ──
  // Always fetch from network so middleware can redirect unauthenticated users.
  // Only fall back to cache if network fails (offline).
  if (request.mode === "navigate" && url.pathname.startsWith("/app")) {
    event.respondWith(
      fetch(request).then((response) => {
        // Only cache successful, non-redirect responses
        if (response.ok && response.status < 300) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        // Offline: serve cached version (or root as fallback)
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

  // ── Static assets: cache-first (fast) ──
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
