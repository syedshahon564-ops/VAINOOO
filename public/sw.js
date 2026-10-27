// Production Service Worker for FF Rivals: High Speed Caching, Push Notifications & Offline Support
const CACHE_NAME = 'ff-rivals-speed-v5-2-0';
const STATIC_PRECACHE = [
  '/',
  '/manifest.json',
  '/logo.png',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE).catch(() => {});
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// High-speed fetch caching:
// 1. Never intercept /api/ calls or non-GET methods (always live real-time)
// 2. Cache-first with background revalidation for static bundles, fonts, icons, banners
// 3. Stale-while-revalidate for page navigations so screen renders in 1ms even on slow 2G/3G
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (!req || req.method !== 'GET') return;

  const url = new URL(req.url);

  // Always bypass API calls and APK downloads
  if (url.pathname.startsWith('/api/') || url.pathname.endsWith('.apk')) {
    return;
  }

  // Cache-first for Next.js static bundles, assets, icons, fonts, avatars
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/avatars/') ||
    url.pathname.startsWith('/banners/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|ico|woff|woff2|ttf|css|js)$/i)
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((networkRes) => {
            if (networkRes && networkRes.status === 200 && networkRes.type === 'basic') {
              const clone = networkRes.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, clone)).catch(() => {});
            }
            return networkRes;
          })
          .catch(() => cached);
      })
    );
    return;
  }

  // Stale-while-revalidate for HTML page navigations (instant response + background refresh)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone)).catch(() => {});
          }
          return networkRes;
        })
        .catch(() => {
          return caches.match(req).then((cached) => {
            return cached || caches.match('/');
          });
        })
    );
  }
});

// Receive Push Notifications in background (even when app/browser is closed)
self.addEventListener('push', (event) => {
  let data = {
    title: 'FF Rivals Tournament',
    body: 'নতুন টুর্নামেন্ট ও ওয়ালেট নোটিফিকেশন!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    url: '/',
  };

  if (event.data) {
    try {
      const json = event.data.json();
      data = Object.assign({}, data, json);
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
    },
    actions: [
      { action: 'open', title: '👀 ওপেন করুন' }
    ],
    tag: 'ff-notification-' + Date.now(),
    renotify: true,
    requireInteraction: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// User taps on the push notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url && client.navigate) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
