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

// Initialize Firebase Messaging. 
// Firebase will automatically handle incoming push notifications and click events 
// natively using the fcmOptions.link provided by the backend!
const messaging = firebase.messaging();

const CACHE_NAME = 'gocanteen-cache-v3';
const ASSETS_TO_CACHE = [
  '/?v=3',
  '/index.html?v=3',
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
      fetch(event.request, { cache: 'no-store' })
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

