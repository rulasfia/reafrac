import type { Feed } from '@/lib/server/types';
import { IconCircleMinus } from '@intentui/icons';
import { useLoaderData } from '@tanstack/react-router';
import { Button } from '../ui/button';

export function FeedItem({ item }: { item: Feed }) {
	const { integration } = useLoaderData({ from: '/reader' });
	return (
		<div className="flex flex-row items-center gap-x-2">
			<Button size="sq-sm" intent="plain" className="hover:bg-background" isDisabled>
				<IconCircleMinus className="mr-2 text-danger!" />
			</Button>
			<img
				width={18}
				height={18}
				src={`${integration?.serverUrl}/feed/icon/${item.icon?.external_icon_id}`}
				alt={item.title}
				className="size-5 rounded-xs border border-border"
			/>
			<span>{item.title}</span>
		</div>
	);
}
