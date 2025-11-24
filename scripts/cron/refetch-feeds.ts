import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { z } from 'zod';
import { pgTable, text, timestamp, boolean, uuid, serial, unique } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { extract } from '@extractus/feed-extractor';

export const users = pgTable('users', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').default(false).notNull(),
	image: text('image'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
	username: text('username').unique(),
	displayUsername: text('display_username')
});

export const categories = pgTable('categories', {
	// we use nanoid here for short, url frendly id
	id: text('id')
		.primaryKey()
		.$defaultFn(() => nanoid(12)),
	name: text('name').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull()
});

export const feeds = pgTable('feeds', {
	// we use nanoid here for short, url frendly id
	id: text('id')
		.primaryKey()
		.$defaultFn(() => nanoid(12)),
	categoryId: text('category_id').references(() => categories.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	link: text('link').notNull(),
	siteUrl: text('site_url').notNull().default(''),
	icon: text('icon').notNull(),
	description: text('description').notNull(),
	language: text('language').notNull(),
	generator: text('generator').notNull(),
	publishedAt: timestamp('published_at').notNull(),
	lastFetchedAt: timestamp('last_fetched_at').defaultNow().notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull()
});

export const entries = pgTable(
	'entries',
	{
		// we use auto increment int here for even smaller size
		id: serial().primaryKey(),
		feedId: text('feed_id')
			.notNull()
			.references(() => feeds.id, { onDelete: 'cascade' }),
		title: text('title').notNull(),
		link: text('link').notNull(),
		description: text('description').notNull(),
		author: text('author').notNull(),
		content: text('content'),
		publishedAt: timestamp('published_at').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		thumbnail: text('thumbnail'),
		thumbnailCaption: text('thumbnail_caption')
	},
	(table) => [
		// Prevent duplicate entries within the same feed based on title
		unique('uniqueFeedEntryTitle').on(table.feedId, table.title)
	]
);

// Junction table for user feed subscriptions
export const userFeedSubscriptions = pgTable(
	'user_feed_subscriptions',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		feedId: text('feed_id')
			.notNull()
			.references(() => feeds.id, { onDelete: 'cascade' }),
		urlPrefix: text('url_prefix'),
		title: text('title'),
		icon: text('icon'),
		subscribedAt: timestamp('subscribed_at').defaultNow().notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull()
	},
	(table) => [
		// Prevent duplicate subscriptions
		unique('uniqueUserFeedSubscription').on(table.userId, table.feedId)
	]
);

// Junction table for user-specific entry states (read status, starred)
export const userEntries = pgTable(
	'user_entries',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		entryId: serial('entry_id')
			.notNull()
			.references(() => entries.id, { onDelete: 'cascade' }),
		status: text('status', { enum: ['unread', 'read'] })
			.default('unread')
			.notNull(),
		starred: boolean('starred').default(false).notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull()
	},
	(table) => [
		// Prevent duplicate user-entry relationships
		unique('uniqueUserEntry').on(table.userId, table.entryId)
	]
);

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
	throw new Error('DATABASE_URL is not defined');
}

// Create database connection
const queryClient = new pg.Pool({
	connectionString: DB_URL,
	max: 10
});

const db = drizzle({
	client: queryClient,
	casing: 'snake_case'
});

