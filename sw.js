// Schedulator offline support for the Home Screen app.
// Network first, so a new version is picked up whenever there is signal; the last copy that
// loaded is kept for when there is none. Your data is not in here — it stays in the app's storage.
const CACHE = 'schedulator-shell';
const SHELL = ['./', './index.html', './manifest.webmanifest', './apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  // A cache that cannot be filled right now must not stop the worker installing — the fetch
  // handler below fills it on the next visit with signal instead.
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); })
    .catch(function () { })
    .then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(function (c) { return c.put(req, copy); }).catch(function () { });
      }
      return res;
    }).catch(function (err) {
      return caches.match(req).then(function (hit) {
        return hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined);
      }).then(function (hit) { if (hit) return hit; throw err; });
    })
  );
});
