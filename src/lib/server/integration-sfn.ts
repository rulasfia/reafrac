import { createServerFn } from '@tanstack/react-start';
import { ofetch } from 'ofetch';
import { type MinifluxUser } from './types';
import * as z from 'zod/mini';
import { db } from '../db-connection';
import { fluxConnections } from '../db-schema';
import { eq } from 'drizzle-orm';
import { authFnMiddleware } from '../middleware/auth-middleware';
import { sentryMiddleware } from '../middleware/sentry-middleware';
import * as Sentry from '@sentry/tanstackstart-react';

const FluxIntegrationSchema = z.object({
	server_url: z.string().check(z.minLength(1)),
	token: z.string().check(z.minLength(1))
});

export const fluxIntegrationServerFn = createServerFn({ method: 'POST' })
	.middleware([sentryMiddleware, authFnMiddleware])
	.inputValidator(FluxIntegrationSchema)
	.handler(async ({ data, context }) => {
		return Sentry.startSpan({ op: 'server_function', name: 'fluxIntegration' }, async (span) => {
			try {
				span.setAttribute('user_id', context.user.id);
				span.setAttribute('server_url', data.server_url);

				// Ensure URL has protocol
				let url = data.server_url;
				if (!url.startsWith('http://') && !url.startsWith('https://')) {
					url = 'https://' + url;
				}

				const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;

				const res = await ofetch<MinifluxUser>(`/v1/me`, {
					baseURL: cleanUrl,
					timeout: 3000,
					headers: {
						'X-Auth-Token': data.token,
						'Content-Type': 'application/json'
					}
				});

				await db.insert(fluxConnections).values({
					userId: context.user.id,
					serverUrl: cleanUrl,
					apiKey: data.token
				});

				span.setAttribute('status', 'success');
				span.setAttribute('username', res.username);
				return res;
			} catch (error) {
				span.setAttribute('status', 'error');
				Sentry.captureException(error, {
					tags: { function: 'fluxIntegration' },
					extra: {
						userId: context.user.id,
						serverUrl: data.server_url,
						errorMessage: error instanceof Error ? error.message : 'Unknown error'
					}
				});
				throw error;
			}
		});
	});

export const getExistingIntegrationServerFn = createServerFn({ method: 'GET' })
	.middleware([sentryMiddleware, authFnMiddleware])
	.inputValidator(z.object({ userId: z.string().check(z.minLength(1)) }))
	.handler(async ({ data }) => {
		return Sentry.startSpan(
			{ op: 'server_function', name: 'getExistingIntegration' },
			async (span) => {
				try {
					span.setAttribute('user_id', data.userId);

					const res = await db
						.select()
						.from(fluxConnections)
						.where(eq(fluxConnections.userId, data.userId))
						.limit(1);

					if (!res || res.length === 0) {
						span.setAttribute('status', 'not_found');
						return null;
					}

					span.setAttribute('status', 'success');
					span.setAttribute('integration_found', true);
					return res[0];
				} catch (error) {
					span.setAttribute('status', 'error');
					Sentry.captureException(error, {
						tags: { function: 'getExistingIntegration' },
						extra: {
							userId: data.userId,
							errorMessage: error instanceof Error ? error.message : 'Unknown error'
						}
					});
					throw error;
				}
			}
		);
	});

export const removeExistingIntegrationServerFn = createServerFn({ method: 'POST' })
	.middleware([sentryMiddleware, authFnMiddleware])
	.handler(async ({ context }) => {
		return Sentry.startSpan(
			{ op: 'server_function', name: 'removeExistingIntegration' },
			async (span) => {
				try {
					span.setAttribute('user_id', context.user.id);

					const deleteResult = await db
						.delete(fluxConnections)
						.where(eq(fluxConnections.userId, context.user.id))
						.returning({ deletedId: fluxConnections.id });

					if (!deleteResult || deleteResult.length === 0) {
						span.setAttribute('status', 'not_found');
						return { success: false, message: 'No integration found for this user' };
					}

					span.setAttribute('status', 'success');
					span.setAttribute('integration_removed', true);
					return { success: true, message: 'Integration removed successfully' };
				} catch (error) {
					span.setAttribute('status', 'error');
					Sentry.captureException(error, {
						tags: { function: 'removeExistingIntegration' },
						extra: {
							userId: context.user.id,
							errorMessage: error instanceof Error ? error.message : 'Unknown error'
						}
					});
					throw error;
				}
			}
		);
	});
