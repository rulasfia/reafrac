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
import { useState } from 'react';
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

const STARTER_FEED = [
	{
		link: 'https://feeds.arstechnica.com/arstechnica/features',
		title: 'Arstechnica long-form feature articles'
	},
	{ link: 'https://newsletter.posthog.com/feed', title: 'Product for Engineers by PostHog' },
	{ link: 'https://www.theverge.com/rss/index.xml', title: 'The Verge' }
];

export function FeedSetting() {
	const { search } = useLocation();
	const { user, integration } = useLoaderData({ from: '/reader' });
	const qc = useQueryClient();
	const getFeeds = useServerFn(getFeedsServerFn);
	const addFeed = useServerFn(addFeedServerFn);
	const removeFeed = useServerFn(removeFeedServerFn);
	const updateFeed = useServerFn(updateFeedServerFn);

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
			const formData = new FormData(event.currentTarget);
			const feedUrl = formData.get('feedUrl') as string;

			const result = addFeedSchema.safeParse({ feedUrl });
			if (!result.success) {
				const { fieldErrors } = z.flattenError(result.error);
				setErrors(fieldErrors);
				return;
			}

			setIsLoading(true);
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

	const clickSuggestionHandler = (link: string) => {
		const form = document.getElementById('feedForm') as HTMLFormElement;
		const input = form.querySelector('input[name="feedUrl"]') as HTMLInputElement;
		input.value = link;
	};

	return (
		<div>
			<h3 className="text-lg font-medium">Feeds Settings</h3>
			<p className="mb-3 text-sm text-foreground/70">
				Manage your feeds here. You can add, remove, and update your feeds.
			</p>

			<Form
				id="feedForm"
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
			<div className="grid grid-cols-1 gap-y-2">
				{!feeds && <span className="py-2 text-sm text-gray-500">&nbsp;</span>}
				{feeds?.length === 0 && (
					<div>
						<span className="py-2 text-sm text-gray-500">
							No feeds found. Here are some recommendations to help you get started:
						</span>
						<ul className="list list-inside list-disc">
							{STARTER_FEED.map((feed) => (
								<li key={feed.link}>
									<button
										className="cursor-pointer text-sm text-primary hover:underline"
										onClick={() => clickSuggestionHandler(feed.link)}
									>
										{feed.title}
									</button>
								</li>
							))}
						</ul>
					</div>
				)}
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
