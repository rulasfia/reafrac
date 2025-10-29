import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getExistingIntegrationServerFn } from '@/lib/server/integration-sfn';
import { getUserInfoServerFn } from '@/lib/server/user-sfn';
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { z } from 'zod/mini';

const readerSearchSchema = z.object({
	page: z.optional(z.string()),
	entry: z.optional(z.number()),
	view: z.optional(z.enum(['summary', 'expanded']))
});

export const Route = createFileRoute('/reader')({
	component: RouteComponent,
	validateSearch: readerSearchSchema,
	beforeLoad: async () => {
		const user = await getUserInfoServerFn();
		return { user };
	},
	loader: async ({ context }) => {
		const integration = await getExistingIntegrationServerFn({ data: { userId: context.user.id } });

		return { user: context.user, integration };
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
