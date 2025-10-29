import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { getEntryServerFn } from '@/lib/server/entry-sfn';
import { Loader } from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import { IconOpenLink, IconX } from '@intentui/icons';

export const Route = createFileRoute('/reader/')({
	component: RouteComponent
});

function RouteComponent() {
	const search = Route.useSearch();
	const getEntry = useServerFn(getEntryServerFn);
	const navigate = useNavigate({ from: Route.fullPath });

	const res = useQuery({
		enabled: !!search.entry,
		queryKey: ['entry', search.entry],
		queryFn: async () => getEntry({ data: { entryId: search.entry ?? 0 } })
	});

	if (!search.entry) return null;

	const onCloseReader = () => {
		navigate({ search: (prev) => ({ ...prev, entry: undefined }) });
	};

	return (
		<div className="mx-auto grid max-w-2xl grid-cols-1 justify-center gap-y-1">
			<Button
				size="sq-sm"
				intent="outline"
				className="absolute top-1.5 right-1.5 cursor-pointer rounded-sm"
				onClick={onCloseReader}
			>
				<IconX />
			</Button>
			{res.status === 'pending' && <Loader className="mx-auto my-4" />}
			{res.status === 'error' && 'Error'}
			{res.status === 'success' && (
				<>
					<div className="mx-auto flex w-full items-center gap-x-2 text-sm text-foreground/75">
						<a href={res.data.feed.site_url} className="text-primary hover:underline">
							{res.data.feed.title}
						</a>
						<span className="h-full w-px bg-foreground/50" />
						<span>{res.data.author}</span>
						<span className="h-full w-px bg-foreground/50" />
						<span>
							{new Date(res.data.published_at).toLocaleString(['en-SG', 'en-US'], {
								day: 'numeric',
								month: 'long',
								year: 'numeric',
								hour: 'numeric',
								minute: 'numeric'
							})}
						</span>
						<span className="h-full w-px bg-foreground/50" />
						<a
							href={res.data.url}
							target="_blank"
							className="inline-flex items-center gap-x-1 text-primary hover:underline"
						>
							External Link <IconOpenLink />
						</a>
					</div>
					<h1 className="mx-auto my-4 w-full text-3xl leading-[105%] font-bold text-pretty">
						{res.data?.title}
					</h1>
					<div
						className="mx-auto prose max-w-2xl prose-neutral dark:prose-invert prose-a:decoration-accent prose-a:hover:decoration-foreground prose-img:rounded-xl prose-img:border prose-img:border-border prose-img:shadow-sm prose-img:shadow-accent/50"
						dangerouslySetInnerHTML={{ __html: res.data?.content }}
					/>
				</>
			)}
		</div>
	);
}
