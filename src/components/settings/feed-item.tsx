import { IconCircleMinus } from '@intentui/icons';
import { Button } from '../ui/button';
import type { Schema } from '@/lib/db-schema';

export function FeedItem({ item }: { item: Schema['Feed'] }) {
	return (
		<div className="flex flex-row items-center gap-x-2">
			<Button size="sq-sm" intent="plain" className="hover:bg-danger/10" isDisabled>
				<IconCircleMinus className="mr-2 text-danger!" />
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
