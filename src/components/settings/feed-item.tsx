import type { Schema } from '@/lib/db-schema';
import { useState } from 'react';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import { Separator } from '../ui/separator';
import { CircleMinusIcon, SquarePenIcon } from 'lucide-react';

interface FeedItemProps {
	item: Omit<Schema['Feed'], 'userId' | 'categoryId'> & {
		meta: Pick<Schema['UserFeedSubscription'], 'title' | 'icon' | 'urlPrefix'>;
	};
	onRemove?: (feedId: string) => Promise<void>;
	onUpdate?: () => void;
}

export function FeedItem({ item, onRemove, onUpdate }: FeedItemProps) {
	const { search } = useLocation();
	const navigate = useNavigate();
	const [isRemoving, setIsRemoving] = useState(false);

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

	const getFeedIcon = () => {
		if (item.meta.icon) {
			return item.meta.icon;
		} else if (item.icon) {
			return item.icon;
		} else {
			return '/favicon.ico';
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
				{isRemoving ? <Spinner /> : <CircleMinusIcon />}
			</Button>
			<Button size="icon-sm" variant="outline" onClick={() => onUpdate?.()}>
				<SquarePenIcon />
			</Button>
			<Separator orientation="vertical" className="mx-2" />
			<img
				width={18}
				height={18}
				src={getFeedIcon()}
				alt={item.title}
				className="size-5 rounded-xs border border-border"
			/>
			<span>{item.title}</span>
		</div>
	);
}
