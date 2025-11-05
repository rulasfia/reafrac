import { createRouter } from '@tanstack/react-router';

// Import the generated route tree
import { routeTree } from './routeTree.gen';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { QueryClient } from '@tanstack/react-query';
import * as Sentry from '@sentry/tanstackstart-react';

// Create a new router instance
export const getRouter = () => {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { refetchOnWindowFocus: false } }
	});

	const router = createRouter({
		routeTree,
		defaultPreload: 'intent',
		context: { queryClient },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});

	setupRouterSsrQueryIntegration({
		router,
		queryClient
	});

	if (!router.isServer) {
		Sentry.init({
			dsn: import.meta.env.VITE_SENTRY_DSN,
			// Adds request headers and IP for users, for more info visit:
			// https://docs.sentry.io/platforms/javascript/guides/tanstackstart-react/configuration/options/#sendDefaultPii
			sendDefaultPii: true,
			environment:
				import.meta.env.NODE_ENV?.toLowerCase() === 'production' ? 'production' : 'development',
			integrations: [Sentry.tanstackRouterBrowserTracingIntegration(router)],
			tracesSampleRate: parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? '1.0')
		});
	}

	return router;
};

declare module '@tanstack/react-router' {
	interface Register {
		router: ReturnType<typeof createRouter>;
	}
}
