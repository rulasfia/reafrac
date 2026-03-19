import { createMiddleware } from '@tanstack/react-start';
import { redirect } from '@tanstack/react-router';
import { auth } from '../auth';
import { getRequest } from '@tanstack/react-start/server';

export const adminMiddleware = createMiddleware({ type: 'function' }).server(async ({ next }) => {
	const session = await auth.api.getSession({
		headers: getRequest().headers
	});

	if (!session) {
		throw redirect({ to: '/' });
	}

	if (!session.user.isAdmin) {
		throw new Error('Unauthorized: Admin access required');
	}

	return await next({ context: { user: session.user } });
});
