import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getFeedsServerFn, removeFeedServerFn, updateFeedServerFn } from '@/lib/server/feed-sfn';
import { useLoaderData, useLocation } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { FeedItem } from './feed-item';
import { toastManager } from '../ui/toast';
import { Label } from '../ui/label';
import { AddFeedDialog } from './add-feed-dialog';

export function FeedSetting() {
	const { search } = useLocation();
	const { user, integration } = useLoaderData({ from: '/reader' });
	const qc = useQueryClient();
	const getFeeds = useServerFn(getFeedsServerFn);
	const removeFeed = useServerFn(removeFeedServerFn);
	const updateFeed = useServerFn(updateFeedServerFn);

	const { data: feeds } = useQuery({
		queryKey: ['feeds', user.id, integration?.id],
		queryFn: async () => getFeeds()
	});

	const handleRemoveFeed = async (feedId: string) => {
		try {
			await removeFeed({ data: { feedId } });
			await qc.invalidateQueries({
				queryKey: ['feeds', user.id, integration?.id]
			});
			// don't await, let it start in the bg
			qc.invalidateQueries({
				queryKey: ['entries', integration?.id, search.page]
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

	const handleUpdateFeed = async (data: { feedId: string; title?: string; url?: string }) => {
		try {
			await updateFeed({ data });
			await qc.invalidateQueries({
				queryKey: ['feeds', user.id, integration?.id]
			});
			// don't await, let it start in the bg
			qc.invalidateQueries({
				queryKey: ['entries', integration?.id, search.page]
			});

			toastManager.add({
				title: 'Success',
				description: 'Feed updated successfully',
				type: 'success'
			});
		} catch (error) {
			console.error(error);
			toastManager.add({
				title: 'Error',
				description: 'Failed to update feed',
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
						onUpdate={handleUpdateFeed}
					/>
				))}
			</div>
		</div>
	);
}
