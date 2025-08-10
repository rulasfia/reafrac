import { getEntriesRequest, type EntryResponse } from '$lib/api/entry';
import { getFeedsRequest } from '$lib/api/feed';
import type { Feed } from '$lib/api/types';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data, fetch, url }) => {
	try {
		// Get pagination parameters
		const page = parseInt(url.searchParams.get('page') || '1', 10);
		const limit = 20;
		const offset = (page - 1) * limit;

		const query = { offset, limit } as const;

		// TODO: handle fetch error
		const res = await Promise.all([
			fetch(getFeedsRequest(data.minifluxUrl, data.token)),
			fetch(getEntriesRequest(data.minifluxUrl, data.token, query))
		]);
		const [feeds, entries] = (await Promise.all(res.map((r) => r.json()))) as [
			Feed[],
			EntryResponse
		];

		return {
			...data,
			feeds,
			entries: {
				data: entries.entries,
				pagination: {
					totalItem: entries.total,
					currentPage: page,
					totalPages: Math.ceil(entries.total / limit),
					hasNext: page < Math.ceil(entries.total / limit),
					hasPrev: page > 1
				}
			}
		};
	} catch (error) {
		console.error('Failed:', error);
		return {
			...data,
			feeds: [],
			entries: {
				data: [],
				pagination: {
					currentPage: 1,
					totalPages: 1,
					hasNext: false,
					hasPrev: false
				}
			},
			error: error instanceof Error ? error.message : 'Failed to fetch'
		};
	}
};
