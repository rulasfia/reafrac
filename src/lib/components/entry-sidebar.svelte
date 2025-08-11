<script lang="ts">
	import type { EntryMeta, FeedEntry } from '$lib/api/types';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { page } from '$app/state';
	import RefreshIcon from '@lucide/svelte/icons/rotate-cw';
	import EntryItem from './entry/entry-item.svelte';
	import { Button } from './ui/button';

	type Props = { data: FeedEntry[]; pagination: EntryMeta };
	const entries: Props = $props();
</script>

<Sidebar.Root class="ml-[12rem] hidden !w-[24rem] flex-1 border-transparent md:flex">
	<Sidebar.Header>
		<Sidebar.Group class="flex flex-row items-center justify-between p-0 px-2 py-1">
			<div class="flex flex-col">
				<span class="text-sm font-semibold">Home</span>
				<span class="text-xs text-foreground/60">All Feed ({entries.pagination.totalItems})</span>
			</div>
			<Button class="size-7 cursor-pointer" size="icon" variant="ghost">
				<RefreshIcon size="16" class="text-foreground/80" />
			</Button>
		</Sidebar.Group>
	</Sidebar.Header>
	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					{#each entries.data as entry (entry.id)}
						<Sidebar.MenuItem>
							<EntryItem {entry} minifluxUrl={page.data.minifluxUrl} />
						</Sidebar.MenuItem>
						<Sidebar.Separator class="h-[0.5px]" />
					{/each}
					<Sidebar.MenuItem>
						<Sidebar.MenuButton class="justify-center">Load More</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>
</Sidebar.Root>
