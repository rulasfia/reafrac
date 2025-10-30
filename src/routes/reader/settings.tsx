import { createFileRoute } from '@tanstack/react-router';
import { Disclosure, DisclosurePanel, DisclosureTrigger } from '@/components/ui/disclosure';
import { MinifluxIntegrationForm } from '@/components/settings/miniflux-integration';
import { FeedSetting } from '@/components/settings/feeds-setting';

export const Route = createFileRoute('/reader/settings')({
	component: RouteComponent
});

function RouteComponent() {
	return (
		<>
			<h2 className="mb-4 text-2xl font-semibold">Settings</h2>
			<section className="grid grid-cols-1 gap-y-3">
				<FeedSetting />

				<Disclosure>
					<DisclosureTrigger className="text-lg! font-medium!">
						Miniflux Integration
					</DisclosureTrigger>
					<DisclosurePanel className="px-1">
						<p className="mb-1">Configure your Miniflux integration settings here.</p>
						<MinifluxIntegrationForm />
					</DisclosurePanel>
				</Disclosure>
			</section>
		</>
	);
}
