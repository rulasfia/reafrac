/// <reference types="vite-plugin-pwa/client" />

declare module 'virtual:pwa-register' {
	export function registerSW(options?: {
		onOfflineReady?: () => void;
		onNeedRefresh?: () => void;
		onRegisteredSW?: (swScriptUrl: string) => void;
		onRegisterError?: (error: any) => void;
	}): (reloadPage?: boolean) => void;
}
