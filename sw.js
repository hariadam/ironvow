// Offline support. Network first, so new versions show up right away when online;
// falls back to the last cached copy when offline. The save is in localStorage, not here.
// Bump CACHE only when the caching rules in this file change.
const CACHE = 'ironvow-v2';

self.addEventListener('install', () => self.skipWaiting());

// Take over open pages and drop caches left by older versions of this file.
self.addEventListener('activate', event => event.waitUntil(
  caches.keys()
    .then(names => Promise.all(names.filter(name => name !== CACHE).map(name => caches.delete(name))))
    .then(() => self.clients.claim()),
));

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  // The game's own files are always re-checked with the server, never taken from the browser's HTTP cache:
  // the game is many small modules, and a new one must never run next to a stale one.
  const ours = new URL(request.url).origin === self.location.origin;
  event.respondWith(
    fetch(request, ours ? { cache: 'no-cache' } : {})
      .then(response => {
        if (response.ok || response.type === 'opaque') {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(request).then(hit => hit || caches.match('./'))),
  );
});
