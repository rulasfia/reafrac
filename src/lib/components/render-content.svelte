<script lang="ts">
	import { page } from '$app/state';
	import XIcon from '@lucide/svelte/icons/x';
	import type { FeedEntry } from '$lib/api/types';
	import { Button } from './ui/button';
	import xss from 'xss';
	import dayjs from 'dayjs';
	import { getEntryRequestById } from '$lib/api/entry';

	const url = $derived(page.url.pathname);
	let data = $derived.by<null | FeedEntry>(() => {
		const entry = page.url.searchParams.get('entry');
		if (!entry) return null;

		let result = page.data.entries.data.find((e: FeedEntry) => e.id.toString() === entry);
		return result;
	});

	const { getDefaultWhiteList } = xss;
	const wl = getDefaultWhiteList();

	// const params = $derived(page.url.searchParams.get('entry'));
	// let data = $state<null | FeedEntry>(null);
	$effect(() => {
		const entry = page.url.searchParams.get('entry');
		if (!entry || !!data) return;
		console.log('not found on existing entries. fetching...');
		fetch(getEntryRequestById(page.data.minifluxUrl, page.data.token, entry)).then((res) =>
			res.json().then((json) => {
				data = json;
			})
		);
	});
</script>

<header>
	<Button href={url} class="size-7 cursor-pointer" size="icon" variant="ghost">
		<XIcon size="16" class="text-foreground/80" />
	</Button>
</header>
{#if !data}
	<div class="flex flex-col items-center gap-y-1 py-4">
		<div class="flex justify-center gap-x-2 text-sm text-foreground/60">
			<span>Fetching entry...</span>
		</div>
	</div>
{:else}
	<div class="flex flex-col items-center gap-y-1 py-4">
		<div class="flex justify-center gap-x-2 text-sm text-foreground/60">
			<span>{data.feed.title}</span>
			<span>-</span>
			<span>{data.author}</span>
		</div>
		<a href={data.url} target="_blank" rel="noopener noreferrer">
			<h1 class="max-w-lg text-center text-2xl font-semibold text-pretty">{data.title}</h1>
		</a>
		<div class="flex justify-center gap-x-1 pt-1 text-xs text-foreground/60">
			<span>{dayjs(data.published_at).format('MMMM D, YYYY')}</span>
			<span>-</span>
			<span>{dayjs(data.published_at).format('h:mm A')}</span>
			<span>-</span>
			<span>{data.reading_time} minutes read</span>
		</div>
		<span class="mt-1 rounded-md bg-primary/20 px-2 py-0.5 text-xs">{data.feed.category.title}</span
		>

		<hr class="my-4 h-[0.5px] w-full max-w-md bg-border/25" />
		<div
			class="prose prose-lg prose-neutral dark:prose-invert prose-img:rounded-lg prose-img:shadow-sm"
		>
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html xss(data.content, {
				whiteList: {
					...wl,
					iframe: ['src', 'frameborder', 'allowfullscreen', 'sandbox', 'loading']
				}
			})}
		</div>
	</div>
{/if}
