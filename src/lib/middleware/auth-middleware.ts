import { createMiddleware } from '@tanstack/react-start';
import { redirect } from '@tanstack/react-router';
import { auth } from '../auth';
import { getRequest } from '@tanstack/react-start/server';

export const authFnMiddleware = createMiddleware({ type: 'function' }).server(async ({ next }) => {
	const session = await auth.api.getSession({
		headers: getRequest().headers
	});

	if (!session) {
		throw redirect({ to: '/' });
	}
	return await next({ context: { user: session?.user } });
});
