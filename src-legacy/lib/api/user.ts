import { ofetch } from 'ofetch';
import type { MinifluxUser } from './types';

export async function validateMinifluxCredentials(
	url: string,
	token: string
): Promise<{ valid: boolean; user?: MinifluxUser; error?: string }> {
	try {
		// Remove trailing slash if present
		const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;

		const data = await ofetch(`/v1/me`, {
			baseURL: cleanUrl,
			timeout: 5000,
			headers: {
				'X-Auth-Token': token,
				'Content-Type': 'application/json'
			}
		});

		return { valid: true, user: data };
	} catch (error) {
		return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' };
	}
}
