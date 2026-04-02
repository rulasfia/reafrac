import { queryOptions } from '@tanstack/react-query';
import { discoverFeedsServerFn, type DiscoveredFeed } from '../server/feed-discovery-sfn';

export const feedDiscoveryQueryOptions = (query: string, skipCrawl?: boolean) => {
	return queryOptions({
		queryKey: ['feed-discovery', query, skipCrawl],
		queryFn: async () =>
			discoverFeedsServerFn({
				data: { query, skipCrawl }
			}),
		enabled: query.length > 0,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000
	});
};

export type { DiscoveredFeed };
