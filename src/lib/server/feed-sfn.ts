import { createServerFn } from '@tanstack/react-start';
import * as z from 'zod/mini';
import { authFnMiddleware } from '../middleware/auth-middleware';
import { getExistingIntegrationServerFn } from './integration-sfn';
import { ofetch } from 'ofetch';
import type { Feed as FluxFeed } from './types';
import { sentryMiddleware } from '../middleware/sentry-middleware';
import * as Sentry from '@sentry/tanstackstart-react';
import { db } from '../db-connection';
import { entries, feeds } from '../db-schema';
import type { Schema } from '../db-schema';
import { eq, and, asc } from 'drizzle-orm';
import { extractFeed } from '../utils/feed-utils';

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

				let userFeeds: Array<Schema['Feed']> = [];

				userFeeds = await db
					.select()
					.from(feeds)
					.where(eq(feeds.userId, context.user.id))
					.orderBy(asc(feeds.title));

				if (integration) {
					// get feeds
					const res = await ofetch<FluxFeed[]>(`/v1/feeds`, {
						baseURL: integration?.serverUrl,
						timeout: 3000,
						method: 'GET',
						headers: {
							'X-Auth-Token': integration?.apiKey,
							'Content-Type': 'application/json'
						}
					});

					// update to feeds
					for (const f of res) {
						userFeeds.push({
							id: f.id.toString(),
							userId: context.user.id,
							categoryId: null,
							generator: 'miniflux',
							icon: `${integration?.serverUrl}/feed/icon/${f.icon?.external_icon_id}`,
							language: 'en_US',
							link: f.feed_url,
							siteUrl: f.site_url,
							title: f.title,
							description: f.title,
							publishedAt: new Date(),
							lastFetchedAt: new Date(),
							updatedAt: new Date(),
							createdAt: new Date()
						});
					}
				}

				span.setAttribute('status', 'success');
				span.setAttribute('feeds_count', userFeeds.length);
				return userFeeds;
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

				const feed = await db
					.select()
					.from(feeds)
					.where(and(eq(feeds.id, data.feedId), eq(feeds.userId, context.user.id)))
					.limit(1);

				if (feed.length === 0) throw new Error('Feed not found');

				span.setAttribute('status', 'success');
				return feed[0];
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

export const previewFeedServerFn = createServerFn({ method: 'GET' })
	.middleware([sentryMiddleware, authFnMiddleware])
	.inputValidator(z.object({ feedUrl: z.string() }))
	.handler(async ({ data, context }) => {
		return Sentry.startSpan({ op: 'server_function', name: 'previewFeed' }, async (span) => {
			try {
				span.setAttribute('user_id', context.user.id);
				span.setAttribute('feed_url', data.feedUrl);

				// Extract feed using the centralized extractFeed function
				const validated = await extractFeed(data.feedUrl);
				span.setAttribute('entries_count', validated.entries.length);
				span.setAttribute('feed_title', validated.title);

				// alternative icon parsing. go to the website and search for icon
				let icon = '';
				if (!validated.icon) {
					const faviconEnpoints = ['favicon.ico', 'favicon.png', 'favicon.jpg', 'favicon.svg'];
					for (const ico of faviconEnpoints) {
						const faviconUrl = `${new URL(data.feedUrl).origin}/${ico}`;
						// check if favicon exists
						const faviconExists = await fetch(faviconUrl).then((res) => res.ok);
						if (!faviconExists) continue;
						icon = faviconUrl;
						break;
					}
				} else {
					icon = validated.icon;
				}

				span.setAttribute('status', 'success');
				return {
					...validated,
					icon
				};
			} catch (error) {
				span.setAttribute('status', 'error');
				Sentry.captureException(error, {
					tags: { function: 'previewFeed', feedUrl: data.feedUrl },
					extra: {
						userId: context.user.id,
						feedUrl: data.feedUrl,
						errorMessage: error instanceof Error ? error.message : 'Unknown error',
						errorStack: error instanceof Error ? error.stack : undefined
					}
				});
				throw error;
			}
		});
	});

