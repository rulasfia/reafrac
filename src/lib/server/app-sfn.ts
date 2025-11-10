import { createServerFn } from '@tanstack/react-start';
import { sentryMiddleware } from '../middleware/sentry-middleware';
import * as Sentry from '@sentry/tanstackstart-react';

export const getAppConfigServerFn = createServerFn()
	.middleware([sentryMiddleware])
	.handler(async () => {
		return Sentry.startSpan({ op: 'server_function', name: 'getAppConfig' }, async (span) => {
			span.setAttribute('status', 'success');
			const isGoogleAuthEnabled =
				!!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

			return { isGoogleAuthEnabled };
		});
	});
