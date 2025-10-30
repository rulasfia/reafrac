import { createServerFn } from '@tanstack/react-start';
import { authFnMiddleware } from '../middleware/auth-middleware';
import { sentryMiddleware } from '../middleware/sentry-middleware';
import * as Sentry from '@sentry/tanstackstart-react';

export const getUserInfoServerFn = createServerFn()
	.middleware([sentryMiddleware, authFnMiddleware])
	.handler(async ({ context }) => {
		return Sentry.startSpan({ op: 'server_function', name: 'getUserInfo' }, async (span) => {
			try {
				span.setAttribute('user_id', context.user.id);
				span.setAttribute('email', context.user.email);

				span.setAttribute('status', 'success');
				return context.user;
			} catch (error) {
				span.setAttribute('status', 'error');
				Sentry.captureException(error, {
					tags: { function: 'getUserInfo' },
					extra: {
						userId: context.user.id,
						errorMessage: error instanceof Error ? error.message : 'Unknown error'
					}
				});
				throw error;
			}
		});
	});
