import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getExistingIntegrationServerFn } from '@/lib/server/integration-sfn';
import { getUserInfoServerFn } from '@/lib/server/user-sfn';
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { z } from 'zod/mini';

const readerSearchSchema = z.object({
	page: z.optional(z.enum(['dashboard', 'today', 'saved'])),
	entry: z.optional(z.number())
});

export const Route = createFileRoute('/reader')({
	component: RouteComponent,
	validateSearch: readerSearchSchema,
	loader: async () => {
		const user = await getUserInfoServerFn();
		const integration = await getExistingIntegrationServerFn({ data: { userId: user.id } });

		return { user, integration };
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
