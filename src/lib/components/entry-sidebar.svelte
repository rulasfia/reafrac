<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { page } from '$app/state';
	import type { EntryMeta, FeedEntry } from '$lib/api/types';
	import EntryItem from './entry/entry-item.svelte';

	const entries = $derived(page.data.entries) as { data: FeedEntry[]; pagination: EntryMeta };
</script>

<Sidebar.Root collapsible="none" class="hidden !w-[24rem] flex-1 md:flex">
	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupLabel>Articles</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					{#each entries.data as entry (entry.id)}
						<Sidebar.MenuItem>
							<EntryItem {entry} minifluxUrl={page.data.minifluxUrl} />
						</Sidebar.MenuItem>
						<Sidebar.Separator />
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>
</Sidebar.Root>
