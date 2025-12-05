import { AppSidebar } from '@/components/layout/sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { userFeedQueryOptions } from '@/lib/queries/feed-query';
import { getUserInfoServerFn } from '@/lib/server/user-sfn';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { z } from 'zod/mini';

const readerSearchSchema = z.object({
	page: z.optional(z.string()),
	entry: z.optional(z.number()),
	view: z.optional(z.enum(['summary', 'expanded']))
});

export const Route = createFileRoute('/reader')({
	component: RouteComponent,
	validateSearch: readerSearchSchema,
	beforeLoad: async ({ search, context, location }) => {
		if (location.pathname === '/reader' && !search.page) {
			throw redirect({ to: '/reader', search: { page: 'all-posts' } });
		}

		const user = await context.queryClient.ensureQueryData({
			queryKey: ['user'],
			queryFn: async () => getUserInfoServerFn(),
			staleTime: 1000 * 60 * 15 // 15 minutes
		});
		return { user };
	},
	loader: async ({ context }) => {
		context.queryClient.fetchQuery(userFeedQueryOptions(context.user.id));
		return { user: context.user };
	}
});

function RouteComponent() {
	const { entry } = Route.useSearch();
	return (
		<SidebarProvider defaultOpenMobile={!entry ? true : false}>
			<AppSidebar />
			<SidebarInset>
				<div className="p-4 lg:p-6">
					<Outlet />
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
