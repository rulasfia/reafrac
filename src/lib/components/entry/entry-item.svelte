<script lang="ts">
	import type { FeedEntry } from '$lib/api/types';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { extractTextFromHtml, formatDate } from '$lib/utils';
	import { sidebarMenuButtonVariants } from '../ui/sidebar/sidebar-menu-button.svelte';

	const { entry, minifluxUrl }: { entry: FeedEntry; minifluxUrl: string } = $props();
</script>

<Sidebar.MenuButton>
	{#snippet child({ props })}
		<a
			{...props}
			href={`/entry/${entry.id}`}
			class={sidebarMenuButtonVariants({
				class: 'grid h-fit w-auto grid-cols-1 overflow-auto p-3 text-wrap'
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
						<span class="text-xs font-medium text-foreground">{entry.feed.title}</span>
						<span class="text-xs">{entry.author}</span>
					</div>
				</div>
				<span class="py-0.5 text-xs">
					{formatDate(entry.published_at)}
				</span>
			</div>
			<p class="line-clamp-2 text-base font-semibold">{entry.title}</p>
			<p class="line-clamp-4 text-foreground/60">{extractTextFromHtml(entry.content, 250)}</p>
		</a>
	{/snippet}
</Sidebar.MenuButton>
