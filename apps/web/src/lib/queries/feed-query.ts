import { queryOptions } from '@tanstack/react-query';
import { getFeedsServerFn } from '../server/feed-sfn';

export const userFeedQueryOptions = (id: string) => {
	return queryOptions({
		queryKey: ['feeds', id],
		queryFn: async () => getFeedsServerFn(),
		staleTime: 2 * 60 * 1000 // 2 minutes
	});
};
