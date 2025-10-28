import { SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
import { useLoaderData } from '@tanstack/react-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ofetch } from 'ofetch';
import type { FeedEntry } from '@/lib/server/types';
import { Loader } from './ui/loader';
import { IconTriangleExclamation } from '@intentui/icons';
import { cn } from '@/lib/utils';
import { EntryItem } from './entry/entry-item';

const PAGE_SIZE = 20;

export function ContentSidebar() {
	const { integration } = useLoaderData({ from: '/reader' });

	const { data, status, fetchNextPage, hasNextPage, isFetchingNextPage, error } = useInfiniteQuery({
		enabled: !!integration,
		queryKey: ['entries', integration?.id],
		queryFn: async ({ pageParam = 0 }) => {
			if (!integration) return { entries: [], total: 0 };
			const res = await ofetch<{ entries: FeedEntry[]; total: number }>(`/v1/entries`, {
				baseURL: integration.serverUrl,
				timeout: 5000,
				headers: { 'X-Auth-Token': integration.apiKey, 'Content-Type': 'application/json' },
				query: { direction: 'desc', order: 'published_at', limit: PAGE_SIZE, offset: pageParam }
			});
			return res;
		},
		getNextPageParam: (lastPage, allPages) => {
			const currentOffset = allPages.length * PAGE_SIZE;
			const hasMore =
				lastPage.entries.length === PAGE_SIZE &&
				currentOffset + lastPage.entries.length < lastPage.total;
			return hasMore ? currentOffset : undefined;
		},
		initialPageParam: 0
	});

	const loadMore = async () => {
		if (!hasNextPage || isFetchingNextPage) return;

		await fetchNextPage();
	};

	return (
		<div className="col-span-3 flex h-full flex-col overflow-y-auto">
			<SidebarHeader>
				<span className="text-lg font-bold">Today</span>
			</SidebarHeader>
			<SidebarContent className="overflow-y-scroll">
				{!integration ? (
					<div className="bg-bg mx-2 flex flex-col items-center rounded-md border border-border p-4">
						<IconTriangleExclamation className="h-6 w-6 opacity-75" />
						<span className="text-sm font-medium opacity-75">No content</span>
					</div>
				) : null}
				{integration && status === 'pending' ? <Loader className="mx-auto my-4" /> : null}
				{integration && status === 'success'
					? data?.pages.flatMap((page) => page.entries).map((entry) => <EntryItem entry={entry} />)
					: null}
				<div className="mx-2 my-2">
					{error && (
						<div className="mb-2 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
							<IconTriangleExclamation className="h-4 w-4" />
							<span>{error.message || 'Failed to load more entries'}</span>
						</div>
					)}
					{integration && status === 'success' && hasNextPage && (
						<button
							onClick={loadMore}
							disabled={isFetchingNextPage}
							className={cn(
								'w-full rounded-md border border-border p-2 text-sm font-medium transition-colors',
								'hover:bg-accent hover:text-accent-foreground',
								'focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none',
								isFetchingNextPage && 'cursor-not-allowed opacity-50'
							)}
						>
							{isFetchingNextPage ? (
								<div className="flex items-center justify-center gap-2">
									<Loader className="h-4 w-4" />
									<span>Loading more...</span>
								</div>
							) : (
								'Load More'
							)}
						</button>
					)}
				</div>
			</SidebarContent>
		</div>
	);
}
