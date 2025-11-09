import { useLocation } from '@tanstack/react-router';
import { Sidebar } from '../ui/sidebar';
import { ContentSidebar } from './content-sidebar';
import { MenuSidebar } from './menu-sidebar';
import { SettingsSidebar } from './settings-sidebar';

export function AppSidebar() {
	const { pathname } = useLocation();
	const isSettings = pathname.startsWith('/reader/settings');

	return (
		<Sidebar variant="inset" className="p-0">
			<div className="grid h-full grid-cols-5">
				<MenuSidebar />
				{isSettings ? <SettingsSidebar /> : <ContentSidebar />}
			</div>
		</Sidebar>
	);
}
