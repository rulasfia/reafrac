import { createServerFn } from '@tanstack/react-start';
import { ofetch } from 'ofetch';
import { MinifluxUser } from 'src-legacy/lib/api/types';
import * as z from 'zod/mini';

const FluxIntegrationSchema = z.object({
	server_url: z.string().check(z.minLength(1)),
	token: z.string().check(z.minLength(1))
});
export const fluxIntegrationServerFn = createServerFn({ method: 'POST' })
	.inputValidator(FluxIntegrationSchema)
	.handler(async ({ data }) => {
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

		return res;
	});
