// Migration service worker for Reafrac PWA - Phase 1
// This version cleans up all existing caches to prepare for caching removal

const MIGRATION_VERSION = 'migration-v1';

// Install event - clean up all existing caches
self.addEventListener('install', (event) => {
	console.log('SW: Installing migration service worker');

	// Skip waiting in production to ensure immediate activation
	const shouldSkipWaiting =
		!self.location.hostname.includes('localhost') && !self.location.hostname.includes('127.0.0.1');

	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) => {
				console.log('SW: Found caches to clean up:', cacheNames);
				return Promise.all(
					cacheNames.map((cacheName) => {
						console.log('SW: Cleaning up cache:', cacheName);
						return caches.delete(cacheName);
					})
				);
			})
			.then(() => {
				console.log('SW: All caches cleaned up successfully');
				if (shouldSkipWaiting) {
					return self.skipWaiting();
				}
			})
			.catch((error) => {
				console.error('SW: Failed to clean up caches:', error);
			})
	);
});

// Activate event - ensure clean state and take control
self.addEventListener('activate', (event) => {
	console.log('SW: Activating migration service worker');

	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) => {
				// Double-check and clean up any remaining caches
				console.log('SW: Final cache cleanup, found:', cacheNames);
				return Promise.all(
					cacheNames.map((cacheName) => {
						console.log('SW: Final cleanup of cache:', cacheName);
						return caches.delete(cacheName);
					})
				);
			})
			.then(() => {
				console.log('SW: Migration complete - all caches removed');
				return self.clients.claim();
			})
			.catch((error) => {
				console.error('SW: Migration activation failed:', error);
			})
	);
});

// Fetch event - pass through to network (no caching during migration)
self.addEventListener('fetch', (_event) => {
	// During migration, don't intercept any requests - let network handle everything
	// This ensures clean behavior while we prepare for the final phase
	return;
});

// Message handling for compatibility with existing PWA registration
self.addEventListener('message', (event) => {
	const { type } = event.data;

	switch (type) {
		case 'SKIP_WAITING':
			console.log('SW: Skip waiting requested');
			self.skipWaiting();
			break;

		case 'GET_VERSION':
			console.log('SW: Version requested during migration');
			event.ports[0].postMessage({
				type: 'VERSION_RESPONSE',
				payload: {
					version: __APP_VERSION__,
					buildDate: __BUILD_DATE__,
					migration: MIGRATION_VERSION
				}
			});
			break;

		default:
			console.log('SW: Unknown message type during migration:', type);
	}
});

console.log('SW: Migration service worker loaded successfully');
