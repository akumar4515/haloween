// Service Worker for caching and performance optimization
const CACHE_NAME = 'flovex-v2';
const STATIC_CACHE = 'flovex-static-v2';
const DYNAMIC_CACHE = 'flovex-dynamic-v2';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/logo.png',
  '/manifest.json',
  '/favicon.ico'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - cache strategy
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Always fetch latest HTML for navigations
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(request) || caches.match('/'))
    );
    return;
  }

  // Cache images aggressively
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then(response => {
        if (response) return response;

        return fetch(request).then(response => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
  }

  // Cache API responses (videos, thumbnails) with short TTL
  else if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).then(response => {
        // Only cache successful responses
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => {
            // Add cache headers for short TTL
            const headers = new Headers(responseClone.headers);
            headers.set('sw-cache-time', Date.now().toString());
            headers.set('sw-cache-ttl', '300000'); // 5 minutes

            const cachedResponse = new Response(responseClone.body, {
              status: responseClone.status,
              statusText: responseClone.statusText,
              headers
            });

            cache.put(request, cachedResponse);
          });
        }
        return response;
      }).catch(() => {
        // Return cached version if available
        return caches.match(request);
      })
    );
  }

  // Cache static assets
  else if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then(response => {
        return response || fetch(request);
      })
    );
  }

  // Default fetch for everything else
  else {
    event.respondWith(fetch(request));
  }
});

// Background sync for analytics (if needed)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Placeholder for background sync tasks
  console.log('Background sync triggered');
}

// Periodic cleanup
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CLEANUP_CACHE') {
    cleanupCache();
  }
});

async function cleanupCache() {
  const cache = await caches.open(DYNAMIC_CACHE);
  const keys = await cache.keys();

  // Remove entries older than 5 minutes
  const now = Date.now();
  const ttl = 5 * 60 * 1000; // 5 minutes

  await Promise.all(
    keys.map(async request => {
      const response = await cache.match(request);
      if (response) {
        const cacheTime = response.headers.get('sw-cache-time');
        if (cacheTime && (now - parseInt(cacheTime)) > ttl) {
          await cache.delete(request);
        }
      }
    })
  );
}
