import { useEffect } from 'react';

export function PWARegister() {
	useEffect(() => {
		// Unregister any existing service workers
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.getRegistrations().then((registrations) => {
				registrations.forEach((registration) => {
					console.log('PWA: Unregistering service worker');
					registration.unregister();
				});
			});
		}
	}, []);

	return null;
}
