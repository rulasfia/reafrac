import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/reader/settings')({
	component: RouteComponent
});

function RouteComponent() {
	return (
		<>
			<section className="grid grid-cols-1 gap-y-5">
				<Outlet />
			</section>
		</>
	);
}
