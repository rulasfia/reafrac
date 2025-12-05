import { useLoaderData, useLocation } from '@tanstack/react-router';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { SidebarContent, SidebarHeader } from '../ui/sidebar';
import { useServerFn } from '@tanstack/react-start';
import { getEntriesServerFn } from '@/lib/server/entry-sfn';
import { getFeedServerFn } from '@/lib/server/feed-sfn';
import { MENU_ITEMS } from './constants';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import { BadgeInfoIcon, RotateCwIcon, TriangleAlertIcon } from 'lucide-react';
import { EntryItem } from '../entry/entry-item';
import { userFeedQueryOptions } from '@/lib/queries/feed-query';

const PAGE_SIZE = 15;

export function ContentSidebar() {
	const { search } = useLocation();
	const { user } = useLoaderData({ from: '/reader' });
	const getEntries = useServerFn(getEntriesServerFn);
	const getFeed = useServerFn(getFeedServerFn);
	const queryClient = useQueryClient();
	const feedId = MENU_ITEMS.find((x) => x.page === search.page) ? undefined : search.page;

	function formatQueryParams(param: typeof search) {
		const status = param.page === 'unread' ? ('unread' as const) : undefined;
		const starred = param.page === 'saved' ? true : undefined;

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
		queryKey: ['entries', search.page],
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
		await queryClient.invalidateQueries({ queryKey: ['entries', search.page] });
	};

	const feeds = useQuery(userFeedQueryOptions(user.id));

	const feed = useQuery({
		enabled: !!feedId,
		queryKey: ['feed', feedId],
		queryFn: async () => getFeed({ data: { feedId: feedId! } })
	});

	const loadMore = async () => {
		if (!entries.hasNextPage || entries.isFetchingNextPage) return;
		await entries.fetchNextPage();
	};

	const pageTitle = (() => {
		if (feedId) return feed.data?.title ?? '';
		if (search.page) return search.page?.replaceAll('-', ' ');
		return 'Feed';
	})();

	return (
		<div className="col-span-4 flex h-full flex-col overflow-y-auto lg:col-span-3">
			<SidebarHeader className="flex flex-row items-start justify-between">
				<span className="line-clamp-2 min-h-7 w-fit gap-x-3 text-lg font-semibold capitalize">
					{pageTitle}
				</span>
				<Button size="icon-sm" variant="ghost" onClick={handleForceRefresh}>
					{entries.isFetching ? <Spinner className="size-3" /> : <RotateCwIcon />}
				</Button>
			</SidebarHeader>

			<SidebarContent className="px-3">
				{feeds.data && feeds.data.length < 1 ? (
					<div className="bg-bg flex flex-col items-center gap-y-2 rounded-md p-4">
						<BadgeInfoIcon className="size-6 opacity-75" />
						<span className="text-sm opacity-75">Your feed content will appear here.</span>
					</div>
				) : null}

				{entries.error && (
					<div className="mb-2 flex items-center gap-2 rounded-md border border-destructive/75 bg-destructive/5 p-2 text-sm text-destructive">
						<TriangleAlertIcon className="size-6" />
						<span className="text-sm opacity-75">{'Failed to load entries'}</span>
					</div>
				)}

				{entries.status === 'success'
					? entries.data?.map((entry) => <EntryItem key={entry.id} entry={entry} />)
					: null}
				{entries.status === 'success' && entries.hasNextPage && (
					<Button
						onClick={loadMore}
						disabled={entries.isFetchingNextPage}
						className="mb-2"
						variant="outline"
					>
						{entries.isFetchingNextPage ? (
							<>
								<Spinner className="size-3" />
								<span>Loading more...</span>
							</>
						) : (
							'Load More'
						)}
					</Button>
				)}
			</SidebarContent>
		</div>
	);
}
