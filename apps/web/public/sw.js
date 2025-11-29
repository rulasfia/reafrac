// Custom service worker for Reafrac PWA
// This replaces vite-plugin-pwa functionality

const CACHE_NAME = 'reafrac-cache-v1';
const API_CACHE_NAME = 'reafrac-api-cache-v1';

// Assets to cache on install
const STATIC_ASSETS = [
	'/',
	'/reader',
	'/manifest.json',
	'/pwa-192x192.png',
	'/pwa-512x512.png',
	'/favicon.ico',
	'/apple-touch-icon.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
	console.log('SW: Installing service worker');

	// Don't skip waiting in development to avoid constant reloads
	const shouldSkipWaiting =
		!self.location.hostname.includes('localhost') && !self.location.hostname.includes('127.0.0.1');

	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => {
				console.log('SW: Caching static assets');
				return cache.addAll(STATIC_ASSETS);
			})
			.then(() => {
				console.log('SW: Static assets cached successfully');
				if (shouldSkipWaiting) {
					return self.skipWaiting();
				}
			})
			.catch((error) => {
				console.error('SW: Failed to cache static assets:', error);
			})
	);
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
	console.log('SW: Activating service worker');

	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) => {
				return Promise.all(
					cacheNames.map((cacheName) => {
						if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
							console.log('SW: Deleting old cache:', cacheName);
							return caches.delete(cacheName);
						}
					})
				);
			})
			.then(() => {
				console.log('SW: Activation complete');
				return self.clients.claim();
			})
			.catch((error) => {
				console.error('SW: Activation failed:', error);
			})
	);
});

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Skip non-GET requests
	if (request.method !== 'GET') return;

	// In development, don't interfere with requests
	if (
		self.location.hostname.includes('localhost') ||
		self.location.hostname.includes('127.0.0.1')
	) {
		return;
	}

	// API requests - Network First strategy
	if (url.pathname.startsWith('/api/')) {
		event.respondWith(
			caches.open(API_CACHE_NAME).then((cache) => {
				return fetch(request)
					.then((response) => {
						// Cache successful responses
						if (response.ok) {
							cache.put(request, response.clone());
						}
						return response;
					})
					.catch(() => {
						// Fallback to cache if network fails
						console.log('SW: Network failed, using cache for API:', request.url);
						return cache.match(request);
					});
			})
		);
		return;
	}

	// Static assets - Cache First strategy
	if (STATIC_ASSETS.some((asset) => url.pathname === asset || url.pathname.startsWith(asset))) {
		event.respondWith(
			caches.open(CACHE_NAME).then((cache) => {
				return cache.match(request).then((response) => {
					if (response) {
						return response;
					}

					// Not in cache, fetch and cache
					return fetch(request).then((response) => {
						if (response.ok) {
							cache.put(request, response.clone());
						}
						return response;
					});
				});
			})
		);
		return;
	}

	// Navigation requests - try network first, fallback to cache
	if (request.mode === 'navigate') {
		event.respondWith(
			fetch(request)
				.then((response) => {
					// Cache successful navigation responses
					if (response.ok) {
						const responseClone = response.clone();
						caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
					}
					return response;
				})
				.catch(() => {
					// Fallback to cached page or offline page
					return caches.match(request).then((response) => {
						return (
							response ||
							caches.match('/') ||
							new Response('Offline', {
								status: 503,
								statusText: 'Service Unavailable'
							})
						);
					});
				})
		);
		return;
	}

	// Other requests - try network, don't cache
	event.respondWith(fetch(request));
});

// Message handling for version updates
self.addEventListener('message', (event) => {
	const { type } = event.data;

	switch (type) {
		case 'SKIP_WAITING':
			console.log('SW: Skip waiting requested');
			self.skipWaiting();
			break;

		case 'GET_VERSION':
			console.log('SW: Version requested');
			event.ports[0].postMessage({
				type: 'VERSION_RESPONSE',
				payload: {
					version: __APP_VERSION__,
					buildDate: __BUILD_DATE__
				}
			});
			break;

		default:
			console.log('SW: Unknown message type:', type);
	}
});

// Background sync for offline actions (if needed)
self.addEventListener('sync', (event) => {
	if (event.tag === 'background-sync') {
		console.log('SW: Background sync triggered');
		event.waitUntil(
			// Handle background sync logic here
			Promise.resolve()
		);
	}
});

// Push notifications (if needed)
self.addEventListener('push', (event) => {
	if (event.data) {
		const data = event.data.json();
		console.log('SW: Push notification received:', data);

		event.waitUntil(
			self.registration.showNotification(data.title, {
				body: data.body,
				icon: '/pwa-192x192.png',
				badge: '/favicon.ico'
			})
		);
	}
});

console.log('SW: Service worker loaded successfully');
