import { useQuery } from '@tanstack/react-query';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { PlusIcon, SearchIcon } from 'lucide-react';
import { Form } from '../ui/form';
import { Button } from '../ui/button';
import {
	Dialog,
	DialogClose,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogPopup,
	DialogTitle,
	DialogTrigger
} from '../ui/dialog';
import { z } from 'zod/mini';
import { startTransition, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useLoaderData } from '@tanstack/react-router';
import { addFeedServerFn, getFeedsServerFn, previewFeedServerFn } from '@/lib/server/feed-sfn';
import { Spinner } from '../ui/spinner';
import { Input } from '../ui/input';
import { toastManager } from '../ui/toast';
import { NewFeedPreview } from './new-feed-preview';
import { ParsedFeed } from '@/lib/schemas/feed-schemas';

const addFeedSchema = z.object({
	feedUrl: z.url({ error: 'Invalid URL' })
});

type Errors = Record<string, string | string[]>;

export function AddFeedDialog() {
	const { user, integration } = useLoaderData({ from: '/reader' });
	const getFeeds = useServerFn(getFeedsServerFn);
	const previewFeed = useServerFn(previewFeedServerFn);
	const addFeed = useServerFn(addFeedServerFn);

	const [isOpen, setIsOpen] = useState(false);
	const [feed, setFeed] = useState<(ParsedFeed & { feedUrl: string }) | null>(null);
	const [isSearching, setIsSearching] = useState(false);
	const [isAdding, setIsAdding] = useState(false);
	const [errors, setErrors] = useState<Errors>({});
	const handleClearErrors = (next: Errors) => setErrors(next);

	const { data: feeds, refetch: invalidateFeeds } = useQuery({
		queryKey: ['feeds', user.id, integration?.id],
		queryFn: async () => getFeeds(),
		staleTime: 2 * 60 * 1000 // 2 minutes
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

			setIsSearching(true);
			const res = await previewFeed({ data: { feedUrl } });
			setFeed({ ...res, feedUrl });
		} catch (error) {
			console.error(error);
			setErrors({ feedUrl: 'Feed not found!' });
		} finally {
			setIsSearching(false);
		}
	};

	const addFeedHandler = async () => {
		try {
			if (!feed) return;
			setIsAdding(true);
			await addFeed({ data: { feedUrl: feed?.feedUrl } });
			await invalidateFeeds();

			toastManager.add({
				title: 'Success',
				description: 'Feed added successfully!',
				type: 'success'
			});
			closeModal(false);
		} catch (error) {
			console.error(error);
			setErrors({ feedUrl: 'Failed to add feed' });
		} finally {
			setIsAdding(false);
		}
	};

	const closeModal = (val: boolean) => {
		setIsOpen(val);
		// reset state
		setTimeout(() => {
			startTransition(() => {
				setErrors({});
				setFeed(null);
			});
		}, 150);
	};

	return (
		<Dialog open={isOpen} onOpenChange={closeModal}>
			<DialogTrigger render={<Button />}>
				<PlusIcon /> Add Feed
			</DialogTrigger>
			<DialogPopup className="sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>Add New Feed</DialogTitle>
					<DialogDescription>
						Follow RSS feed, Reddit, Youtube Channel, Newsletters, Podcasts, and more.
					</DialogDescription>
				</DialogHeader>
				<Form
					id="feedForm"
					onSubmit={submitHandler}
					errors={errors}
					onClearErrors={handleClearErrors}
				>
					<Field name="feedUrl">
						<FieldLabel>Feed URL</FieldLabel>
						<div className="flex w-full flex-col items-end gap-2 sm:flex-row sm:items-center">
							<Input
								className="w-full"
								name="feedUrl"
								placeholder="https://example.com/feed.xml"
								type="text"
								disabled={isSearching}
							/>

							{isSearching ? (
								<Button
									className="w-full sm:w-fit"
									variant="outline"
									type="submit"
									disabled={isSearching}
								>
									<Spinner /> Searching...
								</Button>
							) : (
								<Button
									className="w-full sm:w-fit"
									variant="outline"
									type="submit"
									disabled={isSearching}
								>
									<SearchIcon /> Search Feed
								</Button>
							)}
						</div>
						<FieldError />
					</Field>
				</Form>

				<NewFeedPreview feeds={feeds ?? []} feed={feed} />

				<DialogFooter className="grid grid-cols-2 justify-between">
					<DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
					<Button type="button" onClick={addFeedHandler} disabled={!feed || isAdding}>
						{isAdding ? (
							<>
								<Spinner /> <span className="hidden sm:block">Adding...</span>
							</>
						) : (
							<>
								<PlusIcon /> Add
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogPopup>
		</Dialog>
	);
}
