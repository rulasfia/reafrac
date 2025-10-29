import type { FeedEntry } from '@/lib/server/types';
import { Link, useLoaderData, useLocation } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn, formatRelativeDate } from '@/lib/utils';
import { updateEntryStatusServerFn } from '@/lib/server/entry-sfn';
import { useServerFn } from '@tanstack/react-start';

export function EntryItem({ entry }: { entry: FeedEntry }) {
	const { search } = useLocation();
	const { integration } = useLoaderData({ from: '/reader' });
	const qc = useQueryClient();
	const updateEntryStatus = useServerFn(updateEntryStatusServerFn);

	const { mutate } = useMutation({
		mutationFn: (id: number) => updateEntryStatus({ data: { entryId: id } }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['entries', integration?.id] });
		}
	});

	return (
		<Link
			to="/reader"
			search={{ ...search, entry: entry.id, view: undefined }}
			onClick={() => mutate(entry.id)}
			className={cn(
				'mx-2 my-0.5 rounded-sm border-[0.5px] border-transparent p-2 text-sm text-foreground',
				search.entry === entry.id
					? 'border-border/20 bg-primary/10 shadow-sm shadow-accent/50 dark:bg-neutral-800'
					: 'hover:bg-foreground/5',
				entry.status === 'read' ? 'text-foreground/50' : ''
			)}
		>
			<div className="mb-1 flex flex-row items-center gap-x-1">
				<img
					width={16}
					height={16}
					src={`${integration?.serverUrl}/feed/icon/${entry.feed.icon?.external_icon_id}`}
					alt={`${entry.feed.title} icon`}
					className="size-4 rounded-xs border border-border"
				/>
				<span className="text-xs text-foreground/75">{entry.feed.title}</span>
				<span>·</span>
				<span className="text-xs text-foreground/75">
					{formatRelativeDate(new Date(entry.published_at))}
				</span>
			</div>
			<span className="font-medium text-pretty">{entry.title}</span>
		</Link>
	);
}
