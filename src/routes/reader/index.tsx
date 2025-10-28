import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { getEntryServerFn } from '@/lib/server/entry-sfn';
import { Loader } from '@/components/ui/loader';

export const Route = createFileRoute('/reader/')({
	component: RouteComponent
});

function RouteComponent() {
	const { entry } = Route.useSearch();
	const getEntry = useServerFn(getEntryServerFn);

	const res = useQuery({
		enabled: !!entry,
		queryKey: ['entry', entry],
		queryFn: async () => getEntry({ data: { entryId: entry ?? 0 } })
	});

	if (!entry) return null;

	return (
		<div className="grid grid-cols-1 justify-center gap-y-1">
			{res.status === 'pending' && <Loader className="mx-auto my-4" />}
			{res.status === 'error' && 'Error'}
			{res.status === 'success' && (
				<>
					<div className="mx-auto mb-1 flex w-full max-w-2xl items-center gap-x-2 text-sm text-foreground/75">
						<a href={res.data.feed.site_url} className="text-primary hover:underline">
							{res.data.feed.title}
						</a>
						<span className="h-full w-px bg-foreground/50" />
						<span>{res.data.author}</span>
					</div>
					<h1 className="mx-auto max-w-2xl text-3xl leading-[105%] font-bold text-pretty">
						{res.data?.title}
					</h1>
					<div
						className="mx-auto prose mt-4 max-w-2xl prose-neutral dark:prose-invert prose-a:decoration-accent prose-a:hover:decoration-foreground prose-img:rounded-lg prose-img:border prose-img:border-border prose-img:shadow-xs"
						dangerouslySetInnerHTML={{ __html: res.data?.content }}
					/>
				</>
			)}
		</div>
	);
}
