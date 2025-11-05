import * as Sentry from '@sentry/tanstackstart-react';
import { extract } from '@extractus/feed-extractor';
import {
	parsedFeedAuthorSchema,
	parsedFeedContentSchema,
	parsedFeedIconSchema,
	parsedFeedSchema
} from '../schemas/feed-schemas';

export async function extractFeed(url: string) {
	return Sentry.startSpan(
		{
			op: 'function',
			name: 'extractFeed',
			attributes: { feed_url: url }
		},
		async (span) => {
			try {
				span.setAttribute('feed.url', url);
				console.log('fetching feed...', url);

				const res = await extract(url, {
					descriptionMaxLen: 0,
					getExtraFeedFields: (feed) => {
						// parse website icon
						let icon = '';
						if ('image' in feed) {
							const parsedImg = parsedFeedIconSchema.parse(feed.image);
							icon = parsedImg;
						} else if ('icon' in feed) {
							const parsedImg = parsedFeedIconSchema.parse(feed.icon);
							icon = parsedImg;
						}

						console.log({ icon });

						return { icon };
					},
					getExtraEntryFields: (feedEntry) => {
						// parse entry author
						let author = '';
						if ('dc:creator' in feedEntry) {
							author = parsedFeedAuthorSchema.parse(feedEntry['dc:creator']);
						}

						if ('author' in feedEntry) {
							author = parsedFeedAuthorSchema.parse(feedEntry['author']);
						}

						let content: string | null = null;
						if ('content' in feedEntry) {
							content = parsedFeedContentSchema.parse(feedEntry['content']);
						} else if ('content:encoded' in feedEntry) {
							content = parsedFeedContentSchema.parse(feedEntry['content:encoded']);
						}

						return { author, content };
					}
				});

				const validated = parsedFeedSchema.parse(res);

				span.setAttribute('feed.entries_count', res.entries?.length || 0);
				span.setAttribute('feed.title', res.title || '');

				return validated;
			} catch (error) {
				// Capture the error with additional context
				Sentry.captureException(error, {
					tags: { component: 'utils-feed', function: 'extractFeed' },
					extra: {
						feedUrl: url,
						errorMessage: error instanceof Error ? error.message : String(error)
					}
				});

				// Re-throw the error to maintain existing behavior
				throw error;
			}
		}
	);
}
