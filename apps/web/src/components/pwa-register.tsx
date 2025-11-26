import { useEffect } from 'react';
import { registerSW } from 'virtual:pwa-register';

export function PWARegister() {
	useEffect(() => {
		const updateSW = registerSW({
			onOfflineReady() {
				console.log('App ready to work offline');
			},
			onNeedRefresh() {
				if (confirm('New content available, reload to update?')) {
					updateSW(true);
				}
			},
			onRegisteredSW(swScriptUrl: string) {
				console.log('SW registered at:', swScriptUrl);
			},
			onRegisterError(error) {
				console.error('SW registration error:', error);
			}
		});
	}, []);

	return null;
}
