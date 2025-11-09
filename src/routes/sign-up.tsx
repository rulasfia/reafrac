import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { toastManager } from '@/components/ui/toast';
import { authClient } from '@/lib/auth-client';
import { kickAuthedUserServerFn } from '@/lib/server/auth-sfn';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { nanoid } from 'nanoid';
import { useState } from 'react';
import { z } from 'zod/mini';

export const Route = createFileRoute('/sign-up')({
	component: RouteComponent,
	beforeLoad: async () => {
		await kickAuthedUserServerFn();
	}
});

const registerSchema = z.object({
	name: z.string(),
	email: z.email({ error: 'Invalid email' }).check(z.trim()),
	password: z
		.string({ error: 'Invalid password' })
		.check(z.minLength(8, { error: 'Password must be at least 8 characters' })),
	repeatPassword: z
		.string()
		.check(z.minLength(8, { error: 'Password must be at least 8 characters' }))
});

type Errors = Record<string, string | string[]>;

function RouteComponent() {
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState<Errors>({});
	const handleClearErrors = (next: Errors) => setErrors(next);
	const navigate = useNavigate();

	const submitHandler = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		const name = formData.get('name') as string;
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const repeatPassword = formData.get('repeatPassword') as string;

		const result = registerSchema.safeParse({
			name,
			email,
			password,
			repeatPassword
		});

		if (!result.success) {
			const { fieldErrors } = z.flattenError(result.error);
			setErrors(fieldErrors);
			return;
		}

		if (password !== repeatPassword) {
			setErrors({ repeatPassword: ['Passwords do not match'] });
			return;
		}

		const date = new Date().getDate();
		const uid = nanoid(4);
		const username = `${name.split(' ')[0].toLowerCase()}-${date}${uid}`;

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
					toastManager.add({ title: 'Sign up failed!', description: error.message, type: 'error' });
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
					toastManager.add({ title: 'Sign up failed!', description: error.message, type: 'error' });
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
				<h1 className="mb-2 text-xl font-semibold">Sign up to Reafrac</h1>

				<Field name="name">
					<FieldLabel>Name</FieldLabel>
					<Input name="name" placeholder="John Doe" type="text" disabled={isLoading} />
					<FieldError />
				</Field>

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

				<Field name="repeatPassword">
					<FieldLabel>Repeat Password</FieldLabel>
					<Input
						name="repeatPassword"
						placeholder="password"
						type="password"
						disabled={isLoading}
					/>
					<FieldError />
				</Field>

				<div className="mt-3 grid grid-cols-1 gap-y-3">
					<Button type="submit" disabled={isLoading}>
						{isLoading ? <Spinner /> : 'Register'}
					</Button>

					<Button disabled={isLoading} onClick={googleLoginHandler} variant="outline">
						<img src="/svg/google.svg" width={16} />
						Continue with Google
					</Button>
				</div>

				<hr className="my-2" />
				<p className="text-sm">
					Already have an account?{' '}
					<Link to="/login" className="text-primary hover:underline">
						Login here
					</Link>
				</p>
			</Form>
		</div>
	);
}
