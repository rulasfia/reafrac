/**
 * TanStack Start Production Server with Bun
 *
 * A high-performance production server for TanStack Start applications that
 * implements intelligent static asset loading with configurable memory management.
 *
 * Features:
 * - Hybrid loading strategy (preload small files, serve large files on-demand)
 * - Configurable file filtering with include/exclude patterns
 * - Memory-efficient response generation
 * - Production-ready caching headers
 *
 * Environment Variables:
 *
 * PORT (number)
 *   - Server port number
 *   - Default: 3000
 *
 * ASSET_PRELOAD_MAX_SIZE (number)
 *   - Maximum file size in bytes to preload into memory
 *   - Files larger than this will be served on-demand from disk
 *   - Default: 5242880 (5MB)
 *   - Example: ASSET_PRELOAD_MAX_SIZE=5242880 (5MB)
 *
 * ASSET_PRELOAD_INCLUDE_PATTERNS (string)
 *   - Comma-separated list of glob patterns for files to include
 *   - If specified, only matching files are eligible for preloading
 *   - Patterns are matched against filenames only, not full paths
 *   - Example: ASSET_PRELOAD_INCLUDE_PATTERNS="*.js,*.css,*.woff2"
 *
 * ASSET_PRELOAD_EXCLUDE_PATTERNS (string)
 *   - Comma-separated list of glob patterns for files to exclude
 *   - Applied after include patterns
 *   - Patterns are matched against filenames only, not full paths
 *   - Example: ASSET_PRELOAD_EXCLUDE_PATTERNS="*.map,*.txt"
 *
 * ASSET_PRELOAD_VERBOSE_LOGGING (boolean)
 *   - Enable detailed logging of loaded and skipped files
 *   - Default: false
 *   - Set to "true" to enable verbose output
 *
 * ASSET_PRELOAD_ENABLE_ETAG (boolean)
 *   - Enable ETag generation for preloaded assets
 *   - Default: true
 *   - Set to "false" to disable ETag support
 *
 * ASSET_PRELOAD_ENABLE_GZIP (boolean)
 *   - Enable Gzip compression for eligible assets
 *   - Default: true
 *   - Set to "false" to disable Gzip compression
 *
 * ASSET_PRELOAD_GZIP_MIN_SIZE (number)
 *   - Minimum file size in bytes required for Gzip compression
 *   - Files smaller than this will not be compressed
 *   - Default: 1024 (1KB)
 *
 * ASSET_PRELOAD_GZIP_MIME_TYPES (string)
 *   - Comma-separated list of MIME types eligible for Gzip compression
 *   - Supports partial matching for types ending with "/"
 *   - Default: text/,application/javascript,application/json,application/xml,image/svg+xml
 *
 * ENABLE_FEED_CRON (boolean)
 *   - Enable scheduled feed refetch cron job
 *   - Default: false
 *   - Set to "true" to enable
 *
 * FEED_CRON_INTERVAL_MS (number)
 *   - Interval in milliseconds between feed refetch runs
 *   - Default: 1800000 (30 minutes)
 *
 * Usage:
 *   bun run server.ts
 */

import path from 'node:path';
import * as Sentry from '@sentry/tanstackstart-react';
import { refetchFeeds } from '@reafrac/external-script';
import { runMigrations } from '@reafrac/database';
import { createLogger, type Logger } from '@reafrac/logger';

const ENABLE_FEED_CRON = process.env.ENABLE_FEED_CRON === 'true';
const FEED_CRON_INTERVAL_MS = Number(process.env.FEED_CRON_INTERVAL_MS ?? 30 * 60 * 1000);

let feedCronRunning = false;

const SERVER_PORT = Number(process.env.PORT ?? 3000);
const CLIENT_DIRECTORY = './dist/client';
const SERVER_ENTRY_POINT = './dist/server/server.js';

const log: Logger = createLogger({ name: 'server' });

// Preloading configuration from environment variables
const MAX_PRELOAD_BYTES = Number(
	process.env.ASSET_PRELOAD_MAX_SIZE ?? 5 * 1024 * 1024 // 5MB default
);

