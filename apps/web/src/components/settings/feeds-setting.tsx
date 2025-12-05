import { useQuery, useQueryClient } from '@tanstack/react-query';
import { removeFeedServerFn } from '@/lib/server/feed-sfn';
import { useLoaderData, useLocation } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { FeedItem } from './feed-item';
import { toastManager } from '../ui/toast';
import { Label } from '../ui/label';
import { AddFeedDialog } from './add-feed-dialog';
import { EditFeedDialog } from './edit-feed-dialog';
import { useState } from 'react';
import { userFeedQueryOptions } from '@/lib/queries/feed-query';

export function FeedSetting() {
	const { search } = useLocation();
	const { user } = useLoaderData({ from: '/reader' });
	const qc = useQueryClient();
	const removeFeed = useServerFn(removeFeedServerFn);

	const { data: feeds, refetch: invalidateFeeds } = useQuery(userFeedQueryOptions(user.id));

	const [activeItem, setActiveItem] = useState<NonNullable<typeof feeds>[number] | null>(null);

	const handleRemoveFeed = async (feedId: string) => {
		try {
			await removeFeed({ data: { feedId } });
			await invalidateFeeds();
			// don't await, let it start in the bg
			qc.invalidateQueries({
				queryKey: ['entries', search.page]
			});

			toastManager.add({
				title: 'Success',
				description: 'Feed removed successfully!',
				type: 'success'
			});
		} catch (error) {
			console.error(error);
			toastManager.add({
				title: 'Error',
				description: 'Failed to remove feed',
				type: 'error'
			});
		}
	};

	return (
		<div>
			<h3 className="text-lg font-medium">Feeds Settings</h3>
			<p className="mb-3 text-sm text-foreground/70">
				Manage your feeds here. You can add, remove, and update your feeds.
			</p>

			<AddFeedDialog />

			<div className="grid grid-cols-1 gap-y-2">
				{feeds && feeds.length > 0 ? (
					<Label className="mt-4 mb-3">Followed Feeds</Label>
				) : (
					<Label className="mt-4 mb-3">You don't follow any feeds yet</Label>
				)}

				{!feeds && <span className="py-2 text-sm text-gray-500">&nbsp;</span>}

				{feeds?.map((feed) => (
					<FeedItem
						key={feed.id}
						item={feed}
						onRemove={handleRemoveFeed}
						onUpdate={() => setActiveItem(feed)}
					/>
				))}

				<EditFeedDialog
					item={activeItem}
					onClose={() => {
						setActiveItem(null);
						void invalidateFeeds();
					}}
				/>
			</div>
		</div>
	);
}
