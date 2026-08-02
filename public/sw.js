// Minimal service worker: exists to satisfy PWA installability (a fetch
// handler + the manifest, see src/app/manifest.ts) and give a bare offline
// fallback — not to cache the app itself. This is dynamic, per-host,
// auth-gated data (dashboard, RSVP forms, guest pages): caching those
// responses risks serving stale or cross-session content to the next
// visitor, which installability doesn't require. Only the bare "/" shell is
// ever cached, and only page navigations ever consult it.
const CACHE_NAME = "ahvaan-shell-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(["/"]))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

// Network-first: every request, including navigations, always tries the
// network first so logged-in/dynamic content is never served stale. Only
// page navigations fall back to the cached "/" shell, and only once the
// network request has actually failed (i.e. genuinely offline).
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).catch(() => caches.match("/")));
});
