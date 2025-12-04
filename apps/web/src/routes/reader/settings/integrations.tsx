import { MinifluxIntegrationSetting } from '@/components/settings/miniflux-integration';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/reader/settings/integrations')({
	component: RouteComponent
});

function RouteComponent() {
	return (
		<>
			<MinifluxIntegrationSetting />
			{/*<ExternalProxySettings />*/}
		</>
	);
}