const FeedManager = {
	parsedFeedSchema: z.object({
		title: z.string(),
		description: z.union([
			z.string(),
			z.object({ '#text': z.string() }).transform((val) => val['#text'].trim())
		]),
		link: z.url(),
		published: z.string(),
		icon: z.string().default(''),
		generator: z.string().default(''),
		language: z.string().default(''),
		entries: z.array(
			z.object({
				id: z.string(),
				title: z.string(),
				link: z.string(),
				published: z.string(),
				description: z.string(),
				author: z.string().default(''),
				content: z.string().nullable(),
				thumbnail: z
					.object({
						url: z.url(),
						text: z.string().optional()
					})
					.nullable()
			})
		)
	}),

	parsedFeedIconSchema: z.union([
		z.url(),
		z.object({ url: z.url() }).transform((val) => val.url.trim())
	]),

	parsedFeedAuthorSchema: z.union([
		z.string().transform((val) => {
			// if include (), get the content inside
			if (val.includes('(') && val.includes(')')) {
				return val.split('(')[1].split(')')[0].trim();
			}
			return val.trim();
		}),
		z.object({ name: z.string() }).transform((val) => val.name.trim()),
		z.array(z.string()).transform((val) => val.join(', ').trim()),
		z
			.array(z.object({ name: z.string() }).transform((val) => val.name.trim()))
			.transform((val) => val.join(', ').trim())
	]),

	parsedFeedContentSchema: z.union([
		z.string(),
		z.object({ '#text': z.string() }).transform((val) => val['#text'].trim())
	]),

	parsedFeedThumbnailSchema: z.union([
		z.string().transform((val) => ({ url: val })),
		z.object({ url: z.string() }).transform((val) => ({ url: val.url })),
		z
			.object({ '@_url': z.string(), 'media:text': z.string().optional() })
			.transform((val) => ({ url: val['@_url'], text: val['media:text'] })),
		z
			.object({ 'media:thumbnail': z.object({ '@_url': z.string() }) })
			.transform((val) => ({ url: val['media:thumbnail']['@_url'] }))
	])
};

export async function extractFeed(url: string) {
	console.log('fetching feed...', url);

	const res = await extract(url, {
		descriptionMaxLen: 0,
		getExtraFeedFields: (feed) => {
			// parse website icon
			let icon = '';
			if ('image' in feed) {
				const parsedImg = FeedManager.parsedFeedIconSchema.parse(feed.image);
				icon = parsedImg;
			} else if ('icon' in feed) {
				const parsedImg = FeedManager.parsedFeedIconSchema.parse(feed.icon);
				icon = parsedImg;
			}

			return { icon };
		},
		getExtraEntryFields: (feedEntry) => {
			// parse entry author
			let author = '';
			if ('dc:creator' in feedEntry) {
				author = FeedManager.parsedFeedAuthorSchema.parse(feedEntry['dc:creator']);
			}

			if ('author' in feedEntry) {
				author = FeedManager.parsedFeedAuthorSchema.parse(feedEntry['author']);
			}

			let content: string | null = null;
			if ('content' in feedEntry) {
				content = FeedManager.parsedFeedContentSchema.parse(feedEntry['content']);
			} else if ('content:encoded' in feedEntry) {
				content = FeedManager.parsedFeedContentSchema.parse(feedEntry['content:encoded']);
			}

			let thumbnail: { url: string; text?: string } | null = null;
			if ('media:content' in feedEntry) {
				thumbnail = FeedManager.parsedFeedThumbnailSchema.parse(feedEntry['media:content']);
				// TODO: fallback thumbnail parsing in the content
			}

			if (thumbnail?.url) {
				console.log(`thumbnail - ${thumbnail.url}`);
			}

			return { author, content, thumbnail };
		}
	});

	const validated = FeedManager.parsedFeedSchema.parse(res);

	return validated;
}

// Main function to refetch feeds and update entries
async function refetchFeeds() {
	console.log('Starting feed refetch process...');

	try {
		const feedsToRefetch = await db.select().from(feeds).limit(50); // Limit to prevent overwhelming the system

		console.log(`>>> Found ${feedsToRefetch.length} feeds to refetch`);

		for (const feed of feedsToRefetch) {
			try {
				console.log(`Refetching feed: ${feed.title} (${feed.link})`);

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
					console.log(`No users subscribed to feed ${feed.id}, skipping entry insertion`);
					continue;
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
						console.log(`No new entries for feed ${feed.id}`);
						continue;
					}

					console.log(`>>> Processing ${newEntries.length} new entries for feed ${feed.id}`);

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
						console.log(`>>> Created ${userEntriesValues.length} user entries`);
					}
				}

				console.log(`Successfully refetched feed: ${feed.title}`);
			} catch (error) {
				console.error(`Error refetching feed ${feed.id} (${feed.link}):`, error);
				// Continue with other feeds even if one fails
			}
		}

		console.log('Feed refetch process completed successfully');
	} catch (error) {
		console.error('Error in feed refetch process:', error);
		throw error;
	} finally {
		// Close database connection
		await queryClient.end();
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
