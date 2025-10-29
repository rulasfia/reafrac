import qs from 'query-string';
import { useQuery } from '@tanstack/react-query';
import {
	IconBookmarkFill,
	IconCalendar2Fill,
	IconChevronsY,
	IconDashboardFill,
	IconGear,
	IconLogout
} from '@intentui/icons';
import { Avatar } from '@/components/ui/avatar';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarItem,
	SidebarLabel,
	SidebarSection,
	SidebarSectionGroup,
	SidebarSeparator
} from '@/components/ui/sidebar';
import {
	Menu,
	MenuContent,
	MenuHeader,
	MenuItem,
	MenuSection,
	MenuTrigger
} from '@/components/ui/menu';
import { ContentSidebar } from './content-sidebar';
import { useLoaderData, useLocation, useNavigate } from '@tanstack/react-router';
import { authClient } from '@/lib/auth-client';
import { useServerFn } from '@tanstack/react-start';
import { getFeedsServerFn } from '@/lib/server/feed-sfn';

export function AppSidebar() {
	return (
		<Sidebar intent="inset">
			<div className="grid h-full grid-cols-5">
				<MenuSidebar />
				<ContentSidebar />
			</div>
		</Sidebar>
	);
}

const MENU_ITEMS = [
	{ label: 'Dashboard', icon: <IconDashboardFill />, href: '/reader', page: 'dashboard' },
	{ label: 'Today', icon: <IconCalendar2Fill />, href: '/reader', page: 'today' },
	{ label: 'Saved', icon: <IconBookmarkFill />, href: '/reader', page: 'saved' }
] as const;

function MenuSidebar() {
	const { search } = useLocation();
	const { user, integration } = useLoaderData({ from: '/reader' });
	const navigate = useNavigate();
	const getFeeds = useServerFn(getFeedsServerFn);

	const { data: feeds } = useQuery({
		enabled: !!integration,
		queryKey: ['feeds', integration?.id],
		queryFn: async () => getFeeds()
	});

	async function logoutHandler() {
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					return navigate({ to: '/', replace: true });
				}
			}
		});
	}

	const getPageUrl = (page: string) => {
		return qs.stringify({
			...search,
			entry: search.entry ? search.entry.toString() : undefined,
			page: typeof page === 'number' ? `_${page}` : page
		});
	};

	return (
		<div className="mr col-span-2 flex h-full flex-col overflow-y-auto border-r bg-muted dark:bg-accent">
			<SidebarHeader>
				<span className="text-lg font-bold">Reafrac</span>
			</SidebarHeader>
			<SidebarContent className="overflow-x-clip">
				<SidebarSectionGroup>
					<SidebarSection>
						{MENU_ITEMS.map((item) => (
							<SidebarItem
								key={item.label}
								tooltip={item.label}
								isCurrent={search.page === item.page}
								// @ts-expect-error - can't get the query param typesafety to work
								href={`${item.href}?${getPageUrl(item.page)}`}
							>
								{item.icon}
								<SidebarLabel>{item.label}</SidebarLabel>
							</SidebarItem>
						))}
					</SidebarSection>
				</SidebarSectionGroup>
				<SidebarSeparator />

				<SidebarSectionGroup>
					<SidebarSection>
						{feeds?.map((item) => (
							<SidebarItem
								key={item.id}
								tooltip={item.title}
								isCurrent={search.page?.split('_')[1] === item.id.toString()}
								// @ts-expect-error - can't get the query param typesafety to work
								href={`/reader?${getPageUrl(item.id)}`}
							>
								<img
									width={18}
									height={18}
									src={`${integration?.serverUrl}/feed/icon/${item.icon?.external_icon_id}`}
									alt={item.title}
									className="mr-2 size-[18px] rounded-xs border border-border"
								/>
								<SidebarLabel>{item.title}</SidebarLabel>
							</SidebarItem>
						))}
					</SidebarSection>
				</SidebarSectionGroup>
			</SidebarContent>

			<SidebarFooter className="flex flex-row justify-between gap-4 group-data-[state=collapsed]:flex-col in-data-[intent=inset]:px-4">
				<Menu>
					<MenuTrigger
						className="flex w-full items-center justify-between rounded-lg p-px hover:bg-background"
						aria-label="Profile"
					>
						<div className="flex items-center gap-x-2">
							<Avatar
								className="size-8 *:size-8 group-data-[state=collapsed]:size-6 group-data-[state=collapsed]:*:size-6"
								isSquare
								src="https://intentui.com/images/avatar/cobain.jpg"
							/>

							<div className="text-sm in-data-[collapsible=dock]:hidden">
								<SidebarLabel className="text-sm">{user.name}</SidebarLabel>
								<span className="-mt-0.5 block text-xs text-muted-fg">{user.email}</span>
							</div>
						</div>
						<IconChevronsY data-slot="chevron" />
					</MenuTrigger>
					<MenuContent
						className="min-w-(--trigger-width) in-data-[sidebar-collapsible=collapsed]:min-w-56"
						placement="bottom right"
					>
						<MenuSection>
							<MenuHeader separator>
								<span className="block">{user.name}</span>
								<span className="font-normal text-muted-fg">@{user.username}</span>
							</MenuHeader>
						</MenuSection>

						<MenuItem href="/reader/settings">
							<IconGear />
							Settings
						</MenuItem>
						<MenuItem isDanger onClick={logoutHandler}>
							<IconLogout />
							Log out
						</MenuItem>
					</MenuContent>
				</Menu>
			</SidebarFooter>
		</div>
	);
}
