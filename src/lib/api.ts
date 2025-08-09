import { ofetch } from 'ofetch';

// Miniflux API client
export interface MinifluxConfig {
	url: string;
	token: string;
}

export interface MinifluxUser {
	id: number;
	username: string;
	email: string;
	is_admin: boolean;
	theme: string;
	language: string;
	timezone: string;
	entry_direction: string;
	entries_per_page: number;
	displayed_infos: string;
	nb_unread_entries: number;
	nb_starred_entries: number;
}

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
