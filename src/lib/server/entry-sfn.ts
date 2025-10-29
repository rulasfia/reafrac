import { extract } from '@extractus/article-extractor';
import { createServerFn } from '@tanstack/react-start';
import * as z from 'zod/mini';
import { authFnMiddleware } from '../middleware/auth-middleware';
import { getExistingIntegrationServerFn } from './integration-sfn';
import { ofetch } from 'ofetch';
import sanitizeHtml from 'sanitize-html';
import type { FeedEntry } from './types';

export const updateEntryStatusServerFn = createServerFn({ method: 'POST' })
	.middleware([authFnMiddleware])
	.inputValidator(z.object({ entryId: z.number() }))
	.handler(async ({ data, context }) => {
		// get user integration
		const integration = await getExistingIntegrationServerFn({ data: { userId: context.user.id } });
		if (!integration) throw new Error('Integration not found');

		// update status
		await ofetch(`/v1/entries`, {
			baseURL: integration?.serverUrl,
			timeout: 5000,
			method: 'PUT',
			body: {
				entry_ids: [data.entryId],
				status: 'read'
			},
			headers: {
				'X-Auth-Token': integration?.apiKey,
				'Content-Type': 'application/json'
			}
		});

		return true;
	});

const EntryQuerySchema = z.object({
	feedId: z.optional(z.string()),
	offset: z.number(),
	after: z.optional(z.number()),
	starred: z.optional(z.boolean())
});

export const getEntriesServerFn = createServerFn({ method: 'GET' })
	.middleware([authFnMiddleware])
	.inputValidator(EntryQuerySchema)
	.handler(async ({ data, context }) => {
		// get user integration
		const integration = await getExistingIntegrationServerFn({ data: { userId: context.user.id } });
		if (!integration) throw new Error('Integration not found');

		const PAGE_SIZE = 20;
		// set endpoint based on existence of feedId
		const endpoint = data.feedId ? `/v1/feeds/${data.feedId}/entries` : `/v1/entries`;

		// get entries
		const entries = await ofetch<{ entries: FeedEntry[]; total: number }>(endpoint, {
			baseURL: integration.serverUrl,
			timeout: 5000,
			method: 'GET',
			query: {
				direction: 'desc',
				order: 'published_at',
				limit: PAGE_SIZE,
				offset: data.offset,
				after: data.after,
				starred: data.starred
			},
			headers: {
				'X-Auth-Token': integration?.apiKey,
				'Content-Type': 'application/json'
			}
		});

		return entries;
	});

export const getEntryServerFn = createServerFn({ method: 'GET' })
	.middleware([authFnMiddleware])
	.inputValidator(z.object({ entryId: z.number() }))
	.handler(async ({ data, context }) => {
		// get user integration
		const integration = await getExistingIntegrationServerFn({ data: { userId: context.user.id } });
		if (!integration) throw new Error('Integration not found');

		// get entry
		const entry = await ofetch<FeedEntry>(`/v1/entries/${data.entryId}`, {
			baseURL: integration?.serverUrl,
			timeout: 5000,
			method: 'GET',
			headers: {
				'X-Auth-Token': integration?.apiKey,
				'Content-Type': 'application/json'
			}
		});

		//  sanitize HTML in the entry.content
		const sanitizedContent = sanitizeHtml(entry.content, {
			allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img'])
		});

		return { ...entry, content: sanitizedContent };
	});

export const getEntryContentServerFn = createServerFn({ method: 'GET' })
	.middleware([authFnMiddleware])
	.inputValidator(z.object({ entryUrl: z.url() }))
	.handler(async ({ data }) => {
		const res = await extract(data.entryUrl);
		if (!res) throw new Error('Failed to extract entry content');

		return res;
	});
