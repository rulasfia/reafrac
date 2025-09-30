import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const minifluxUrl = cookies.get('miniflux-url');
	const token = cookies.get('miniflux-token');
	const userStr = cookies.get('miniflux-user');

	if (!minifluxUrl || !token) {
		throw redirect(303, '/login');
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

			throw redirect(303, '/login');
		}
	}

	return { user: user as { username: string }, minifluxUrl, token };
};
