import { getEntriesRequest, type EntryResponse } from '$lib/api/entry';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ data, url, fetch }) => {
	try {
		// Get pagination parameters
		const page = parseInt(url.searchParams.get('page') || '1', 10);
		const limit = 20;
		const offset = (page - 1) * limit;

		const query = { offset, limit } as const;

		// TODO: handle fetch error
		const res = await fetch(getEntriesRequest(data.minifluxUrl, data.token, query));
		const entries = (await res.json()) as EntryResponse;

		return {
			user: data.user,
			data: entries,
			pagination: {
				currentPage: page,
				totalPages: Math.ceil(entries.total / limit),
				hasNext: page < Math.ceil(entries.total / limit),
				hasPrev: page > 1
			}
		};
	} catch (error) {
		console.error('Failed to fetch feed:', error);
		return {
			user: data.user,
			data: { total: 0, entries: [] },
			pagination: { currentPage: 1, totalPages: 0, hasNext: false, hasPrev: false },
			error: error instanceof Error ? error.message : 'Failed to fetch feed'
		};
	}
};
