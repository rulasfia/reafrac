import { SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
import { useLoaderData, useLocation } from '@tanstack/react-router';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Loader } from './ui/loader';
import { IconTriangleExclamation } from '@intentui/icons';
import { EntryItem } from './entry/entry-item';
import { Button } from './ui/button';
import { useServerFn } from '@tanstack/react-start';
import { getEntriesServerFn } from '@/lib/server/entry-sfn';
import { getFeedServerFn } from '@/lib/server/feed-sfn';

const PAGE_SIZE = 20;

export function ContentSidebar() {
	const { search } = useLocation();
	const { integration } = useLoaderData({ from: '/reader' });
	const feedId = search.page?.split('_')[1];
	const getEntries = useServerFn(getEntriesServerFn);
	const getFeed = useServerFn(getFeedServerFn);

	const { data, status, fetchNextPage, hasNextPage, isFetchingNextPage, error } = useInfiniteQuery({
		enabled: !!integration,
		queryKey: ['entries', integration?.id, search.page],
		queryFn: async ({ pageParam = 0 }) => {
			if (!integration) return { entries: [], total: 0 };

			const starred = search.page === 'saved';
			// today at 12am in unix timestamp
			const after =
				search.page === 'today'
					? new Date(new Date().setHours(0, 0, 0, 0)).getTime() / 1000
					: undefined;

			return getEntries({ data: { feedId, offset: pageParam, after, starred } });
		},
		getNextPageParam: (lastPage, allPages) => {
			const currentOffset = allPages.length * PAGE_SIZE;
			const hasMore =
				lastPage.entries.length === PAGE_SIZE &&
				currentOffset + lastPage.entries.length < lastPage.total;
			return hasMore ? currentOffset : undefined;
		},
		initialPageParam: 0,
		select: (res) => {
			return res.pages
				.flatMap((page) => page.entries)
				.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
		}
	});

	const feed = useQuery({
		enabled: !!feedId,
		queryKey: ['feed', feedId],
		queryFn: async () => getFeed({ data: { feedId: feedId! } })
	});

	const loadMore = async () => {
		if (!hasNextPage || isFetchingNextPage) return;
		await fetchNextPage();
	};

	return (
		<div className="col-span-3 flex h-full flex-col overflow-y-auto">
			<SidebarHeader className="flex w-full flex-row items-center justify-between">
				<span className="min-h-7 gap-x-3 text-lg font-bold capitalize">
					{feedId ? (feed.data?.title ?? ' ') : search.page}
				</span>
				{integration && status === 'pending' ? <Loader size="xs" /> : null}
			</SidebarHeader>
			<SidebarContent className="overflow-y-scroll">
				{!integration ? (
					<div className="bg-bg mx-2 flex flex-col items-center rounded-md border border-border p-4">
						<IconTriangleExclamation className="h-6 w-6 opacity-75" />
						<span className="text-sm font-medium opacity-75">No content</span>
					</div>
				) : null}
				{integration && status === 'success'
					? data?.map((entry) => <EntryItem key={entry.id} entry={entry} />)
					: null}
				<div className="mx-2 mt-2 mb-4">
					{error && (
						<div className="mb-2 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
							<IconTriangleExclamation className="h-4 w-4" />
							<span>{error.message || 'Failed to load more entries'}</span>
						</div>
					)}
					{integration && status === 'success' && hasNextPage && (
						<Button
							onClick={loadMore}
							isDisabled={isFetchingNextPage}
							className="w-full"
							intent="outline"
						>
							{isFetchingNextPage ? (
								<div className="flex items-center justify-center gap-2">
									<Loader className="h-4 w-4" />
									<span>Loading more...</span>
								</div>
							) : (
								'Load More'
							)}
						</Button>
					)}
				</div>
			</SidebarContent>
		</div>
	);
}
