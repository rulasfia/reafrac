import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ cookies }) => {
	const url = cookies.get('miniflux-url');
	const token = cookies.get('miniflux-token');
	const userStr = cookies.get('miniflux-user');

	if (!url || !token) {
		return { isAuthenticated: false, user: null };
	}

	let user = null;
	if (userStr) {
		try {
			user = JSON.parse(userStr);
		} catch {
			// Invalid user data, clear cookies
			cookies.delete('miniflux-url', { path: '/' });
			cookies.delete('miniflux-token', { path: '/' });
			cookies.delete('miniflux-user', { path: '/' });

			return { isAuthenticated: false, user: null };
		}
	}

	return { isAuthenticated: true, user };
};

export const actions = {
	logout: async ({ cookies }) => {
		cookies.delete('miniflux-url', { path: '/' });
		cookies.delete('miniflux-token', { path: '/' });
		cookies.delete('miniflux-user', { path: '/' });

		throw redirect(303, '/login');
	}
};
