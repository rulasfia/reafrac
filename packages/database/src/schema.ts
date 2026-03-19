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
	displayUsername: text('display_username'),
	isAdmin: boolean('is_admin').default(false).notNull()
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

export const fluxConnections = pgTable(
	'flux_connections',
	{
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
	},
	(table) => [index('fluxConnections_userId_idx').on(table.userId)]
);

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

export const feeds = pgTable(
	'feeds',
	{
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
	},
	(table) => [
		index('feeds_categoryId_idx').on(table.categoryId),
		index('feeds_link_idx').on(table.link)
	]
);

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
		unique('uniqueFeedEntryTitle').on(table.feedId, table.title),
		index('entries_feedId_idx').on(table.feedId),
		index('entries_publishedAt_idx').on(table.publishedAt),
		index('entries_createdAt_idx').on(table.createdAt)
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
		unique('uniqueUserFeedSubscription').on(table.userId, table.feedId),
		index('userFeedSubscriptions_userId_idx').on(table.userId),
		index('userFeedSubscriptions_feedId_idx').on(table.feedId)
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
		unique('uniqueUserEntry').on(table.userId, table.entryId),
		index('userEntries_userId_idx').on(table.userId),
		index('userEntries_entryId_idx').on(table.entryId),
		index('userEntries_status_idx').on(table.status),
		index('userEntries_userId_status_idx').on(table.userId, table.status)
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
