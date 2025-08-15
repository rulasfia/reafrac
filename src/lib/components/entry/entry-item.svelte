<script lang="ts">
	import { page } from '$app/state';
	import type { FeedEntry } from '$lib/api/types';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { extractTextFromHtml, formatRelativeDate } from '$lib/utils';
	import { sidebarMenuButtonVariants } from '../ui/sidebar/sidebar-menu-button.svelte';
	import { markEntryAsRead } from '$lib/api/entry';

	const {
		entry,
		mutableEntries = $bindable(),
		minifluxUrl
	}: { entry: FeedEntry; mutableEntries: FeedEntry[]; minifluxUrl: string } = $props();

	const isActive = $derived(page.url.searchParams.get('entry') === entry.id.toString());
	const isRead = $derived(entry.status);

	async function markAsRead() {
		if (entry.status !== 'read') {
			try {
				await markEntryAsRead(minifluxUrl, page.data.token, entry.id);
				// Update the entry status locally
				for (const mutableEntry of mutableEntries) {
					if (mutableEntry.id === entry.id) {
						mutableEntry.status = 'read';
						break;
					}
				}
			} catch (error) {
				console.error('Failed to mark entry as read:', error);
			}
		}
	}
</script>

<Sidebar.MenuButton>
	{#snippet child({ props })}
		<a
			{...props}
			href={`?entry=${entry.id}`}
			data-status={isRead}
			data-active={isActive}
			onclick={markAsRead}
			class={sidebarMenuButtonVariants({
				class:
					'grid h-fit w-auto grid-cols-1 overflow-auto border-[0.5px] border-transparent p-3 text-wrap transition-all duration-[50ms] ease-out data-[active=true]:border-border/75 data-[active=true]:shadow-sm/5 data-[status=read]:opacity-50'
			})}
		>
			<div class="flex justify-between text-foreground/60">
				<div class="flex items-center gap-x-1">
					<img
						width={28}
						height={28}
						src={`${minifluxUrl}/feed/icon/${entry.feed.icon?.external_icon_id}`}
						alt={entry.feed.title}
						class="size-7 rounded-full border border-border/20 shadow-sm"
					/>
					<div class="flex flex-col">
						<span
							data-status={isRead}
							class="text-xs font-medium text-foreground data-[status=read]:text-foreground/70"
							>{entry.feed.title}
						</span>
						<span class="text-xs">{entry.author}</span>
					</div>
				</div>
				<span class="py-0.5 text-xs">
					{formatRelativeDate(entry.published_at)}
				</span>
			</div>
			<p class="line-clamp-2 text-base font-semibold">{entry.title}</p>
			<p class="line-clamp-4 text-foreground/60">{extractTextFromHtml(entry.content, 250)}</p>
		</a>
	{/snippet}
</Sidebar.MenuButton>
