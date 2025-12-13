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
import { BlocksIcon, RssIcon, ShieldUserIcon } from 'lucide-react';

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

export function SettingsSidebar() {
	const { search } = useLocation();
	const { toggleSidebar, isMobile } = useSidebar();

	const onEntryClick = () => {
		if (isMobile) toggleSidebar();
	};

	return (
		<div className="col-span-4 flex h-full flex-col overflow-y-auto lg:col-span-3">
			<SidebarHeader>
				<span className="text-lg font-semibold">Settings</span>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{SETTING_ITEMS.map((item) => (
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
