import { createServerFn } from '@tanstack/react-start';
import { sentryMiddleware } from '../middleware/sentry-middleware';
import { adminMiddleware } from '../middleware/admin-middleware';
import * as Sentry from '@sentry/tanstackstart-react';
import { db, users, feeds, entries, userFeedSubscriptions } from '@reafrac/database';
import { count, gt } from '@reafrac/database';

export const getAdminStatsServerFn = createServerFn({ method: 'GET' })
	.middleware([sentryMiddleware, adminMiddleware])
	.handler(async ({ context }) => {
		return Sentry.startSpan({ op: 'server_function', name: 'getAdminStats' }, async (span) => {
			try {
				span.setAttribute('user_id', context.user.id);

				const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

				const [
					totalUsersResult,
					totalFeedsResult,
					activeFeedsResult,
					totalEntriesResult,
					totalSubscriptionsResult,
					recentEntriesResult,
					recentUsersResult
				] = await Promise.all([
					db.select({ count: count() }).from(users),
					db.select({ count: count() }).from(feeds),
					db.select({ count: count() }).from(feeds).where(gt(feeds.lastFetchedAt, sevenDaysAgo)),
					db.select({ count: count() }).from(entries),
					db.select({ count: count() }).from(userFeedSubscriptions),
					db.select({ count: count() }).from(entries).where(gt(entries.createdAt, sevenDaysAgo)),
					db.select({ count: count() }).from(users).where(gt(users.createdAt, sevenDaysAgo))
				]);

				const stats = {
					totalUsers: totalUsersResult[0].count,
					totalFeeds: totalFeedsResult[0].count,
					activeFeeds: activeFeedsResult[0].count,
					totalEntries: totalEntriesResult[0].count,
					totalSubscriptions: totalSubscriptionsResult[0].count,
					recentEntries: recentEntriesResult[0].count,
					recentUsers: recentUsersResult[0].count
				};

				span.setAttribute('status', 'success');
				span.setAttribute('stats', JSON.stringify(stats));

				return stats;
			} catch (error) {
				span.setAttribute('status', 'error');
				Sentry.captureException(error, {
					tags: { function: 'getAdminStats' },
					extra: {
						userId: context.user.id,
						errorMessage: error instanceof Error ? error.message : 'Unknown error'
					}
				});
				throw error;
			}
		});
	});
