#!/usr/bin/env bun

/**
 * Migration script to convert user-specific feeds/entries to shared structure
 *
 * This script migrates from:
 * - feeds table with userId column
 * - entries table with userId, status, starred columns
 * - categories table with userId column
 *
 * To:
 * - Shared feeds/entries/categories (no userId)
 * - user_feed_subscriptions junction table
 * - user_entries junction table for user-specific states
 */

import { isNotNull } from 'drizzle-orm';
import { db } from '../src/lib/db-connection';
import * as schemas from '../src/lib/db-schema';

console.log('🚀 Starting migration to shared feeds/entries structure...');

async function migrate() {
	try {
		// Start transaction for atomic migration
		await db.transaction(async (tx) => {
			console.log('📋 Step 1: Backing up existing data...');

			// Create backup tables (optional but recommended)
			await tx.execute(`
        CREATE TABLE IF NOT EXISTS feeds_backup AS SELECT * FROM feeds;
        CREATE TABLE IF NOT EXISTS entries_backup AS SELECT * FROM entries;
        CREATE TABLE IF NOT EXISTS categories_backup AS SELECT * FROM categories;
      `);

			console.log('📋 Step 2: Migrating user feed subscriptions...');

			// Select all feed from feeds table
			const feeds = await tx.select().from(schemas.feeds).where(isNotNull(schemas.feeds.userId));

			// Insert to user_feed_subscriptions table
			const userFeeds = await tx
				.insert(schemas.userFeedSubscriptions)
				.values(
					feeds.map((feed) => ({
						userId: feed.userId,
						feedId: feed.id,
						subscribedAt: feed.createdAt,
						createdAt: feed.createdAt,
						updatedAt: feed.updatedAt
					}))
				)
				.returning();

			console.log(`✅ Created ${userFeeds.length || 0} feed subscriptions`);

			console.log('📋 Step 3: Migrating user entry states...');
			const entries = await tx
				.select()
				.from(schemas.entries)
				.where(isNotNull(schemas.entries.userId));
			const userEntries = await tx
				.insert(schemas.userEntries)
				.values(
					entries.map((entry) => ({
						userId: entry.userId,
						entryId: entry.id,
						status: entry.status || 'unread',
						starred: entry.starred || false,
						createdAt: entry.createdAt,
						updatedAt: entry.updatedAt
					}))
				)
				.returning();

			console.log(`✅ Created ${userEntries.length || 0} user entry states`);

			console.log('✅ Migration completed successfully!');
		});

		console.log('🎉 Migration to shared feeds/entries structure completed!');
	} catch (error) {
		console.error('❌ Migration failed:', error);
		process.exit(1);
	}
}

// Rollback function in case we need to revert
async function rollback() {
	try {
		console.log('🔄 Starting rollback...');

		await db.transaction(async (tx) => {
			console.log('📋 Step 1: Restoring user_id columns if they were removed...');

			// Add back user_id columns if they don't exist
			await tx.execute(`
        ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
        ALTER TABLE feeds ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
        ALTER TABLE entries ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
        ALTER TABLE entries ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read'));
        ALTER TABLE entries ADD COLUMN IF NOT EXISTS starred BOOLEAN DEFAULT false;
      `);

			console.log('📋 Step 2: Restoring original data from backup tables...');

			// Only restore if backup tables exist
			const backupExists = await tx.execute(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name IN ('feeds_backup', 'entries_backup', 'categories_backup')
        ) as exists;
      `);

			if (backupExists.rows[0]?.exists) {
				// Restore original data from backups
				await tx.execute(`
          UPDATE categories SET
            user_id = (SELECT user_id FROM categories_backup WHERE categories_backup.id = categories.id)
          WHERE EXISTS (SELECT 1 FROM categories_backup WHERE categories_backup.id = categories.id AND categories_backup.user_id IS NOT NULL);
        `);

				await tx.execute(`
          UPDATE feeds SET
            user_id = (SELECT user_id FROM feeds_backup WHERE feeds_backup.id = feeds.id)
          WHERE EXISTS (SELECT 1 FROM feeds_backup WHERE feeds_backup.id = feeds.id AND feeds_backup.user_id IS NOT NULL);
        `);

				await tx.execute(`
          UPDATE entries SET
            user_id = (SELECT user_id FROM entries_backup WHERE entries_backup.id = entries.id),
            status = (SELECT status FROM entries_backup WHERE entries_backup.id = entries.id),
            starred = (SELECT starred FROM entries_backup WHERE entries_backup.id = entries.id)
          WHERE EXISTS (SELECT 1 FROM entries_backup WHERE entries_backup.id = entries.id AND entries_backup.user_id IS NOT NULL);
        `);

				console.log('✅ Original data restored from backup tables');
			} else {
				console.log('⚠️  Backup tables not found, cannot restore original data');
			}

			console.log('📋 Step 3: Restoring original constraints...');

			// Drop the new shared constraint if it exists
			await tx.execute(`
        ALTER TABLE entries DROP CONSTRAINT IF EXISTS entries_feed_id_title_unique;
        ALTER TABLE entries DROP CONSTRAINT IF EXISTS uniqueFeedEntryTitle;
      `);

			// Restore the old user-specific constraint
			await tx.execute(`
        ALTER TABLE entries ADD CONSTRAINT IF NOT EXISTS uniqueUserFeedEntryTitle UNIQUE (user_id, feed_id, title);
      `);

			console.log('📋 Step 4: Cleaning up junction tables...');

			// Drop the junction tables that were created during migration
			await tx.execute(`
        DROP TABLE IF EXISTS user_entries;
        DROP TABLE IF EXISTS user_feed_subscriptions;
      `);

			console.log('📋 Step 5: Optionally cleaning up backup tables...');
			// Note: Uncomment the following lines if you want to automatically clean up backup tables
			// await tx.execute(`
			//   DROP TABLE IF EXISTS categories_backup;
			//   DROP TABLE IF EXISTS feeds_backup;
			//   DROP TABLE IF EXISTS entries_backup;
			// `);
		});

		console.log('✅ Rollback completed successfully!');
		console.log(
			'📝 Note: Backup tables were preserved for safety. You can manually drop them if desired:'
		);
		console.log('   DROP TABLE categories_backup, feeds_backup, entries_backup;');
	} catch (error) {
		console.error('❌ Rollback failed:', error);
		process.exit(1);
	}
}

// Main execution
async function main() {
	const command = process.argv[2];

	if (command === 'rollback') {
		await rollback();
	} else if (command === 'migrate') {
		await migrate();
	} else {
		console.log('Usage:');
		console.log('  bun run migrate-to-shared    # Run migration');
		console.log('  bun run migrate-to-shared rollback    # Rollback migration');
		process.exit(1);
	}
}

main().catch(console.error);
