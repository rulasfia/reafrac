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
import { entries, feeds } from '../db-schema';
import { eq, and, desc, lt, count } from 'drizzle-orm';
import type { EntryMeta } from './types';
import { db } from '../db-connection';

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
					timeout: 3000,
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
	status: z.optional(z.enum(['read', 'unread']))
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

				// Build query conditions
				const conditions = [eq(entries.userId, context.user.id)];

				// Add filters based on input
				if (data.feedId) {
					conditions.push(eq(entries.feedId, data.feedId));
				}

				if (data.status) {
					conditions.push(eq(entries.status, data.status));
				}

				if (data.starred !== undefined) {
					conditions.push(eq(entries.starred, data.starred));
				}

				const baseWhereConditions = and(...conditions);

				// Get total count of entries matching the filters
				const totalCountResult = await db
					.select({ count: count() })
					.from(entries)
					.where(baseWhereConditions)
					.execute();

				const totalItems = totalCountResult[0]?.count || 0;

				// Load-more pagination using the `after` parameter (entry ID)
				// If no `after` is provided, start from the beginning
				const paginationCondition = data.after ? lt(entries.id, data.after) : undefined;

				const whereConditions = paginationCondition
					? and(...conditions, paginationCondition)
					: and(...conditions);

				// Query entries with load-more style pagination, including feed data
				const userEntries = await db
					.select({
						// Entry fields
						id: entries.id,
						userId: entries.userId,
						feedId: entries.feedId,
						title: entries.title,
						link: entries.link,
						description: entries.description,
						author: entries.author,
						content: entries.content,
						status: entries.status,
						starred: entries.starred,
						publishedAt: entries.publishedAt,
						createdAt: entries.createdAt,
						updatedAt: entries.updatedAt,
						// Feed fields
						feed: {
							id: feeds.id,
							userId: feeds.userId,
							categoryId: feeds.categoryId,
							title: feeds.title,
							link: feeds.link,
							icon: feeds.icon,
							description: feeds.description,
							language: feeds.language,
							generator: feeds.generator,
							publishedAt: feeds.publishedAt,
							createdAt: feeds.createdAt,
							updatedAt: feeds.updatedAt
						}
					})
					.from(entries)
					.leftJoin(feeds, eq(entries.feedId, feeds.id))
					.where(whereConditions)
					.orderBy(desc(entries.id))
					.limit(20) // Load 20 entries at a time
					.execute();

				// Calculate pagination metadata
				const itemsPerPage = 20;
				const currentPage = Math.floor((data.offset || 0) / itemsPerPage) + 1;
				const totalPages = Math.ceil(totalItems / itemsPerPage);
				const hasNext = userEntries.length === itemsPerPage;
				const hasPrev = data.offset !== undefined && data.offset > 0;

				const meta: EntryMeta = {
					totalItems,
					currentPage,
					totalPages,
					hasNext,
					hasPrev
				};

				span.setAttribute('status', 'success');
				span.setAttribute('entries_count', userEntries.length);
				span.setAttribute('total_items', totalItems);
				span.setAttribute('has_next', hasNext);

				return { entries: userEntries, meta };
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
					timeout: 3000,
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
