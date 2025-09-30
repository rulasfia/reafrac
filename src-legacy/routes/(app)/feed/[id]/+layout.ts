import type { LayoutLoad } from './$types';
import {
	getEntriesByFeedRequest,
	type EntriesQueryParams,
	type EntryResponse
} from '$lib/api/entry';

export const load: LayoutLoad = async ({ parent, fetch, url, params }) => {
	try {
		const data = await parent();

		const page = parseInt(url.searchParams.get('page') || '1', 10);
		const limit = 20;
		const offset = (page - 1) * limit;

		const query = {
			offset,
			limit,
			direction: 'desc',
			order: 'published_at'
		} satisfies EntriesQueryParams;

		const feedUrl = params.id;

		// TODO: handle fetch error
		const res = await fetch(
			getEntriesByFeedRequest(data.minifluxUrl, data.token, {
				...query,
				feedId: parseInt(feedUrl, 10)
			})
		);
		const entries = (await res.json()) as EntryResponse;

		return {
			entries: {
				data: entries.entries,
				pagination: {
					totalItems: entries.total,
					currentPage: page,
					totalPages: Math.ceil(entries.total / limit),
					hasNext: page < Math.ceil(entries.total / limit),
					hasPrev: page > 1
				}
			}
		};
	} catch (error) {
		console.error(error);
		return {
			entries: {
				data: [],
				pagination: {
					totalItems: 0,
					currentPage: 1,
					totalPages: 1,
					hasNext: false,
					hasPrev: false
				},
				error: error instanceof Error ? error.message : 'Failed to fetch'
			}
		};
	}
};
