<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<div class="container mx-auto py-4">
	{#if data.isAuthenticated}
		<h1 class="px-2 text-2xl font-semibold">Welcome to Reefrac</h1>
		{#if data.user}
			<p class="px-2 py-2">Logged in as: {data.user.username}</p>
		{/if}
		<div class="flex items-center gap-x-3 p-2">
			<a
				href="/unread"
				class="rounded-md border border-foreground/20 px-2 py-0.5 hover:bg-foreground/10"
				>Go to My Feeeds</a
			>
			<form method="POST" action="?/logout">
				<button
					type="submit"
					class="rounded-md border border-foreground/20 px-2 py-0.5 hover:bg-foreground/10"
				>
					Logout
				</button>
			</form>
		</div>
	{:else}
		<h1 class="px-2 text-2xl font-semibold">Welcome to Reefrac</h1>
		<div class="py-2">
			<a
				href="/login"
				class="rounded-md border border-foreground/20 px-2 py-0.5 hover:bg-foreground/10"
			>
				Login with Miniflux
			</a>
		</div>
		<p class="px-2 py-4 text-foreground/80">
			Please login with your Miniflux server URL and API token to access your RSS feeds.
		</p>
	{/if}
</div>
