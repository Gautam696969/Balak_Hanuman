const CACHE_NAME = 'bh-scorer-v1';

// Static assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
  '/balak-hanuman.png'
];

// 1. Install event: pre-cache core app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. Activate event: clean up outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch event: Network-first strategy for live scores and fresh content
self.addEventListener('fetch', (event) => {
  // Never cache non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Never cache API, Firebase Realtime Database, Firestore, WebSocket, or browser extensions
  if (
    url.pathname.startsWith('/api') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebase') ||
    url.protocol.startsWith('chrome-extension')
  ) {
    return;
  }

  // Network-first strategy:
  // Always fetch from network first so live scores, commentary, and match state are fresh.
  // If the user goes offline or the network drops, fallback to cache.
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Only cache successful standard responses
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Network failed (offline) -> attempt to serve from cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // For navigation requests (HTML pages), fallback to cached index.html
        if (event.request.mode === 'navigate') {
          const fallback = await caches.match('/index.html') || await caches.match('/');
          if (fallback) return fallback;
        }

        return new Response('Offline - No connection available', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain' })
        });
      })
  );
});

