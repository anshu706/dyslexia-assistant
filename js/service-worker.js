// SERVICE WORKER - Offline support and caching

const CACHE_NAME = 'dyslexia-assistant-v1';
const urlsToCache = [
    './',
    './index.html',
    'css/main.css',
    'css/dyslexia.css',
    'css/themes.css',
    'css/animations.css',
    'js/utils.js',
    'js/file-handler.js',
    'js/storage.js',
    'js/highlights.js',
    'js/notes.js',
    'js/state.js',
    'js/tts.js',
    'js/app.js'
];

// Install event
self.addEventListener('install', (event) => {
    console.log('🚀 Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('✅ Cache opened');
            return cache.addAll(urlsToCache).catch(error => {
                console.log('⚠️ Some assets failed to cache:', error);
                // Continue even if some assets fail
                return Promise.resolve();
            });
        })
    );
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker activated');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - Network first, fall back to cache
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone the response
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                return response;
            })
            .catch(() => {
                // Fall back to cache
                return caches.match(event.request).then((response) => {
                    return response || new Response('Offline - Content not available', {
                        status: 503,
                        statusText: 'Service Unavailable'
                    });
                });
            })
    );
});