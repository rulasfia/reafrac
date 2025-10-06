import { createServerFn } from '@tanstack/react-start';
import { authFnMiddleware } from '../middleware/auth-middleware';

export const getUserInfoServerFn = createServerFn()
	.middleware([authFnMiddleware])
	.handler(async ({ context }) => {
		return context.user;
	});
