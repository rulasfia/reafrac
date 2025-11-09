import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { PanelLeftIcon } from 'lucide-react';

export const Route = createFileRoute('/reader/settings')({
	component: RouteComponent
});

function RouteComponent() {
	const { toggleSidebar } = useSidebar();
	return (
		<>
			<Button
				size="icon-sm"
				variant="outline"
				className="absolute top-2 left-2 flex cursor-pointer rounded-sm lg:top-1.5 lg:left-1.5 lg:hidden"
				onClick={toggleSidebar}
			>
				<PanelLeftIcon />
				<span className="sr-only">Toggle Sidebar</span>
			</Button>

			<section className="grid grid-cols-1 gap-y-5 pt-8 lg:pt-0">
				<Outlet />
			</section>
		</>
	);
}
