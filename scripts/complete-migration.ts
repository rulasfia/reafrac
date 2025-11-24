#!/usr/bin/env bun

/**
 * Complete migration script to convert user-specific feeds/entries to shared structure
 * This script handles the full migration process including proper backup creation
 */

import { db } from '../src/lib/db-connection';

console.log('🚀 Starting complete migration to shared feeds/entries structure...');

async function completeMigration() {
	try {
		await db.transaction(async (tx) => {
			console.log('📋 Step 1: Creating proper backups before migration...');

			// Create backup tables with current data structure
			await tx.execute(`
        DROP TABLE IF EXISTS feeds_backup;
        DROP TABLE IF EXISTS entries_backup;
        DROP TABLE IF EXISTS categories_backup;
        
        CREATE TABLE feeds_backup AS SELECT * FROM feeds;
        CREATE TABLE entries_backup AS SELECT * FROM entries;
        CREATE TABLE categories_backup AS SELECT * FROM categories;
      `);

			console.log('✅ Backup tables created successfully');

			console.log('📋 Step 2: Migrating user feed subscriptions...');

			// Migrate existing feeds to user_feed_subscriptions
			const feedSubscriptionsResult = await tx.execute(`
        INSERT INTO user_feed_subscriptions (user_id, feed_id, subscribed_at, created_at, updated_at)
        SELECT DISTINCT 
          user_id, 
          id, 
          created_at as subscribed_at,
          created_at,
          updated_at
        FROM feeds_backup 
        WHERE user_id IS NOT NULL
        ON CONFLICT (user_id, feed_id) DO NOTHING
        RETURNING COUNT(*) as count;
      `);

			console.log(`✅ Created ${feedSubscriptionsResult.rows[0]?.count || 0} feed subscriptions`);

			console.log('📋 Step 3: Migrating user entry states...');

			// Migrate existing entries to user_entries with their states
			const userEntriesResult = await tx.execute(`
        INSERT INTO user_entries (user_id, entry_id, status, starred, created_at, updated_at)
        SELECT 
          user_id,
          id,
          COALESCE(status, 'unread') as status,
          COALESCE(starred, false) as starred,
          created_at,
          updated_at
        FROM entries_backup 
        WHERE user_id IS NOT NULL
        ON CONFLICT (user_id, entry_id) DO NOTHING
        RETURNING COUNT(*) as count;
      `);

			console.log(`✅ Created ${userEntriesResult.rows[0]?.count || 0} user entry states`);

			console.log('📋 Step 4: Verifying migration...');

			// Verify counts
			const feedCount = await tx.execute(`SELECT COUNT(*) as count FROM feeds`);
			const subscriptionCount = await tx.execute(
				`SELECT COUNT(*) as count FROM user_feed_subscriptions`
			);
			const entryCount = await tx.execute(`SELECT COUNT(*) as count FROM entries`);
			const userEntryCount = await tx.execute(`SELECT COUNT(*) as count FROM user_entries`);

			console.log(
				`📊 Feeds: ${feedCount.rows[0]?.count}, Subscriptions: ${subscriptionCount.rows[0]?.count}`
			);
			console.log(
				`📊 Entries: ${entryCount.rows[0]?.count}, User Entries: ${userEntryCount.rows[0]?.count}`
			);

			console.log('✅ Migration completed successfully!');
		});

		console.log('🎉 Complete migration to shared feeds/entries structure finished!');
	} catch (error) {
		console.error('❌ Migration failed:', error);
		process.exit(1);
	}
}

// Main execution
async function main() {
	await completeMigration();
}

main().catch(console.error);
