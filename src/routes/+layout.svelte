<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import favicon from '$lib/assets/favicon.ico';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Reafrac</title>
</svelte:head>

<ModeWatcher />
{@render children?.()}
