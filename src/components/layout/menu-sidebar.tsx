import qs from 'query-string';
import { useQuery } from '@tanstack/react-query';
import {
	BookmarkIcon,
	CalendarIcon,
	ChevronRightIcon,
	InboxIcon,
	ListIcon,
	PlusIcon,
	SettingsIcon
} from 'lucide-react';
import {
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupAction,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarSeparator
} from '../ui/sidebar';
import { Link, useLoaderData, useLocation } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { getFeedsServerFn } from '@/lib/server/feed-sfn';
import { Button } from '../ui/button';

export const MENU_ITEMS = [
	{ label: 'All Posts', icon: <ListIcon />, href: '/reader', page: 'all-posts' },
	{ label: 'Unread', icon: <InboxIcon />, href: '/reader', page: 'unread' },
	{ label: 'Today', icon: <CalendarIcon />, href: '/reader', page: 'today' },
	{ label: 'Saved', icon: <BookmarkIcon />, href: '/reader', page: 'saved' }
] as const;

export function MenuSidebar() {
	const { search, pathname } = useLocation();
	const { user, integration } = useLoaderData({ from: '/reader' });
	const getFeeds = useServerFn(getFeedsServerFn);

	const { data: feeds } = useQuery({
		queryKey: ['feeds', user.id, integration?.id],
		queryFn: async () => getFeeds()
	});

	return (
		<div className="mr col-span-2 flex h-full flex-col overflow-y-auto border-r bg-muted dark:bg-accent">
			<SidebarHeader>
				<span className="text-lg font-semibold">Reafrac</span>
			</SidebarHeader>
			<SidebarContent className="overflow-x-clip">
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{MENU_ITEMS.map((item) => (
								<SidebarMenuItem key={item.page}>
									<SidebarMenuButton asChild isActive={item.page === search.page}>
										<Link to="/reader" search={{ ...search, page: item.page }}>
											{item.icon}
											{item.label}
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				<SidebarSeparator />

				<SidebarGroup>
					<SidebarGroupLabel>Feeds</SidebarGroupLabel>
					<SidebarGroupAction asChild>
						<Link to="/reader/settings/feeds">
							<ChevronRightIcon />
							<span className="sr-only">Manage Feeds</span>
						</Link>
					</SidebarGroupAction>
					<SidebarGroupContent>
						{feeds?.length === 0 ? (
							<div className="flex flex-col items-center justify-center gap-y-3 rounded-md border border-dashed border-sidebar-border bg-background px-2 py-6">
								<span className="text-sm opacity-75">Personalize your feed.</span>
								<Button size="xs" render={<Link to="/reader/settings/feeds" search={search} />}>
									<PlusIcon className="size-5" /> Add Feed
								</Button>
							</div>
						) : null}

						<SidebarMenu>
							{feeds?.map((item) => (
								<SidebarMenuItem key={item.id}>
									<SidebarMenuButton asChild isActive={item.id === search.page}>
										<Link to="/reader" search={{ ...search, page: item.id }}>
											<img
												width={16}
												height={16}
												src={item.icon === '' ? '/favicon.ico' : item.icon}
												alt={item.title}
												className="size-4 rounded-xs border border-transparent"
											/>
											{item.title}
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className="p-0">
				<SidebarGroup>
					<SidebarGroupLabel>{user.name}</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton asChild isActive={pathname.startsWith('/reader/settings')}>
									<Link to="/reader/settings/feeds">
										<SettingsIcon />
										Settings
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarFooter>
		</div>
	);
}
