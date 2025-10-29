import { redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server'; // Or similar path based on your setup
import * as z from 'zod/mini';
import { auth } from '../auth';
import { sentryMiddleware } from '../middleware/sentry-middleware';

const LoginSchema = z.object({
	email: z.email(),
	password: z.string().check(z.minLength(8))
});

export const loginServerFn = createServerFn({ method: 'POST' })
	.middleware([sentryMiddleware])
	.inputValidator(LoginSchema)
	.handler(async ({ data }) => {
		const { email, password } = data;
		const response = await auth.api.signInEmail({
			body: { email, password }
		});

		return response;
	});

const RegisterSchema = z.object({
	email: z.email(),
	password: z.string().check(z.minLength(8))
});

export const registerServerFn = createServerFn({ method: 'POST' })
	.middleware([sentryMiddleware])
	.inputValidator(RegisterSchema)
	.handler(async ({ data }) => {
		const { email, password } = data;
		const response = await auth.api.signInEmail({
			body: { email, password }
		});

		return response;
	});

export const kickAuthedUserServerFn = createServerFn()
	.middleware([sentryMiddleware])
	.handler(async () => {
		const session = await auth.api.getSession({
			headers: getRequest().headers,
			query: { disableCookieCache: true }
		});

		if (session) {
			throw redirect({ to: '/reader' });
		}

		return false;
	});
