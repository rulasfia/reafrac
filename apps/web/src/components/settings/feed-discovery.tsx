'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { feedDiscoveryQueryOptions, type DiscoveredFeed } from '@/lib/queries/feed-discovery-query';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import { PlusIcon, GlobeIcon, SearchIcon } from 'lucide-react';
import { Field, FieldError, FieldLabel } from '../ui/field';
import { Form } from '../ui/form';

interface FeedDiscoveryProps {
	onSelectFeed: (feedUrl: string) => void;
}

export function FeedDiscovery({ onSelectFeed }: FeedDiscoveryProps) {
	const [query, setQuery] = useState('');
	const [searchQuery, setSearchQuery] = useState('');
	const [isSearching, setIsSearching] = useState(false);

	// React Query for discovery
	const {
		data: feeds,
		isLoading,
		error,
		refetch
	} = useQuery({
		...feedDiscoveryQueryOptions(searchQuery, true),
		enabled: false // Don't auto-fetch, only fetch on manual trigger
	});

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!query.trim()) return;

		setIsSearching(true);
		setSearchQuery(query);
		try {
			await refetch();
		} finally {
			setIsSearching(false);
		}
	};

	// Extract seconds from rate limit error message
	const getRateLimitSeconds = (errorMessage: string): number | null => {
		const match = errorMessage.match(/wait (\d+) seconds/);
		return match ? parseInt(match[1]) : null;
	};

	// Limit number of feeds displayed
	const MAX_FEEDS = 10;
	const displayedFeeds = feeds?.slice(0, MAX_FEEDS);
	const hasMoreFeeds = feeds && feeds.length > MAX_FEEDS;

	return (
		<div className="space-y-4">
			{/* Search Form */}
			<Form onSubmit={handleSubmit}>
				<Field name="discoveryUrl">
					<FieldLabel>Website URL</FieldLabel>
					<div className="flex w-full flex-col items-end gap-2 sm:flex-row sm:items-center">
						<Input
							className="w-full"
							placeholder="domain.com"
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							disabled={isSearching}
						/>

						{isSearching ? (
							<Button
								className="w-full sm:w-fit"
								variant="outline"
								type="submit"
								disabled={isSearching}
							>
								<Spinner /> Searching...
							</Button>
						) : (
							<Button
								className="w-full sm:w-fit"
								variant="outline"
								type="submit"
								disabled={!query.trim() || isSearching}
							>
								<SearchIcon /> Discover Feeds
							</Button>
						)}
					</div>
					<FieldError />
				</Field>
			</Form>

			{/* Attribution Link */}
			<p className="text-xs text-muted-foreground">
				Powered by{' '}
				<a
					href="https://feedsearch.dev"
					target="_blank"
					rel="noopener noreferrer"
					className="underline hover:text-foreground"
				>
					Feedsearch
				</a>
			</p>

			{/* Error State */}
			{error && (
				<div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
					{error instanceof Error && error.message.includes('Rate limit') ? (
						<div className="space-y-2">
							<p className="font-medium text-destructive">Too many searches</p>
							<p className="text-sm text-muted-foreground">
								Please wait {getRateLimitSeconds(error.message) ?? 60} seconds before searching
								again.
							</p>
						</div>
					) : (
						<p className="text-sm text-destructive">
							Failed to discover feeds. Please check the URL and try again.
						</p>
					)}
				</div>
			)}

			{/* Results */}
			{displayedFeeds && displayedFeeds.length > 0 && (
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<p className="text-sm font-medium">
							Found {feeds?.length} feed{feeds && feeds.length !== 1 ? 's' : ''}
						</p>
						{hasMoreFeeds && (
							<p className="text-xs text-muted-foreground">Showing top {MAX_FEEDS}</p>
						)}
					</div>
					<div className="max-h-80 space-y-2 overflow-y-auto pr-1">
						{displayedFeeds.map((feed) => (
							<FeedDiscoveryCard key={feed.feedUrl} feed={feed} onSelect={onSelectFeed} />
						))}
					</div>
				</div>
			)}

			{/* No Results */}
			{feeds && feeds.length === 0 && !isSearching && searchQuery && (
				<div className="rounded-lg border bg-muted p-4">
					<p className="text-sm text-muted-foreground">
						No feeds found for this URL. The website may not have RSS feeds or they may be hidden.
					</p>
				</div>
			)}

			{/* Empty State */}
			{!searchQuery && !isSearching && (
				<div className="rounded-lg border bg-muted p-6 text-center">
					<GlobeIcon className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
					<p className="text-sm text-muted-foreground">
						Enter a website URL to discover available RSS feeds
					</p>
				</div>
			)}
		</div>
	);
}

interface FeedDiscoveryCardProps {
	feed: DiscoveredFeed;
	onSelect: (feedUrl: string) => void;
}

function FeedDiscoveryCard({ feed, onSelect }: FeedDiscoveryCardProps) {
	return (
		<div
			className="cursor-pointer rounded-lg border p-3 transition-colors hover:bg-accent"
			onClick={() => onSelect(feed.feedUrl)}
		>
			<div className="flex items-start gap-3">
				{/* Favicon */}
				<div className="shrink-0">
					{feed.favicon ? (
						<img src={feed.favicon} alt={`${feed.title} favicon`} className="h-6 w-6 rounded" />
					) : (
						<div className="flex h-6 w-6 items-center justify-center rounded bg-muted">
							<GlobeIcon className="h-4 w-4 text-muted-foreground" />
						</div>
					)}
				</div>

				{/* Content */}
				<div className="min-w-0 flex-1 overflow-hidden">
					<h4 className="truncate text-sm font-medium">{feed.title}</h4>
					{feed.description && (
						<p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{feed.description}</p>
					)}
					<div className="mt-1.5 flex flex-wrap gap-2 text-xs text-muted-foreground">
						{feed.itemCount && <span>{feed.itemCount} items</span>}
						{feed.isPodcast && (
							<span className="rounded bg-primary/10 px-1.5 py-0.5 font-medium text-primary">
								Podcast
							</span>
						)}
					</div>
				</div>

				{/* Action */}
				<Button
					variant="ghost"
					size="sm"
					className="h-8 w-8 shrink-0 p-0"
					onClick={(e) => {
						e.stopPropagation();
						onSelect(feed.feedUrl);
					}}
				>
					<PlusIcon className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}
