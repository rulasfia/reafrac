export function getFeedsRequest(url: string, token: string) {
	const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
	return new Request(`${cleanUrl}/v1/feeds`, {
		method: 'GET',
		headers: {
			'X-Auth-Token': token,
			'Content-Type': 'application/json'
		}
	});
}

export function getFeedIconRequest(url: string, token: string, params: { feedId: number }) {
	const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
	return new Request(`${cleanUrl}/v1/feeds/${params.feedId}/icon`, {
		method: 'GET',
		headers: {
			'X-Auth-Token': token,
			'Content-Type': 'application/json'
		}
	});
}
