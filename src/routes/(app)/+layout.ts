import { getFeedsRequest } from '$lib/api/feed';
import type { Feed } from '$lib/api/types';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data, fetch }) => {
	try {
		const res = await fetch(getFeedsRequest(data.minifluxUrl, data.token));
		const feeds = (await res.json()) as Feed[];

		return { ...data, feeds };
	} catch (error) {
		console.error('Failed:', error);
		return {
			...data,
			feeds: [],
			error: error instanceof Error ? error.message : 'Failed to fetch'
		};
	}
};
