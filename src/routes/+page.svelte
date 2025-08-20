<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<div class="container mx-auto max-w-4xl py-8">
	<header class="mb-12 text-center">
		<h1 class="mb-4 text-4xl font-bold">Reafrac</h1>
		<p class="text-xl text-foreground/70">A modern RSS reader for Miniflux</p>
	</header>

	<main>
		{#if data.isAuthenticated}
			<section class="mb-8 text-center">
				<h2 class="mb-4 text-2xl font-semibold">Welcome back!</h2>
				{#if data.user}
					<p class="mb-6 text-foreground/80">Logged in as: {data.user.username}</p>
				{/if}
				<div class="flex justify-center gap-4">
					<a
						href="/home"
						class="rounded-md border border-foreground/20 px-6 py-2 transition-colors hover:bg-foreground/10"
					>
						View My Feeds
					</a>
					<form method="POST" action="?/logout">
						<button
							type="submit"
							class="rounded-md border border-foreground/20 px-6 py-2 transition-colors hover:bg-foreground/10"
						>
							Logout
						</button>
					</form>
				</div>
			</section>
		{:else}
			<section class="mb-12 text-center">
				<h2 class="mb-6 text-2xl font-semibold">Read your RSS feeds with simplicity</h2>
				<p class="mx-auto mb-8 max-w-2xl text-foreground/80">
					Reafrac is a clean, fast RSS reader that integrates seamlessly with your Miniflux server.
					Access your feeds anywhere with a modern, responsive interface.
				</p>
				<a
					href="/login"
					class="inline-block rounded-md border border-foreground/20 px-8 py-3 transition-colors hover:bg-foreground/10"
				>
					Login with Miniflux
				</a>
			</section>

			<section class="mb-12 grid gap-8 md:grid-cols-3">
				<div class="text-center">
					<h3 class="mb-2 font-semibold">Fast & Simple</h3>
					<p class="text-sm text-foreground/70">
						Built with SvelteKit for optimal performance and minimal JavaScript
					</p>
				</div>
				<div class="text-center">
					<h3 class="mb-2 font-semibold">Miniflux Integration</h3>
					<p class="text-sm text-foreground/70">
						Seamlessly connects to your existing Miniflux server
					</p>
				</div>
				<div class="text-center">
					<h3 class="mb-2 font-semibold">Modern Design</h3>
					<p class="text-sm text-foreground/70">
						Clean, responsive interface that works on all devices
					</p>
				</div>
			</section>

			<section class="border-t border-foreground/10 pt-8 text-center">
				<h3 class="mb-4 font-semibold">Getting Started</h3>
				<p class="mb-4 text-foreground/80">
					You'll need your Miniflux server URL and API token to get started.
				</p>
				<p class="text-sm text-foreground/60">
					Don't have a Miniflux server?
					<a
						href="https://miniflux.app"
						target="_blank"
						rel="noopener"
						class="underline hover:text-foreground"
					>
						Learn more about Miniflux
					</a>
				</p>
				<p class="text-sm text-foreground/60">
					<a
						href="https://miniflux.app"
						target="_blank"
						rel="noopener"
						class="underline hover:text-foreground"
					>
						Learn more about Miniflux
					</a>
				</p>
			</section>
		{/if}
	</main>
</div>
