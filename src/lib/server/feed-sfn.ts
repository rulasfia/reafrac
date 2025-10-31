import { createServerFn } from '@tanstack/react-start';
import * as z from 'zod/mini';
import { authFnMiddleware } from '../middleware/auth-middleware';
import { getExistingIntegrationServerFn } from './integration-sfn';
import { ofetch } from 'ofetch';
import type { Feed } from './types';
import { sentryMiddleware } from '../middleware/sentry-middleware';
import * as Sentry from '@sentry/tanstackstart-react';

export const getFeedsServerFn = createServerFn({ method: 'GET' })
	.middleware([sentryMiddleware, authFnMiddleware])
	.handler(async ({ context }) => {
		return Sentry.startSpan({ op: 'server_function', name: 'getFeeds' }, async (span) => {
			try {
				span.setAttribute('user_id', context.user.id);

				// get user integration
				const integration = await getExistingIntegrationServerFn({
					data: { userId: context.user.id }
				});
				if (!integration) {
					throw new Error('Integration not found');
				}

				// get feeds
				const res = await ofetch<Feed[]>(`/v1/feeds`, {
					baseURL: integration?.serverUrl,
					timeout: 3000,
					method: 'GET',
					headers: {
						'X-Auth-Token': integration?.apiKey,
						'Content-Type': 'application/json'
					}
				});

				span.setAttribute('status', 'success');
				span.setAttribute('feeds_count', res.length);
				return res;
			} catch (error) {
				span.setAttribute('status', 'error');
				Sentry.captureException(error, {
					tags: { function: 'getFeeds' },
					extra: {
						userId: context.user.id,
						errorMessage: error instanceof Error ? error.message : 'Unknown error'
					}
				});
				throw error;
			}
		});
	});

export const getFeedServerFn = createServerFn({ method: 'GET' })
	.middleware([sentryMiddleware, authFnMiddleware])
	.inputValidator(z.object({ feedId: z.string() }))
	.handler(async ({ data, context }) => {
		return Sentry.startSpan({ op: 'server_function', name: 'getFeed' }, async (span) => {
			try {
				span.setAttribute('feed_id', data.feedId);
				span.setAttribute('user_id', context.user.id);

				// get user integration
				const integration = await getExistingIntegrationServerFn({
					data: { userId: context.user.id }
				});
				if (!integration) {
					throw new Error('Integration not found');
				}

				// get feed
				const feed = await ofetch<Feed>(`/v1/feeds/${data.feedId}`, {
					baseURL: integration?.serverUrl,
					timeout: 3000,
					method: 'GET',
					headers: {
						'X-Auth-Token': integration?.apiKey,
						'Content-Type': 'application/json'
					}
				});

				span.setAttribute('status', 'success');
				return feed;
			} catch (error) {
				span.setAttribute('status', 'error');
				Sentry.captureException(error, {
					tags: { function: 'getFeed', feedId: data.feedId },
					extra: {
						userId: context.user.id,
						errorMessage: error instanceof Error ? error.message : 'Unknown error'
					}
				});
				throw error;
			}
		});
	});
