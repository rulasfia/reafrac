import * as Sentry from '@sentry/tanstackstart-react';
import { extractFeed as coreExtractFeed } from '@reafrac/feed-utils';

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

				const result = await coreExtractFeed(url);

				span.setAttribute('feed.entries_count', result.entries?.length || 0);
				span.setAttribute('feed.title', result.title || '');

				return result;
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
