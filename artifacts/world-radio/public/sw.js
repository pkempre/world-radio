const CACHE_NAME = 'world-radio-v2';
const STATIC_ASSETS = [
  '/',
  '/browse',
  '/search',
  '/favorites',
  '/music',
  '/artists',
  '/playlists',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.svg',
];

// Install: pre-cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Audio streams: always network, never cache (live radio)
  if (
    url.pathname.includes('/stream') ||
    url.pathname.includes('/audio') ||
    request.headers.get('range') !== null
  ) {
    event.respondWith(fetch(request));
    return;
  }

  // API calls: network only, no cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: 'Offline' }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    return;
  }

  // Cross-origin requests (YouTube, Google fonts, etc.): pass through
  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(request));
    return;
  }

  // App shell: cache-first, update in background
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
      return cached || networkFetch;
    })
  );
});

// Background sync placeholder (future: queue favorite saves while offline)
self.addEventListener('sync', () => {});

// Push notifications placeholder (future: new station alerts)
self.addEventListener('push', () => {});
