import { relations } from 'drizzle-orm';
import {
	pgTable,
	index,
	text,
	timestamp,
	boolean,
	uuid,
	serial,
	unique
} from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

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

export const sessions = pgTable(
	'sessions',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		expiresAt: timestamp('expires_at').notNull(),
		token: text('token').notNull().unique(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' })
	},
	(table) => [index('sessions_userId_idx').on(table.userId)]
);

export const accounts = pgTable(
	'accounts',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		accountId: text('account_id').notNull(),
		providerId: text('provider_id').notNull(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		accessToken: text('access_token'),
		refreshToken: text('refresh_token'),
		idToken: text('id_token'),
		accessTokenExpiresAt: timestamp('access_token_expires_at'),
		refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
		scope: text('scope'),
		password: text('password'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull()
	},
	(table) => [index('accounts_userId_idx').on(table.userId)]
);

export const verifications = pgTable(
	'verifications',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		identifier: text('identifier').notNull(),
		value: text('value').notNull(),
		expiresAt: timestamp('expires_at').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull()
	},
	(table) => [index('verifications_identifier_idx').on(table.identifier)]
);

export const userRelations = relations(users, ({ many }) => ({
	sessions: many(sessions),
	accounts: many(accounts)
}));

export const sessionRelations = relations(sessions, ({ one }) => ({
	users: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	})
}));

export const accountRelations = relations(accounts, ({ one }) => ({
	users: one(users, {
		fields: [accounts.userId],
		references: [users.id]
	})
}));

export const fluxConnections = pgTable('flux_connections', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	serverUrl: text('server_url').notNull(),
	apiKey: text('api_key').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull()
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

export type Schema = {
	User: typeof users.$inferSelect;
	Session: typeof sessions.$inferSelect;
	Account: typeof accounts.$inferSelect;
	Verification: typeof verifications.$inferSelect;
	FluxConnection: typeof fluxConnections.$inferSelect;
	Category: typeof categories.$inferSelect;
	Feed: typeof feeds.$inferSelect;
	Entry: typeof entries.$inferSelect;
	UserFeedSubscription: typeof userFeedSubscriptions.$inferSelect;
	UserEntry: typeof userEntries.$inferSelect;
};