export const addFeedServerFn = createServerFn({ method: 'GET' })
	.middleware([sentryMiddleware, authFnMiddleware])
	.inputValidator(z.object({ feedUrl: z.string() }))
	.handler(async ({ data, context }) => {
		return Sentry.startSpan({ op: 'server_function', name: 'addFeed' }, async (span) => {
			try {
				span.setAttribute('user_id', context.user.id);
				span.setAttribute('feed_url', data.feedUrl);

				// Extract feed using the centralized extractFeed function
				const validated = await extractFeed(data.feedUrl);
				span.setAttribute('entries_count', validated.entries.length);
				span.setAttribute('feed_title', validated.title);

				// alternative icon parsing. go to the website and search for icon
				let icon = '';
				if (!validated.icon) {
					const faviconEnpoints = ['favicon.ico', 'favicon.png', 'favicon.jpg', 'favicon.svg'];
					for (const ico of faviconEnpoints) {
						const faviconUrl = `${new URL(data.feedUrl).origin}/${ico}`;
						// check if favicon exists
						const faviconExists = await fetch(faviconUrl).then((res) => res.ok);
						if (!faviconExists) continue;
						icon = faviconUrl;
						break;
					}
				} else {
					icon = validated.icon;
				}

				// Insert to feed table
				const newFeed = await db
					.insert(feeds)
					.values({
						userId: context.user.id,
						title: validated.title,
						description: validated.description,
						link: data.feedUrl,
						siteUrl: new URL(data.feedUrl).origin,
						publishedAt: new Date(validated.published),
						icon: icon,
						generator: validated.generator,
						language: validated.language
					})
					.returning();

				span.setAttribute('new_feed_id', newFeed[0].id);

				// Insert entries in batches if there are many entries
				const entryValues = validated.entries.map((entry) => ({
					userId: context.user.id,
					feedId: newFeed[0].id,
					title: entry.title,
					description: entry.description,
					link: entry.link,
					publishedAt: new Date(entry.published),
					author: entry.author,
					content: entry.content,
					thumbnail: entry.thumbnail?.url,
					thumbnailCaption: entry.thumbnail?.text ?? entry.title
				}));

				await db.insert(entries).values(entryValues);
				span.setAttribute('inserted_entries_count', entryValues.length);

				span.setAttribute('status', 'success');
				return validated;
			} catch (error) {
				span.setAttribute('status', 'error');
				Sentry.captureException(error, {
					tags: { function: 'addFeed', feedUrl: data.feedUrl },
					extra: {
						userId: context.user.id,
						feedUrl: data.feedUrl,
						errorMessage: error instanceof Error ? error.message : 'Unknown error',
						errorStack: error instanceof Error ? error.stack : undefined
					}
				});
				throw error;
			}
		});
	});

export const updateFeedServerFn = createServerFn({ method: 'POST' })
	.middleware([sentryMiddleware, authFnMiddleware])
	.inputValidator(
		z.object({
			feedId: z.string(),
			title: z.optional(z.string()),
			url: z.optional(z.string())
		})
	)
	.handler(async ({ data, context }) => {
		return Sentry.startSpan({ op: 'server_function', name: 'updateFeed' }, async (span) => {
			try {
				span.setAttribute('feed_id', data.feedId);
				span.setAttribute('user_id', context.user.id);

				// Build update object with only provided fields
				const updateData: Partial<Schema['Feed']> = {};
				if (data.title !== undefined) updateData.title = data.title;
				if (data.url !== undefined) updateData.link = data.url;

				// Update the feed for this user
				const updatedFeed = await db
					.update(feeds)
					.set(updateData)
					.where(and(eq(feeds.id, data.feedId), eq(feeds.userId, context.user.id)))
					.returning();

				if (updatedFeed.length === 0) {
					throw new Error('Feed not found or not authorized to update');
				}

				span.setAttribute('status', 'success');
				return { success: true, feed: updatedFeed[0] };
			} catch (error) {
				span.setAttribute('status', 'error');
				Sentry.captureException(error, {
					tags: { function: 'updateFeed', feedId: data.feedId },
					extra: {
						userId: context.user.id,
						errorMessage: error instanceof Error ? error.message : 'Unknown error'
					}
				});
				throw error;
			}
		});
	});

export const removeFeedServerFn = createServerFn({ method: 'POST' })
	.middleware([sentryMiddleware, authFnMiddleware])
	.inputValidator(z.object({ feedId: z.string() }))
	.handler(async ({ data, context }) => {
		return Sentry.startSpan({ op: 'server_function', name: 'removeFeed' }, async (span) => {
			try {
				span.setAttribute('feed_id', data.feedId);
				span.setAttribute('user_id', context.user.id);

				// Delete entries associated with the feed for this user
				await db
					.delete(entries)
					.where(and(eq(entries.feedId, data.feedId), eq(entries.userId, context.user.id)));

				// Delete the feed for this user
				const deletedFeed = await db
					.delete(feeds)
					.where(and(eq(feeds.id, data.feedId), eq(feeds.userId, context.user.id)))
					.returning();

				if (deletedFeed.length === 0) {
					throw new Error('Feed not found or not authorized to delete');
				}

				span.setAttribute('status', 'success');
				return { success: true, feedId: data.feedId };
			} catch (error) {
				span.setAttribute('status', 'error');
				Sentry.captureException(error, {
					tags: { function: 'removeFeed', feedId: data.feedId },
					extra: {
						userId: context.user.id,
						errorMessage: error instanceof Error ? error.message : 'Unknown error'
					}
				});
				throw error;
			}
		});
	});
