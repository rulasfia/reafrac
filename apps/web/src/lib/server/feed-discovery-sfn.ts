import { createServerFn } from '@tanstack/react-start';
import * as z from 'zod/mini';
import { authFnMiddleware } from '../middleware/auth-middleware';
import { sentryMiddleware } from '../middleware/sentry-middleware';
import * as Sentry from '@sentry/tanstackstart-react';
import { ofetch } from 'ofetch';
import { SimpleCache } from '../cache';
import { feedDiscoveryRateLimiter, FEED_DISCOVERY_RATE_LIMIT } from '../rate-limiter';

// Cache for discovered feeds (5 minute TTL)
const feedDiscoveryCache = new SimpleCache<DiscoveredFeed[]>(5 * 60 * 1000);

// Schema for discovered feed
export interface DiscoveredFeed {
	feedUrl: string;
	siteUrl: string;
	title: string;
	description: string;
	favicon?: string;
	itemCount?: number;
	lastUpdated?: Date;
	isPodcast: boolean;
	version: string;
}

// Feedsearch.dev API response format
interface FeedsearchResponse {
	url: string; // Always present in valid responses
	title?: string;
	description?: string;
	site_url?: string;
	site_name?: string;
	favicon?: string;
	is_podcast?: boolean;
	item_count?: number;
	last_updated?: string;
	version?: string;
}

/**
 * Normalize URL - ensure it has a scheme and sanitize input
 */
function normalizeUrl(query: string): string {
	// Trim whitespace and remove potentially dangerous characters
	const trimmed = query.trim();
	const sanitized = trimmed.replace(/[\r\n\t]/g, '');

	// If already has scheme, return as is
	if (sanitized.startsWith('http://') || sanitized.startsWith('https://')) {
		return sanitized;
	}

	// Add https:// prefix
	return `https://${sanitized}`;
}

/**
 * Parse Feedsearch API response and transform to DiscoveredFeed
 */
function parseFeedsearchResponse(response: FeedsearchResponse[]): DiscoveredFeed[] {
	return response.map((feed) => ({
		feedUrl: feed.url,
		siteUrl: feed.site_url || '',
		title: feed.title || feed.site_name || 'Untitled Feed',
		description: feed.description || '',
		favicon: feed.favicon,
		itemCount: feed.item_count,
		lastUpdated: feed.last_updated ? new Date(feed.last_updated) : undefined,
		isPodcast: feed.is_podcast || false,
		version: feed.version || 'unknown'
	}));
}

/**
 * Discover RSS feeds for a given URL/domain using Feedsearch.dev API
 * Implements rate limiting and caching to prevent API spam
 */
export const discoverFeedsServerFn = createServerFn({ method: 'GET' })
	.middleware([sentryMiddleware, authFnMiddleware])
	.inputValidator(
		z.object({
			query: z.string(),
			skipCrawl: z.optional(z.boolean())
		})
	)
	.handler(async ({ data, context }) => {
		return Sentry.startSpan(
			{
				op: 'server_function',
				name: 'discoverFeeds'
			},
			async (span) => {
				let normalizedQuery = '';

				try {
					span.setAttribute('user_id', context.user.id);
					span.setAttribute('query', data.query);

					// 1. Rate limit check
					const rateLimitKey = `${context.user.id}:feed-discovery`;
					const allowed = feedDiscoveryRateLimiter.checkLimit(
						rateLimitKey,
						FEED_DISCOVERY_RATE_LIMIT.maxRequests,
						FEED_DISCOVERY_RATE_LIMIT.windowMs
					);

					if (!allowed) {
						const resetTime = feedDiscoveryRateLimiter.getResetTime(
							rateLimitKey,
							FEED_DISCOVERY_RATE_LIMIT.windowMs
						);
						const seconds = Math.ceil(resetTime / 1000);
						throw new Error(
							`Rate limit exceeded. Please wait ${seconds} seconds before searching again.`
						);
					}

					// 2. Normalize query (ensure URL format)
					normalizedQuery = normalizeUrl(data.query);
					span.setAttribute('normalized_url', normalizedQuery);

					// Validate URL format
					try {
						z.parse(z.url(), normalizedQuery);
					} catch {
						throw new Error('Invalid URL format. Please enter a valid website URL.');
					}

					// 3. Check cache
					const cacheKey = `feed-discovery:${normalizedQuery}`;
					const cachedFeeds = feedDiscoveryCache.get(cacheKey);

					if (cachedFeeds) {
						span.setAttribute('cache_hit', true);
						span.setAttribute('feeds_count', cachedFeeds.length);
						span.setAttribute('status', 'success');
						return cachedFeeds;
					}

					span.setAttribute('cache_hit', false);

					// 4. Call Feedsearch API
					const apiUrl = process.env.FEEDSEARCH_API_URL || 'https://feedsearch.dev/api/v1/search';

					span.setAttribute('api_url', apiUrl);

					const response = await ofetch<FeedsearchResponse[]>(apiUrl, {
						params: {
							url: normalizedQuery,
							info: true,
							favicon: false,
							skip_crawl: data.skipCrawl ?? false
						},
						timeout: 10000 // 10 second timeout
					});

					// 5. Parse and transform response
					const discoveredFeeds = parseFeedsearchResponse(response);

					span.setAttribute('feeds_count', discoveredFeeds.length);

					// 6. Cache results (5 minute TTL)
					feedDiscoveryCache.set(cacheKey, discoveredFeeds);

					// 7. Return feeds
					span.setAttribute('status', 'success');
					return discoveredFeeds;
				} catch (error) {
					span.setAttribute('status', 'error');

					// Handle different error types with generic messages for users
					let userMessage = 'Failed to discover feeds. Please check the URL and try again.';
					let shouldCaptureToSentry = true;

					// Don't capture rate limit errors to Sentry (expected behavior)
					if (error instanceof Error && error.message.includes('Rate limit')) {
						shouldCaptureToSentry = false;
						userMessage = error.message; // Preserve rate limit message with seconds
					}
					// Handle timeout errors
					else if (error instanceof Error && error.message.includes('timeout')) {
						userMessage = 'Request timed out. Please try again.';
					}
					// Handle network errors
					else if (error instanceof Error && error.message.includes('network')) {
						userMessage = 'Network error. Please check your connection and try again.';
					}
					// Handle invalid URL errors
					else if (error instanceof Error && error.message.includes('Invalid URL')) {
						userMessage = error.message; // Preserve user-friendly URL error
					}

					// Capture to Sentry if needed
					if (shouldCaptureToSentry && error instanceof Error) {
						Sentry.captureException(error, {
							tags: { function: 'discoverFeeds' },
							extra: {
								userId: context.user.id,
								query: data.query,
								normalizedQuery,
								errorMessage: error.message,
								errorStack: error.stack
							}
						});
					}

					// Throw error with user-friendly message
					throw new Error(userMessage);
				}
			}
		);
	});
