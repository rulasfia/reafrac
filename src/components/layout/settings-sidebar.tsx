import { Link, useLocation } from '@tanstack/react-router';
import {
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem
} from '../ui/sidebar';
import { BlocksIcon, RssIcon, ShieldUserIcon } from 'lucide-react';

const SETTING_ITEMS = [
	{
		label: 'Feeds',
		href: '/reader/settings/feeds',
		icon: <RssIcon />
	},
	{
		label: 'Integrations',
		href: '/reader/settings/integrations',
		icon: <BlocksIcon />
	},
	{
		label: 'Account',
		href: '/reader/settings/account',
		icon: <ShieldUserIcon />
	}
];

export function SettingsSidebar() {
	const { pathname } = useLocation();

	return (
		<div className="col-span-3 flex h-full flex-col overflow-y-auto">
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
										isActive={pathname === item.href}
										asChild
										className="active:bg-sidebar-accent data-[active=true]:bg-sidebar-accent data-[state=open]:hover:bg-sidebar-accent"
									>
										<Link to={item.href}>
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
