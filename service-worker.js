const SHELL_CACHE = "zziksticker-shell-v30-text";
const RUNTIME_CACHE = "zziksticker-runtime-v30-text";

const SHELL_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;

  // App shell: network-first (so fixes show up right away while we're
  // actively iterating), falling back to cache when offline.
  if (isSameOrigin) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(event.request, copy));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // AI model/wasm assets (background removal) from CDNs: cache-first
  // (they're versioned & immutable), so repeat use works offline too.
  const AI_CDN_HOSTS = [
    "esm.sh",
    "esm.run",
    "cdn.skypack.dev",
    "staticimgly.com",
    "jsdelivr.net",
    "unpkg.com",
  ];
  if (AI_CDN_HOSTS.some((h) => url.hostname.includes(h))) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        try {
          const res = await fetch(event.request);
          if (res && res.status === 200) cache.put(event.request, res.clone());
          return res;
        } catch (err) {
          if (cached) return cached;
          throw err;
        }
      })
    );
  }
});
