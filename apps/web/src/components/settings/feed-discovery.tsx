'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { feedDiscoveryQueryOptions, type DiscoveredFeed } from '@/lib/queries/feed-discovery-query';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import { PlusIcon, GlobeIcon } from 'lucide-react';

interface FeedDiscoveryProps {
	onSelectFeed: (feedUrl: string) => void;
}

export function FeedDiscovery({ onSelectFeed }: FeedDiscoveryProps) {
	const [query, setQuery] = useState('');
	const [debouncedQuery, setDebouncedQuery] = useState('');

	// Debounce search input (500ms)
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedQuery(query);
		}, 500);
		return () => clearTimeout(timer);
	}, [query]);

	// React Query for discovery
	const {
		data: feeds,
		isLoading,
		error
	} = useQuery(
		feedDiscoveryQueryOptions(debouncedQuery, true) // skipCrawl=true for faster cached results
	);

	// Extract seconds from rate limit error message
	const getRateLimitSeconds = (errorMessage: string): number | null => {
		const match = errorMessage.match(/wait (\d+) seconds/);
		return match ? parseInt(match[1]) : null;
	};

	return (
		<div className="space-y-4">
			{/* Search Input */}
			<Input
				placeholder="Enter website URL (e.g., theverge.com)"
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				disabled={isLoading}
			/>

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

			{/* Loading State */}
			{isLoading && (
				<div className="flex items-center justify-center py-8">
					<Spinner />
					<span className="ml-2 text-muted-foreground">Searching...</span>
				</div>
			)}

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
			{feeds && feeds.length > 0 && (
				<div className="space-y-2">
					<p className="text-sm font-medium">Found {feeds.length} feeds:</p>
					{feeds.map((feed) => (
						<FeedDiscoveryCard key={feed.feedUrl} feed={feed} onSelect={onSelectFeed} />
					))}
				</div>
			)}

			{/* No Results */}
			{feeds && feeds.length === 0 && !isLoading && debouncedQuery && (
				<div className="rounded-lg border bg-muted p-4">
					<p className="text-sm text-muted-foreground">
						No feeds found for this URL. The website may not have RSS feeds or they may be hidden.
					</p>
				</div>
			)}

			{/* Empty State */}
			{!debouncedQuery && !isLoading && (
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
			className="cursor-pointer rounded-lg border p-4 transition-colors hover:bg-accent"
			onClick={() => onSelect(feed.feedUrl)}
		>
			<div className="flex items-start gap-3">
				{/* Favicon */}
				{feed.favicon ? (
					<img src={feed.favicon} alt="" className="h-6 w-6 rounded" />
				) : (
					<div className="flex h-6 w-6 items-center justify-center rounded bg-muted">
						<GlobeIcon className="h-4 w-4 text-muted-foreground" />
					</div>
				)}

				{/* Content */}
				<div className="min-w-0 flex-1">
					<h4 className="truncate font-medium">{feed.title}</h4>
					{feed.description && (
						<p className="mt-1 truncate text-sm text-muted-foreground">{feed.description}</p>
					)}
					<div className="mt-2 flex gap-2 text-xs text-muted-foreground">
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
					className="shrink-0"
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
