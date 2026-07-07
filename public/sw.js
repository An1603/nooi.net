// NOOI — PWA Service Worker
// Version: 2.0.0

const CACHE_NAME = "nooi-v2";
const APP_ROUTES = [
  "/",
  "/app",
  "/app/journal",
  "/app/thuc-hanh",
  "/app/voice",
  "/app/sandbox",
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
  self.clients.claim();
});

// ── Fetch: stale-while-revalidate for app, network-first for rest ──
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // App routes: stale-while-revalidate (fast offline, fresh online)
  if (request.mode === "navigate") {
    const isAppRoute = url.pathname.startsWith("/app");
    if (isAppRoute) {
      event.respondWith(
        caches.match(request).then((cached) => {
          const fetchPromise = fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          }).catch(() => cached);
          return cached || fetchPromise;
        })
      );
      return;
    }

    // For main site pages: network-first with offline fallback
    event.respondWith(
      fetch(request).catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
    );
    return;
  }

  // For static assets: cache-first
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
