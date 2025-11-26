import { extract, FeedData } from '@extractus/feed-extractor';
import {
	parsedFeedAuthorSchema,
	parsedFeedContentSchema,
	parsedFeedIconSchema,
	parsedFeedSchema,
	parsedFeedThumbnailSchema
} from './schemas';

export async function extractFeed(url: string) {
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

			let thumbnail: { url: string; text?: string } | null = null;
			if ('media:content' in feedEntry) {
				thumbnail = parsedFeedThumbnailSchema.parse(feedEntry['media:content']);
				// TODO: fallback thumbnail parsing in the content
			}

			return { author, content, thumbnail };
		}
	});

	const validated = parsedFeedSchema.parse(res);
	return validated;
}

export * from './schemas';
export type { FeedData };
