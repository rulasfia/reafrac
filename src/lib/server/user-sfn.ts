import { createServerFn } from '@tanstack/react-start';
import { authFnMiddleware } from '../middleware/auth-middleware';
import { sentryMiddleware } from '../middleware/sentry-middleware';

export const getUserInfoServerFn = createServerFn()
	.middleware([sentryMiddleware, authFnMiddleware])
	.handler(async ({ context }) => {
		return context.user;
	});
