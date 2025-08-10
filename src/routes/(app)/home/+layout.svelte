<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import EntrySidebar from '$lib/components/entry-sidebar.svelte';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
</script>

<div
	style="--sidebar-width: 24rem; --sidebar-width-mobile: 20rem;"
	class="flex w-full flex-row justify-between bg-sidebar"
>
	<EntrySidebar data={data.entries.data} pagination={data.entries.pagination} />
	<Sidebar.Inset
		class="container m-2 h-[calc(100vh-1rem)] w-[calc(100vw-37rem)] overflow-auto rounded-xl p-4 shadow-md"
	>
		{@render children?.()}
	</Sidebar.Inset>
</div>
