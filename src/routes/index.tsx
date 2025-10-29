import { buttonStyles } from '@/components/ui/button';
import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
	component: App
});

function App() {
	return (
		<div className="container mx-auto py-12 text-center">
			<h1 className="font-serif text-xl">Welcome to Reafrac</h1>
			<hr className="my-4" />
			<Link className={buttonStyles({ intent: 'outline', className: 'min-w-28' })} to="/login">
				Login
			</Link>
		</div>
	);
}