// Parse comma-separated include patterns (no defaults)
const INCLUDE_PATTERNS = (process.env.ASSET_PRELOAD_INCLUDE_PATTERNS ?? '')
	.split(',')
	.map((s) => s.trim())
	.filter(Boolean)
	.map((pattern: string) => convertGlobToRegExp(pattern));

// Parse comma-separated exclude patterns (no defaults)
const EXCLUDE_PATTERNS = (process.env.ASSET_PRELOAD_EXCLUDE_PATTERNS ?? '')
	.split(',')
	.map((s) => s.trim())
	.filter(Boolean)
	.map((pattern: string) => convertGlobToRegExp(pattern));

// Verbose logging flag
const VERBOSE = process.env.ASSET_PRELOAD_VERBOSE_LOGGING === 'true';

// Optional ETag feature
const ENABLE_ETAG = (process.env.ASSET_PRELOAD_ENABLE_ETAG ?? 'true') === 'true';

// Optional Gzip feature
const ENABLE_GZIP = (process.env.ASSET_PRELOAD_ENABLE_GZIP ?? 'true') === 'true';
const GZIP_MIN_BYTES = Number(process.env.ASSET_PRELOAD_GZIP_MIN_SIZE ?? 1024); // 1KB
const GZIP_TYPES = (
	process.env.ASSET_PRELOAD_GZIP_MIME_TYPES ??
	'text/,application/javascript,application/json,application/xml,image/svg+xml'
)
	.split(',')
	.map((v) => v.trim())
	.filter(Boolean);

/**
 * Convert a simple glob pattern to a regular expression
 * Supports * wildcard for matching any characters
 */
function convertGlobToRegExp(globPattern: string): RegExp {
	// Escape regex special chars except *, then replace * with .*
	const escapedPattern = globPattern.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&').replace(/\*/g, '.*');
	return new RegExp(`^${escapedPattern}$`, 'i');
}

/**
 * Compute ETag for a given data buffer
 */
function computeEtag(data: Uint8Array): string {
	const hash = Bun.hash(data);
	return `W/"${hash.toString(16)}-${data.byteLength.toString()}"`;
}

/**
 * Metadata for preloaded static assets
 */
interface AssetMetadata {
	route: string;
	size: number;
	type: string;
}

/**
 * In-memory asset with ETag and Gzip support
 */
interface InMemoryAsset {
	raw: Uint8Array;
	gz?: Uint8Array;
	etag?: string;
	type: string;
	immutable: boolean;
	size: number;
}

/**
 * Result of static asset preloading process
 */
interface PreloadResult {
	routes: Record<string, (req: Request) => Response | Promise<Response>>;
	loaded: AssetMetadata[];
	skipped: AssetMetadata[];
}

/**
 * Check if a file is eligible for preloading based on configured patterns
 */
function isFileEligibleForPreloading(relativePath: string): boolean {
	const fileName = relativePath.split(/[/\\]/).pop() ?? relativePath;

	// If include patterns are specified, file must match at least one
	if (INCLUDE_PATTERNS.length > 0) {
		if (!INCLUDE_PATTERNS.some((pattern) => pattern.test(fileName))) {
			return false;
		}
	}

	// If exclude patterns are specified, file must not match any
	if (EXCLUDE_PATTERNS.some((pattern) => pattern.test(fileName))) {
		return false;
	}

	return true;
}

/**
 * Check if a MIME type is compressible
 */
function isMimeTypeCompressible(mimeType: string): boolean {
	return GZIP_TYPES.some((type) =>
		type.endsWith('/') ? mimeType.startsWith(type) : mimeType === type
	);
}

/**
 * Conditionally compress data based on size and MIME type
 */
function compressDataIfAppropriate(data: Uint8Array, mimeType: string): Uint8Array | undefined {
	if (!ENABLE_GZIP) return undefined;
	if (data.byteLength < GZIP_MIN_BYTES) return undefined;
	if (!isMimeTypeCompressible(mimeType)) return undefined;
	try {
		return Bun.gzipSync(data.buffer as ArrayBuffer);
	} catch {
		return undefined;
	}
}

/**
 * Create response handler function with ETag and Gzip support
 */
