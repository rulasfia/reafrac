import * as Sentry from '@sentry/tanstackstart-react';

Sentry.init({
	dsn: process.env.VITE_SENTRY_DSN,
	// Adds request headers and IP for users, for more info visit:
	// https://docs.sentry.io/platforms/javascript/guides/tanstackstart-react/configuration/options/#sendDefaultPii
	sendDefaultPii: true,
	environment: process.env.NODE_ENV?.toLowerCase() === 'production' ? 'production' : 'development',
	tracesSampleRate: parseFloat(process.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? '1.0')
});

console.log('Sentry initialized in intrument.server.ts...');
