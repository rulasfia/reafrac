import { markAllAsRead } from '$lib/api/entry';
import { json } from '@sveltejs/kit';

export async function POST({ cookies }) {
	const url = cookies.get('miniflux-url');
	const token = cookies.get('miniflux-token');

	if (!url || !token) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	try {
		await markAllAsRead(url, token);

		return json({ success: true });
	} catch (error) {
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to mark all entries as read' },
			{ status: 500 }
		);
	}
}
