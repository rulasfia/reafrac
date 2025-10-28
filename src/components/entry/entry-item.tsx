import type { FeedEntry } from '@/lib/server/types';
import { Link, useLoaderData, useLocation } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
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
			search={{ ...search, entry: entry.id }}
			onClick={() => mutate(entry.id)}
			className={cn(
				'mx-2 my-0.5 rounded-sm border-[0.5px] border-transparent p-2 text-sm text-foreground',
				search.entry === entry.id ? 'bg-primary/10 dark:bg-neutral-800' : 'hover:bg-foreground/5',
				entry.status === 'read' ? 'text-foreground/50' : ''
			)}
		>
			{entry.title}
		</Link>
	);
}
