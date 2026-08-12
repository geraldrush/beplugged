const CACHE_VERSION = "beplugged-v27";
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
  "/studio",
  // The book designer keeps the whole book in IndexedDB and only needs the
  // network to send it. Precaching the shell means a dropped connection
  // costs the customer nothing until they press send.
  "/studio/editor",
  "/studio/editor.css",
  "/studio/editor.js",
  "/portfolio-details",
  "/contact",
  "/training",
  "/training/unisa_modules/cos1511/",
  OFFLINE_URL,
  "/style.css",
  "/css/bootstrap.min.css",
  "/css/normalize.css",
  "/css/responsive.css",
  "/css/theme.css",
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

  // The C++ toolchain payloads are large and the compiler already keeps its
  // own copy in IndexedDB. Caching them here as well would store them twice
  // and eat the student's quota for nothing.
  if (url.pathname.startsWith("/academy/cdn/")) {
    return true;
  }

  return request.headers.has("Authorization");
}

// Assets whose contents change from one deploy to the next, under a URL that
// does not. These get revalidated in the background rather than pinned.
function shouldRevalidate(request) {
  if (request.destination === "style" || request.destination === "script") {
    return true;
  }
  return /\.(css|js)$/i.test(new URL(request.url).pathname);
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

  // Revalidated assets must be written back to the cache they were precached
  // into. caches.match() searches STATIC_CACHE first, so refreshing a copy of
  // theme.css into RUNTIME_CACHE would leave the stale precached one winning
  // every lookup.
  const targetCache = shouldRevalidate(request) ? STATIC_CACHE : RUNTIME_CACHE;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (!isCacheableResponse(response)) {
            return response;
          }

          const responseClone = response.clone();
          event.waitUntil(
            caches.open(targetCache).then((cache) => cache.put(request, responseClone))
          );
          return response;
        })
        .catch(() => {
          if (cached) {
            return cached;
          }
          if (request.destination === "image") {
            return caches.match("/img/logo.png");
          }
          return Response.error();
        });

      // Stylesheets and scripts change on every deploy. Serving them
      // cache-first with no revalidation meant a returning visitor kept the
      // build they first saw until CACHE_VERSION happened to change, so CSS
      // fixes silently never reached them. Hand back the cached copy for
      // speed, but always refresh it in the background so the next load is
      // current. Images and fonts are content-stable, so they stay
      // cache-first and cost no extra request.
      if (shouldRevalidate(request)) {
        if (cached) {
          event.waitUntil(network.catch(() => {}));
          return cached;
        }
        return network;
      }

      return cached || network;
    })
  );
});
