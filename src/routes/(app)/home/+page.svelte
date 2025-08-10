<script>
	import { page } from '$app/state';
	import RenderContent from '$lib/components/render-content.svelte';

	const params = $derived(page.url.searchParams.get('entry'));
</script>

<div>
	{#if !!params}
		<RenderContent />
	{:else}
		<h2 class="mt-4 text-center text-lg font-semibold">Welcome to the Reafrac!</h2>
	{/if}
</div>
