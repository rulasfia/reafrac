<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import { NuqsAdapter } from 'nuqs-svelte/adapters/svelte-kit';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	import { browser } from '$app/environment';
	import favicon from '$lib/assets/favicon.ico';
	import '../app.css';

	let { children } = $props();

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { enabled: browser, retry: 2, refetchOnWindowFocus: false }
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Reafrac</title>
</svelte:head>

<ModeWatcher />
<QueryClientProvider client={queryClient}>
	<NuqsAdapter>
		{@render children?.()}
	</NuqsAdapter>
	<SvelteQueryDevtools />
</QueryClientProvider>
