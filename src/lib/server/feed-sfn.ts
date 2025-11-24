import { createServerFn } from '@tanstack/react-start';
import * as z from 'zod/mini';
import { authFnMiddleware } from '../middleware/auth-middleware';
import { getExistingIntegrationServerFn } from './integration-sfn';
import { ofetch } from 'ofetch';
import type { Feed as FluxFeed } from './types';
import { sentryMiddleware } from '../middleware/sentry-middleware';
import * as Sentry from '@sentry/tanstackstart-react';
import { db } from '../db-connection';
import { entries, feeds, userEntries, userFeedSubscriptions } from '../db-schema';
import type { Schema } from '../db-schema';
import { eq, and, asc, inArray } from 'drizzle-orm';
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

				let userFeeds: Array<
					Omit<Schema['Feed'], 'userId' | 'categoryId'> & {
						meta: Pick<Schema['UserFeedSubscription'], 'urlPrefix' | 'title' | 'icon'>;
					}
				> = [];

				userFeeds = await db
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
					.where(eq(userFeedSubscriptions.userId, context.user.id))
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

					// Add Miniflux feeds and create subscriptions
					for (const f of res) {
						// Check if feed already exists (globally)
						let existingFeed = await db
							.select()
							.from(feeds)
							.where(eq(feeds.link, f.feed_url))
							.limit(1);

						let feedId: string;

						if (existingFeed.length === 0) {
							// Create new feed
							const newFeed = await db
								.insert(feeds)
								.values({
									title: f.title,
									description: f.title,
									link: f.feed_url,
									siteUrl: f.site_url,
									publishedAt: new Date(),
									icon: `${integration?.serverUrl}/feed/icon/${f.icon?.external_icon_id}`,
									generator: 'miniflux',
									language: 'en_US'
								})
								.returning();
							feedId = newFeed[0].id;
						} else {
							feedId = existingFeed[0].id;
						}

						// Create user subscription if it doesn't exist
						const existingSubscription = await db
							.select()
							.from(userFeedSubscriptions)
							.where(
								and(
									eq(userFeedSubscriptions.userId, context.user.id),
									eq(userFeedSubscriptions.feedId, feedId)
								)
							)
							.limit(1);

						if (existingSubscription.length === 0) {
							await db.insert(userFeedSubscriptions).values({
								userId: context.user.id,
								feedId: feedId
							});
						}

						// Add to user feeds list
						const feedData =
							existingFeed.length > 0
								? {
										id: existingFeed[0].id,
										title: existingFeed[0].title,
										description: existingFeed[0].description,
										link: existingFeed[0].link,
										icon: existingFeed[0].icon,
										siteUrl: existingFeed[0].siteUrl,
										language: existingFeed[0].language,
										generator: existingFeed[0].generator,
										publishedAt: existingFeed[0].publishedAt,
										lastFetchedAt: existingFeed[0].lastFetchedAt,
										createdAt: existingFeed[0].createdAt,
										updatedAt: existingFeed[0].updatedAt,
										meta: { urlPrefix: null, title: null, icon: null }
									}
								: {
										id: feedId,
										title: f.title,
										description: f.title,
										link: f.feed_url,
										icon: `${integration?.serverUrl}/feed/icon/${f.icon?.external_icon_id}`,
										siteUrl: f.site_url,
										language: 'en_US',
										generator: 'miniflux',
										publishedAt: new Date(),
										lastFetchedAt: new Date(),
										updatedAt: new Date(),
										createdAt: new Date(),
										meta: { urlPrefix: null, title: null, icon: null }
									};

						userFeeds.push(feedData);
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
					.where(and(eq(feeds.id, data.feedId), eq(userFeedSubscriptions.userId, context.user.id)))
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

				// Check if feed already exists (globally)
				let existingFeed = await db
					.select()
					.from(feeds)
					.where(eq(feeds.link, data.feedUrl))
					.limit(1);

				let feed: Schema['Feed'];

				if (existingFeed.length === 0) {
					// Create new feed
					const newFeed = await db
						.insert(feeds)
						.values({
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
					feed = newFeed[0];
					span.setAttribute('new_feed_created', 'true');
				} else {
					feed = existingFeed[0];
					span.setAttribute('new_feed_created', 'false');
				}

				span.setAttribute('feed_id', feed.id);

				// Create user subscription if it doesn't exist
				const existingSubscription = await db
					.select()
					.from(userFeedSubscriptions)
					.where(
						and(
							eq(userFeedSubscriptions.userId, context.user.id),
							eq(userFeedSubscriptions.feedId, feed.id)
						)
					)
					.limit(1);

				if (existingSubscription.length === 0) {
					await db.insert(userFeedSubscriptions).values({
						userId: context.user.id,
						feedId: feed.id
					});
					span.setAttribute('subscription_created', 'true');
				} else {
					span.setAttribute('subscription_created', 'false');
				}

				// Only insert entries if this is a new feed
				if (existingFeed.length === 0 && validated.entries.length > 0) {
					// Insert entries in batches if there are many entries
					const entryValues = validated.entries.map((entry) => ({
						feedId: feed.id,
						title: entry.title,
						description: entry.description,
						link: entry.link,
						publishedAt: new Date(entry.published),
						author: entry.author,
						content: entry.content,
						thumbnail: entry.thumbnail?.url,
						thumbnailCaption: entry.thumbnail?.text ?? entry.title
					}));

					const insertedEntries = await db
						.insert(entries)
						.values(entryValues)
						.returning({ id: entries.id });

					// Create user entries for the user
					await db.insert(userEntries).values(
						insertedEntries.map((insertedEntry) => ({
							userId: context.user.id,
							entryId: insertedEntry.id,
							status: 'unread' as const,
							starred: false
						}))
					);

					span.setAttribute('inserted_entries_count', entryValues.length);
				}

				// if using existing feed, adding entries to this user
				// will be done by entries-sfn when user getting the entries

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

const UpdateFeedSchema = z.object({
	feedId: z.string(),
	title: z.optional(z.string()),
	urlPrefix: z.optional(z.string()),
	icon: z.optional(
		z
			.url()
			.check(
				z.refine(
					(val) =>
						val.includes('.ico') ||
						val.includes('.png') ||
						val.includes('.svg') ||
						val.includes('.jpg') ||
						val.includes('.jpeg'),
					{ message: 'Invalid icon URL' }
				)
			)
	)
});

export const updateFeedServerFn = createServerFn({ method: 'POST' })
	.middleware([sentryMiddleware, authFnMiddleware])
	.inputValidator(UpdateFeedSchema)
	.handler(async ({ data, context }) => {
		return Sentry.startSpan({ op: 'server_function', name: 'updateFeed' }, async (span) => {
			try {
				span.setAttribute('feed_id', data.feedId);
				span.setAttribute('user_id', context.user.id);

				// Build update object with only provided fields
				const updateData: Partial<Schema['UserFeedSubscription']> = {};
				if (data.title !== undefined) updateData.title = data.title;
				if (data.icon !== undefined) updateData.icon = data.icon;
				if (data.urlPrefix !== undefined) updateData.urlPrefix = data.urlPrefix;

				// Check if user is subscribed to this feed
				const subscription = await db
					.select()
					.from(userFeedSubscriptions)
					.where(
						and(
							eq(userFeedSubscriptions.userId, context.user.id),
							eq(userFeedSubscriptions.feedId, data.feedId)
						)
					)
					.limit(1);

				if (subscription.length === 0) {
					throw new Error('Feed not found or not authorized to update');
				}

				// Update the userFeedSubscriptions (feeds are shared, so no one edit this directly)
				const updatedFeed = await db
					.update(userFeedSubscriptions)
					.set(updateData)
					.where(eq(userFeedSubscriptions.id, subscription[0].id))
					.returning();

				if (updatedFeed.length === 0) {
					throw new Error('Feed not found');
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

				// Check if user is subscribed to this feed
				const subscription = await db
					.select()
					.from(userFeedSubscriptions)
					.where(
						and(
							eq(userFeedSubscriptions.userId, context.user.id),
							eq(userFeedSubscriptions.feedId, data.feedId)
						)
					)
					.limit(1);

				if (subscription.length === 0) {
					throw new Error('Feed not found or not subscribed');
				}

				// Remove user subscription
				const deletedSubscription = await db
					.delete(userFeedSubscriptions)
					.where(
						and(
							eq(userFeedSubscriptions.userId, context.user.id),
							eq(userFeedSubscriptions.feedId, data.feedId)
						)
					)
					.returning();

				if (deletedSubscription.length === 0) {
					throw new Error('Failed to remove subscription');
				}

				// Remove user entries for this feed
				const feedEntries = await db
					.select({ id: entries.id })
					.from(entries)
					.where(eq(entries.feedId, data.feedId));

				if (feedEntries.length > 0) {
					const entryIds = feedEntries.map((entry) => entry.id);
					await db
						.delete(userEntries)
						.where(
							and(eq(userEntries.userId, context.user.id), inArray(userEntries.entryId, entryIds))
						);
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
