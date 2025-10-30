import { extract } from '@extractus/article-extractor';
import { createServerFn } from '@tanstack/react-start';
import * as z from 'zod/mini';
import { authFnMiddleware } from '../middleware/auth-middleware';
import { getExistingIntegrationServerFn } from './integration-sfn';
import { ofetch } from 'ofetch';
import sanitizeHtml from 'sanitize-html';
import type { FeedEntry } from './types';
import { sentryMiddleware } from '../middleware/sentry-middleware';
import * as Sentry from '@sentry/tanstackstart-react';

export const updateEntryStatusServerFn = createServerFn({ method: 'POST' })
	.middleware([sentryMiddleware, authFnMiddleware])
	.inputValidator(z.object({ entryId: z.number() }))
	.handler(async ({ data, context }) => {
		return Sentry.startSpan({ op: 'server_function', name: 'updateEntryStatus' }, async (span) => {
			try {
				span.setAttribute('entry_id', data.entryId);
				span.setAttribute('user_id', context.user.id);

				// get user integration
				const integration = await getExistingIntegrationServerFn({
					data: { userId: context.user.id }
				});
				if (!integration) {
					throw new Error('Integration not found');
				}

				// update status
				await ofetch(`/v1/entries`, {
					baseURL: integration?.serverUrl,
					timeout: 5000,
					method: 'PUT',
					body: {
						entry_ids: [data.entryId],
						status: 'read'
					},
					headers: {
						'X-Auth-Token': integration?.apiKey,
						'Content-Type': 'application/json'
					}
				});

				span.setAttribute('status', 'success');
				return true;
			} catch (error) {
				span.setAttribute('status', 'error');
				Sentry.captureException(error, {
					tags: { function: 'updateEntryStatus', entryId: data.entryId },
					extra: {
						userId: context.user.id,
						errorMessage: error instanceof Error ? error.message : 'Unknown error'
					}
				});
				throw error;
			}
		});
	});

const EntryQuerySchema = z.object({
	feedId: z.optional(z.string()),
	offset: z.number(),
	after: z.optional(z.number()),
	starred: z.optional(z.boolean()),
	status: z.optional(z.enum(['read', 'unread', 'removed']))
});

export const getEntriesServerFn = createServerFn({ method: 'GET' })
	.middleware([sentryMiddleware, authFnMiddleware])
	.inputValidator(EntryQuerySchema)
	.handler(async ({ data, context }) => {
		return Sentry.startSpan({ op: 'server_function', name: 'getEntries' }, async (span) => {
			try {
				span.setAttribute('user_id', context.user.id);
				span.setAttribute('feed_id', data.feedId || 'all');
				span.setAttribute('offset', data.offset);
				span.setAttribute('status', data.status || 'all');
				span.setAttribute('starred', data.starred || false);

				// get user integration
				const integration = await getExistingIntegrationServerFn({
					data: { userId: context.user.id }
				});
				if (!integration) {
					throw new Error('Integration not found');
				}

				const PAGE_SIZE = 20;
				// set endpoint based on existence of feedId
				const endpoint = data.feedId ? `/v1/feeds/${data.feedId}/entries` : `/v1/entries`;

				// get entries
				const entries = await ofetch<{ entries: FeedEntry[]; total: number }>(endpoint, {
					baseURL: integration.serverUrl,
					timeout: 5000,
					method: 'GET',
					query: {
						direction: 'desc',
						order: 'published_at',
						limit: PAGE_SIZE,
						offset: data.offset,
						after: data.after,
						starred: data.starred,
						status: data.status
					},
					headers: {
						'X-Auth-Token': integration?.apiKey,
						'Content-Type': 'application/json'
					}
				});

				span.setAttribute('status', 'success');
				span.setAttribute('entries_count', entries.entries.length);
				span.setAttribute('total_count', entries.total);
				return entries;
			} catch (error) {
				span.setAttribute('status', 'error');
				Sentry.captureException(error, {
					tags: { function: 'getEntries', feedId: data.feedId || 'all' },
					extra: {
						userId: context.user.id,
						query: data,
						errorMessage: error instanceof Error ? error.message : 'Unknown error'
					}
				});
				throw error;
			}
		});
	});

export const getEntryServerFn = createServerFn({ method: 'GET' })
	.middleware([sentryMiddleware, authFnMiddleware])
	.inputValidator(z.object({ entryId: z.number() }))
	.handler(async ({ data, context }) => {
		return Sentry.startSpan({ op: 'server_function', name: 'getEntry' }, async (span) => {
			try {
				span.setAttribute('entry_id', data.entryId);
				span.setAttribute('user_id', context.user.id);

				// get user integration
				const integration = await getExistingIntegrationServerFn({
					data: { userId: context.user.id }
				});
				if (!integration) {
					throw new Error('Integration not found');
				}

				// get entry
				const entry = await ofetch<FeedEntry>(`/v1/entries/${data.entryId}`, {
					baseURL: integration?.serverUrl,
					timeout: 5000,
					method: 'GET',
					headers: {
						'X-Auth-Token': integration?.apiKey,
						'Content-Type': 'application/json'
					}
				});

				//  sanitize HTML in the entry.content
				const sanitizedContent = sanitizeHtml(entry.content, {
					allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img'])
				});

				span.setAttribute('status', 'success');
				span.setAttribute('content_length', sanitizedContent.length);
				return { ...entry, content: sanitizedContent };
			} catch (error) {
				span.setAttribute('status', 'error');
				Sentry.captureException(error, {
					tags: { function: 'getEntry', entryId: data.entryId },
					extra: {
						userId: context.user.id,
						errorMessage: error instanceof Error ? error.message : 'Unknown error'
					}
				});
				throw error;
			}
		});
	});

export const getEntryContentServerFn = createServerFn({ method: 'GET' })
	.middleware([sentryMiddleware, authFnMiddleware])
	.inputValidator(z.object({ entryUrl: z.url() }))
	.handler(async ({ data }) => {
		return Sentry.startSpan({ op: 'server_function', name: 'getEntryContent' }, async (span) => {
			try {
				span.setAttribute('entry_url', data.entryUrl);

				const res = await extract(data.entryUrl);
				if (!res) {
					throw new Error('Failed to extract entry content');
				}

				span.setAttribute('status', 'success');
				span.setAttribute('content_extracted', !!res.content);
				return res;
			} catch (error) {
				span.setAttribute('status', 'error');
				Sentry.captureException(error, {
					tags: { function: 'getEntryContent' },
					extra: {
						entryUrl: data.entryUrl,
						errorMessage: error instanceof Error ? error.message : 'Unknown error'
					}
				});
				throw error;
			}
		});
	});
