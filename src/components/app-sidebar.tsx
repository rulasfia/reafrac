import * as React from 'react';
import {
	IconBookmarkFill,
	IconCalendar2Fill,
	IconChevronsY,
	IconDashboardFill,
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
	SidebarSectionGroup
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
	{ label: 'Dashboard', icon: <IconDashboardFill />, href: '/reader/dashboard' },
	{ label: 'Today', icon: <IconCalendar2Fill />, href: '/reader/today' },
	{ label: 'Saved', icon: <IconBookmarkFill />, href: '/reader/saved' }
];

function MenuSidebar() {
	const { pathname } = useLocation();
	const { user } = useLoaderData({ from: '/reader' });
	const navigate = useNavigate();

	async function logoutHandler() {
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					return navigate({ to: '/', replace: true });
				}
			}
		});
	}
	return (
		<div className="mr col-span-2 flex h-full flex-col overflow-y-auto border-r">
			<SidebarHeader>
				<span>Reafrac</span>
			</SidebarHeader>
			<SidebarContent>
				<SidebarSectionGroup>
					<SidebarSection>
						{MENU_ITEMS.map((item) => (
							<SidebarItem
								key={item.label}
								tooltip={item.label}
								isCurrent={pathname === item.href}
								href={item.href}
							>
								{item.icon}
								<SidebarLabel>{item.label}</SidebarLabel>
							</SidebarItem>
						))}
					</SidebarSection>
				</SidebarSectionGroup>
			</SidebarContent>

			<SidebarFooter className="flex flex-row justify-between gap-4 group-data-[state=collapsed]:flex-col">
				<Menu>
					<MenuTrigger className="flex w-full items-center justify-between" aria-label="Profile">
						<div className="flex items-center gap-x-2">
							<Avatar
								className="size-8 *:size-8 group-data-[state=collapsed]:size-6 group-data-[state=collapsed]:*:size-6"
								isSquare
								src="https://intentui.com/images/avatar/cobain.jpg"
							/>

							<div className="text-sm in-data-[collapsible=dock]:hidden">
								<SidebarLabel>{user.name}</SidebarLabel>
								<span className="-mt-0.5 block text-muted-fg">{user.email}</span>
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

						<MenuItem onClick={logoutHandler}>
							<IconLogout />
							Log out
						</MenuItem>
					</MenuContent>
				</Menu>
			</SidebarFooter>
		</div>
	);
}
