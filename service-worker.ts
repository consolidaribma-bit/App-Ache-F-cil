/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'ache-facil-v1';
const RUNTIME_CACHE = 'ache-facil-runtime';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install Event
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (event: FetchEvent) => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        return caches.match('/offline.html');
      });
    })
  );
});

// Background Sync
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'sync-lists') {
    event.waitUntil(syncShoppingLists());
  }
});

async function syncShoppingLists() {
  try {
    const response = await fetch('/api/sync');
    if (response.ok) {
      const data = await response.json();
      // Broadcast to all clients
      const clients = await self.clients.matchAll();
      clients.forEach((client) => {
        client.postMessage({
          type: 'SYNC_COMPLETE',
          data,
        });
      });
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Push Notifications
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  const data = event.data.json();
  const options: NotificationOptions = {
    body: data.body,
    icon: '/logo-192.png',
    badge: '/logo-192.png',
    tag: data.tag || 'notification',
    requireInteraction: data.requireInteraction || false,
    data: data.data || {},
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification Click
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/app';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return (client as any).focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
