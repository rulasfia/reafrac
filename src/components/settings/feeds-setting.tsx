import { useQuery, useQueryClient } from '@tanstack/react-query';
import { addFeedServerFn, getFeedsServerFn } from '@/lib/server/feed-sfn';
import { useLoaderData, useLocation } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { FeedItem } from './feed-item';
import { TextField } from '../ui/text-field';
import { Button } from '../ui/button';
import { useState } from 'react';
import { Loader } from '../ui/loader';

export function FeedSetting() {
	const { search } = useLocation();
	const { user, integration } = useLoaderData({ from: '/reader' });
	const qc = useQueryClient();
	const getFeeds = useServerFn(getFeedsServerFn);
	const addFeed = useServerFn(addFeedServerFn);

	const [isLoading, setIsLoading] = useState(false);

	const { data: feeds } = useQuery({
		queryKey: ['feeds', user.id, integration?.id],
		queryFn: async () => getFeeds()
	});

	const submitHandler = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setIsLoading(true);
		const formData = new FormData(event.currentTarget);
		const feedUrl = formData.get('feedUrl') as string;
		const res = await addFeed({ data: { feedUrl } });
		console.log('feed', res);
		await Promise.all([
			qc.invalidateQueries({
				queryKey: ['feeds', user.id, integration?.id]
			}),
			qc.invalidateQueries({
				queryKey: ['entries', integration?.id, search.page]
			})
		]);

		setIsLoading(false);
		// clear form
		event.currentTarget.reset();
	};
	return (
		<div>
			<h3 className="mb-3 text-lg font-medium">Feeds Settings</h3>
			<ul className="grid grid-cols-1 gap-y-2">
				<form className="flex items-end gap-x-3" onSubmit={submitHandler}>
					<TextField
						className="w-full"
						name="feedUrl"
						label="Feed URL"
						placeholder="https://example.com/feed.xml"
						type="url"
					/>
					<Button type="submit" isDisabled={isLoading}>
						{isLoading ? <Loader /> : 'Add'}
					</Button>
				</form>
				{!feeds && <li className="py-2 text-sm text-gray-500">&nbsp;</li>}
				{feeds?.length === 0 && <li className="py-2 text-sm text-gray-500">No feeds found</li>}
				{feeds?.map((feed) => (
					<FeedItem key={feed.id} item={feed} />
				))}
			</ul>
		</div>
	);
}
