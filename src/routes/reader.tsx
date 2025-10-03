import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getUserInfoServerFn } from '@/lib/server/user-sfn';
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/reader')({
	component: RouteComponent,
	loader: async () => {
		const user = await getUserInfoServerFn();
		return { user };
	}
});

function RouteComponent() {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<div className="p-4 lg:p-6">
					<Outlet />
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
