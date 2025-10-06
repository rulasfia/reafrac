import { SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
import { Link, useLoaderData, useLocation } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ofetch } from 'ofetch';
import type { FeedEntry } from '@/lib/server/types';
import { Loader } from './ui/loader';
import clsx from 'clsx';

export function ContentSidebar() {
	const { search } = useLocation();
	const { integration } = useLoaderData({ from: '/reader' });

	const { data, status } = useQuery({
		enabled: !!integration,
		queryKey: [['entries', integration?.id]],
		queryFn: async () => {
			if (!integration) return { entries: [], total: 0 };
			const res = await ofetch<{ entries: FeedEntry[]; total: number }>(`/v1/entries`, {
				baseURL: integration.serverUrl,
				timeout: 5000,
				headers: { 'X-Auth-Token': integration.apiKey, 'Content-Type': 'application/json' },
				query: { direction: 'asc', order: 'published_at', limit: 25, offset: 0 }
			});
			return res;
		}
	});

	return (
		<div className="col-span-3 flex h-full flex-col overflow-y-auto">
			<SidebarHeader>
				<span className="text-lg font-bold">Today</span>
			</SidebarHeader>
			<SidebarContent className="overflow-y-scroll">
				{status === 'pending' ? <Loader className="mx-auto my-4" /> : null}
				{status === 'success'
					? data.entries.map((entry) => (
							<Link
								to="/reader"
								search={{ ...search, entry: entry.id }}
								key={entry.id}
								className={clsx([
									'mx-2 my-1 rounded-sm border border-transparent p-2 hover:border-border',
									search.entry === entry.id ? 'bg-neutral-100 dark:bg-neutral-800' : ''
								])}
							>
								{entry.title}
							</Link>
						))
					: null}
			</SidebarContent>
		</div>
	);
}
