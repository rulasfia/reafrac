import { Button } from '@/components/ui/button';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/reader/dashboard')({
	component: RouteComponent
});

function RouteComponent() {
	return (
		<div>
			Hello "/dashboard"!
			<div>
				<Button>Click me</Button>
			</div>
		</div>
	);
}
