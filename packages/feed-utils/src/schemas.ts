import { z } from 'zod';

export const parsedFeedSchema = z.object({
	title: z.string(),
	description: z.union([z.string(), z.object({ '#text': z.string() })]),
	link: z.url(),
	published: z.string(),
	icon: z.string().default(''),
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
			content: z.string().nullable(),
			thumbnail: z
				.object({
					url: z.url(),
					text: z.string().optional()
				})
				.nullable()
		})
	)
});

export const parsedAndTransformFeedSchema = z.object({
	...parsedFeedSchema.shape,
	description: z.union([
		z.string(),
		z.object({ '#text': z.string() }).transform((val) => val['#text'].trim())
	])
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
	z.number().transform((val) => val.toString()),
	z.object({ name: z.string() }).transform((val) => val.name.trim()),
	z.array(z.string()).transform((val) => val.join(', ').trim()),
	z
		.array(z.object({ name: z.string() }).transform((val) => val.name.trim()))
		.transform((val) => val.join(', ').trim())
]);

export const parsedFeedContentSchema = z.union([
	z.string(),
	z.object({ '#text': z.string() }).transform((val) => val['#text'].trim())
]);

export const parsedFeedThumbnailSchema = z.union([
	z.string().transform((val) => ({ url: val })),
	z.object({ url: z.string() }).transform((val) => ({ url: val.url })),
	z
		.object({ '@_url': z.string(), 'media:text': z.string().optional() })
		.transform((val) => ({ url: val['@_url'], text: val['media:text'] })),
	z
		.object({ 'media:thumbnail': z.object({ '@_url': z.string() }) })
		.transform((val) => ({ url: val['media:thumbnail']['@_url'] }))
]);

export type ParsedFeed = z.infer<typeof parsedAndTransformFeedSchema>;
