import { useQuery } from '@tanstack/react-query';
import { TextField } from '@/components/ui/text-field';
import { Button } from '@/components/ui/button';
import { useServerFn } from '@tanstack/react-start';
import {
	fluxIntegrationServerFn,
	getExistingIntegrationServerFn
} from '@/lib/server/integration-sfn';
import { toast } from 'sonner';
import { useState } from 'react';
import { Loader } from '@/components/ui/loader';
import { useLoaderData } from '@tanstack/react-router';

export function MinifluxIntegrationForm() {
	const { user } = useLoaderData({ from: '/reader' });
	const getExistingIntegration = useServerFn(getExistingIntegrationServerFn);
	const postFluxIntegration = useServerFn(fluxIntegrationServerFn);

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

			const res = await postFluxIntegration({ data: { server_url, token } });

			if (res) {
				toast('MiniFlux successfully connected!');
				await refetch();
			}
		} catch (error) {
			console.error(error);
			toast('Failed to connect to MiniFlux');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<form onSubmit={submitHandler} className="flex max-w-md flex-col gap-y-2">
			<TextField
				name="server-url"
				type="url"
				label="Miniflux Server URL"
				placeholder={data?.serverUrl}
				isDisabled={!!data}
			/>
			<TextField
				name="api-key"
				type="password"
				label="Miniflux API Key"
				placeholder="****************"
				isDisabled={!!data}
			/>
			<div className="mt-2">
				<Button isPending={isLoading} isDisabled={!!data} type="submit">
					{isLoading ? <Loader /> : 'Connect to Server'}
				</Button>
				{data ? <span className="ml-2 text-success">Integration connected!</span> : null}
			</div>
		</form>
	);
}
