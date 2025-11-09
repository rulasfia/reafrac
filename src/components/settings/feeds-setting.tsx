import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
	addFeedServerFn,
	getFeedsServerFn,
	removeFeedServerFn,
	updateFeedServerFn
} from '@/lib/server/feed-sfn';
import { useLoaderData, useLocation } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { FeedItem } from './feed-item';
import { useRef, useState } from 'react';
import { z } from 'zod/mini';
import { toastManager } from '../ui/toast';
import { Form } from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import { PlusIcon } from 'lucide-react';
import { Label } from '../ui/label';

const addFeedSchema = z.object({
	feedUrl: z.url({ error: 'Invalid URL' })
});

type Errors = Record<string, string | string[]>;

export function FeedSetting() {
	const { search } = useLocation();
	const { user, integration } = useLoaderData({ from: '/reader' });
	const qc = useQueryClient();
	const getFeeds = useServerFn(getFeedsServerFn);
	const addFeed = useServerFn(addFeedServerFn);
	const removeFeed = useServerFn(removeFeedServerFn);
	const updateFeed = useServerFn(updateFeedServerFn);

	const formRef = useRef(null);
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState<Errors>({});
	const handleClearErrors = (next: Errors) => setErrors(next);

	const { data: feeds } = useQuery({
		queryKey: ['feeds', user.id, integration?.id],
		queryFn: async () => getFeeds()
	});

	const submitHandler = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		try {
			setErrors({});
			setIsLoading(true);
			const formData = new FormData(event.currentTarget);
			const feedUrl = formData.get('feedUrl') as string;

			const result = addFeedSchema.safeParse({ feedUrl });
			if (!result.success) {
				const { fieldErrors } = z.flattenError(result.error);
				setErrors(fieldErrors);
				return;
			}
			console.log('currentTarget-1', formRef.current);

			await addFeed({ data: { feedUrl } });
			await Promise.all([
				qc.invalidateQueries({
					queryKey: ['feeds', user.id, integration?.id]
				}),
				qc.invalidateQueries({
					queryKey: ['entries', integration?.id, search.page]
				})
			]);

			toastManager.add({
				title: 'Success',
				description: 'Feed added successfully!',
				type: 'success'
			});
		} catch (error) {
			console.error(error);
			setErrors({ feedUrl: 'Failed to add feed' });
		} finally {
			setIsLoading(false);
		}
	};

	const handleRemoveFeed = async (feedId: string) => {
		try {
			await removeFeed({ data: { feedId } });

			await Promise.all([
				qc.invalidateQueries({
					queryKey: ['feeds', user.id, integration?.id]
				}),
				qc.invalidateQueries({
					queryKey: ['entries', integration?.id, search.page]
				})
			]);

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
			await Promise.all([
				qc.invalidateQueries({
					queryKey: ['feeds', user.id, integration?.id]
				}),
				qc.invalidateQueries({
					queryKey: ['entries', integration?.id, search.page]
				})
			]);

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

			<Form
				onSubmit={submitHandler}
				errors={errors}
				onClearErrors={handleClearErrors}
				className="max-w-lg"
			>
				<Field name="feedUrl">
					<FieldLabel>Feed URL</FieldLabel>
					<div className="flex w-full gap-2">
						<Input
							className="w-full"
							name="feedUrl"
							placeholder="https://example.com/feed.xml"
							type="text"
							disabled={isLoading}
						/>

						<Button className="w-fit" type="submit" disabled={isLoading}>
							{isLoading ? (
								<>
									<Spinner /> Adding Feed...
								</>
							) : (
								<>
									<PlusIcon /> Add Feed
								</>
							)}
						</Button>
					</div>
					<FieldError />
				</Field>
			</Form>

			<Label className="mt-4 mb-3">Followed Feeds</Label>
			<ul className="grid grid-cols-1 gap-y-2">
				{!feeds && <li className="py-2 text-sm text-gray-500">&nbsp;</li>}
				{feeds?.length === 0 && <li className="py-2 text-sm text-gray-500">No feeds found</li>}
				{feeds?.map((feed) => (
					<FeedItem
						key={feed.id}
						item={feed}
						onRemove={handleRemoveFeed}
						onUpdate={handleUpdateFeed}
					/>
				))}
			</ul>
		</div>
	);
}
