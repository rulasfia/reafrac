import { extractFeed, parsedFeedSchema } from '@reafrac/feed-utils';
import { Elysia } from 'elysia';
import { openapi, fromTypes } from '@elysiajs/openapi';
import { z } from 'zod';

const app = new Elysia()
	.use(
		openapi({
			references: fromTypes(),
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
			console.log({ body });
			console.info('Extract feed received!');
			const validated = await extractFeed(body.url);

			return validated;
		},
		{
			body: z.object({ url: z.url({ error: 'Invalid URL' }) }),
			response: parsedFeedSchema
		}
	)
	.listen(3001);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
