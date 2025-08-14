<script lang="ts">
	import type { EntryMeta, FeedEntry } from '$lib/api/types';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { page } from '$app/state';
	import RefreshIcon from '@lucide/svelte/icons/rotate-cw';
	import EntryItem from './entry/entry-item.svelte';
	import { Button } from './ui/button';
	import { SvelteMap } from 'svelte/reactivity';

	type Props = { data: FeedEntry[]; pagination: EntryMeta };
	let { data = $bindable(), pagination = $bindable() }: Props = $props();

	let loading = $state(false);
	let error = $state<string | null>(null);

	// Create a derived array of unique entries for deduplication
	let uniqueEntries = $derived.by(() => {
		const entryMap = new SvelteMap<number, FeedEntry>();

		// Add entries in reverse order to prioritize newer entries when duplicates exist
		[...data].reverse().forEach((entry) => {
			if (!entryMap.has(entry.id)) {
				entryMap.set(entry.id, entry);
			}
		});

		// Convert back to array in original order
		return Array.from(entryMap.values()).reverse();
	});

	async function loadMore() {
		if (!pagination.hasNext || loading) return;
		if (loading) return;

		loading = true;
		error = null;

		try {
			const nextPage = pagination.currentPage + 1;
			const limit = 20;
			const offset = (nextPage - 1) * limit;

			const query = {
				offset,
				limit,
				direction: 'desc',
				order: 'published_at'
			};

			const res = await fetch(
				`${page.data.minifluxUrl}/v1/entries?${new URLSearchParams(query as any)}`,
				{
					method: 'GET',
					headers: {
						'X-Auth-Token': page.data.token,
						'Content-Type': 'application/json'
					}
				}
			);

			if (!res.ok) {
				throw new Error('Failed to load more entries');
			}

			const newEntries = await res.json();

			// Update the entries data by appending new entries
			// Filter out any entries that already exist to prevent duplicates
			const existingIds = new Set(data.map((entry) => entry.id));
			const filteredNewEntries = newEntries.entries.filter(
				(entry: FeedEntry) => !existingIds.has(entry.id)
			);

			data = [...data, ...filteredNewEntries];

			// Update pagination
			pagination = {
				...pagination,
				currentPage: nextPage,
				hasNext: nextPage < Math.ceil(pagination.totalItems / limit)
			};
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load more entries';
		} finally {
			loading = false;
		}
	}
</script>

<Sidebar.Root class="ml-[12rem] hidden !w-[24rem] flex-1 border-transparent md:flex">
	<Sidebar.Header>
		<Sidebar.Group class="flex flex-row items-center justify-between p-0 px-2 py-1">
			<div class="flex flex-col">
				<span class="text-sm font-semibold">Home</span>
				<span class="text-xs text-foreground/60">All Feed ({pagination.totalItems})</span>
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
					{#each uniqueEntries as entry (entry.id)}
						<Sidebar.MenuItem>
							<EntryItem {entry} bind:mutableEntries={data} minifluxUrl={page.data.minifluxUrl} />
						</Sidebar.MenuItem>
						<Sidebar.Separator class="h-[0.5px]" />
					{/each}
					{#if pagination.hasNext}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton
								class="justify-center {loading ? 'cursor-not-allowed opacity-50' : ''}"
								onclick={loadMore}
							>
								{loading ? 'Loading...' : 'Load More'}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{/if}
					{#if error}
						<Sidebar.MenuItem>
							<div class="p-2 text-center text-sm text-red-500">
								{error}
							</div>
						</Sidebar.MenuItem>
					{/if}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>
</Sidebar.Root>
