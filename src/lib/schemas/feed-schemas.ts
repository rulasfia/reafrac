import { z } from 'zod';

export const parsedFeedSchema = z.object({
	title: z.string(),
	description: z.union([
		z.string(),
		z.object({ '#text': z.string() }).transform((val) => val['#text'].trim())
	]),
	link: z.url(),
	published: z.string(),
	icon: z.url().default(''),
	generator: z.string().default(''),
	language: z.string().default(''),
	entries: z.array(
		z.object({
			id: z.string(),
			title: z.string(),
			link: z.string(),
			published: z.string(),
			description: z.string(),
			author: z.string().default(''),
			content: z.string().nullable()
		})
	)
});

export const parsedFeedIconSchema = z.union([
	z.url(),
	z.object({ url: z.url() }).transform((val) => val.url.trim())
]);

export const parsedFeedAuthorSchema = z.union([
	z.string().transform((val) => {
		// if include (), get the content inside
		if (val.includes('(') && val.includes(')')) {
			return val.split('(')[1].split(')')[0].trim();
		}
		return val.trim();
	}),
	z.object({ name: z.string() }).transform((val) => val.name.trim())
]);

export const parsedFeedContentSchema = z.union([
	z.string(),
	z.object({ '#text': z.string() }).transform((val) => val['#text'].trim())
]);

export type ParsedFeed = z.infer<typeof parsedFeedSchema>;
