import { createServerFn } from '@tanstack/react-start';
import { authFnMiddleware } from '../middleware/auth-middleware';
import { sentryMiddleware } from '../middleware/sentry-middleware';
import * as Sentry from '@sentry/tanstackstart-react';
import { db, eq, userPreferences } from '@reafrac/database';
import z from 'zod';
import { ofetch } from 'ofetch';

export const getUserPreferenceServerFn = createServerFn()
	.middleware([sentryMiddleware, authFnMiddleware])
	.handler(async ({ context }) => {
		return Sentry.startSpan({ op: 'server_function', name: 'getUserPreference' }, async (span) => {
			try {
				span.setAttribute('user_id', context.user.id);

				const preference = await db
					.select()
					.from(userPreferences)
					.where(eq(userPreferences.userId, context.user.id))
					.limit(1);

				if (preference.length === 0) return null;

				span.setAttribute('preference_id', preference[0].id);
				return preference[0];
			} catch (error) {
				span.setAttribute('status', 'error');
				Sentry.captureException(error, {
					tags: { function: 'getUserPreference' },
					extra: {
						userId: context.user.id,
						errorMessage: error instanceof Error ? error.message : 'Unknown error'
					}
				});
				throw error;
			}
		});
	});

export const updateUserPreferenceServerFn = createServerFn()
	.middleware([sentryMiddleware, authFnMiddleware])
	.inputValidator(z.object({ proxyUrl: z.string() }))
	.handler(async ({ context, data }) => {
		return Sentry.startSpan(
			{ op: 'server_function', name: 'updateUserPreference' },
			async (span) => {
				try {
					span.setAttribute('user_id', context.user.id);

					// check if the user has preference savedo
					const existing = await getUserPreferenceServerFn();
					console.log({ existing });

					let preference: NonNullable<typeof existing>[] = [];
					if (existing) {
						preference = await db
							.update(userPreferences)
							.set({ proxyUrl: data.proxyUrl })
							.where(eq(userPreferences.userId, context.user.id))
							.returning();
					} else {
						preference = await db
							.insert(userPreferences)
							.values({
								userId: context.user.id,
								proxyUrl: data.proxyUrl
							})
							.returning();
					}

					span.setAttribute('preference_id', preference[0].id);
					return preference[0];
				} catch (error) {
					span.setAttribute('status', 'error');
					Sentry.captureException(error, {
						tags: { function: 'updateUserPreference' },
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

export const testProxyConnectionServerFn = createServerFn()
	.middleware([sentryMiddleware, authFnMiddleware])
	.inputValidator(z.object({ proxyUrl: z.string() }))
	.handler(async ({ context, data }) => {
		return Sentry.startSpan(
			{ op: 'server_function', name: 'testProxyConnection' },
			async (span) => {
				try {
					span.setAttribute('user_id', context.user.id);

					// test proxy connection. both ofetch and zod will throw on error
					const res = await ofetch('/ping', { baseURL: data.proxyUrl });
					z.object({ status: z.string() }).parse(res);

					span.setAttribute('proxy_url', data.proxyUrl);
					return { isValid: true };
				} catch (error) {
					span.setAttribute('status', 'error');
					Sentry.captureException(error, {
						tags: { function: 'testProxyConnection' },
						extra: {
							userId: context.user.id,
							errorMessage: error instanceof Error ? error.message : 'Unknown error'
						}
					});

					return { isValid: false };
				}
			}
		);
	});
