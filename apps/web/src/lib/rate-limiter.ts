/**
 * Simple in-memory rate limiter using sliding window algorithm
 * Used to prevent API spam for feed discovery and other operations
 */

interface RateLimitEntry {
	timestamps: number[];
}

export class RateLimiter {
	private requests: Map<string, RateLimitEntry> = new Map();
	private cleanupInterval: NodeJS.Timeout | null = null;
	private maxEntries: number;

	constructor(cleanupIntervalMs: number = 5 * 60 * 1000, maxEntries: number = 10000) {
		this.maxEntries = maxEntries;
		this.startCleanup(cleanupIntervalMs);
	}

	/**
	 * Check if a request is allowed based on rate limits
	 * @param key - Unique identifier for the rate limit (e.g., userId + operation)
	 * @param maxRequests - Maximum requests allowed in the window
	 * @param windowMs - Time window in milliseconds
	 * @returns true if request is allowed, false if rate limit exceeded
	 */
	checkLimit(key: string, maxRequests: number, windowMs: number): boolean {
		const now = Date.now();
		const entry = this.requests.get(key);

		if (!entry) {
			// Enforce max entries limit to prevent memory leak
			if (this.requests.size >= this.maxEntries) {
				this.evictOldestEntry();
			}
			this.requests.set(key, { timestamps: [now] });
			return true;
		}

		// Filter out timestamps outside the window
		const validTimestamps = entry.timestamps.filter((timestamp) => now - timestamp < windowMs);

		if (validTimestamps.length >= maxRequests) {
			// Update entry with filtered timestamps
			entry.timestamps = validTimestamps;
			return false;
		}

		// Add current timestamp and update entry
		validTimestamps.push(now);
		entry.timestamps = validTimestamps;
		return true;
	}

	/**
	 * Evict the oldest entry when max entries limit is reached
	 */
	private evictOldestEntry(): void {
		let oldestKey: string | null = null;
		let oldestTimestamp = Infinity;

		for (const [key, entry] of this.requests.entries()) {
			if (entry.timestamps.length > 0) {
				const minTimestamp = Math.min(...entry.timestamps);
				if (minTimestamp < oldestTimestamp) {
					oldestTimestamp = minTimestamp;
					oldestKey = key;
				}
			}
		}

		if (oldestKey) {
			this.requests.delete(oldestKey);
		}
	}

	/**
	 * Get the time until the rate limit resets (when oldest request expires)
	 * @param key - Unique identifier for the rate limit
	 * @param windowMs - Time window in milliseconds
	 * @returns milliseconds until reset, or 0 if not limited
	 */
	getResetTime(key: string, windowMs: number): number {
		const entry = this.requests.get(key);
		if (!entry || entry.timestamps.length === 0) {
			return 0;
		}

		const now = Date.now();
		const oldestTimestamp = Math.min(...entry.timestamps);
		const resetTime = oldestTimestamp + windowMs - now;

		return Math.max(0, resetTime);
	}

	/**
	 * Clear all rate limit entries
	 */
	clear(): void {
		this.requests.clear();
	}

	/**
	 * Clear rate limit for a specific key
	 */
	clearKey(key: string): void {
		this.requests.delete(key);
	}

	/**
	 * Start periodic cleanup of expired entries
	 */
	private startCleanup(intervalMs: number): void {
		this.cleanupInterval = setInterval(() => {
			this.cleanupExpired();
		}, intervalMs);
	}

	/**
	 * Cleanup expired entries to prevent memory leak
	 */
	private cleanupExpired(): void {
		const now = Date.now();
		// Use the maximum window we expect (1 minute for feed discovery)
		const maxWindowMs = 60 * 1000;

		for (const [key, entry] of this.requests.entries()) {
			const validTimestamps = entry.timestamps.filter((timestamp) => now - timestamp < maxWindowMs);

			if (validTimestamps.length === 0) {
				this.requests.delete(key);
			} else {
				entry.timestamps = validTimestamps;
			}
		}
	}

	/**
	 * Stop the cleanup interval (for cleanup on server shutdown)
	 */
	stopCleanup(): void {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
			this.cleanupInterval = null;
		}
	}
}

// Global rate limiter instance for feed discovery
export const feedDiscoveryRateLimiter = new RateLimiter();

// Default rate limit configuration for feed discovery
export const FEED_DISCOVERY_RATE_LIMIT = {
	maxRequests: 10, // 10 requests per minute per user
	windowMs: 60 * 1000 // 1 minute window
};
