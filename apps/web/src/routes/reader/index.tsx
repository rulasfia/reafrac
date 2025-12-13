import { createFileRoute } from '@tanstack/react-router';
import { EntryReader } from '@/components/entry/entry-reader';
import { useLocation } from '@tanstack/react-router';
import { Settings } from '@/components/settings/settings';

export const Route = createFileRoute('/reader/')({
	component: RouteComponent
});

function RouteComponent() {
	const { search } = useLocation();
	if (search.page === 'settings') return <Settings />;

	return <EntryReader />;
}
