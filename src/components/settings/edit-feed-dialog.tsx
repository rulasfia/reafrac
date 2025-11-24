import { SquarePenIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { useQueryClient } from '@tanstack/react-query';
import {
	Dialog,
	DialogClose,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogPopup,
	DialogTitle
} from '../ui/dialog';
import { toastManager } from '../ui/toast';
import { startTransition, useEffect, useState } from 'react';
import type { Schema } from '@/lib/db-schema';
import { Form } from '../ui/form';
import { Field, FieldDescription, FieldError, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { z } from 'zod/mini';
import { useServerFn } from '@tanstack/react-start';
import { updateFeedServerFn } from '@/lib/server/feed-sfn';
import { Spinner } from '../ui/spinner';

const editFeedSchema = z.object({
	title: z.string({ error: 'Invalid title' }),
	urlPrefix: z.string({ error: 'Invalid URL Prefix' }),
	icon: z
		.url({ error: 'Invalid icon URL' })
		.check(
			z.refine(
				(val) =>
					val.includes('.ico') ||
					val.includes('.png') ||
					val.includes('.svg') ||
					val.includes('.jpg') ||
					val.includes('.jpeg'),
				{ message: 'Invalid icon format' }
			)
		)
});

type Errors = Record<string, string | string[]>;

interface Props {
	item:
		| (Omit<Schema['Feed'], 'userId' | 'categoryId'> & {
				meta: Pick<Schema['UserFeedSubscription'], 'icon' | 'urlPrefix' | 'title'>;
		  })
		| null;
	onUpdate?: (data: { feedId: string; title?: string; url?: string }) => Promise<void>;
	onClose?: () => void;
}

export function EditFeedDialog({ item, onClose }: Props) {
	const qc = useQueryClient();
	const [isOpen, setIsOpen] = useState(false);
	const [errors, setErrors] = useState<Errors>({});
	const handleClearErrors = (next: Errors) => setErrors(next);
	const [isEditing, setIsEditing] = useState(false);

	const updateFeed = useServerFn(updateFeedServerFn);

	useEffect(() => {
		if (item) setIsOpen(true);
		else setIsOpen(false);
	}, [item]);

	const editFeedHandler = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!item) return;

		try {
			setErrors({});
			const formData = new FormData(event.currentTarget);
			// Prompt for new title
			const urlPrefix = formData.get('urlPrefix') as string;
			const title = formData.get('title') as string;
			const icon = formData.get('icon') as string;

			const result = editFeedSchema.safeParse({ title, urlPrefix, icon });
			if (!result.success) {
				const { fieldErrors } = z.flattenError(result.error);
				setErrors(fieldErrors);
				return;
			}

			// Prepare update data
			const updateData = {
				feedId: item.id,
				title: result.data.title.trim(),
				icon: result.data.icon.trim(),
				urlPrefix: result.data.urlPrefix.trim()
			};

			setIsEditing(true);

			await updateFeed({ data: updateData });
			// don't await, let it start in the bg
			qc.invalidateQueries({ queryKey: ['entries'] });

			toastManager.add({
				title: 'Success',
				description: 'Feed updated successfully',
				type: 'success'
			});
			onOpenChange(false);
		} catch (error) {
			console.error('Failed to update feed:', error);
			throw error;
		} finally {
			setIsEditing(false);
		}
	};

	const onOpenChange = (val: boolean) => {
		setIsOpen(val);
		setIsEditing(false);

		setTimeout(() => {
			startTransition(() => {
				onClose?.();
			});
		}, 150);
	};

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogPopup className="">
				<DialogHeader>
					<DialogTitle>Edit Feed</DialogTitle>
					<DialogDescription>Edit feed properties.</DialogDescription>
				</DialogHeader>
				{item ? (
					<Form
						id="editFeedForm"
						onSubmit={editFeedHandler}
						errors={errors}
						onClearErrors={handleClearErrors}
					>
						<Field name="title">
							<FieldLabel>Title</FieldLabel>
							<Input
								defaultValue={item.meta.title || item?.title}
								name="title"
								placeholder="Feed Title"
								type="text"
							/>
							<FieldError />
						</Field>

						<Field name="feedUrl">
							<FieldLabel>Feed URL</FieldLabel>
							<Input
								disabled
								defaultValue={item?.link}
								name="feedUrl"
								placeholder="Feed URL"
								type="url"
							/>
							<FieldError />
						</Field>

						<Field name="urlPrefix">
							<FieldLabel>URL Prefix</FieldLabel>
							<Input
								name="urlPrefix"
								defaultValue={item.meta.urlPrefix ?? undefined}
								placeholder="https://prefix.url/"
								type="text"
							/>
							<FieldDescription>
								When you click 'Read Original Source' link, it will go to:{' '}
								<span className="font-mono wrap-break-word">{`https://prefix.url/https://original.url`}</span>
							</FieldDescription>
							<FieldError />
						</Field>

						<Field name="icon">
							<FieldLabel>Icon URL</FieldLabel>
							<Input
								defaultValue={item.meta.icon || item?.icon}
								className="w-full"
								placeholder="Icon URL"
								type="text"
							/>
							<FieldError />
						</Field>

						<button type="submit" className="hidden" />
					</Form>
				) : null}

				<DialogFooter className="grid grid-cols-2 justify-between">
					<DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
					<Button
						type="button"
						onClick={() => {
							const form = document.getElementById('editFeedForm') as HTMLFormElement;
							form.requestSubmit();
						}}
					>
						{isEditing ? (
							<>
								<Spinner /> <span className="hidden sm:block">Saving...</span>
							</>
						) : (
							<>
								<SquarePenIcon /> Save
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogPopup>
		</Dialog>
	);
}
