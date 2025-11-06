import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import {
	getEntryContentServerFn,
	getEntryServerFn,
	saveEntryToBookmarkServerFn
} from '@/lib/server/entry-sfn';
import { Loader } from '@/components/ui/loader';
import { Button, buttonStyles } from '@/components/ui/button';
import { IconBookmark, IconBookmarkFill, IconOpenLink, IconX } from '@intentui/icons';
import { toast } from 'sonner';

export const Route = createFileRoute('/reader/')({
	component: RouteComponent
});

function RouteComponent() {
	const search = Route.useSearch();
	const qc = useQueryClient();
	const getEntry = useServerFn(getEntryServerFn);
	const getEntryContent = useServerFn(getEntryContentServerFn);
	const saveEntryToBookmark = useServerFn(saveEntryToBookmarkServerFn);
	const navigate = useNavigate({ from: Route.fullPath });

	const entry = useQuery({
		enabled: !!search.entry,
		queryKey: ['entry', search.entry],
		queryFn: async () => getEntry({ data: { entryId: search.entry ?? 0 } })
	});

	const content = useQuery({
		enabled: false,
		staleTime: Infinity,
		queryKey: ['entry-content', search.entry],
		queryFn: async () => getEntryContent({ data: { entryUrl: entry.data?.link ?? '' } })
	});

	const onCloseReader = () => {
		navigate({ search: (prev) => ({ ...prev, entry: undefined }) });
	};

	const onSaveToBookmark = async () => {
		try {
			if (!entry.data) return;
			const newValue = !entry.data.starred;
			await saveEntryToBookmark({ data: { entryId: entry.data.id, saved: newValue } });
			await qc.invalidateQueries({ queryKey: ['entry', search.entry] });
			toast.success(newValue ? 'Added to bookmark' : 'Removed from bookmark');
		} catch (error) {
			console.error(error);
			toast.error('Failed to update bookmark');
		}
	};

	if (!search.entry) {
		return (
			<div className="mx-auto grid max-w-2xl grid-cols-1 items-center justify-center gap-y-1">
				<p className="text-center font-medium opacity-75">No Entry Selected</p>
			</div>
		);
	}

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
						<a href={entry.data.feed?.link} className="text-primary hover:underline">
							{entry.data.feed?.title}
						</a>
						<span className="h-full w-px bg-foreground/50" />
						<span className="w-fit">{entry.data.author}</span>
						<span className="h-full w-px bg-foreground/50" />
						<span>
							{new Date(entry.data.publishedAt).toLocaleString(['en-SG', 'en-US'], {
								day: 'numeric',
								month: 'long',
								year: 'numeric',
								hour: 'numeric',
								minute: 'numeric'
							})}
						</span>
					</div>
					<h1 className="mx-auto mt-4 mb-3 w-full text-3xl leading-[105%] font-bold text-pretty">
						{entry.data?.title}
					</h1>

					<div className="mb-4 flex items-center">
						{/*<Link
							className={buttonStyles({
								intent: 'outline',
								className: 'mt-4 w-fit cursor-pointer rounded-r-none'
							})}
							to="/reader"
							search={{ ...search, view: search.view === 'expanded' ? undefined : 'expanded' }}
						>
							{search.view === 'expanded' && content.status === 'success'
								? 'Back to Summary'
								: 'Read Full Article'}
							{content.isLoading ? <Loader /> : null}
						</Link>*/}
						<Button
							intent="outline"
							className="w-fit cursor-pointer rounded-r-none"
							onClick={onSaveToBookmark}
						>
							{entry.data.starred ? <IconBookmarkFill /> : <IconBookmark />}
							Save
						</Button>
						<a
							className={buttonStyles({
								intent: 'outline',
								className: '-ml-px w-fit cursor-pointer rounded-l-none'
							})}
							href={entry.data.link}
							target="_blank"
						>
							Read Original Source
							<IconOpenLink />
						</a>
					</div>

					{entry.data?.thumbnail ? (
						<div className="prose mb-4 prose-neutral dark:prose-invert">
							<figure>
								<img
									src={entry.data?.thumbnail}
									alt={`${entry.data?.title} image thumbnail`}
									className="rounded-xl border border-border shadow-sm shadow-accent/50"
									loading="lazy"
								/>
								<figcaption>{entry.data?.thumbnailCaption ?? entry.data?.title}</figcaption>
							</figure>
						</div>
					) : null}
					<div
						className="mx-auto prose max-w-2xl prose-neutral xl:min-w-2xl dark:prose-invert prose-a:decoration-accent prose-a:hover:decoration-foreground prose-img:rounded-xl prose-img:border prose-img:border-border prose-img:shadow-sm prose-img:shadow-accent/50"
						dangerouslySetInnerHTML={{
							__html:
								search.view === 'expanded' && content.status === 'success'
									? (content.data?.content ?? 'Not Available!')
									: entry.data?.content || entry.data?.description
						}}
					/>
				</>
			)}
		</div>
	);
}
