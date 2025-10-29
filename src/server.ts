import handler from '@tanstack/react-start/server-entry';
import * as Sentry from '@sentry/tanstackstart-react';

Sentry.init({
	dsn: process.env.VITE_SENTRY_DSN,
	// Adds request headers and IP for users, for more info visit:
	// https://docs.sentry.io/platforms/javascript/guides/tanstackstart-react/configuration/options/#sendDefaultPii
	sendDefaultPii: true,
	environment: process.env.NODE_ENV?.toLowerCase() === 'production' ? 'production' : 'development'
});

export default {
	fetch(request: Request) {
		return handler.fetch(request);
	}
};
