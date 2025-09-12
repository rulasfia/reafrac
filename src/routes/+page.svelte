<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<div class="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
	<div class="container mx-auto max-w-7xl px-4 py-16">
		<header class="mb-12 text-center">
			<div class="mb-6 inline-flex items-center justify-center rounded-full bg-primary/10 p-4 backdrop-blur-sm">
				<div class="text-4xl">📡</div>
			</div>
			<h1 class="mb-4 text-5xl font-bold tracking-tight md:text-6xl">
				<span class="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
					Reafrac
				</span>
			</h1>
			<p class="mx-auto max-w-3xl text-xl text-foreground/90 md:text-2xl">
				The modern, open-source RSS reader that puts you in control
			</p>
			<div class="mt-6 flex items-center justify-center gap-2 text-sm text-foreground/70">
				<div class="flex items-center gap-1">
					<span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
					<span>Built with Svelte 5</span>
				</div>
				<span>•</span>
				<div class="flex items-center gap-1">
					<span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
					<span>Cloudflare Optimized</span>
				</div>
				<span>•</span>
				<div class="flex items-center gap-1">
					<span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
					<span>Miniflux Powered</span>
				</div>
			</div>
		</header>

		<main>
			{#if data.isAuthenticated}
				<section class="mb-12 text-center">
					<div
						class="mb-6 inline-flex items-center justify-center rounded-full bg-green-100 px-4 py-2 dark:bg-green-900/20"
					>
						<span class="text-sm font-medium text-green-700 dark:text-green-300">✓ Connected</span>
					</div>
					<h2 class="mb-4 text-3xl font-semibold">Welcome back!</h2>
					{#if data.user}
						<p class="mb-8 text-lg text-foreground/80">
							Logged in as <span class="font-mono font-semibold">{data.user.username}</span>
						</p>
					{/if}
					<div class="flex flex-col justify-center gap-4 sm:flex-row">
						<a
							href="/home"
							class="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
						>
							View My Feeds
							<span class="ml-2">→</span>
						</a>
						<form method="POST" action="?/logout">
							<button
								type="submit"
								class="inline-flex items-center justify-center rounded-lg border border-foreground/20 px-8 py-3 font-medium transition-colors hover:bg-foreground/10"
							>
								Logout
							</button>
						</form>
					</div>
				</section>
			{:else}
				<section class="mb-16 text-center">
					<h2 class="mb-6 text-3xl font-semibold md:text-4xl">
						Read the web, <span class="text-primary">your way</span>
					</h2>
					<p class="mx-auto mb-10 max-w-4xl text-lg text-foreground/80 md:text-xl">
						Reafrac delivers a clean, lightning-fast RSS experience powered by Svelte 5. 
						Connect to your Miniflux server and enjoy reading without distractions. 
						Perfect for developers who appreciate clean code and readers who love clean content.
					</p>
					<div class="flex flex-col justify-center gap-4 sm:flex-row">
						<a
							href="/login"
							class="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-4 font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105 shadow-lg"
						>
							Get Started
							<span class="ml-2">→</span>
						</a>
						<a
							href="https://github.com"
							target="_blank"
							rel="noopener"
							class="inline-flex items-center justify-center rounded-lg border border-foreground/20 px-8 py-4 font-medium transition-all hover:bg-foreground/10 hover:scale-105"
						>
							<svg class="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
								<path
									d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
								/>
							</svg>
							View on GitHub
						</a>
					</div>
				</section>

				<section class="mb-16">
					<h3 class="mb-12 text-center text-3xl font-semibold">Why you'll love Reafrac</h3>
					<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						<div class="group rounded-lg border border-foreground/10 bg-card p-6 text-center transition-all hover:shadow-lg hover:scale-105">
							<div class="mb-4 text-4xl">⚡</div>
							<h4 class="mb-2 font-semibold">Lightning Fast</h4>
							<p class="text-sm text-foreground/70">
								Built with Svelte 5 for optimal performance. Minimal JavaScript, maximum speed.
							</p>
						</div>
						<div class="group rounded-lg border border-foreground/10 bg-card p-6 text-center transition-all hover:shadow-lg hover:scale-105">
							<div class="mb-4 text-4xl">🛠️</div>
							<h4 class="mb-2 font-semibold">Developer Friendly</h4>
							<p class="text-sm text-foreground/70">
								TypeScript, strict mode, and clean architecture. Easy to extend and customize.
							</p>
						</div>
						<div class="group rounded-lg border border-foreground/10 bg-card p-6 text-center transition-all hover:shadow-lg hover:scale-105">
							<div class="mb-4 text-4xl">🔧</div>
							<h4 class="mb-2 font-semibold">Miniflux Powered</h4>
							<p class="text-sm text-foreground/70">
								Seamlessly integrates with your Miniflux server for reliable feed management.
							</p>
						</div>
						<div class="group rounded-lg border border-foreground/10 bg-card p-6 text-center transition-all hover:shadow-lg hover:scale-105">
							<div class="mb-4 text-4xl">📱</div>
							<h4 class="mb-2 font-semibold">Beautiful on Any Device</h4>
							<p class="text-sm text-foreground/70">
								Works beautifully on desktop, tablet, and mobile devices.
							</p>
						</div>
						<div class="group rounded-lg border border-foreground/10 bg-card p-6 text-center transition-all hover:shadow-lg hover:scale-105">
							<div class="mb-4 text-4xl">🔓</div>
							<h4 class="mb-2 font-semibold">Truly Open Source</h4>
							<p class="text-sm text-foreground/70">
								Fully open source with MIT license. Fork, customize, and contribute.
							</p>
						</div>
						<div class="group rounded-lg border border-foreground/10 bg-card p-6 text-center transition-all hover:shadow-lg hover:scale-105">
							<div class="mb-4 text-4xl">🚀</div>
							<h4 class="mb-2 font-semibold">Future Ready</h4>
							<p class="text-sm text-foreground/70">
								Planned standalone mode, offline support, and enhanced mobile experience.
							</p>
						</div>
					</div>
				</section>

				<section class="mb-16 rounded-lg bg-gradient-to-r from-muted/20 to-muted/40 p-8 backdrop-blur-sm">
					<h3 class="mb-8 text-center text-3xl font-semibold">Powered by Modern Technology</h3>
					<div class="flex flex-wrap justify-center gap-4">
						<div class="flex items-center gap-2 rounded-full bg-background px-4 py-2 font-medium shadow-sm">
							<span class="text-primary">Svelte 5</span>
						</div>
						<div class="flex items-center gap-2 rounded-full bg-background px-4 py-2 font-medium shadow-sm">
							<span class="text-primary">TypeScript</span>
						</div>
						<div class="flex items-center gap-2 rounded-full bg-background px-4 py-2 font-medium shadow-sm">
							<span class="text-primary">Tailwind CSS v4</span>
						</div>
						<div class="flex items-center gap-2 rounded-full bg-background px-4 py-2 font-medium shadow-sm">
							<span class="text-primary">Shadcn/ui</span>
						</div>
						<div class="flex items-center gap-2 rounded-full bg-background px-4 py-2 font-medium shadow-sm">
							<span class="text-primary">TanStack Query</span>
						</div>
						<div class="flex items-center gap-2 rounded-full bg-background px-4 py-2 font-medium shadow-sm">
							<span class="text-primary">Cloudflare Workers</span>
						</div>
						<div class="flex items-center gap-2 rounded-full bg-background px-4 py-2 font-medium shadow-sm">
							<span class="text-primary">Miniflux API</span>
						</div>
					</div>
				</section>

				<section class="border-t border-foreground/10 pt-12 text-center">
					<h3 class="mb-4 text-2xl font-semibold">Ready to get started?</h3>
					<p class="mb-6 text-lg text-foreground/80">
						Connect your Miniflux server and start reading in seconds.
					</p>
					<div class="space-y-4">
						<a
							href="/login"
							class="inline-block rounded-lg bg-primary px-8 py-3 font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105 shadow-lg"
						>
							Connect to Miniflux
						</a>
						<p class="text-sm text-foreground/60">
							New to Miniflux?
							<a
								href="https://miniflux.app"
								target="_blank"
								rel="noopener"
								class="font-medium underline hover:text-foreground"
							>
								Set up your server
							</a>
						</p>
					</div>
				</section>
			{/if}
		</main>
	</div>
</div>
