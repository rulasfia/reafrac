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

<div class="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
	<div class="container mx-auto max-w-md px-4 py-16">
		<div class="mb-6 text-center">
			<div class="mb-4 inline-flex items-center justify-center rounded-full bg-primary/10 p-3">
				<div class="text-3xl">📡</div>
			</div>
			<h1 class="mb-2 text-2xl font-bold tracking-tight">Connect to Miniflux</h1>
			<p class="text-foreground/70">Enter your server details to get started</p>
		</div>

		<div class="rounded-lg border border-foreground/10 bg-card p-8 shadow-sm">
			<form method="POST" class="space-y-6">
				<div class="space-y-2">
					<Label for="url" class="text-sm font-medium">Miniflux Server URL</Label>
					<Input
						id="url"
						name="url"
						type="text"
						bind:value={form.url}
						placeholder="https://miniflux.example.com"
						required
						class="h-11"
					/>
				</div>

				<div class="space-y-2">
					<Label for="token" class="text-sm font-medium">API Token</Label>
					<Input
						id="token"
						name="token"
						type="password"
						bind:value={form.token}
						placeholder="Your Miniflux API token"
						required
						class="h-11"
					/>
				</div>

				{#if form.error}
					<div class="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
						<p class="text-sm font-medium text-destructive">{form.error}</p>
					</div>
				{/if}

				<Button type="submit" disabled={loading} class="h-11 w-full font-medium">
					{#if loading}
						<div class="flex items-center justify-center gap-2">
							<div
								class="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
							></div>
							Connecting...
						</div>
					{:else}
						Connect to Server
					{/if}
				</Button>
			</form>
		</div>

		<div class="mt-8 rounded-lg bg-muted/30 p-6">
			<h2 class="mb-4 flex items-center gap-2 text-lg font-semibold">
				<span class="text-xl">🔑</span>
				How to get your API token
			</h2>
			<ol class="space-y-3 text-sm text-foreground/80">
				<li class="flex items-start gap-3">
					<span
						class="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary"
						>1</span
					>
					<span>Log into your Miniflux instance</span>
				</li>
				<li class="flex items-start gap-3">
					<span
						class="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary"
						>2</span
					>
					<span
						>Navigate to <span class="rounded bg-background px-1 font-mono"
							>Settings → API Keys</span
						></span
					>
				</li>
				<li class="flex items-start gap-3">
					<span
						class="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary"
						>3</span
					>
					<span>Create a new API key or use an existing one</span>
				</li>
				<li class="flex items-start gap-3">
					<span
						class="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary"
						>4</span
					>
					<span>Copy the token and paste it above</span>
				</li>
			</ol>
		</div>

		<div class="mt-8 text-center">
			<p class="text-sm text-foreground/60">
				Don't have a Miniflux server?
				<a
					href="https://miniflux.app"
					target="_blank"
					rel="noopener"
					class="font-medium text-primary hover:underline"
				>
					Learn more about Miniflux
				</a>
			</p>
		</div>

		<div class="mt-8 text-center">
			<a
				href="/"
				class="inline-flex items-center gap-2 text-sm text-foreground/60 transition-colors hover:text-foreground"
			>
				← Back to home
			</a>
		</div>
	</div>
</div>
