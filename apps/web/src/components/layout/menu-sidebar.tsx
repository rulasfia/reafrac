import { ChevronRightIcon, PlusIcon, SettingsIcon } from 'lucide-react';
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
	SidebarSeparator,
	useSidebar
} from '../ui/sidebar';
import { Link, useLoaderData, useLocation } from '@tanstack/react-router';
import { getFeedsServerFn } from '@/lib/server/feed-sfn';
import { Button } from '../ui/button';
import { MENU_ITEMS } from './constants';
import { userFeedQueryOptions } from '@/lib/queries/feed-query';
import { useQuery } from '@tanstack/react-query';

export function MenuSidebar() {
	const { isMobile, toggleSidebar } = useSidebar();
	const { search, pathname } = useLocation();
	const { user } = useLoaderData({ from: '/reader' });

	const { data: feeds } = useQuery(userFeedQueryOptions(user.id));

	const getFeedIcon = (item: Awaited<ReturnType<typeof getFeedsServerFn>>[number]) => {
		if (item.meta.icon) {
			return item.meta.icon;
		} else if (item.icon) {
			return item.icon;
		} else {
			return '/favicon.ico';
		}
	};

	return (
		<div className="mr col-span-1 flex h-full flex-col overflow-y-auto border-r bg-muted lg:col-span-2 dark:bg-accent">
			<SidebarHeader className="flex flex-row items-start justify-between">
				<span className="hidden min-h-7 w-fit text-lg font-semibold lg:block">Reafrac</span>
			</SidebarHeader>
			<SidebarContent className="overflow-x-clip">
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{MENU_ITEMS.map((item) => (
								<SidebarMenuItem key={item.page}>
									<SidebarMenuButton
										asChild
										isActive={item.page === search.page}
										size={isMobile ? 'icon-lg' : 'default'}
										className="mx-auto justify-center lg:mx-0 lg:justify-start"
									>
										<Link to="/reader" search={{ ...search, page: item.page }}>
											{item.icon}
											<span className="hidden lg:block">{item.label}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				<SidebarSeparator />

				<SidebarGroup>
					{isMobile ? null : (
						<>
							<SidebarGroupLabel>Feeds</SidebarGroupLabel>
							<SidebarGroupAction asChild>
								<Link to="/reader" search={{ page: 'settings', category: 'feeds' }}>
									<ChevronRightIcon />
									<span className="sr-only">Manage Feeds</span>
								</Link>
							</SidebarGroupAction>
						</>
					)}

					<SidebarGroupContent>
						{feeds?.length === 0 ? (
							<div className="hidden flex-col items-center justify-center gap-y-3 rounded-md border border-dashed border-sidebar-border bg-background px-2 py-6 lg:flex">
								<span className="text-sm opacity-75">Personalize your feed.</span>
								<Button
									size="xs"
									render={<Link to="/reader" search={{ page: 'settings', category: 'feeds' }} />}
								>
									<PlusIcon className="size-5" /> Add Feed
								</Button>
							</div>
						) : null}

						<SidebarMenu>
							{feeds?.map((item) => (
								<SidebarMenuItem key={item.id}>
									<SidebarMenuButton
										asChild
										isActive={item.id === search.page}
										size={isMobile ? 'icon-lg' : 'default'}
										className="mx-auto justify-center lg:mx-0 lg:justify-start"
									>
										<Link to="/reader" search={{ ...search, page: item.id }}>
											<img
												width={16}
												height={16}
												src={getFeedIcon(item)}
												alt={item.meta.title || item.title}
												className="size-4 rounded-xs border border-transparent"
											/>
											<span className="hidden lg:block">{item.meta.title || item.title}</span>
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
					<SidebarGroupLabel className="mb-2 text-center lg:mb-0 lg:text-left">
						{user.name}
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton asChild className="justify-center lg:justify-start">
									<Link
										to="/reader"
										search={{ page: 'settings', category: 'feeds' }}
										onClick={() => (isMobile ? toggleSidebar() : undefined)}
									>
										<SettingsIcon />
										<span className="hidden lg:block">Settings</span>
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
