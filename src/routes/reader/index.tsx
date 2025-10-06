import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/reader/')({
	component: RouteComponent
});

function RouteComponent() {
	return <div>Hello "/(reader)/index"!</div>;
}
