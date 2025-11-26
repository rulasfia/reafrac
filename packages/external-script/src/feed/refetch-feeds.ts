import { db, feeds, entries, userFeedSubscriptions, userEntries } from '@reafrac/database';
import { eq } from 'drizzle-orm';
import { extractFeed } from '@reafrac/feed-utils';

// Main function to refetch feeds and update entries
export async function refetchFeeds() {
	console.log('Starting feed refetch process...');

	try {
		const feedsToRefetch = await db.select().from(feeds).limit(50); // Limit to prevent overwhelming the system

		console.log(`>>> Found ${feedsToRefetch.length} feeds to refetch`);

		// Create async functions for each feed to be executed in parallel
		const feedTasks = feedsToRefetch.map((feed, idx) => async () => {
			try {
				const i = String(idx + 1).padStart(2, '0');
				console.log(`${i}. Refetching feed: ${feed.title} (${feed.link})`);

				// Extract feed data using the existing utility
				const feedData = await extractFeed(feed.link);

				// Update feed's last fetched timestamp
				await db
					.update(feeds)
					.set({
						lastFetchedAt: new Date(),
						updatedAt: new Date()
					})
					.where(eq(feeds.id, feed.id));

				// Get users subscribed to this feed
				const subscriptions = await db
					.select({ userId: userFeedSubscriptions.userId })
					.from(userFeedSubscriptions)
					.where(eq(userFeedSubscriptions.feedId, feed.id));

				if (subscriptions.length === 0) {
					console.log(`${i}. No users subscribed to feed ${feed.title}, skipping entry insertion`);
					return;
				}

				// Process new entries
				if (feedData.entries.length > 0) {
					// Get existing entries for this feed to avoid duplicates
					const existingEntries = await db
						.select({ title: entries.title })
						.from(entries)
						.where(eq(entries.feedId, feed.id));

					const existingTitles = new Set(existingEntries.map((entry) => entry.title));

					// Filter only new entries
					const newEntries = feedData.entries.filter((entry) => !existingTitles.has(entry.title));

					if (newEntries.length === 0) {
						console.log(`${i}. No new entries for feed ${feed.title}`);
						return;
					}

					console.log(`${i}. Processing ${newEntries.length} new entries for feed ${feed.title}`);

					// Insert new entries
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

					// Create user entries for all subscribed users
					const userIds = subscriptions.map((sub) => sub.userId);

					// Batch inserts to avoid memory/query size issues
					const BATCH_SIZE = 1000;
					let totalCreated = 0;

					for (const entry of insertedEntries) {
						const batch = userIds.map((userId) => ({
							userId,
							entryId: entry.id,
							status: 'unread' as const,
							starred: false
						}));

						// Insert in chunks
						for (let j = 0; j < batch.length; j += BATCH_SIZE) {
							const chunk = batch.slice(j, j + BATCH_SIZE);
							await db.insert(userEntries).values(chunk);
							totalCreated += chunk.length;
						}
					}

					if (totalCreated > 0) {
						console.log(`${i}. Created ${totalCreated} u-entries for ${feed.title}`);
					}
				}

				console.log(`${i}. Successfully refetched feed: ${feed.title}`);
			} catch (error) {
				console.error(`Error refetching feed ${feed.id} (${feed.link}):`, error);
				// Continue with other feeds even if one fails
			}
		});

		// Execute feed processing in parallel with a concurrency limit
		const FEED_CONCURRENCY = 10;
		let finishedFeedCount = 0;

		for (let i = 0; i < feedTasks.length; i += FEED_CONCURRENCY) {
			const chunk = feedTasks.slice(i, i + FEED_CONCURRENCY).map((task) => task());
			await Promise.all(chunk);
			finishedFeedCount += chunk.length;
		}

		if (finishedFeedCount > 0) {
			console.log(`Feed refetch process completed successfully: ${finishedFeedCount} `);
		}
	} catch (error) {
		console.error('Error in feed refetch process:', error);
		throw error;
	}
}
