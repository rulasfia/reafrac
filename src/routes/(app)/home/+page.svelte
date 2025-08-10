<script lang="ts">
	import { browser } from '$app/environment';
	import { Button } from '$lib/components/ui/button';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let loading = $state(false);
	let markingAsRead = $state<number | null>(null);

	async function handleMarkAsRead(entryId: number) {
		markingAsRead = entryId;
		try {
			// We need to get the URL and token from cookies since they're not available in the component
			const response = await fetch('/api/mark-read', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ entryId })
			});

			if (response.ok) {
				// Refresh the page to show updated entries
				window.location.reload();
			} else {
				throw new Error('Failed to mark as read');
			}
		} catch (error) {
			console.error('Failed to mark as read:', error);
		} finally {
			markingAsRead = null;
		}
	}

	async function handleMarkAllAsRead() {
		loading = true;
		try {
			// We need to get the URL and token from cookies since they're not available in the component
			const response = await fetch('/api/mark-all-read', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (response.ok) {
				// Refresh the page to show updated entries
				window.location.reload();
			} else {
				throw new Error('Failed to mark all as read');
			}
		} catch (error) {
			console.error('Failed to mark all as read:', error);
		} finally {
			loading = false;
		}
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function stripHtml(html: string) {
		if (browser) {
			const tmp = document.createElement('div');
			tmp.innerHTML = html;
			return tmp.textContent || tmp.innerText || '';
		}
		return '';
	}
</script>

<div class="container mx-auto py-4">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold">All Feed</h1>
		{#if data.data.entries.length > 0}
			<Button onclick={handleMarkAllAsRead} disabled={loading}>
				{loading ? 'Marking all as read...' : 'Mark all as read'}
			</Button>
		{/if}
	</div>

	{#if data.error}
		<div class="mb-4 rounded-md bg-red-50 p-4 text-red-700">
			<p>{data.error}</p>
		</div>
	{/if}

	{#if data.data.entries.length === 0}
		<div class="rounded-md bg-gray-50 p-8 text-center">
			<p class="text-gray-600">No entries found.</p>
			<p class="mt-2 text-sm text-gray-500">Great job! You're all caught up.</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each data.data.entries as entry (entry.id)}
				<article class="rounded-md border bg-white p-4">
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<h2 class="mb-2 text-lg font-semibold">
								<a
									href={entry.url}
									target="_blank"
									rel="noopener noreferrer"
									class="text-blue-600 hover:text-blue-800 hover:underline"
								>
									{entry.title}
								</a>
							</h2>
							<div class="mb-2 flex items-center gap-4 text-sm text-gray-600">
								<span class="font-medium">{entry.feed.title}</span>
								<span>•</span>
								<span>{formatDate(entry.published_at)}</span>
								{#if entry.author}
									<span>•</span>
									<span>by {entry.author}</span>
								{/if}
								{#if entry.reading_time > 0}
									<span>•</span>
									<span>{entry.reading_time} min read</span>
								{/if}
							</div>
							<p class="text-gray-700">
								{stripHtml(entry.content).substring(0, 200)}
								{stripHtml(entry.content).length > 200 ? '...' : ''}
							</p>
						</div>
						<div class="ml-4 flex flex-col gap-2">
							<Button
								variant="outline"
								size="sm"
								onclick={() => handleMarkAsRead(entry.id)}
								disabled={markingAsRead === entry.id}
							>
								{markingAsRead === entry.id ? 'Marking...' : 'Mark as read'}
							</Button>
							<a
								href={entry.url}
								target="_blank"
								rel="noopener noreferrer"
								class="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
							>
								Read
							</a>
						</div>
					</div>
				</article>
			{/each}
		</div>

		<!-- Pagination -->
		{#if data.pagination.totalPages > 1}
			<div class="mt-8 flex items-center justify-between">
				<div class="text-sm text-gray-600">
					Showing {data.data.entries.length} of {data.data.total} entries
				</div>
				<div class="flex gap-2">
					{#if data.pagination.hasPrev}
						<a
							href="?page={data.pagination.currentPage - 1}"
							class="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
						>
							Previous
						</a>
					{/if}
					<span class="px-3 py-1 text-sm text-gray-600">
						Page {data.pagination.currentPage} of {data.pagination.totalPages}
					</span>
					{#if data.pagination.hasNext}
						<a
							href="?page={data.pagination.currentPage + 1}"
							class="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
						>
							Next
						</a>
					{/if}
				</div>
			</div>
		{/if}
	{/if}
</div>
