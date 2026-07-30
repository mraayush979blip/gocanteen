// Import and configure Firebase Cloud Messaging in the service worker
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD6_lK9TP82lmj0YH4nvEkRKYj7jmmqjzA",
  authDomain: "go-canteen-77c0a.firebaseapp.com",
  projectId: "go-canteen-77c0a",
  storageBucket: "go-canteen-77c0a.firebasestorage.app",
  messagingSenderId: "83432321106",
  appId: "1:83432321106:web:0c1560c7e3462115e1ef8b"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Go Canteen';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || '',
    icon: '/app-icon.png',
    badge: '/logo.png',
    data: payload.data || {},
    requireInteraction: true
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Fallback Native Push Handler for iOS Safari & Android Deep Sleep
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const payload = event.data.json();
    const notificationTitle = payload.notification?.title || payload.data?.title || 'Go Canteen';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || '',
      icon: '/app-icon.png',
      badge: '/logo.png',
      data: payload.data || {},
      requireInteraction: true
    };
    event.waitUntil(
      self.registration.showNotification(notificationTitle, notificationOptions)
    );
  } catch (e) {
    console.warn('Native push handling notice:', e);
  }
});

// Handle Notification Clicks to Open App
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.link || '/#/menu';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

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
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
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

