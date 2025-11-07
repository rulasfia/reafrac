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
					return navigate({ to: '/reader', replace: true, search: { page: 'all-posts' } });
				},
				onError: ({ error }) => {
					setIsLoading(false);
					toast.error(error.message, { dismissible: true, icon: '❌' });
				}
			}
		);
	};

	const googleLoginHandler = async () => {
		await authClient.signIn.social(
			{ provider: 'google' },
			{
				onRequest: () => setIsLoading(true),
				onSuccess: () => {
					setIsLoading(false);
					window.location.assign('/reader?page=all-posts');
				},
				onError: ({ error }) => {
					setIsLoading(false);
					toast.error(error.message, { dismissible: true, icon: '❌' });
				}
			}
		);
	};

	return (
		<div className="container mx-auto h-screen py-12">
			<form
				onSubmit={submitHandler}
				className="mx-auto grid max-w-sm grid-cols-1 gap-y-2 rounded-md border border-border p-4"
			>
				<TextField name="email" label="Email" placeholder="example@email.com" type="email" />
				<TextField name="password" label="Password" placeholder="Your Password" type="password" />
				<div className="mt-3 grid grid-cols-1 gap-y-3">
					<Button isPending={isLoading} type="submit">
						{isLoading ? <Loader /> : 'Login'}
					</Button>

					<Button isPending={isLoading} onClick={googleLoginHandler} intent="outline" type="submit">
						<img src="/svg/google.svg" width={16} />
						Continue with Google
					</Button>
				</div>
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
