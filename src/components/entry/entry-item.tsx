import { Link, useLoaderData, useLocation } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn, formatRelativeDate } from '@/lib/utils';
import { updateEntryStatusServerFn } from '@/lib/server/entry-sfn';
import { useServerFn } from '@tanstack/react-start';
import type { Schema } from '@/lib/db-schema';
import { BookmarkIcon } from 'lucide-react';
import { useSidebar } from '../ui/sidebar';

type Props = {
	entry: Omit<
		Schema['Entry'],
		| 'content'
		| 'createdAt'
		| 'updatedAt'
		| 'thumbnail'
		| 'thumbnailCaption'
		| 'userId'
		| 'starred'
		| 'status'
	> & {
		feed: Pick<Schema['Feed'], 'id' | 'categoryId' | 'title' | 'icon' | 'link'> | null;
	} & {
		meta: Pick<Schema['UserEntry'], 'userId' | 'status' | 'starred'>;
	};
};

export function EntryItem({ entry }: Props) {
	const { search } = useLocation();
	const { toggleSidebar, isMobile } = useSidebar();
	const { integration } = useLoaderData({ from: '/reader' });
	const qc = useQueryClient();
	const updateEntryStatus = useServerFn(updateEntryStatusServerFn);

	const { mutate } = useMutation({
		mutationFn: (id: number) => updateEntryStatus({ data: { entryId: id } }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['entries', integration?.id] });
		}
	});

	const onEntryClick = () => {
		if (isMobile) toggleSidebar();
		if (entry.meta.status === 'unread') {
			mutate(entry.id);
		}
	};

	return (
		<Link
			to="/reader"
			preload={false}
			search={{ ...search, entry: entry.id, view: undefined }}
			onClick={onEntryClick}
			className={cn(
				'rounded-sm border-l-4 border-transparent py-2 pr-2 pl-3 text-sm text-foreground',
				search.entry === entry.id
					? 'border-primary bg-background shadow-xs shadow-accent'
					: 'hover:bg-foreground/5',
				entry.meta.status === 'read' && search.entry !== entry.id ? 'text-foreground/50' : '',
				entry.meta.status === 'read' && search.entry === entry.id ? 'text-foreground/80' : ''
			)}
		>
			<div className="mb-1 flex flex-row items-center gap-x-1">
				<img
					width={16}
					height={16}
					src={entry.feed?.icon}
					alt={`${entry.feed?.title} icon`}
					className="size-4 rounded-xs border border-border"
				/>
				<span className="text-xs text-foreground/75">{entry.feed?.title}</span>
				<span>·</span>
				<span className="text-xs text-foreground/75">{formatRelativeDate(entry.publishedAt)}</span>
				{entry.meta.starred ? (
					<>
						<span>·</span>
						<BookmarkIcon fill="var(--color-foreground)" className="size-4" />
					</>
				) : null}
			</div>
			<span className="font-medium text-pretty">{entry.title}</span>
		</Link>
	);
}
