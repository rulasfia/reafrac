import { IconCircleMinus } from '@intentui/icons';
import { Button } from '../ui/button';
import type { Schema } from '@/lib/db-schema';
import { useState } from 'react';
import { Loader } from '../ui/loader';

interface FeedItemProps {
	item: Schema['Feed'];
	onRemove?: (feedId: string) => Promise<void>;
}

export function FeedItem({ item, onRemove }: FeedItemProps) {
	const [isRemoving, setIsRemoving] = useState(false);

	const handleRemove = async () => {
		if (onRemove && confirm(`Are you sure you want to remove "${item.title}"?`)) {
			setIsRemoving(true);
			try {
				await onRemove(item.id);
			} catch (error) {
				console.error('Failed to remove feed:', error);
			} finally {
				setIsRemoving(false);
			}
		}
	};

	return (
		<div className="flex flex-row items-center gap-x-2">
			<Button
				size="sq-sm"
				intent="plain"
				className="hover:bg-danger/10"
				onPress={handleRemove}
				isDisabled={isRemoving || !onRemove}
			>
				{isRemoving ? <Loader /> : <IconCircleMinus className="mr-2 text-danger!" />}
			</Button>
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
