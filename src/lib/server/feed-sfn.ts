import { createServerFn } from '@tanstack/react-start';
import * as z from 'zod/mini';
import { authFnMiddleware } from '../middleware/auth-middleware';
import { getExistingIntegrationServerFn } from './integration-sfn';
import { ofetch } from 'ofetch';
import type { Feed } from './types';
import { sentryMiddleware } from '../middleware/sentry-middleware';

export const getFeedsServerFn = createServerFn({ method: 'GET' })
	.middleware([sentryMiddleware, authFnMiddleware])
	.handler(async ({ context }) => {
		// get user integration
		const integration = await getExistingIntegrationServerFn({ data: { userId: context.user.id } });
		if (!integration) throw new Error('Integration not found');

		// get entry
		const res = await ofetch<Feed[]>(`/v1/feeds`, {
			baseURL: integration?.serverUrl,
			timeout: 5000,
			method: 'GET',
			headers: {
				'X-Auth-Token': integration?.apiKey,
				'Content-Type': 'application/json'
			}
		});

		return res;
	});

export const getFeedServerFn = createServerFn({ method: 'GET' })
	.middleware([sentryMiddleware, authFnMiddleware])
	.inputValidator(z.object({ feedId: z.string() }))
	.handler(async ({ data, context }) => {
		// get user integration
		const integration = await getExistingIntegrationServerFn({ data: { userId: context.user.id } });
		if (!integration) throw new Error('Integration not found');

		// get entry
		const feed = await ofetch<Feed>(`/v1/feeds/${data.feedId}`, {
			baseURL: integration?.serverUrl,
			timeout: 5000,
			method: 'GET',
			headers: {
				'X-Auth-Token': integration?.apiKey,
				'Content-Type': 'application/json'
			}
		});

		return feed;
	});
