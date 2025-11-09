import { FeedSetting } from '@/components/settings/feeds-setting';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/reader/settings/feeds')({
	component: RouteComponent
});

function RouteComponent() {
	return <FeedSetting />;
}
