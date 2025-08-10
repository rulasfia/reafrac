<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import BookmarkIcon from '@lucide/svelte/icons/bookmark';
	import HistoryIcon from '@lucide/svelte/icons/history';
	import HouseIcon from '@lucide/svelte/icons/house';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import type { ComponentProps } from 'svelte';
	import EntrySidebar from './entry-sidebar.svelte';

	const items = [
		{
			title: 'Today',
			url: '#',
			icon: CalendarIcon
		},
		{
			title: 'Bookmarks',
			url: '#',
			icon: BookmarkIcon
		},
		{
			title: 'History',
			url: '#',
			icon: HistoryIcon
		}
	];

	type Props = {
		username: string;
		feeds: { id: number; title: string; icon?: string; url: string }[];
	};

	let {
		username = '',
		feeds = [],
		ref = $bindable(null),
		...restProps
	}: ComponentProps<typeof Sidebar.Root> & Props = $props();
</script>

<Sidebar.Root bind:ref {...restProps} class="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row">
	<Sidebar.Root collapsible="none" class="!w-[12rem] border-r">
		<Sidebar.Header />
		<Sidebar.Content>
			<Sidebar.Group>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						<Sidebar.MenuButton size="lg">
							{#snippet child({ props })}
								<a href="/home" {...props}>
									<HouseIcon />
									<span>Home</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>

			<Sidebar.Group>
				<Sidebar.GroupLabel>Saved</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						{#each items as item (item.title)}
							<Sidebar.MenuItem>
								<Sidebar.MenuButton>
									{#snippet child({ props })}
										<a href={item.url} {...props}>
											<item.icon />
											<span>{item.title}</span>
										</a>
									{/snippet}
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
						{/each}
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>

			<Sidebar.Group>
				<Sidebar.GroupLabel>Feeds</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						{#each feeds as feed (feed.id)}
							<Sidebar.MenuItem>
								<Sidebar.MenuButton>
									{#snippet child({ props })}
										<a href={`/feed/${feed.id}`} {...props}>
											<img
												width={18}
												height={18}
												src={feed.icon}
												alt={feed.title}
												class="size-[18px] rounded-xs border border-border"
											/>
											<span>{feed.title}</span>
										</a>
									{/snippet}
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
						{/each}
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		</Sidebar.Content>

		<Sidebar.Separator />
		<Sidebar.Footer>
			<Sidebar.Menu>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton class="font-medium">
						{username}
					</Sidebar.MenuButton>
					<form method="POST" action="/?/logout">
						<Sidebar.MenuAction type="submit" class="cursor-pointer hover:text-destructive">
							<LogOutIcon /> <span class="sr-only">Log out</span>
						</Sidebar.MenuAction>
					</form>
				</Sidebar.MenuItem></Sidebar.Menu
			>
		</Sidebar.Footer>
	</Sidebar.Root>

	<EntrySidebar />
</Sidebar.Root>
