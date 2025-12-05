import { MinifluxIntegrationSetting } from '@/components/settings/miniflux-integration';
import { getExistingIntegrationServerFn } from '@/lib/server/integration-sfn';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/reader/settings/integrations')({
	component: RouteComponent,
	loader: async ({ context }) => {
		const integration = await context.queryClient.ensureQueryData({
			queryKey: ['miniflux-integration', context.user.id],
			queryFn: () => getExistingIntegrationServerFn({ data: { userId: context.user.id } })
		});
		return { integration };
	}
});

function RouteComponent() {
	return (
		<>
			<MinifluxIntegrationSetting />
			{/*<ExternalProxySettings />*/}
		</>
	);
}
