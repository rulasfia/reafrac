import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { TextField } from '@/components/ui/text-field';
import { authClient } from '@/lib/auth-client';
import { kickAuthedUserServerFn } from '@/lib/server/auth-sfn';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/login')({
	component: RouteComponent,
	beforeLoad: async () => {
		await kickAuthedUserServerFn();
	}
});

function RouteComponent() {
	const [isLoading, setIsLoading] = useState(false);
	const navigate = useNavigate();

	const submitHandler = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		await authClient.signIn.email(
			{ email, password },
			{
				onRequest: () => setIsLoading(true),
				onSuccess: () => {
					setIsLoading(false);
					return navigate({ to: '/reader', replace: true, search: { page: 'dashboard' } });
				},
				onError: ({ error }) => {
					setIsLoading(false);
					toast(error.message, { dismissible: true, icon: '❌' });
				}
			}
		);
	};

	return (
		<div className="container mx-auto h-screen py-12">
			<form
				onSubmit={submitHandler}
				className="mx-auto grid max-w-md grid-cols-1 gap-y-2 rounded-md border border-border p-4"
			>
				<TextField name="email" label="Email" placeholder="example@email.com" type="email" />
				<TextField name="password" label="Password" placeholder="Your Password" type="password" />
				<Button isPending={isLoading} type="submit" className="mt-3 w-fit">
					{isLoading ? <Loader /> : 'Let me in!'}
				</Button>
				<hr className="my-2" />
				<p className="text-sm">
					Don't have an account?{' '}
					<Link to="/sign-up" className="text-primary hover:underline">
						Register here
					</Link>
				</p>
			</form>
		</div>
	);
}
