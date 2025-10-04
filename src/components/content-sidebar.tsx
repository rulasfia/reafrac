import { SidebarContent, SidebarHeader } from '@/components/ui/sidebar';

export function ContentSidebar() {
	const content = [];
	return (
		<div className="col-span-3 flex h-full flex-col overflow-y-auto">
			<SidebarHeader>
				<span>Today</span>
			</SidebarHeader>
			<SidebarContent>
				{content.map((_, i) => (
					<div key={i}>Item {i + 1}</div>
				))}
			</SidebarContent>
		</div>
	);
}
