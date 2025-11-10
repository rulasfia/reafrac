export interface CacheEntry<T> {
	data: T;
	timestamp: number;
	ttl: number;
}

export class SimpleCache<T> {
	private cache = new Map<string, CacheEntry<T>>();
	private defaultTtl: number;

	constructor(defaultTtl: number = 5 * 60 * 1000) {
		this.defaultTtl = defaultTtl;
	}

	/**
	 * Get data from cache. Returns null if not found or expired.
	 */
	get(key: string): T | null {
		const entry = this.cache.get(key);

		if (!entry) {
			return null;
		}

		const now = Date.now();
		if (now - entry.timestamp > entry.ttl) {
			this.cache.delete(key);
			return null;
		}

		return entry.data;
	}

	/**
	 * Get data from cache with stale-while-revalidate support.
	 * Returns stale data if expired but within staleTtl, otherwise null.
	 */
	getWithStale(key: string, staleTtl?: number): { data: T; isStale: boolean } | null {
		const entry = this.cache.get(key);

		if (!entry) {
			return null;
		}

		const now = Date.now();
		const age = now - entry.timestamp;
		const isStale = age > entry.ttl;

		// Remove if too old (beyond stale TTL)
		const maxAge = staleTtl ? entry.ttl + staleTtl : entry.ttl * 3;
		if (age > maxAge) {
			this.cache.delete(key);
			return null;
		}

		return {
			data: entry.data,
			isStale
		};
	}

	/**
	 * Set data in cache with optional TTL (uses default TTL if not provided).
	 */
	set(key: string, data: T, ttl?: number): void {
		this.cache.set(key, {
			data,
			timestamp: Date.now(),
			ttl: ttl || this.defaultTtl
		});
	}

	/**
	 * Update existing cache entry or set new one.
	 */
	update(key: string, data: T, ttl?: number): void {
		this.set(key, data, ttl);
	}

	/**
	 * Remove specific entry from cache.
	 */
	remove(key: string): boolean {
		return this.cache.delete(key);
	}

	/**
	 * Clear all entries from cache.
	 */
	clear(): void {
		this.cache.clear();
	}

	/**
	 * Get cached data or fetch using provided function.
	 * Caches the result if fetch is successful.
	 */
	async getOrFetch(key: string, fetchFn: () => Promise<T>, ttl?: number): Promise<T> {
		const cached = this.get(key);

		if (cached !== null) {
			return cached;
		}

		const data = await fetchFn();
		this.set(key, data, ttl);
		return data;
	}

	/**
	 * Get cached data or fetch using provided function with stale-while-revalidate support.
	 * Returns stale data on fetch failure if within stale TTL.
	 */
	async getOrFetchWithStale(
		key: string,
		fetchFn: () => Promise<T>,
		options?: {
			ttl?: number;
			staleTtl?: number;
			onStaleUsed?: (data: T) => void;
		}
	): Promise<T> {
		const cached = this.getWithStale(key, options?.staleTtl);

		if (cached && !cached.isStale) {
			return cached.data;
		}

		try {
			const data = await fetchFn();
			this.set(key, data, options?.ttl);
			return data;
		} catch (error) {
			// If we have stale data, return it as fallback
			if (cached?.isStale) {
				options?.onStaleUsed?.(cached.data);
				return cached.data;
			}
			throw error;
		}
	}

	/**
	 * Clean up expired entries (optional manual cleanup).
	 */
	cleanup(): number {
		const now = Date.now();
		let removedCount = 0;

		for (const [key, entry] of this.cache.entries()) {
			if (now - entry.timestamp > entry.ttl * 3) {
				// Use 3x TTL as default max age
				this.cache.delete(key);
				removedCount++;
			}
		}

		return removedCount;
	}

	/**
	 * Get current cache size.
	 */
	get size(): number {
		return this.cache.size;
	}

	/**
	 * Check if key exists and is not expired.
	 */
	has(key: string): boolean {
		return this.get(key) !== null;
	}

	/**
	 * Check if key exists (including stale entries within max age).
	 */
	hasWithStale(key: string, staleTtl?: number): boolean {
		return this.getWithStale(key, staleTtl) !== null;
	}
}
