import { useQuery } from '@tanstack/react-query';
import { getFeedsServerFn } from '@/lib/server/feed-sfn';
import { useLoaderData } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { FeedItem } from './feed-item';

export function FeedSetting() {
	const { integration } = useLoaderData({ from: '/reader' });
	const getFeeds = useServerFn(getFeedsServerFn);

	const { data: feeds } = useQuery({
		enabled: !!integration,
		queryKey: ['feeds', integration?.id],
		queryFn: async () => getFeeds()
	});

	return (
		<div>
			<h3 className="mb-2 text-lg font-medium">Feeds Settings</h3>
			<ul className="grid grid-cols-1">
				{feeds?.map((feed) => (
					<FeedItem key={feed.id} item={feed} />
				))}
			</ul>
		</div>
	);
}
