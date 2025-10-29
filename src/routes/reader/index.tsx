import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { getEntryContentServerFn, getEntryServerFn } from '@/lib/server/entry-sfn';
import { Loader } from '@/components/ui/loader';
import { Button, buttonStyles } from '@/components/ui/button';
import { IconOpenLink, IconX } from '@intentui/icons';

export const Route = createFileRoute('/reader/')({
	component: RouteComponent
});

function RouteComponent() {
	const search = Route.useSearch();
	const getEntry = useServerFn(getEntryServerFn);
	const getEntryContent = useServerFn(getEntryContentServerFn);
	const navigate = useNavigate({ from: Route.fullPath });

	const entry = useQuery({
		enabled: !!search.entry,
		queryKey: ['entry', search.entry],
		queryFn: async () => getEntry({ data: { entryId: search.entry ?? 0 } })
	});

	const content = useQuery({
		enabled: !!entry.data && search.view === 'expanded',
		staleTime: Infinity,
		queryKey: ['entry-content', search.entry],
		queryFn: async () => getEntryContent({ data: { entryUrl: entry.data?.url ?? '' } })
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
			{entry.status === 'pending' && <Loader className="mx-auto my-4" />}
			{entry.status === 'error' && 'Error'}
			{entry.status === 'success' && (
				<>
					<div className="mx-auto flex w-full items-center gap-x-2 text-sm text-foreground/75">
						<a href={entry.data.feed.site_url} className="text-primary hover:underline">
							{entry.data.feed.title}
						</a>
						<span className="h-full w-px bg-foreground/50" />
						<span>{entry.data.author}</span>
						<span className="h-full w-px bg-foreground/50" />
						<span>
							{new Date(entry.data.published_at).toLocaleString(['en-SG', 'en-US'], {
								day: 'numeric',
								month: 'long',
								year: 'numeric',
								hour: 'numeric',
								minute: 'numeric'
							})}
						</span>
						<span className="h-full w-px bg-foreground/50" />
						<a
							href={entry.data.url}
							target="_blank"
							className="inline-flex items-center gap-x-1 text-primary hover:underline"
						>
							External Link <IconOpenLink />
						</a>
					</div>
					<h1 className="mx-auto my-4 w-full text-3xl leading-[105%] font-bold text-pretty">
						{entry.data?.title}
					</h1>
					<div
						className="mx-auto prose max-w-2xl prose-neutral dark:prose-invert prose-a:decoration-accent prose-a:hover:decoration-foreground prose-img:rounded-xl prose-img:border prose-img:border-border prose-img:shadow-sm prose-img:shadow-accent/50"
						dangerouslySetInnerHTML={{
							__html:
								search.view === 'expanded' && content.status === 'success'
									? (content.data?.content ?? 'Not Available!')
									: entry.data?.content
						}}
					/>

					<Link
						className={buttonStyles({ intent: 'outline', className: 'mt-4 w-fit cursor-pointer' })}
						to="/reader"
						search={{ ...search, view: search.view === 'expanded' ? undefined : 'expanded' }}
					>
						{search.view === 'expanded' && content.status === 'success'
							? 'Back to Summary'
							: 'Read Full Article'}
						{content.isLoading ? <Loader /> : null}
					</Link>
				</>
			)}
		</div>
	);
}
