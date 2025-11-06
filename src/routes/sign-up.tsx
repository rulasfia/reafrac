import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { TextField } from '@/components/ui/text-field';
import { authClient } from '@/lib/auth-client';
import { kickAuthedUserServerFn } from '@/lib/server/auth-sfn';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/sign-up')({
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
		const name = formData.get('name') as string;
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const repeatPassword = formData.get('repeat-password') as string;

		if (password !== repeatPassword) {
			toast.error('Invalid password', { dismissible: true, icon: '❌' });
			return;
		}

		const username = `${name.replaceAll(' ', '').toLowerCase()}${Math.floor(Math.random() * 101)}`;
		await authClient.signUp.email(
			{ email, password, name, username },
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

	return (
		<div className="container mx-auto h-screen py-12">
			<form
				onSubmit={submitHandler}
				className="mx-auto grid max-w-md grid-cols-1 gap-y-2 rounded-md border border-border p-4"
			>
				<TextField name="name" label="Name" placeholder="John Doe" type="text" isRequired />
				<TextField
					name="email"
					label="Email"
					placeholder="example@email.com"
					type="email"
					isRequired
				/>
				<TextField
					name="password"
					label="Password"
					placeholder="Your Password"
					type="password"
					isRequired
				/>
				<TextField
					name="repeat-password"
					label="Repeat Password"
					placeholder="Your Password"
					type="password"
				/>
				<div className="mt-3 flex flex-row items-center gap-x-4">
					<Button type="submit" className="min-w-20">
						{isLoading ? <Loader /> : 'Register'}
					</Button>
				</div>
				<hr className="my-2" />
				<p className="text-sm">
					Already have an account?{' '}
					<Link to="/login" className="text-primary hover:underline">
						Login here
					</Link>
				</p>
			</form>
		</div>
	);
}
