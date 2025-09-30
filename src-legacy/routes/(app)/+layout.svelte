<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import type { LayoutProps } from './$types';
	import { createQuery } from '@tanstack/svelte-query';
	import { getFeedsRequest } from '$lib/api/feed';
	import { type Feed } from '$lib/api/types';

	let { children, data }: LayoutProps = $props();

	const query = createQuery<Feed[]>({
		queryKey: ['feeds'],
		queryFn: async () => {
			try {
				const res = await fetch(getFeedsRequest(data.minifluxUrl, data.token));
				if (res.ok) return await res.json();
				throw new Error('Failed to fetch feeds');
			} catch {
				throw new Error('Failed to fetch feeds');
			}
		},
		initialData: data.feeds
	});

	const feeds = $derived.by(() => {
		return $query.data.map((feed) => ({
			id: feed.id,
			title: feed.title,
			icon: `${data.minifluxUrl}/feed/icon/${feed.icon?.external_icon_id}`,
			url: feed.site_url
		}));
	});
</script>

<Sidebar.Provider>
	<AppSidebar username={data.user.username} {feeds} />
	{@render children?.()}
</Sidebar.Provider>