function createResponseHandler(asset: InMemoryAsset): (req: Request) => Response {
	return (req: Request) => {
		const headers: Record<string, string> = {
			'Content-Type': asset.type,
			'Cache-Control': asset.immutable
				? 'public, max-age=31536000, immutable'
				: 'public, max-age=3600'
		};

		if (ENABLE_ETAG && asset.etag) {
			const ifNone = req.headers.get('if-none-match');
			if (ifNone && ifNone === asset.etag) {
				return new Response(null, {
					status: 304,
					headers: { ETag: asset.etag }
				});
			}
			headers.ETag = asset.etag;
		}

		if (ENABLE_GZIP && asset.gz && req.headers.get('accept-encoding')?.includes('gzip')) {
			headers['Content-Encoding'] = 'gzip';
			headers['Content-Length'] = String(asset.gz.byteLength);
			const gzCopy = new Uint8Array(asset.gz);
			return new Response(gzCopy, { status: 200, headers });
		}

		headers['Content-Length'] = String(asset.raw.byteLength);
		const rawCopy = new Uint8Array(asset.raw);
		return new Response(rawCopy, { status: 200, headers });
	};
}

/**
 * Create composite glob pattern from include patterns
 */
function createCompositeGlobPattern(): Bun.Glob {
	const raw = (process.env.ASSET_PRELOAD_INCLUDE_PATTERNS ?? '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
	if (raw.length === 0) return new Bun.Glob('**/*');
	if (raw.length === 1) return new Bun.Glob(raw[0]);
	return new Bun.Glob(`{${raw.join(',')}}`);
}

/**
 * Initialize static routes with intelligent preloading strategy
 * Small files are loaded into memory, large files are served on-demand
 */
async function initializeStaticRoutes(clientDirectory: string): Promise<PreloadResult> {
	const routes: Record<string, (req: Request) => Response | Promise<Response>> = {};
	const loaded: AssetMetadata[] = [];
	const skipped: AssetMetadata[] = [];

	log.info({ directory: clientDirectory }, 'Loading static assets');
	if (VERBOSE) {
		log.debug(
			{
				maxSizeMB: (MAX_PRELOAD_BYTES / 1024 / 1024).toFixed(2),
				includePatterns: process.env.ASSET_PRELOAD_INCLUDE_PATTERNS ?? '',
				excludePatterns: process.env.ASSET_PRELOAD_EXCLUDE_PATTERNS ?? ''
			},
			'Asset preload configuration'
		);
	}

	let totalPreloadedBytes = 0;

	try {
		const glob = createCompositeGlobPattern();
		for await (const relativePath of glob.scan({ cwd: clientDirectory })) {
			const filepath = path.join(clientDirectory, relativePath);
			const route = `/${relativePath.split(path.sep).join(path.posix.sep)}`;

			try {
				// Get file metadata
				const file = Bun.file(filepath);

				// Skip if file doesn't exist or is empty
				if (!(await file.exists()) || file.size === 0) {
					continue;
				}

				const metadata: AssetMetadata = {
					route,
					size: file.size,
					type: file.type || 'application/octet-stream'
				};

				// Determine if file should be preloaded
				const matchesPattern = isFileEligibleForPreloading(relativePath);
				const withinSizeLimit = file.size <= MAX_PRELOAD_BYTES;

				if (matchesPattern && withinSizeLimit) {
					// Preload small files into memory with ETag and Gzip support
					const bytes = new Uint8Array(await file.arrayBuffer());
					const gz = compressDataIfAppropriate(bytes, metadata.type);
					const etag = ENABLE_ETAG ? computeEtag(bytes) : undefined;
					const asset: InMemoryAsset = {
						raw: bytes,
						gz,
						etag,
						type: metadata.type,
						immutable: true,
						size: bytes.byteLength
					};
					routes[route] = createResponseHandler(asset);

					loaded.push({ ...metadata, size: bytes.byteLength });
					totalPreloadedBytes += bytes.byteLength;
				} else {
					// Serve large or filtered files on-demand
					routes[route] = () => {
						const fileOnDemand = Bun.file(filepath);
						return new Response(fileOnDemand, {
							headers: {
								'Content-Type': metadata.type,
								'Cache-Control': 'public, max-age=3600'
							}
						});
					};

					skipped.push(metadata);
				}
			} catch (error: unknown) {
				if (error instanceof Error && error.name !== 'EISDIR') {
					log.error(`Failed to load ${filepath}: ${error.message}`);
				}
			}
		}

		if (VERBOSE) {
			if (loaded.length > 0 || skipped.length > 0) {
				log.debug(
					{
						preloaded: loaded.map((f) => ({
							route: f.route,
							sizeKB: (f.size / 1024).toFixed(2),
							type: f.type
						})),
						onDemand: skipped.map((f) => ({
							route: f.route,
							sizeKB: (f.size / 1024).toFixed(2),
							type: f.type
						}))
					},
					'Asset preload details'
				);
			} else {
				log.debug('No files found to preload');
			}
		}

		if (loaded.length > 0) {
			log.info(
				{
					count: loaded.length,
					totalSizeMB: (totalPreloadedBytes / 1024 / 1024).toFixed(2)
				},
				'Static assets preloaded'
			);
		} else {
			log.info('No static assets preloaded into memory');
		}

		if (skipped.length > 0) {
			const tooLarge = skipped.filter((f) => f.size > MAX_PRELOAD_BYTES).length;
			const filtered = skipped.length - tooLarge;
			log.info({ count: skipped.length, tooLarge, filtered }, 'Static assets served on-demand');
		}
	} catch (error) {
		log.error({ directory: clientDirectory, error: String(error) }, 'Failed to load static assets');
	}

	return { routes, loaded, skipped };
}

/**
 * Initialize the server
 */
async function initializeServer() {
	log.info('Starting production server');

	log.info('Running database migrations');
	try {
		await runMigrations();
		log.info('Database migrations completed');
	} catch (error) {
		log.error({ error: String(error) }, 'Migration failed');
		process.exit(1);
	}

	let handler: { fetch: (request: Request) => Response | Promise<Response> };
	try {
		const serverModule = (await import(SERVER_ENTRY_POINT)) as {
			default: { fetch: (request: Request) => Response | Promise<Response> };
		};
		handler = serverModule.default;
		log.info('Application handler initialized');
	} catch (error) {
		log.error({ error: String(error) }, 'Failed to load server handler');
		process.exit(1);
	}

	const { routes } = await initializeStaticRoutes(CLIENT_DIRECTORY);

	const server = Bun.serve({
		port: SERVER_PORT,

		routes: {
			...routes,

			'/*': (req: Request) => {
				try {
					return handler.fetch(req);
				} catch (error) {
					log.error({ error: String(error) }, 'Server handler error');
					return new Response('Internal Server Error', { status: 500 });
				}
			}
		},

		error(error) {
			log.error(
				{ error: error instanceof Error ? error.message : String(error) },
				'Uncaught server error'
			);
			return new Response('Internal Server Error', { status: 500 });
		}
	});

	log.info({ url: `http://localhost:${server.port}`, port: server.port }, 'Server listening');

	if (ENABLE_FEED_CRON) {
		const runFeedRefetch = async () => {
			if (feedCronRunning) {
				log.warn('Feed refetch already in progress, skipping');
				return;
			}

			feedCronRunning = true;
			const startTime = Date.now();
			log.info('Starting scheduled feed refetch');

			try {
				await Sentry.startSpan({ op: 'cron', name: 'feed-refetch' }, async () => {
					await refetchFeeds();
				});
				const duration = ((Date.now() - startTime) / 1000).toFixed(1);
				log.info({ durationSeconds: duration }, 'Feed refetch completed');
			} catch (error) {
				const duration = ((Date.now() - startTime) / 1000).toFixed(1);
				log.error({ durationSeconds: duration, error: String(error) }, 'Feed refetch failed');
				Sentry.captureException(error, {
					tags: { component: 'feed-cron' }
				});
			} finally {
				feedCronRunning = false;
			}
		};

		setInterval(runFeedRefetch, FEED_CRON_INTERVAL_MS);
		log.info(
			{ intervalMinutes: (FEED_CRON_INTERVAL_MS / 1000 / 60).toFixed(0) },
			'Feed cron scheduled'
		);
	}
}

initializeServer().catch((error: unknown) => {
	log.error({ error: String(error) }, 'Failed to start server');
	process.exit(1);
});
