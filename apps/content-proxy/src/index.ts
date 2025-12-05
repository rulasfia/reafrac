import { extractFeed, parsedFeedSchema, extractArticle } from '@reafrac/feed-utils';
import { Elysia } from 'elysia';
import { openapi } from '@elysiajs/openapi';
import { z } from 'zod';

const app = new Elysia()
	.use(
		openapi({
			mapJsonSchema: { zod: z.toJSONSchema }
		})
	)
	.get('/', () => 'Hello Elysia')
	.get(
		'/ping',
		() => {
			console.info('Ping received!');
			return { status: 'online' };
		},
		{ response: z.object({ status: z.string() }) }
	)
	.post(
		'/extract-feed',
		async ({ body }) => {
			console.log('extracting feed: ', body.url);
			const validated = await extractFeed(body.url);

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
			console.log('extracting article: ', body.url);
			const validated = await extractArticle(body.url);

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

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
