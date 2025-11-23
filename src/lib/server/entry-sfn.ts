import { extract } from '@extractus/article-extractor';
import { createServerFn } from '@tanstack/react-start';
import * as z from 'zod/mini';
import { authFnMiddleware } from '../middleware/auth-middleware';
import sanitizeHtml from 'sanitize-html';
import { sentryMiddleware } from '../middleware/sentry-middleware';
import * as Sentry from '@sentry/tanstackstart-react';
import { entries, feeds, userEntries } from '../db-schema';
import { eq, and, desc, lt, count, inArray, gte } from 'drizzle-orm';
import type { EntryMeta } from './types';
import { db } from '../db-connection';
import { extractFeed } from '../utils/feed-utils';
import { ParsedFeed } from '../schemas/feed-schemas';
import { SimpleCache } from '../cache';

// Feed cache using SimpleCache with stale-while-revalidate support
const feedCache = new SimpleCache<ParsedFeed>(2 * 60 * 1000); // 2 minutes TTL

// Configuration for feed refetching
const REFETCH_CONFIG = {
	// Only refetch feeds that haven't been updated in the last 5 minutes
	MIN_REFETCH_INTERVAL: 5 * 60 * 1000, // 5 minutes
	// Cache feed data for 2 minutes
	FETCH_CACHE_TTL: 2 * 60 * 1000, // 2 minutes
	// Maximum number of feeds to refetch in parallel
	MAX_CONCURRENT_FETCHES: 5,
	// Timeout for individual feed fetches
	FETCH_TIMEOUT: 10000 // 10 seconds
};

// Helper function to get cached feed data or fetch new data
async function getCachedFeedData(feedUrl: string): Promise<ParsedFeed> {
	return feedCache.getOrFetchWithStale(
		feedUrl,
		async () => {
			return await Promise.race([
				extractFeed(feedUrl),
				new Promise<never>((_, reject) =>
					setTimeout(() => reject(new Error('Feed fetch timeout')), REFETCH_CONFIG.FETCH_TIMEOUT)
				)
			]);
		},
		{
			ttl: REFETCH_CONFIG.FETCH_CACHE_TTL,
			staleTtl: REFETCH_CONFIG.FETCH_CACHE_TTL * 2, // Allow 2x TTL for stale data
			onStaleUsed: (_data) => {
				// Optional: log when stale data is used
				console.log(`Using stale feed data for ${feedUrl}`);
			}
		}
	);
}

