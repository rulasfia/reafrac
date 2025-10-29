import { createServerFn } from '@tanstack/react-start';
import { ofetch } from 'ofetch';
import { type MinifluxUser } from './types';
import * as z from 'zod/mini';
import { db } from '../db-connection';
import { fluxConnections } from '../db-schema';
import { eq } from 'drizzle-orm';
import { authFnMiddleware } from '../middleware/auth-middleware';
import { sentryMiddleware } from '../middleware/sentry-middleware';

const FluxIntegrationSchema = z.object({
	server_url: z.string().check(z.minLength(1)),
	token: z.string().check(z.minLength(1))
});

export const fluxIntegrationServerFn = createServerFn({ method: 'POST' })
	.middleware([sentryMiddleware, authFnMiddleware])
	.inputValidator(FluxIntegrationSchema)
	.handler(async ({ data, context }) => {
		try {
			// Ensure URL has protocol
			let url = data.server_url;
			if (!url.startsWith('http://') && !url.startsWith('https://')) {
				url = 'https://' + url;
			}

			const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;

			const res = await ofetch<MinifluxUser>(`/v1/me`, {
				baseURL: cleanUrl,
				timeout: 5000,
				headers: {
					'X-Auth-Token': data.token,
					'Content-Type': 'application/json'
				}
			});

			await db.insert(fluxConnections).values({
				userId: context.user.id,
				serverUrl: cleanUrl,
				apiKey: data.token
			});

			return res;
		} catch (err) {
			console.error(err);
			throw err;
		}
	});

export const getExistingIntegrationServerFn = createServerFn({ method: 'GET' })
	.middleware([sentryMiddleware, authFnMiddleware])
	.inputValidator(z.object({ userId: z.string().check(z.minLength(1)) }))
	.handler(async ({ data }) => {
		const res = await db
			.select()
			.from(fluxConnections)
			.where(eq(fluxConnections.userId, data.userId))
			.limit(1);

		if (!res || res.length === 0) {
			return null;
		}

		return res[0];
	});
