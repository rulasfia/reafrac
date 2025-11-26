import { Separator } from '../ui/separator';
import type { ParsedFeed } from '@reafrac/feed-utils';
import type { Schema } from '@reafrac/database';

type Props = {
	feed: (ParsedFeed & { feedUrl: string }) | null;
	feeds: Array<
		Omit<Schema['Feed'], 'userId' | 'categoryId'> & {
			meta: Pick<Schema['UserFeedSubscription'], 'icon' | 'urlPrefix' | 'title'>;
		}
	>;
};

const STARTER_FEED = [
	{
		link: 'https://feeds.arstechnica.com/arstechnica/features',
		title: 'Arstechnica long-form feature articles'
	},
	{ link: 'https://newsletter.posthog.com/feed', title: 'Product for Engineers by PostHog' },
	{ link: 'https://www.theverge.com/rss/index.xml', title: 'The Verge - About news & technology' }
];

export function NewFeedPreview(props: Props) {
	const clickSuggestionHandler = (link: string) => {
		const form = document.getElementById('feedForm') as HTMLFormElement;
		const input = form.querySelector('input[name="feedUrl"]') as HTMLInputElement;
		input.value = link;
	};

	if (!props.feed && props.feeds.length === 0) {
		return (
			<div>
				<span className="py-2 text-sm text-gray-500">
					You don't follow any feeds yet. Here are some recommendations to help you get started:
				</span>
				<ul className="list mt-3 list-inside list-disc sm:mt-1">
					{STARTER_FEED.map((f) => (
						<li key={f.link}>
							<button
								className="cursor-pointer text-sm text-primary hover:underline"
								onClick={() => clickSuggestionHandler(f.link)}
							>
								{f.title}
							</button>
						</li>
					))}
				</ul>
			</div>
		);
	}

	if (!props.feed) {
		return <div className="flex min-h-[40vh] w-full flex-col rounded-md sm:min-h-0" />;
	}

	return (
		<div className="flex min-h-[40vh] w-full flex-col overflow-hidden rounded-md bg-muted p-4 sm:min-h-0 dark:bg-input/32">
			<div className="flex items-center gap-x-3">
				<img
					src={props.feed.icon}
					alt="Jagat Review Logo"
					width={32}
					height={32}
					className="size-8 rounded-sm"
				/>
				<div className="flex flex-col">
					<span className="text-lg font-semibold">{props.feed.title}</span>
					<span className="line-clamp-1 font-mono text-xs">{props.feed.feedUrl}</span>
				</div>
			</div>
			<Separator className="my-2" />
			<span className="font-semibold">Recent Posts</span>
			<ul className="list list-inside list-disc text-sm">
				{props.feed.entries.slice(0, 5).map((entry) => (
					<li key={entry.id} className="text-pretty">
						{entry.title}
					</li>
				))}
			</ul>
		</div>
	);
}
