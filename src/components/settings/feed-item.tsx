import { IconCircleMinus, IconPencilBox } from '@intentui/icons';
import type { Schema } from '@/lib/db-schema';
import { useState } from 'react';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { toastManager } from '../ui/toast';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import { Separator } from '../ui/separator';

interface FeedItemProps {
	item: Schema['Feed'];
	onRemove?: (feedId: string) => Promise<void>;
	onUpdate?: (data: { feedId: string; title?: string; url?: string }) => Promise<void>;
}

export function FeedItem({ item, onRemove, onUpdate }: FeedItemProps) {
	const { search } = useLocation();
	const navigate = useNavigate();
	const [isRemoving, setIsRemoving] = useState(false);
	const [isEditing, setIsEditing] = useState(false);

	const handleRemove = async () => {
		if (onRemove && confirm(`Are you sure you want to remove "${item.title}"?`)) {
			setIsRemoving(true);
			try {
				await onRemove(item.id);
				if (search.page === item.id) {
					navigate({ to: '/reader/settings', search: { ...search, page: undefined } });
				}
			} catch (error) {
				console.error('Failed to remove feed:', error);
				throw error;
			} finally {
				setIsRemoving(false);
			}
		}
	};

	const handleEdit = async () => {
		setIsEditing(true);
		try {
			// Prompt for new title
			const newTitle = prompt('Enter new title:', item.title);
			if (newTitle === null) {
				// User cancelled
				return;
			}

			// Validate that at least one field was changed
			if (newTitle.trim() === item.title) {
				toastManager.add({
					title: 'Feed Unchanged',
					description: 'No changes were made to the feed.',
					type: 'info'
				});
				return;
			}

			// Prepare update data
			const updateData: { feedId: string; title?: string; url?: string } = {
				feedId: item.id
			};

			if (newTitle.trim() !== item.title) {
				updateData.title = newTitle.trim();
			}

			// Call onUpdate callback if provided
			if (onUpdate) {
				await onUpdate(updateData);
			}
		} catch (error) {
			console.error('Failed to update feed:', error);
			throw error;
		} finally {
			setIsEditing(false);
		}
	};

	return (
		<div className="flex flex-row items-center gap-x-2">
			<Button
				size="icon-sm"
				variant="destructive-outline"
				onClick={handleRemove}
				disabled={isRemoving || !onRemove}
			>
				{isRemoving ? <Spinner /> : <IconCircleMinus />}
			</Button>
			<Button size="icon-sm" variant="outline" onClick={handleEdit} disabled={isEditing}>
				{isEditing ? <Spinner /> : <IconPencilBox />}
			</Button>
			<Separator orientation="vertical" className="mx-2" />
			<img
				width={18}
				height={18}
				src={item.icon === '' ? '/favicon.ico' : item.icon}
				alt={item.title}
				className="size-5 rounded-xs border border-border"
			/>
			<span>{item.title}</span>
		</div>
	);
}
