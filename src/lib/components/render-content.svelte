<script lang="ts">
	import { page } from '$app/state';
	import XIcon from '@lucide/svelte/icons/x';
	import type { FeedEntry } from '$lib/api/types';
	import { Button } from './ui/button';

	const url = $derived(page.url.pathname);
	const data = $derived.by<null | FeedEntry>(() => {
		const entry = page.url.searchParams.get('entry');
		if (!entry) return null;

		return page.data.entries.data.find((e: FeedEntry) => e.id.toString() === entry);
	});

	// const params = $derived(page.url.searchParams.get('entry'));
	// let data = $state<null | FeedEntry>(null);
	// $effect(() => {
	// 	if (!params) return;
	// 	fetch(getEntryRequestById(page.data.minifluxUrl, page.data.token, params)).then((res) =>
	// 		res.json().then((json) => {
	// 			data = json;
	// 		})
	// 	);
	// });
</script>

<header>
	<Button href={url} class="size-7 cursor-pointer" size="icon" variant="ghost">
		<XIcon size="16" class="text-foreground/80" />
	</Button>
</header>
{#if !data}{:else}
	<div class="flex flex-col items-center gap-y-2 py-4">
		<div class="flex justify-center gap-x-2 text-sm text-foreground/60">
			<span>{data.feed.title}</span>
			<span>-</span>
			<span>{data.author}</span>
			<span>-</span>
			<span>{data.reading_time} minutes read</span>
		</div>
		<a href={data.url} target="_blank" rel="noopener noreferrer">
			<h1 class="max-w-lg text-center text-2xl font-semibold text-pretty">{data.title}</h1>
		</a>
		<div class="mt-4">
			<p class="text-center italic">Content rendering is Work in Progress</p>
		</div>
	</div>
{/if}
