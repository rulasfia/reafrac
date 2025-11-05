import { z } from 'zod';

export const parsedFeedSchema = z.object({
	title: z.string(),
	description: z.string(),
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
			author: z.string().default('')
		})
	)
});
