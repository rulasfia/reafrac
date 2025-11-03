import { createFileRoute } from '@tanstack/react-router';
import { MinifluxIntegrationSetting } from '@/components/settings/miniflux-integration';
import { FeedSetting } from '@/components/settings/feeds-setting';

export const Route = createFileRoute('/reader/settings')({
	component: RouteComponent
});

function RouteComponent() {
	return (
		<>
			<h2 className="mb-4 text-2xl font-semibold">Settings</h2>
			<section className="grid grid-cols-1 gap-y-5">
				<FeedSetting />
				<MinifluxIntegrationSetting />
			</section>
		</>
	);
}
