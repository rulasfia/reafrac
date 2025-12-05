import { type ArticleData, extract } from '@extractus/article-extractor';
import { createServerFn } from '@tanstack/react-start';
import * as z from 'zod';
import { authFnMiddleware } from '../middleware/auth-middleware';
import sanitizeHtml from 'sanitize-html';
import { sentryMiddleware } from '../middleware/sentry-middleware';
import * as Sentry from '@sentry/tanstackstart-react';
import type { EntryMeta } from './types';
import { db, entries, feeds, userEntries, userFeedSubscriptions } from '@reafrac/database';
import { eq, and, desc, count, gte } from '@reafrac/database';
import { ofetch } from 'ofetch';

export const extractEntryContentServerFn = createServerFn({ method: 'GET' })
	.middleware([sentryMiddleware, authFnMiddleware])
	.inputValidator(z.object({ entryUrl: z.string() }))
	.handler(async ({ data, context }) => {
		return Sentry.startSpan(
			{ op: 'server_function', name: 'extractEntryContent' },
			async (span) => {
				try {
					span.setAttribute('user_id', context.user.id);
					span.setAttribute('entry_url', data.entryUrl);

					// check if user has proxy setup
					const proxyUrl = process.env.PROXY_URL;
					span.setAttribute('proxy_url', proxyUrl);

					console.log({ proxyUrl, url: data.entryUrl });
					let validated: ArticleData | undefined = undefined;
					if (proxyUrl) {
						// if user has set proxy settings, use it to extract feed
						// TODO: if extraction via proxy failed, fallback to extraction in this server
						const httpResponse = await ofetch<ArticleData>('/extract-article', {
							baseURL: proxyUrl,
							timeout: 6000, // 6 seconds
							method: 'POST',
							body: { url: data.entryUrl }
						});

						validated = httpResponse;
					} else {
						// otherwise, do the entry content extraction in this server
						validated = (await extract(data.entryUrl)) ?? undefined;
					}

					if (!validated) {
						throw new Error('Failed to extract entry content');
					}

					return validated;
				} catch (error) {
					span.setAttribute('status', 'error');
					Sentry.captureException(error, {
						tags: { function: 'extractEntryContent', feedUrl: data.entryUrl },
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

export const updateEntryStatusServerFn = createServerFn({ method: 'POST' })
	.middleware([sentryMiddleware, authFnMiddleware])
	.inputValidator(z.object({ entryId: z.number() }))
	.handler(async ({ data, context }) => {
		return Sentry.startSpan({ op: 'server_function', name: 'updateEntryStatus' }, async (span) => {
			try {
				span.setAttribute('entry_id', data.entryId);
				span.setAttribute('user_id', context.user.id);

				// Update user entry status in the userEntries table
				await db
					.update(userEntries)
					.set({ status: 'read' as const })
					.where(
						and(eq(userEntries.entryId, data.entryId), eq(userEntries.userId, context.user.id))
					);

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

export const saveEntryToBookmarkServerFn = createServerFn({ method: 'POST' })
	.middleware([sentryMiddleware, authFnMiddleware])
	.inputValidator(z.object({ entryId: z.number(), saved: z.boolean() }))
	.handler(async ({ data, context }) => {
		return Sentry.startSpan(
			{ op: 'server_function', name: 'saveEntryToBookmark' },
			async (span) => {
				try {
					span.setAttribute('entry_id', data.entryId);
					span.setAttribute('user_id', context.user.id);

					// Update user entry starred status in the userEntries table
					await db
						.update(userEntries)
						.set({ starred: data.saved })
						.where(
							and(eq(userEntries.entryId, data.entryId), eq(userEntries.userId, context.user.id))
						);

					span.setAttribute('status', 'success');
					return true;
				} catch (error) {
					span.setAttribute('status', 'error');
					Sentry.captureException(error, {
						tags: { function: 'saveEntryToBookmark', entryId: data.entryId },
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

const EntryQuerySchema = z.object({
	feedId: z.string().optional(),
	offset: z.number(),
	after: z.number().optional(),
	starred: z.boolean().optional(),
	status: z.enum(['read', 'unread']).optional(),
	forceRefetch: z.boolean().optional()
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
				span.setAttribute('force_refetch', data.forceRefetch || false);

				// Refetch entries data from feeds link stored in db
				// Only refetch for specific feed if feedId is provided, otherwise refetch all feeds
				Sentry.startSpan({ op: 'function', name: 'refetchBeforeGetEntries' }, async () => {
					try {
						// await refetchFeedEntries(
						// 	context.user.id,
						// 	data.feedId ? [data.feedId] : undefined,
						// 	data.forceRefetch
						// );
					} catch (error) {
						console.error('Error refetching feed entries:', error);
						// Don't let refetch errors block the main request - just log them
						Sentry.captureException(error, {
							tags: { function: 'refetchBeforeGetEntries' },
							extra: {
								userId: context.user.id,
								feedId: data.feedId,
								forceRefetch: data.forceRefetch,
								errorMessage: error instanceof Error ? error.message : 'Unknown error'
							}
						});
					}
				});

				// Build query conditions - ensure user only sees entries from feeds they're subscribed to
				// Using inner joins guarantees we only get entries that have user entries
				const conditions = [
					eq(userEntries.userId, context.user.id),
					eq(userFeedSubscriptions.userId, context.user.id)
				];

				// Add filters based on input
				if (data.feedId) {
					conditions.push(eq(entries.feedId, data.feedId));
				}

				if (data.status) {
					conditions.push(eq(userEntries.status, data.status));
				}

				if (data.starred !== undefined) {
					conditions.push(eq(userEntries.starred, data.starred));
				}

				// Add "today" filter - only show entries published after the specified timestamp
				if (data.after) {
					// Convert Unix timestamp (seconds) to JavaScript Date for comparison with PostgreSQL timestamp
					conditions.push(gte(entries.publishedAt, new Date(data.after * 1000)));
				}

				const baseWhereConditions = and(...conditions);

				// Get total count of entries matching the filters
				const totalCountResult = await db
					.select({ count: count() })
					.from(entries)
					.innerJoin(userEntries, eq(entries.id, userEntries.entryId))
					.innerJoin(userFeedSubscriptions, eq(entries.feedId, userFeedSubscriptions.feedId))
					.where(baseWhereConditions)
					.execute();

				const totalItems = totalCountResult[0]?.count || 0;

				// Load-more pagination using the `offset` parameter
				// Skip the specified number of entries based on the offset
				const whereConditions = and(...conditions);

				// Query entries with load-more style pagination, including feed data
				const entryList = await db
					.select({
						// Entry fields
						id: entries.id,
						feedId: entries.feedId,
						title: entries.title,
						link: entries.link,
						description: entries.description,
						author: entries.author,
						publishedAt: entries.publishedAt,
						// user entry - guaranteed to exist due to inner join
						meta: {
							userId: userEntries.userId,
							starred: userEntries.starred,
							status: userEntries.status
						},
						// Feed fields
						feed: {
							id: feeds.id,
							categoryId: feeds.categoryId,
							title: feeds.title,
							link: feeds.link,
							icon: feeds.icon
						}
					})
					.from(entries)
					.innerJoin(userEntries, eq(entries.id, userEntries.entryId))
					.innerJoin(userFeedSubscriptions, eq(entries.feedId, userFeedSubscriptions.feedId))
					.leftJoin(feeds, eq(entries.feedId, feeds.id))
					.where(whereConditions)
					.orderBy(desc(entries.publishedAt))
					.limit(15) // Load 15 entries at a time
					.offset(data.offset || 0) // Skip entries based on offset
					.execute();

				// Calculate pagination metadata
				const itemsPerPage = 15;
				const currentPage = Math.floor((data.offset || 0) / itemsPerPage) + 1;
				const totalPages = Math.ceil(totalItems / itemsPerPage);
				const hasNext = entryList.length === itemsPerPage;
				const hasPrev = data.offset !== undefined && data.offset > 0;

				const meta: EntryMeta = {
					totalItems,
					currentPage,
					totalPages,
					hasNext,
					hasPrev
				};

				span.setAttribute('status', 'success');
				span.setAttribute('entries_count', entryList.length);
				span.setAttribute('total_items', totalItems);
				span.setAttribute('has_next', hasNext);

				return { entries: entryList, meta };
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

				const res = await db
					.select({
						// Entry fields
						id: entries.id,
						feedId: entries.feedId,
						title: entries.title,
						link: entries.link,
						description: entries.description,
						author: entries.author,
						content: entries.content,
						publishedAt: entries.publishedAt,
						thumbnail: entries.thumbnail,
						thumbnailCaption: entries.thumbnailCaption,
						// user entry
						meta: {
							userId: userEntries.userId,
							starred: userEntries.starred,
							status: userEntries.status
						}
					})
					.from(entries)
					.innerJoin(userEntries, eq(entries.id, userEntries.entryId))
					.where(and(eq(entries.id, data.entryId), eq(userEntries.userId, context.user.id)))
					.limit(1);

				const entry = res[0];
				if (!entry) {
					throw new Error('Entry not found');
				}
				const feed = await db
					.select({
						id: feeds.id,
						title: feeds.title,
						description: feeds.description,
						link: feeds.link,
						icon: feeds.icon,
						siteUrl: feeds.siteUrl,
						language: feeds.language,
						generator: feeds.generator,
						publishedAt: feeds.publishedAt,
						lastFetchedAt: feeds.lastFetchedAt,
						createdAt: feeds.createdAt,
						updatedAt: feeds.updatedAt,
						meta: {
							urlPrefix: userFeedSubscriptions.urlPrefix,
							title: userFeedSubscriptions.title,
							icon: userFeedSubscriptions.icon
						}
					})
					.from(feeds)
					.innerJoin(userFeedSubscriptions, eq(feeds.id, userFeedSubscriptions.feedId))
					.where(and(eq(feeds.id, entry.feedId), eq(userFeedSubscriptions.userId, context.user.id)))
					.limit(1);

				//  sanitize HTML in the entry.content
				const sanitizedContent = sanitizeHtml(
					entry.content?.replace(/:{3,}/g, '').replace(/\\(?!\w)/g, '') ?? '',
					{
						allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
						allowProtocolRelative: false
					}
				);

				span.setAttribute('status', 'success');
				span.setAttribute('content_length', sanitizedContent.length);
				return { ...entry, content: sanitizedContent, feed: feed[0] };
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
	.inputValidator(z.object({ entryUrl: z.url(), prefixUrl: z.url().optional() }))
	.handler(async ({ data }) => {
		return Sentry.startSpan({ op: 'server_function', name: 'getEntryContent' }, async (span) => {
			try {
				span.setAttribute('prefix_url', data.prefixUrl);
				span.setAttribute('entry_url', data.entryUrl);

				const url = data.prefixUrl ? `${data.prefixUrl}${data.entryUrl}` : data.entryUrl;

				const res = await extractEntryContentServerFn({ data: { entryUrl: url } });
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
