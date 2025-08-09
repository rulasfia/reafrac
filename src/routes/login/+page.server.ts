import { validateMinifluxCredentials } from '$lib/api';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const url = cookies.get('miniflux-url');
	const token = cookies.get('miniflux-token');
	const userStr = cookies.get('miniflux-user');

	if (url && token && userStr) {
		try {
			const user = JSON.parse(userStr);
			return { savedCredentials: { url, token, user } };
		} catch {
			// Invalid user data, clear cookies
			cookies.delete('miniflux-url', { path: '/' });
			cookies.delete('miniflux-token', { path: '/' });
			cookies.delete('miniflux-user', { path: '/' });
		}
	}

	return { savedCredentials: null };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const url = formData.get('url') as string;
		const token = formData.get('token') as string;

		if (!url || !token) {
			return fail(400, {
				error: 'Please enter both URL and token',
				url,
				token
			});
		}

		// Ensure URL has protocol
		let fullUrl = url;
		if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
			fullUrl = 'https://' + fullUrl;
		}

		const result = await validateMinifluxCredentials(fullUrl, token);

		if (result.valid && result.user) {
			// TODO: update credentials storage method
			// Save credentials to cookies
			cookies.set('miniflux-url', fullUrl, {
				path: '/',
				httpOnly: true,
				secure: import.meta.env.PROD,
				sameSite: 'lax',
				maxAge: 60 * 60 * 24 * 30 // 30 days
			});

			cookies.set('miniflux-token', token, {
				path: '/',
				httpOnly: true,
				secure: import.meta.env.PROD,
				sameSite: 'lax',
				maxAge: 60 * 60 * 24 * 30 // 30 days
			});

			cookies.set('miniflux-user', JSON.stringify(result.user), {
				path: '/',
				httpOnly: true,
				secure: import.meta.env.PROD,
				sameSite: 'lax',
				maxAge: 60 * 60 * 24 * 30 // 30 days
			});

			throw redirect(303, '/unread');
		} else {
			return fail(401, {
				error: result.error || 'Authentication failed',
				url,
				token
			});
		}
	}
};
