const CACHE_NAME = 'gocanteen-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/app-icon.png',
  '/logo.png',
  '/robots.txt',
  '/sitemap.xml'
];

// Install Event - Cache Core Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and skip external analytics, Supabase or other dynamic calls
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('/supabase.co') ||
    event.request.url.includes('/checkout.razorpay.com') ||
    event.request.url.includes('chrome-extension://') ||
    !event.request.url.startsWith(self.location.origin)
  ) {
    return;
  }

  const isHtmlRequest = event.request.mode === 'navigate' || 
                        event.request.url === self.location.origin + '/' || 
                        event.request.url.endsWith('/index.html');

  // Network-First strategy for HTML navigation requests to prevent stale asset hashes / white screens on updates
  if (isHtmlRequest) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Stale-while-revalidate strategy for other static assets (JS, CSS, images)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Silent fallback on network failures
        });

      return cachedResponse || fetchPromise;
    })
  );
});

