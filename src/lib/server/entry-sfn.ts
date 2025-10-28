import { createServerFn } from '@tanstack/react-start';
import * as z from 'zod/mini';
import { authFnMiddleware } from '../middleware/auth-middleware';
import { getExistingIntegrationServerFn } from './integration-sfn';
import { ofetch } from 'ofetch';

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
