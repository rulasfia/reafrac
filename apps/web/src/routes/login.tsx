import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { authClient } from '@/lib/auth-client';
import { kickAuthedUserServerFn } from '@/lib/server/auth-sfn';
import { createFileRoute, Link, useLoaderData, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { z } from 'zod/mini';
import { Form } from '@/components/ui/form';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { toastManager } from '@/components/ui/toast';

export const Route = createFileRoute('/login')({
	component: RouteComponent,
	beforeLoad: async () => {
		await kickAuthedUserServerFn();
	}
});

const loginSchema = z.object({
	email: z.email({ error: 'Invalid email' }).check(z.trim()),
	password: z
		.string({ error: 'Invalid password' })
		.check(z.minLength(8, { error: 'Password must be at least 8 characters' }))
});

type Errors = Record<string, string | string[]>;

function RouteComponent() {
	const { isGoogleAuthEnabled } = useLoaderData({ from: '__root__' });
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState<Errors>({});
	const handleClearErrors = (next: Errors) => setErrors(next);
	const navigate = useNavigate();

	const submitHandler = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setErrors({});
		const formData = new FormData(event.currentTarget);
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		const result = loginSchema.safeParse({ email, password });

		if (!result.success) {
			const { fieldErrors } = z.flattenError(result.error);
			setErrors(fieldErrors);
			return;
		}

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
					toastManager.add({ title: 'Login failed!', description: error.message, type: 'error' });
				}
			}
		);
	};

	const googleLoginHandler = async () => {
		if (!isGoogleAuthEnabled) return;
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
					toastManager.add({ title: 'Login failed!', description: error.message, type: 'error' });
				}
			}
		);
	};

	return (
		<div className="container mx-auto h-screen py-12">
			<Form
				onSubmit={submitHandler}
				errors={errors}
				onClearErrors={handleClearErrors}
				className="mx-auto grid max-w-sm grid-cols-1 gap-y-2 rounded-md border border-border p-4"
			>
				<h1 className="mb-2 text-xl font-semibold">Login to Reafrac</h1>
				<Field name="email">
					<FieldLabel>Email</FieldLabel>
					<Input name="email" placeholder="example@email.com" type="email" disabled={isLoading} />
					<FieldError />
				</Field>

				<Field name="password">
					<FieldLabel>Password</FieldLabel>
					<Input name="password" placeholder="password" type="password" disabled={isLoading} />
					<FieldError />
				</Field>

				<div className="mt-3 grid grid-cols-1 gap-y-3">
					<Button disabled={isLoading} type="submit">
						{isLoading ? <Spinner /> : 'Login'}
					</Button>

					{isGoogleAuthEnabled && (
						<Button disabled={isLoading} onClick={googleLoginHandler} variant="outline">
							<img src="/svg/google.svg" width={16} />
							Continue with Google
						</Button>
					)}
				</div>
				<hr className="my-2" />
				<p className="text-sm">
					Don't have an account?{' '}
					<Link to="/sign-up" className="text-primary hover:underline">
						Register here
					</Link>
				</p>
			</Form>
		</div>
	);
}
