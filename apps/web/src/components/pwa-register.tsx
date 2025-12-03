import { useEffect, useRef } from 'react';

interface VersionInfo {
	version: string;
	buildDate: string;
	env: string;
}

export function PWARegister() {
	const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);
	const versionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const currentVersionRef = useRef<string>(import.meta.env.VITE_APP_VERSION || 'dev');

	useEffect(() => {
		// Skip PWA functionality in development and clean up any existing SWs
		if (import.meta.env.DEV) {
			console.log('PWA: Skipping service worker registration in development');

			// Unregister any existing service workers in development
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.getRegistrations().then((registrations) => {
					registrations.forEach((registration) => {
						console.log('PWA: Unregistering service worker in development');
						registration.unregister();
					});
				});
			}
			return;
		}

		const registerServiceWorker = async () => {
			try {
				if ('serviceWorker' in navigator) {
					console.log('PWA: Registering service worker');

					const registration = await navigator.serviceWorker.register('/sw.js', {
						scope: '/'
					});

					swRegistrationRef.current = registration;
					console.log('PWA: Service worker registered successfully');

					// Handle service worker updates
					registration.addEventListener('updatefound', () => {
						const newWorker = registration.installing;
						if (newWorker) {
							console.log('PWA: New service worker found');

							newWorker.addEventListener('statechange', () => {
								if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
									console.log('PWA: New service worker installed, checking for updates');
									checkForUpdates();
								}
							});
						}
					});

					// Start version checking
					startVersionChecking();

					// Handle controller changes (when new SW takes control)
					navigator.serviceWorker.addEventListener('controllerchange', () => {
						console.log('PWA: Controller changed, reloading page');
						window.location.reload();
					});
				} else {
					console.warn('PWA: Service Worker not supported');
				}
			} catch (error) {
				console.error('PWA: Service worker registration failed:', error);
			}
		};

		const checkForUpdates = async () => {
			try {
				console.log('PWA: Checking for version updates');

				// Get current version from API
				const response = await fetch('/api/version');
				if (!response.ok) {
					console.warn('PWA: Failed to fetch version info');
					return;
				}

				const serverVersion: VersionInfo = await response.json();
				console.log(
					'PWA: Server version:',
					serverVersion.version,
					'Current version:',
					currentVersionRef.current
				);

				// Check if version has changed
				if (serverVersion.version !== currentVersionRef.current) {
					console.log('PWA: New version detected:', serverVersion.version);

					// Trigger service worker update
					if (swRegistrationRef.current) {
						const registration = swRegistrationRef.current;

						// Send message to service worker to skip waiting
						if (registration.active) {
							registration.active.postMessage({ type: 'SKIP_WAITING' });
						}

						// Also try to update the service worker
						await registration.update();
					}
				}
			} catch (error) {
				console.error('PWA: Version check failed:', error);
			}
		};

		const startVersionChecking = () => {
			// Check for updates every 30 minutes (less frequent to reduce overhead)
			versionCheckIntervalRef.current = setInterval(
				() => {
					checkForUpdates();
				},
				30 * 60 * 1000
			);

			// Check after a short delay to allow page to load first
			setTimeout(checkForUpdates, 5000);
		};

		const stopVersionChecking = () => {
			if (versionCheckIntervalRef.current) {
				clearInterval(versionCheckIntervalRef.current);
				versionCheckIntervalRef.current = null;
			}
		};

		// Register service worker
		registerServiceWorker();

		// Cleanup
		return () => {
			stopVersionChecking();
		};
	}, []);

	return null;
}
