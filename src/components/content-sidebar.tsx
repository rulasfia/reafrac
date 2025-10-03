import * as React from 'react';
import { SidebarContent, SidebarHeader } from '@/components/ui/sidebar';

interface ContentSidebarProps {}

export const ContentSidebar: React.FC<ContentSidebarProps> = () => {
	return (
		<div className="col-span-3 flex h-full flex-col overflow-y-auto">
			<SidebarHeader>
				<span>Today</span>
			</SidebarHeader>
			<SidebarContent>
				{Array.from({ length: 100 }, (_, i) => (
					<div key={i}>Item {i + 1}</div>
				))}
			</SidebarContent>
		</div>
	);
};