// Optimized helper function to refetch entries from feeds and insert only new entries
async function refetchFeedEntries(
	userId: string,
	feedIds?: string[],
	forceRefetch: boolean = false
): Promise<void> {
	return Sentry.startSpan({ op: 'function', name: 'refetchFeedEntries' }, async (span) => {
		try {
			span.setAttribute('user_id', userId);
			span.setAttribute('feed_ids_count', feedIds?.length || 0);

			// Get feeds to refetch, but only those that haven't been fetched recently (unless forceRefetch is true)
			const fiveMinutesAgo = new Date(Date.now() - REFETCH_CONFIG.MIN_REFETCH_INTERVAL);

			const feedsToRefetch = feedIds
				? await db
						.select()
						.from(feeds)
						.where(
							and(
								eq(feeds.userId, userId),
								inArray(feeds.id, feedIds),
								// Only if feed hasn't been fetched in the last 5 minutes, unless forceRefetch is true
								forceRefetch ? undefined : lt(feeds.lastFetchedAt, fiveMinutesAgo)
							)
						)
				: await db
						.select()
						.from(feeds)
						.where(
							and(
								eq(feeds.userId, userId),
								forceRefetch ? undefined : lt(feeds.lastFetchedAt, fiveMinutesAgo)
							)
						);

			if (forceRefetch) {
				console.log('Manually refetching feeds by user request');
			}

			if (feedsToRefetch.length === 0) {
				span.setAttribute('status', 'skipped');
				span.setAttribute('reason', 'no_feeds_need_refetch');
				console.log('No feeds need refetching');
				return;
			}

			span.setAttribute('feeds_to_refetch_count', feedsToRefetch.length);

			// Get all existing entries at once for better efficiency
			const allExistingEntries = await db
				.select({ title: entries.title, link: entries.link, feedId: entries.feedId })
				.from(entries)
				.where(
					and(
						eq(entries.userId, userId),
						inArray(
							entries.feedId,
							feedsToRefetch.map((f) => f.id)
						)
					)
				);

			console.log(`Found ${allExistingEntries.length} existing entries`); // Debugging

			// Group existing entries by feedId for faster lookup
			// Track titles and links separately for duplicate detection (skip if ANY match)
			const existingEntriesByFeed = new Map<string, { titles: Set<string>; links: Set<string> }>();
			for (const entry of allExistingEntries) {
				if (!existingEntriesByFeed.has(entry.feedId)) {
					existingEntriesByFeed.set(entry.feedId, { titles: new Set(), links: new Set() });
				}
				const existing = existingEntriesByFeed.get(entry.feedId)!;
				if (entry.title) {
					existing.titles.add(entry.title);
				}
				if (entry.link) {
					existing.links.add(entry.link);
				}
			}

			// Process feeds in batches to limit concurrent requests
			const batches = [];
			for (let i = 0; i < feedsToRefetch.length; i += REFETCH_CONFIG.MAX_CONCURRENT_FETCHES) {
				batches.push(feedsToRefetch.slice(i, i + REFETCH_CONFIG.MAX_CONCURRENT_FETCHES));
			}

			let totalInserted = 0;

			if (batches.length === 0) {
				console.log('No feeds to refetch');
			} else {
				console.log(`Refetching ${feedsToRefetch.length} feeds in ${batches.length} batches`);
			}

			for (const batch of batches) {
				const batchPromises = batch.map(async (feed) => {
					try {
						// Extract feed data with caching and timeout
						const feedData = await Sentry.startSpan(
							{ op: 'feed.extract', name: `Extract feed: ${feed.title}` },
							async () => {
								try {
									return await getCachedFeedData(feed.link);
								} catch (error) {
									console.error(`Error extracting feed ${feed.title}:`, error);
									throw error;
								}
							}
						);

						if (!feedData?.entries?.length) {
							return { feedId: feed.id, inserted: 0 };
						}

						span.setAttribute(`feed_${feed.id}_entries_count`, feedData.entries.length);

						// Get existing entries for this specific feed
						const existingEntries = existingEntriesByFeed.get(feed.id) || {
							titles: new Set(),
							links: new Set()
						};

						// Filter out entries that already exist based on title OR link matching
						const newEntries = feedData.entries.filter((entry) => {
							if (!entry.title) return false;

							// Skip if title already exists OR link already exists
							const titleExists = entry.title ? existingEntries.titles.has(entry.title) : false;
							const linkExists = entry.link ? existingEntries.links.has(entry.link) : false;

							return !titleExists && !linkExists;
						});

						span.setAttribute(`feed_${feed.id}_new_entries_count`, newEntries.length);

						console.log(`Found ${newEntries.length} new entries for feed ${feed.title}`);

						const insertedCount = newEntries.length;

						if (newEntries.length > 0) {
							// Prepare entry values for insertion
							const entryValues = newEntries.map((entry) => ({
								userId,
								feedId: feed.id,
								title: entry.title,
								description: entry.description,
								link: entry.link,
								publishedAt: new Date(entry.published || Date.now()),
								author: typeof entry.author === 'string' ? entry.author : '',
								content: entry.content,
								thumbnail: entry.thumbnail?.url,
								thumbnailCaption: entry.thumbnail?.text ?? entry.title
							}));

							// Insert new entries
							await db.insert(entries).values(entryValues);

							span.setAttribute(`feed_${feed.id}_inserted_count`, entryValues.length);
						}

						// Update the feed's lastFetchedAt timestamp after successful fetch
						await db
							.update(feeds)
							.set({ lastFetchedAt: new Date() })
							.where(and(eq(feeds.id, feed.id), eq(feeds.userId, userId)));

						return { feedId: feed.id, inserted: insertedCount };
					} catch (error) {
						// Log error for individual feed but continue processing other feeds
						Sentry.captureException(error, {
							tags: { function: 'refetchFeedEntries', feedId: feed.id },
							extra: {
								userId,
								feedId: feed.id,
								feedUrl: feed.link,
								errorMessage: error instanceof Error ? error.message : 'Unknown error'
							}
						});
						return {
							feedId: feed.id,
							inserted: 0,
							error: error instanceof Error ? error.message : 'Unknown error'
						};
					}
				});

				const batchResults = await Promise.allSettled(batchPromises);

				// Count successful insertions
				for (const result of batchResults) {
					if (result.status === 'fulfilled') {
						totalInserted += result.value.inserted;
					}
				}
			}

			span.setAttribute('total_inserted', totalInserted);

			span.setAttribute('status', 'success');
		} catch (error) {
			span.setAttribute('status', 'error');
			Sentry.captureException(error, {
				tags: { function: 'refetchFeedEntries' },
				extra: {
					userId,
					feedIds: feedIds,
					errorMessage: error instanceof Error ? error.message : 'Unknown error'
				}
			});
			throw error;
		}
	});
}

