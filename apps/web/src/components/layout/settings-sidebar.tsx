import { Link, useLocation } from '@tanstack/react-router';
import {
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar
} from '../ui/sidebar';
import { BlocksIcon, RssIcon, ShieldUserIcon, LockIcon } from 'lucide-react';
import { useLoaderData } from '@tanstack/react-router';

const SETTING_ITEMS = [
	{
		label: 'Feeds',
		href: '/reader',
		category: 'feeds',
		icon: <RssIcon />
	},
	{
		label: 'Integrations',
		href: '/reader',
		category: 'integrations',
		icon: <BlocksIcon />
	},
	{
		label: 'Account',
		href: '/reader',
		category: 'account',
		icon: <ShieldUserIcon />
	}
];

const ADMIN_SETTING_ITEM = {
	label: 'Admin',
	href: '/reader',
	category: 'admin',
	icon: <LockIcon />
};

export function SettingsSidebar() {
	const { search } = useLocation();
	const { toggleSidebar, isMobile } = useSidebar();
	const { user } = useLoaderData({ from: '/reader' });

	const onEntryClick = () => {
		if (isMobile) toggleSidebar();
	};

	const settingItems =
		user.isAdmin === true ? [...SETTING_ITEMS, ADMIN_SETTING_ITEM] : SETTING_ITEMS;

	return (
		<div className="col-span-4 flex h-full flex-col overflow-y-auto lg:col-span-3">
			<SidebarHeader>
				<span className="text-lg font-semibold">Settings</span>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{settingItems.map((item) => (
								<SidebarMenuItem key={item.label}>
									<SidebarMenuButton
										isActive={search.category === item.category}
										asChild
										className="active:bg-sidebar-accent data-[active=true]:bg-sidebar-accent data-[state=open]:hover:bg-sidebar-accent"
									>
										<Link
											to={item.href}
											search={{ ...search, category: item.category }}
											onClick={onEntryClick}
										>
											{item.icon}
											{item.label}
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</div>
	);
}
