import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import {
	fluxIntegrationServerFn,
	getExistingIntegrationServerFn,
	removeExistingIntegrationServerFn
} from '@/lib/server/integration-sfn';
import { useState } from 'react';
import { useLoaderData } from '@tanstack/react-router';
import { Field, FieldError, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import { toastManager } from '../ui/toast';

export function MinifluxIntegrationSetting() {
	const { user } = useLoaderData({ from: '/reader' });
	const getExistingIntegration = useServerFn(getExistingIntegrationServerFn);
	const postFluxIntegration = useServerFn(fluxIntegrationServerFn);
	const removeExistingIntegration = useServerFn(removeExistingIntegrationServerFn);

	const [isLoading, setIsLoading] = useState(false);

	const { data, refetch } = useQuery({
		queryKey: ['miniflux-integration', user.id],
		queryFn: () => getExistingIntegration({ data: { userId: user.id } })
	});

	const submitHandler = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setIsLoading(true);
		try {
			const formData = new FormData(event.currentTarget);
			const server_url = formData.get('server-url') as string;
			const token = formData.get('api-key') as string;

			if (!server_url || !token) {
				toastManager.add({
					title: 'Incomplete Fields',
					description: 'Please fill in all fields',
					type: 'error'
				});
				return;
			}

			const res = await postFluxIntegration({ data: { server_url, token } });

			if (res) {
				toastManager.add({
					title: 'MiniFlux Connected',
					description: 'MiniFlux integration setup completed successfully!',
					type: 'success'
				});
				await refetch();
			}
		} catch (error) {
			console.error(error);
			toastManager.add({
				title: 'MiniFlux Connection Failed',
				description: 'Failed to connect to MiniFlux. Please check your server URL and API key.',
				type: 'error'
			});
		} finally {
			setIsLoading(false);
		}
	};

	const removeIntegrationHandler = async () => {
		setIsLoading(true);
		try {
			const res = await removeExistingIntegration();
			if (res) {
				toastManager.add({
					title: 'MiniFlux Integration Removed',
					description: 'MiniFlux integration has been removed successfully!',
					type: 'success'
				});
				await refetch();
			}
		} catch (error) {
			console.error(error);
			toastManager.add({
				title: 'MiniFlux Integration Removal Failed',
				description: 'Failed to remove MiniFlux integration. Please try again.',
				type: 'error'
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div>
			<h3 className="text-lg font-medium">Miniflux Integration</h3>
			<p className="mb-3 text-sm text-foreground/70">
				Configure your Miniflux integration settings here.
			</p>

			<form onSubmit={submitHandler} className="flex max-w-md flex-col gap-y-2">
				<Field name="server-url">
					<FieldLabel>Miniflux Server URL</FieldLabel>
					<Input
						name="server-url"
						placeholder={data ? data?.serverUrl : 'https://miniflux.example.com'}
						type="url"
						inputMode="url"
						disabled={isLoading || !!data}
					/>
					<FieldError />
				</Field>

				<Field name="api-key">
					<FieldLabel>Miniflux API Key</FieldLabel>
					<Input
						name="api-key"
						type="password"
						placeholder="****************"
						disabled={isLoading || !!data}
					/>
				</Field>

				<div className="mt-2">
					{data ? (
						<Button disabled={isLoading || !data} onClick={removeIntegrationHandler} type="button">
							{isLoading ? <Spinner /> : 'Remove Integration'}
						</Button>
					) : (
						<Button
							// disabled={isLoading || !!data}
							disabled
							type="submit"
						>
							{isLoading ? <Spinner /> : 'Connect to Server'}
						</Button>
					)}
					{data ? <span className="ml-2 text-success">Integration connected!</span> : null}
				</div>
			</form>
		</div>
	);
}
