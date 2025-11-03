import { useQuery } from '@tanstack/react-query';
import { addFeedServerFn, getFeedsServerFn } from '@/lib/server/feed-sfn';
import { useLoaderData } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { FeedItem } from './feed-item';
import { TextField } from '../ui/text-field';
import { Button } from '../ui/button';

export function FeedSetting() {
	const { user, integration } = useLoaderData({ from: '/reader' });
	const getFeeds = useServerFn(getFeedsServerFn);
	const addFeed = useServerFn(addFeedServerFn);

	const { data: feeds } = useQuery({
		enabled: !!integration,
		queryKey: ['feeds', user.id, integration?.id],
		queryFn: async () => getFeeds()
	});

	const submitHandler = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		const feedUrl = formData.get('feedUrl') as string;
		const res = await addFeed({ data: { feedUrl } });
		console.log('feed', res);
	};
	return (
		<div>
			<h3 className="mb-3 text-lg font-medium">Feeds Settings</h3>
			<ul className="grid grid-cols-1">
				<form className="flex items-end gap-x-2" onSubmit={submitHandler}>
					<TextField
						className="w-full"
						name="feedUrl"
						label="Feed URL"
						placeholder="https://example.com/feed.xml"
						type="url"
					/>
					<Button type="submit">Add</Button>
				</form>
				{feeds?.length === 0 && <li className="py-2 text-sm text-gray-500">No feeds found</li>}
				{feeds?.map((feed) => (
					<FeedItem key={feed.id} item={feed} />
				))}
			</ul>
		</div>
	);
}
