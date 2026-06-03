const CACHE_NAME = 'voicetype-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Just precaching the root to make the PWA installable.
      return cache.addAll(['/']);
    }).catch((err) => {
      console.log('Failed to cache:', err);
    })
  );
  // Tell the active service worker to take control of the page immediately.
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // Simple network-first approach so we don't break the API calls
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
