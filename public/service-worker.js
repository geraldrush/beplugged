const CACHE_VERSION = "beplugged-v5";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Workers Assets serves pages without the .html extension and 307s the
// extensioned form, so precache the canonical paths users actually navigate
// to. Caching "/about.html" stored a redirected response under a key no
// navigation ever matched, which silently broke offline page loads.
const OFFLINE_URL = "/offline";

const CORE_ASSETS = [
  "/",
  "/about",
  "/service",
  "/portfolio-details",
  "/contact",
  "/training",
  OFFLINE_URL,
  "/style.css",
  "/css/bootstrap.min.css",
  "/css/normalize.css",
  "/css/responsive.css",
  "/js/jquery.min.js",
  "/js/bootstrap.min.js",
  "/js/main.js",
  "/js/pwa.js",
  "/js/whatsapp.js",
  "/img/logo.png",
  "/img/favicon.ico",
  "/img/android-chrome-192x192.png",
  "/img/android-chrome-512x512.png",
  "/site.webmanifest"
];

function shouldBypassCache(request) {
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return true;
  }

  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/admin/") ||
    url.pathname === "/admin"
  ) {
    return true;
  }

  return request.headers.has("Authorization");
}

function isCacheableResponse(response) {
  if (!response || response.status !== 200 || response.type !== "basic") {
    return false;
  }

  const cacheControl = response.headers.get("Cache-Control") || "";
  return !/no-store|private/i.test(cacheControl);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET" || shouldBypassCache(request)) {
    return;
  }

  const isDocument = request.mode === "navigate";

  if (isDocument) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (isCacheableResponse(response)) {
            const responseClone = response.clone();
            event.waitUntil(
              caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, responseClone))
            );
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL)))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(request)
        .then((response) => {
          if (!isCacheableResponse(response)) {
            return response;
          }

          const responseClone = response.clone();
          event.waitUntil(
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, responseClone))
          );
          return response;
        })
        .catch(() => {
          if (request.destination === "image") {
            return caches.match("/img/logo.png");
          }
          return Response.error();
        });
    })
  );
});
