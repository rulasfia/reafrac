<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	const feeds = data.feeds.map((feed) => ({
		id: feed.id,
		title: feed.title,
		icon: `${data.minifluxUrl}/feed/icon/${feed.icon?.external_icon_id}`,
		url: feed.site_url
	}));
</script>

<Sidebar.Provider>
	<AppSidebar username={data.user.username} {feeds} />
	<main class="container mx-auto">
		{@render children?.()}
	</main>
</Sidebar.Provider>
