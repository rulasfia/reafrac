import { authClient } from '@/lib/auth-client';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { useLoaderData, useNavigate } from '@tanstack/react-router';
import { Input } from '@/components/ui/input';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function AccountSetting() {
	const { user } = useLoaderData({ from: '/reader' });
	const navigate = useNavigate();

	async function logoutHandler() {
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					return navigate({ to: '/', replace: true });
				}
			}
		});
	}

	const userInitial = user.name
		? user.name
				.split(' ')
				.map((n) => n[0])
				.join('')
		: (user.email?.[0]?.toUpperCase() ?? '?');

	return (
		<div>
			<h3 className="text-lg font-medium">Account Settings</h3>
			<p className="mb-3 text-sm text-foreground/70">
				Manage your account settings and set e-mail preferences.
			</p>

			<div className="flex w-full gap-x-4">
				<div className="flex w-1/4 flex-col items-center gap-y-2">
					<Avatar className="size-24">
						<AvatarImage src={user?.image ?? undefined} alt="User avatar" />
						<AvatarFallback className="text-lg">{userInitial}</AvatarFallback>
					</Avatar>
					<Button size="sm" variant="outline" disabled>
						Update Picture
					</Button>
				</div>
				<Form className="w-3/4">
					<Field name="name">
						<FieldLabel>Name</FieldLabel>
						<Input name="name" value={user.name} type="text" disabled />
						<FieldError />
					</Field>

					<Field name="email">
						<FieldLabel>Email</FieldLabel>
						<Input name="email" value={user.email} type="email" disabled />
						<FieldError />
					</Field>

					<div>
						<Button type="button" variant="destructive" onClick={logoutHandler}>
							Logout
						</Button>
					</div>
				</Form>
			</div>
		</div>
	);
}
