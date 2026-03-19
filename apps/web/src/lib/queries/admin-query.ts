import { queryOptions } from '@tanstack/react-query';
import { getAdminStatsServerFn } from '../server/admin-sfn';

export const adminStatsQueryOptions = () => {
	return queryOptions({
		queryKey: ['admin', 'stats'],
		queryFn: async () => getAdminStatsServerFn(),
		staleTime: 5 * 60 * 1000
	});
};
