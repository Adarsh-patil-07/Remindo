/* ============================================
   REMINDO — Service Worker
   Handles: Caching, Offline, Notifications
   ============================================ */

const CACHE_NAME = 'remindo-v23';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/index.css',
    '/css/components.css',
    '/css/pages.css',
    '/js/firebase-config.js',
    '/js/utils.js',
    '/js/store.js',
    '/js/router.js',
    '/js/notifications.js',
    '/js/app.js',
    '/js/pages/home.js',
    '/js/pages/birthdays.js',
    '/js/pages/bills.js',
    '/js/pages/student.js',
    '/js/pages/jobs.js',
    '/js/pages/medicines.js',
    '/js/pages/wishlist.js',
    '/js/pages/sizes.js',
    '/js/pages/reminders.js',
    '/icons/icon-192.svg',
    '/icons/icon-512.svg'
];

// --- Install: Cache static assets ---
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// --- Activate: Clean old caches ---
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

// --- Fetch: Network-first for API, Cache-first for static ---
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip Firebase/external requests
    if (url.origin !== self.location.origin) return;

    // Skip Google Fonts (let the browser handle caching)
    if (url.hostname.includes('googleapis') || url.hostname.includes('gstatic')) return;

    event.respondWith(
        caches.match(event.request)
            .then(cached => {
                // Return cached version, but also fetch update in background
                const fetchPromise = fetch(event.request)
                    .then(response => {
                        if (response && response.status === 200) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => cache.put(event.request, responseClone));
                        }
                        return response;
                    })
                    .catch(() => cached);

                return cached || fetchPromise;
            })
    );
});

// --- Push Notification handler ---
self.addEventListener('push', event => {
    if (!event.data) return;

    const data = event.data.json();
    const options = {
        body: data.body || '',
        icon: '/icons/icon-192.svg',
        badge: '/icons/icon-192.svg',
        vibrate: [200, 100, 200],
        data: data.url || '/',
        actions: [
            { action: 'open', title: 'Open' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Remindo', options)
    );
});

// --- Notification click handler ---
self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'dismiss') return;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clientList => {
                // Focus existing window if open
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Otherwise open new window
                return clients.openWindow(event.notification.data || '/');
            })
    );
});
