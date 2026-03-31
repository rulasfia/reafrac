import { db, feeds, entries, userFeedSubscriptions, userEntries } from '@reafrac/database';
import { eq, inArray, and } from 'drizzle-orm';
import { extractFeed, ParsedFeed } from '@reafrac/feed-utils';
import { createLogger } from '@reafrac/logger';

const log = createLogger({ name: 'feed-refetch' });
const proxyUrl = process.env.PROXY_URL;

export async function refetchFeeds() {
	log.info('Starting feed refetch process');

	try {
		const feedsToRefetch = await db.select().from(feeds).limit(50);

		log.info({ count: feedsToRefetch.length }, 'Found feeds to refetch');

		const feedTasks = feedsToRefetch.map((feed, idx) => async () => {
			const feedLog = log.child({ feedId: feed.id, feedTitle: feed.title, feedLink: feed.link });

			try {
				feedLog.debug('Refetching feed');

				let feedData: ParsedFeed | undefined = undefined;
				if (proxyUrl) {
					const httpResponse = await fetch(`${proxyUrl}/extract-feed`, {
						method: 'POST',
						body: JSON.stringify({ url: feed.link }),
						headers: { 'Content-Type': 'application/json' }
					});

					if (!httpResponse.ok) {
						throw new Error(`Proxy returned ${httpResponse.status}`);
					}

					feedData = (await httpResponse.json()) as ParsedFeed;
				} else {
					feedData = await extractFeed(feed.link);
				}

				await db
					.update(feeds)
					.set({
						lastFetchedAt: new Date(),
						updatedAt: new Date()
					})
					.where(eq(feeds.id, feed.id));

				const subscriptions = await db
					.select({ userId: userFeedSubscriptions.userId })
					.from(userFeedSubscriptions)
					.where(eq(userFeedSubscriptions.feedId, feed.id));

				if (subscriptions.length === 0) {
					feedLog.debug('No users subscribed, skipping entry insertion');
					return;
				}

				if (feedData.entries.length > 0) {
					const newTitles = feedData.entries.map((entry) => entry.title);
					const existingEntries = await db
						.select({ title: entries.title })
						.from(entries)
						.where(and(eq(entries.feedId, feed.id), inArray(entries.title, newTitles)));

					const existingTitles = new Set(existingEntries.map((entry) => entry.title));
					const newEntries = feedData.entries.filter((entry) => !existingTitles.has(entry.title));

					if (newEntries.length === 0) {
						feedLog.debug('No new entries found');
						return;
					}

					feedLog.info({ count: newEntries.length }, 'Processing new entries');

					const insertedEntries = await db
						.insert(entries)
						.values(
							newEntries.map((entry) => ({
								feedId: feed.id,
								title: entry.title,
								description: entry.description,
								link: entry.link,
								publishedAt: entry.published ? new Date(entry.published) : new Date(),
								author: typeof entry.author === 'string' ? entry.author : '',
								content: entry.content,
								thumbnail: entry.thumbnail?.url,
								thumbnailCaption: entry.thumbnail?.text ?? entry.title
							}))
						)
						.returning({ id: entries.id });

					const userIds = subscriptions.map((sub) => sub.userId);
					const BATCH_SIZE = 1000;
					let totalCreated = 0;

					for (const entry of insertedEntries) {
						const batch = userIds.map((userId) => ({
							userId,
							entryId: entry.id,
							status: 'unread' as const,
							starred: false
						}));

						for (let j = 0; j < batch.length; j += BATCH_SIZE) {
							const chunk = batch.slice(j, j + BATCH_SIZE);
							await db.insert(userEntries).values(chunk);
							totalCreated += chunk.length;
						}
					}

					if (totalCreated > 0) {
						feedLog.info({ userEntryCount: totalCreated }, 'Created user entries');
					}
				}

				feedLog.info('Feed refetched successfully');
			} catch (error) {
				feedLog.error({ error: String(error) }, 'Error refetching feed');
			}
		});

		const FEED_CONCURRENCY = 10;
		let finishedFeedCount = 0;

		for (let i = 0; i < feedTasks.length; i += FEED_CONCURRENCY) {
			const chunk = feedTasks.slice(i, i + FEED_CONCURRENCY).map((task) => task());
			await Promise.all(chunk);
			finishedFeedCount += chunk.length;
		}

		if (finishedFeedCount > 0) {
			log.info({ count: finishedFeedCount }, 'Feed refetch process completed');
		}
	} catch (error) {
		log.error({ error: String(error) }, 'Error in feed refetch process');
		throw error;
	}
}
