import { MinifluxIntegrationSetting } from '@/components/settings/miniflux-integration';
import { getExistingIntegrationServerFn } from '@/lib/server/integration-sfn';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/reader/settings/integrations')({
	component: RouteComponent,
	loader: async ({ context }) => {
		const integration = await getExistingIntegrationServerFn({ data: { userId: context.user.id } });
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
