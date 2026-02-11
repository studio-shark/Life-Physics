
const CACHE_NAME = 'life-physics-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/constants.tsx'
];

// On install, cache all core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// Network-first falling back to cache for most requests
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests like Google APIs unless we want to cache them specifically
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clonedRes = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedRes));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
