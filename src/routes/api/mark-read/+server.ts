import { markEntryAsRead } from '$lib/api/entry';
import { json } from '@sveltejs/kit';

export async function POST({ request, cookies }) {
	const url = cookies.get('miniflux-url');
	const token = cookies.get('miniflux-token');

	if (!url || !token) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	try {
		const { entryId } = await request.json();

		if (!entryId) {
			return json({ error: 'Entry ID is required' }, { status: 400 });
		}

		await markEntryAsRead(url, token, entryId);

		return json({ success: true });
	} catch (error) {
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to mark entry as read' },
			{ status: 500 }
		);
	}
}
