import { SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
import { useLoaderData, useLocation } from '@tanstack/react-router';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader } from './ui/loader';
import { IconTriangleExclamation, IconCircleExclamation, IconRotateLeft } from '@intentui/icons';
import { EntryItem } from './entry/entry-item';
import { Button } from './ui/button';
import { useServerFn } from '@tanstack/react-start';
import { getEntriesServerFn } from '@/lib/server/entry-sfn';
import { getFeedServerFn, getFeedsServerFn } from '@/lib/server/feed-sfn';
import { MENU_ITEMS } from './app-sidebar';

const PAGE_SIZE = 10;

export function ContentSidebar() {
	const { search } = useLocation();
	const { user, integration } = useLoaderData({ from: '/reader' });
	const getEntries = useServerFn(getEntriesServerFn);
	const getFeed = useServerFn(getFeedServerFn);
	const getFeeds = useServerFn(getFeedsServerFn);
	const queryClient = useQueryClient();
	const feedId = MENU_ITEMS.find((x) => x.page === search.page) ? undefined : search.page;

	function formatQueryParams(param: typeof search) {
		const status = param.page === 'unread' ? ('unread' as const) : undefined;
		const starred = param.page === 'saved';

		// today at 12am UTC in milliseconds
		let after: number | undefined = undefined;
		if (param.page === 'today') {
			const now = new Date();
			const utcToday = new Date(
				Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
			);
			after = Math.floor(utcToday.getTime() / 1000); // Convert to Unix timestamp (seconds)
		}

		return { status, starred, after };
	}

	const entries = useInfiniteQuery({
		queryKey: ['entries', integration?.id, search.page],
		queryFn: async ({ pageParam = 0 }) => {
			const { after, starred, status } = formatQueryParams(search);

			return getEntries({ data: { feedId, offset: pageParam, after, starred, status } });
		},
		getNextPageParam: (lastPage, allPages) => {
			const currentOffset = allPages.length * PAGE_SIZE;
			const hasMore =
				lastPage.entries.length === PAGE_SIZE &&
				currentOffset + lastPage.entries.length < lastPage.meta.totalItems;
			return hasMore ? currentOffset : undefined;
		},
		initialPageParam: 0,
		select: (res) => {
			return res.pages.flatMap((page) => page.entries);
		}
	});

	const handleForceRefresh = async () => {
		const { after, starred, status } = formatQueryParams(search);

		// TODO: update with more efficient approach so it didn't have to request twice
		// Trigger a force refetch by directly calling the server function with forceRefetch: true
		await getEntries({ data: { feedId, offset: 0, after, starred, status, forceRefetch: true } });
		// After force refetch, invalidate the query to refresh the UI
		await queryClient.invalidateQueries({ queryKey: ['entries', integration?.id, search.page] });
	};

	const feeds = useQuery({
		queryKey: ['feeds', user.id, integration?.id],
		queryFn: async () => getFeeds()
	});

	const feed = useQuery({
		enabled: !!feedId,
		queryKey: ['feed', feedId],
		queryFn: async () => getFeed({ data: { feedId: feedId! } })
	});

	const loadMore = async () => {
		if (!entries.hasNextPage || entries.isFetchingNextPage) return;
		await entries.fetchNextPage();
	};

	return (
		<div className="col-span-3 flex h-full flex-col overflow-y-auto">
			<SidebarHeader className="flex w-full flex-row items-start justify-between">
				<span className="line-clamp-2 min-h-7 w-fit gap-x-3 text-lg font-bold capitalize">
					{feedId ? (feed.data?.title ?? ' ') : search.page?.replaceAll('-', ' ')}
				</span>
				<Button size="sq-sm" intent="plain" onClick={handleForceRefresh}>
					{entries.isFetching ? <Loader size="xs" /> : <IconRotateLeft />}
				</Button>
			</SidebarHeader>
			<SidebarContent className="overflow-y-scroll">
				{feeds.data && feeds.data.length < 1 ? (
					<div className="bg-bg mx-2 flex flex-col items-center gap-y-2 rounded-md p-4">
						<IconCircleExclamation className="h-6 w-6 opacity-75" />
						<span className="text-sm opacity-75">Your feed content will appear here.</span>
					</div>
				) : null}
				{entries.status === 'success'
					? entries.data?.map((entry) => <EntryItem key={entry.id} entry={entry} />)
					: null}
				<div className="mx-2 mt-2 mb-4">
					{entries.error && (
						<div className="mb-2 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
							<IconTriangleExclamation className="h-4 w-4" />
							<span>{'Failed to load entries'}</span>
						</div>
					)}
					{entries.status === 'success' && entries.hasNextPage && (
						<Button
							onClick={loadMore}
							isDisabled={entries.isFetchingNextPage}
							className="w-full"
							intent="outline"
						>
							{entries.isFetchingNextPage ? (
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
