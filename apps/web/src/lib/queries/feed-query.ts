import { queryOptions } from '@tanstack/react-query';
import { getFeedsServerFn } from '../server/feed-sfn';

export const userFeedQueryOptions = (userId: string) => {
	return queryOptions({
		queryKey: ['feeds', userId],
		queryFn: async () => getFeedsServerFn(),
		staleTime: 2 * 60 * 1000 // 2 minutes
	});
};
