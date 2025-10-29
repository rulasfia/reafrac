import { createMiddleware } from '@tanstack/react-start';
import * as Sentry from '@sentry/tanstackstart-react';

export const sentryMiddleware = createMiddleware({ type: 'function' }).server(
	Sentry.sentryGlobalServerMiddlewareHandler()
);
