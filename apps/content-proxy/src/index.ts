import { extractFeed, parsedFeedSchema, extractArticle } from '@reafrac/feed-utils';
import { Elysia } from 'elysia';
import { openapi } from '@elysiajs/openapi';
import { z } from 'zod';
import { createLogger } from '@reafrac/logger';

const log = createLogger({ name: 'content-proxy' });

const app = new Elysia()
	.use(
		openapi({
			mapJsonSchema: { zod: z.toJSONSchema }
		})
	)
	.get('/', () => 'Hello Elysia')
	.get(
		'/health',
		() => {
			return { status: 'healthy', timestamp: new Date().toISOString() };
		},
		{ response: z.object({ status: z.string(), timestamp: z.string() }) }
	)
	.post(
		'/extract-feed',
		async ({ body }) => {
			log.debug({ url: body.url }, 'Extracting feed');
			const validated = await extractFeed(body.url);
			log.info({ url: body.url }, 'Feed extracted');
			return validated;
		},
		{
			body: z.object({ url: z.url({ error: 'Invalid URL' }) }),
			response: parsedFeedSchema
		}
	)
	.post(
		'/extract-article',
		async ({ body }) => {
			log.debug({ url: body.url }, 'Extracting article');
			const validated = await extractArticle(body.url);
			log.info({ url: body.url }, 'Article extracted');
			return validated;
		},
		{
			body: z.object({ url: z.url({ error: 'Invalid URL' }) }),
			response: z
				.object({
					url: z.string().optional(),
					links: z.array(z.string()).optional(),
					title: z.string().optional(),
					description: z.string().optional(),
					image: z.string().optional(),
					favicon: z.string().optional(),
					author: z.string().optional(),
					content: z.string().optional(),
					source: z.string().optional(),
					published: z.string().optional(),
					ttr: z.number().optional(),
					type: z.string().optional()
				})
				.nullable()
		}
	)
	.listen(3001);

log.info({ host: app.server?.hostname, port: app.server?.port }, 'Content proxy server running');
