<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let form = $state({
		url: data.savedCredentials?.url || '',
		token: data.savedCredentials?.token || '',
		error: ''
	});
	let loading = $state(false);

	$effect(() => {
		if (data.savedCredentials) {
			form.url = data.savedCredentials.url;
			form.token = data.savedCredentials.token;
		}
	});
</script>

<main class="container mx-auto max-w-md py-4">
	<h1 class="mb-6 text-2xl font-bold">Miniflux Login</h1>

	<form method="POST" class="space-y-4">
		<div class="space-y-2">
			<Label for="url">Miniflux Server URL</Label>
			<Input
				id="url"
				name="url"
				type="text"
				bind:value={form.url}
				placeholder="https://miniflux.example.com"
				required
			/>
		</div>

		<div class="space-y-2">
			<Label for="token">API Token</Label>
			<Input
				id="token"
				name="token"
				type="password"
				bind:value={form.token}
				placeholder="Your Miniflux API token"
				required
			/>
		</div>

		{#if form.error}
			<div class="text-sm text-red-500">{form.error}</div>
		{/if}

		<Button type="submit" disabled={loading}>
			{loading ? 'Authenticating...' : 'Login'}
		</Button>
	</form>

	<div class="mt-6 text-sm text-gray-600">
		<h2 class="mb-2 font-medium">How to get your API token:</h2>
		<ol class="list-inside list-decimal space-y-1">
			<li>Log into your Miniflux instance</li>
			<li>Go to Settings → API Keys</li>
			<li>Create a new API key or use an existing one</li>
			<li>Copy the token and paste it above</li>
		</ol>
	</div>
</main>
