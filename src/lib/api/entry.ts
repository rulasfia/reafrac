import { ofetch } from 'ofetch';
import qs from 'query-string';
import type { FeedEntry } from './types';

export interface EntryResponse {
	total: number;
	entries: FeedEntry[];
}

export type EntriesQueryParams = {
	status?: 'unread' | 'read' | 'removed';
	order?: 'id' | 'status' | 'published_at' | 'category_title' | 'category_id';
	direction?: 'asc' | 'desc';
	limit?: number;
	offset?: number;
};

export function getEntriesRequest(
	url: string,
	token: string,
	query: EntriesQueryParams = { direction: 'asc', order: 'published_at', limit: 20, offset: 0 }
) {
	// Remove trailing slash if present
	const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;

	const queryString = qs.stringify(query);
	return new Request(`${cleanUrl}/v1/entries?${queryString}`, {
		method: 'GET',
		headers: {
			'X-Auth-Token': token,
			'Content-Type': 'application/json'
		}
	});
}

export function getEntryRequestById(url: string, token: string, id: string) {
	return new Request(`${url}/v1/entries/${id}`, {
		method: 'GET',
		headers: {
			'X-Auth-Token': token,
			'Content-Type': 'application/json'
		}
	});
}

export async function getEntries(
	url: string,
	token: string,
	query: EntriesQueryParams = { direction: 'desc', order: 'published_at', limit: 20, offset: 0 }
): Promise<EntryResponse> {
	try {
		// Remove trailing slash if present
		const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;

		const data = await ofetch(`/v1/entries`, {
			baseURL: cleanUrl,
			timeout: 10000,
			query,
			headers: {
				'X-Auth-Token': token,
				'Content-Type': 'application/json'
			}
		});

		return data;
	} catch (error) {
		throw new Error(error instanceof Error ? error.message : 'Failed to fetch unread entries');
	}
}

export async function markEntryAsRead(url: string, token: string, entryId: number): Promise<void> {
	try {
		// Remove trailing slash if present
		const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;

		await ofetch(`/v1/entries/${entryId}`, {
			baseURL: cleanUrl,
			method: 'PUT',
			timeout: 5000,
			headers: {
				'X-Auth-Token': token,
				'Content-Type': 'application/json'
			},
			body: {
				status: 'read'
			}
		});
	} catch (error) {
		throw new Error(error instanceof Error ? error.message : 'Failed to mark entry as read');
	}
}

export async function markAllAsRead(url: string, token: string): Promise<void> {
	try {
		// Remove trailing slash if present
		const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;

		await ofetch(`/v1/entries`, {
			baseURL: cleanUrl,
			method: 'PUT',
			timeout: 5000,
			headers: {
				'X-Auth-Token': token,
				'Content-Type': 'application/json'
			},
			body: {
				status: 'read'
			}
		});
	} catch (error) {
		throw new Error(error instanceof Error ? error.message : 'Failed to mark all entries as read');
	}
}
