import { db, feeds, entries, userFeedSubscriptions, userEntries } from '@reafrac/database';
import { eq } from 'drizzle-orm';
import { extractFeed } from '@reafrac/feed-utils';

// Main function to refetch feeds and update entries
async function refetchFeeds() {
	console.log('Starting feed refetch process...');

	try {
		const feedsToRefetch = await db.select().from(feeds).limit(50); // Limit to prevent overwhelming the system

		console.log(`>>> Found ${feedsToRefetch.length} feeds to refetch`);

		// Create async functions for each feed to be executed in parallel
		const feedPromises = feedsToRefetch.map(async (feed, idx) => {
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
								publishedAt: new Date(entry.published || Date.now()),
								author: typeof entry.author === 'string' ? entry.author : '',
								content: entry.content,
								thumbnail: entry.thumbnail?.url,
								thumbnailCaption: entry.thumbnail?.text ?? entry.title
							}))
						)
						.returning({ id: entries.id });

					// Create user entries for all subscribed users
					const userIds = subscriptions.map((sub) => sub.userId);
					const userEntriesValues = [];

					for (const entry of insertedEntries) {
						for (const userId of userIds) {
							userEntriesValues.push({
								userId,
								entryId: entry.id,
								status: 'unread' as const,
								starred: false
							});
						}
					}

					if (userEntriesValues.length > 0) {
						await db.insert(userEntries).values(userEntriesValues);
						console.log(`${i}. Created ${userEntriesValues.length} u-entries for ${feed.title}`);
					}
				}

				console.log(`${i}. Successfully refetched feed: ${feed.title}`);
			} catch (error) {
				console.error(`Error refetching feed ${feed.id} (${feed.link}):`, error);
				// Continue with other feeds even if one fails
			}
		});

		// Execute all feed processing in parallel
		await Promise.all(feedPromises);

		console.log('Feed refetch process completed successfully');
	} catch (error) {
		console.error('Error in feed refetch process:', error);
		throw error;
	}
}

// Run the function
(function main() {
	refetchFeeds()
		.then(() => {
			console.log('Script completed successfully');
			process.exit(0);
		})
		.catch((error) => {
			console.error('Script failed:', error);
			process.exit(1);
		});
})();