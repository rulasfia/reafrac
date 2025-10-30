import { redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server'; // Or similar path based on your setup
import * as z from 'zod/mini';
import { auth } from '../auth';
import { sentryMiddleware } from '../middleware/sentry-middleware';
import * as Sentry from '@sentry/tanstackstart-react';

const LoginSchema = z.object({
	email: z.email(),
	password: z.string().check(z.minLength(8))
});

export const loginServerFn = createServerFn({ method: 'POST' })
	.middleware([sentryMiddleware])
	.inputValidator(LoginSchema)
	.handler(async ({ data }) => {
		return Sentry.startSpan({ op: 'server_function', name: 'login' }, async (span) => {
			try {
				span.setAttribute('email', data.email);

				const { email, password } = data;
				const response = await auth.api.signInEmail({
					body: { email, password }
				});

				span.setAttribute('status', 'success');
				span.setAttribute('login_successful', !!response.user);
				return response;
			} catch (error) {
				span.setAttribute('status', 'error');
				Sentry.captureException(error, {
					tags: { function: 'login' },
					extra: {
						email: data.email,
						errorMessage: error instanceof Error ? error.message : 'Unknown error'
					}
				});
				throw error;
			}
		});
	});

const RegisterSchema = z.object({
	email: z.email(),
	password: z.string().check(z.minLength(8))
});

export const registerServerFn = createServerFn({ method: 'POST' })
	.middleware([sentryMiddleware])
	.inputValidator(RegisterSchema)
	.handler(async ({ data }) => {
		return Sentry.startSpan({ op: 'server_function', name: 'register' }, async (span) => {
			try {
				span.setAttribute('email', data.email);

				const { email, password } = data;
				const response = await auth.api.signInEmail({
					body: { email, password }
				});

				span.setAttribute('status', 'success');
				span.setAttribute('register_successful', !!response.user);
				return response;
			} catch (error) {
				span.setAttribute('status', 'error');
				Sentry.captureException(error, {
					tags: { function: 'register' },
					extra: {
						email: data.email,
						errorMessage: error instanceof Error ? error.message : 'Unknown error'
					}
				});
				throw error;
			}
		});
	});

export const kickAuthedUserServerFn = createServerFn()
	.middleware([sentryMiddleware])
	.handler(async () => {
		return Sentry.startSpan({ op: 'server_function', name: 'kickAuthedUser' }, async (span) => {
			try {
				const session = await auth.api.getSession({
					headers: getRequest().headers,
					query: { disableCookieCache: true }
				});

				if (session) {
					span.setAttribute('status', 'redirect');
					span.setAttribute('session_exists', true);
					span.setAttribute('user_id', session.user?.id);
					throw redirect({ to: '/reader' });
				}

				span.setAttribute('status', 'success');
				span.setAttribute('session_exists', false);
				return false;
			} catch (error) {
				// Don't capture redirect errors in Sentry
				if (error instanceof Response && error.status >= 300 && error.status < 400) {
					throw error;
				}

				span.setAttribute('status', 'error');
				Sentry.captureException(error, {
					tags: { function: 'kickAuthedUser' },
					extra: {
						errorMessage: error instanceof Error ? error.message : 'Unknown error'
					}
				});
				throw error;
			}
		});
	});