export const updateEntryStatusServerFn = createServerFn({ method: 'POST' })
	.middleware([sentryMiddleware, authFnMiddleware])
	.inputValidator(z.object({ entryId: z.number() }))
	.handler(async ({ data, context }) => {
		return Sentry.startSpan({ op: 'server_function', name: 'updateEntryStatus' }, async (span) => {
			try {
				span.setAttribute('entry_id', data.entryId);
				span.setAttribute('user_id', context.user.id);

				await Promise.all([
					// DEPRECATED: update the old entries table with user info on it
					// TODO: remove after full migrations
					db
						.update(entries)
						.set({ status: 'read' })
						.where(and(eq(entries.id, data.entryId), eq(entries.userId, context.user.id))),
					db
						.update(userEntries)
						.set({ status: 'read' })
						.where(
							and(eq(userEntries.entryId, data.entryId), eq(userEntries.userId, context.user.id))
						)
				]);

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

					await Promise.all([
						// DEPRECATED: update the old entries table with user info on it
						// TODO: remove after full migrations
						db
							.update(entries)
							.set({ starred: data.saved })
							.where(and(eq(entries.id, data.entryId), eq(entries.userId, context.user.id))),
						db
							.update(userEntries)
							.set({ starred: data.saved })
							.where(
								and(eq(userEntries.entryId, data.entryId), eq(userEntries.userId, context.user.id))
							)
					]);

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
	feedId: z.optional(z.string()),
	offset: z.number(),
	after: z.optional(z.number()),
	starred: z.optional(z.boolean()),
	status: z.optional(z.enum(['read', 'unread'])),
	forceRefetch: z.optional(z.boolean())
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
						await refetchFeedEntries(
							context.user.id,
							data.feedId ? [data.feedId] : undefined,
							data.forceRefetch
						);
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

				// Build query conditions
				const conditions = [
					eq(userEntries.userId, context.user.id),
					eq(userEntries.entryId, entries.id)
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
					.leftJoin(userEntries, eq(entries.id, userEntries.entryId))
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
						// user entry
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
					.leftJoin(feeds, eq(entries.feedId, feeds.id))
					.leftJoin(userEntries, eq(entries.id, userEntries.entryId))
					.where(whereConditions)
					.orderBy(desc(entries.publishedAt))
					.limit(10) // Load 10 entries at a time
					.offset(data.offset || 0) // Skip entries based on offset
					.execute();

				// Calculate pagination metadata
				const itemsPerPage = 10;
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
						},
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
							generator: feeds.generator
						}
					})
					.from(entries)
					.leftJoin(feeds, eq(entries.feedId, feeds.id))
					.leftJoin(userEntries, eq(entries.id, userEntries.entryId))
					.where(and(eq(entries.id, data.entryId), eq(userEntries.userId, context.user.id)))
					.limit(1);

				const entry = res[0];
				if (!entry) {
					throw new Error('Entry not found');
				}

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
