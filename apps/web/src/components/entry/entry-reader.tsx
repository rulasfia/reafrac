import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import {
	getEntryContentServerFn,
	getEntryServerFn,
	saveEntryToBookmarkServerFn
} from '@/lib/server/entry-sfn';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { BookmarkIcon, ExternalLinkIcon } from 'lucide-react';
import { toastManager } from '@/components/ui/toast';
import { Separator } from '@/components/ui/separator';
import { FloatingMenuButton } from '@/components/entry/floating-menu-button';
import { EntryHeader } from '@/components/entry/entry-header';
import { useEffect } from 'react';

export function EntryReader() {
	const navigate = useNavigate({ from: '/reader/' });
	const search = useSearch({ from: '/reader/' });
	const qc = useQueryClient();
	const getEntry = useServerFn(getEntryServerFn);
	const getEntryContent = useServerFn(getEntryContentServerFn);
	const saveEntryToBookmark = useServerFn(saveEntryToBookmarkServerFn);

	const entry = useQuery({
		enabled: !!search.entry,
		queryKey: ['entry', search.entry],
		queryFn: async () => getEntry({ data: { entryId: search.entry ?? 0 } })
	});

	const content = useQuery({
		enabled: search.view === 'expanded' && entry.status === 'success',
		staleTime: Infinity,
		retry: false,
		queryKey: ['entry-content', search.entry],
		queryFn: async () =>
			getEntryContent({
				data: {
					entryId: entry.data?.id ?? 0,
					entryUrl: entry.data?.link ?? '',
					prefixUrl: entry.data?.feed.meta.urlPrefix || undefined
				}
			})
	});

	// handle full content extraction error in the ui
	useEffect(() => {
		if (content.status === 'error') {
			toastManager.add({
				title: 'Failed to get full article content!',
				description: 'Please visit the original website to view the full article.',
				type: 'error'
			});
			navigate({
				search: (prev) => {
					return { ...prev, view: 'summary' };
				}
			});
		}
	}, [content.status, navigate]);

	const onSaveToBookmark = async () => {
		try {
			if (!entry.data) return;
			const newValue = !entry.data.meta?.starred;
			await saveEntryToBookmark({ data: { entryId: entry.data.id, saved: newValue } });
			await qc.invalidateQueries({ queryKey: ['entry', search.entry] });
			toastManager.add({
				title: newValue ? 'Added to bookmark' : 'Removed from bookmark',
				type: 'success'
			});
		} catch (error) {
			console.error(error);
			toastManager.add({ title: 'Failed to update bookmark', type: 'error' });
		}
	};

	return (
		<div className="container mx-auto grid max-w-[65ch] grid-cols-1 justify-center gap-y-1 pb-16 lg:pb-0 xl:max-w-2xl xl:min-w-xl">
			{entry.data ? <title>{entry.data?.title}</title> : null}
			<EntryHeader />
			<FloatingMenuButton />

			{!search.entry ? (
				<div className="mx-auto grid grid-cols-1 items-center justify-center gap-y-1 py-12 lg:py-4">
					<p className="text-center font-medium opacity-75">No Entry Selected</p>
				</div>
			) : null}

			{!!search.entry && entry.status === 'pending' ? <Spinner className="mx-auto my-4" /> : null}
			{!!search.entry && entry.status === 'error' ? 'Error!' : null}
			{!!search.entry && entry.status === 'success' ? (
				<>
					<div className="mx-auto mt-2 flex w-full flex-wrap items-center gap-x-2 gap-y-1 text-sm text-foreground/75 lg:mt-0">
						<a
							href={entry.data.feed?.link}
							className="text-primary hover:underline"
							rel="noopener noreferrer"
							data-umami-event="outbound-link-click"
							data-umami-event-url={entry.data.feed?.link}
						>
							{entry.data.feed?.title}
						</a>
						<Separator orientation="vertical" />
						<span className="w-fit">{entry.data.author}</span>
						<Separator orientation="vertical" />
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
					<h1 className="mx-auto mt-4 mb-3 w-full font-serif text-3xl font-semibold text-pretty">
						{entry.data?.title}
					</h1>

					<div className="mb-4 flex items-center">
						<Button
							variant="outline"
							className="w-fit cursor-pointer rounded-r-none"
							onClick={onSaveToBookmark}
						>
							{entry.data.meta?.starred ? (
								<BookmarkIcon fill="var(--color-primary)" strokeWidth={1} />
							) : (
								<BookmarkIcon />
							)}
							Save
						</Button>

						<Button
							variant="outline"
							className="-ml-px w-fit cursor-pointer rounded-none"
							render={
								<Link
									to="/reader"
									search={{ ...search, view: search.view === 'expanded' ? undefined : 'expanded' }}
								/>
							}
						>
							{search.view === 'expanded' && content.status === 'success'
								? 'Back to Summary'
								: 'Read Full Article'}
							{content.isLoading ? <Spinner /> : null}
						</Button>

						<Button
							variant="outline"
							className="-ml-px w-fit cursor-pointer rounded-l-none"
							render={
								<a
									href={
										entry.data.feed.meta.urlPrefix
											? `${entry.data.feed.meta.urlPrefix}${entry.data.link}`
											: entry.data.link
									}
									target="_blank"
									rel="noopener noreferrer"
									data-umami-event="outbound-link-click"
									data-umami-event-url={entry.data.link}
								/>
							}
						>
							Read Original Source
							<ExternalLinkIcon />
						</Button>
					</div>

					{entry.data?.thumbnail ? (
						<div className="prose mb-4 max-w-2xl prose-neutral xl:min-w-2xl dark:prose-invert">
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
						className="xl:max-w-1xl container mx-auto prose w-full prose-neutral xl:min-w-xl dark:prose-invert prose-a:decoration-accent prose-a:hover:decoration-foreground prose-img:rounded-xl prose-img:border prose-img:border-border prose-img:shadow-sm prose-img:shadow-accent/51 prose-video:rounded-xl prose-video:border prose-video:border-border prose-video:shadow-sm prose-video:shadow-accent/50"
						dangerouslySetInnerHTML={{
							__html:
								search.view === 'expanded' && content.status === 'success'
									? // isReadingFullContent && content.status === 'success'
										(content.data?.content ?? 'Not Available!')
									: entry.data?.content || entry.data?.description
						}}
					/>
				</>
			) : null}
		</div>
	);
}
