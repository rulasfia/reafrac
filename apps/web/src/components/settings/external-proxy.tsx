import { Button } from '../ui/button';
import { Field, FieldError, FieldLabel } from '../ui/field';
import { z } from 'zod/mini';
import { Input } from '../ui/input';
import { Form } from '../ui/form';
import { useState } from 'react';
import { toastManager } from '../ui/toast';
import { useServerFn } from '@tanstack/react-start';
import {
	getUserPreferenceServerFn,
	testProxyConnectionServerFn,
	updateUserPreferenceServerFn
} from '@/lib/server/preference-sfn';
import { useQuery } from '@tanstack/react-query';
import { useLoaderData } from '@tanstack/react-router';
import { Spinner } from '../ui/spinner';

const externalProxySchema = z.object({
	url: z.pipe(
		z.url({ error: 'Invalid URL' }),
		z.transform((url) => (url.endsWith('/') ? url : url + '/'))
	)
});

type Errors = Record<string, string | string[]>;

export function ExternalProxySettings() {
	const { user } = useLoaderData({ from: '/reader' });
	const [errors, setErrors] = useState<Errors>({});
	const [isLoading, setIsLoading] = useState(false);
	const [isValidated, setIsValidated] = useState(false);

	const getUserPreference = useServerFn(getUserPreferenceServerFn);
	const testProxyConnection = useServerFn(testProxyConnectionServerFn);
	const updateUserPreference = useServerFn(updateUserPreferenceServerFn);

	const { data, status } = useQuery({
		queryKey: ['user-preference', user.id],
		queryFn: () => getUserPreference()
	});

	const validateProxySettings = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		try {
			setErrors({});
			const formData = new FormData(event.currentTarget);
			// Prompt for new title
			const url = (formData.get('url') as string) ?? undefined;

			const result = externalProxySchema.safeParse({ url });
			if (!result.success) {
				const { fieldErrors } = z.flattenError(result.error);
				setErrors(fieldErrors);
				return;
			}

			setIsLoading(true);
			const testResult = await testProxyConnection({ data: { proxyUrl: result.data.url } });

			// connection to proxy server failed
			if (!testResult.isValid) {
				setErrors({ url: "Can't connect to proxy server!" });
				setIsLoading(false);
				return;
			}

			setIsValidated(true);
			toastManager.add({
				title: 'Proxy Server Validated!',
				description: 'Successfully connected to proxy server',
				type: 'success'
			});
		} catch (error) {
			console.error('Failed to validate proxy settings:', error);
			setErrors({ url: "Can't connect to proxy server!" });
			throw error;
		} finally {
			setIsLoading(false);
		}
	};

	const submitProxySettings = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		try {
			setErrors({});
			const formData = new FormData(event.currentTarget);
			// Prompt for new title
			const url = (formData.get('url') as string) ?? undefined;

			const result = externalProxySchema.safeParse({ url });
			if (!result.success) {
				const { fieldErrors } = z.flattenError(result.error);
				setErrors(fieldErrors);
				return;
			}

			setIsLoading(true);
			await updateUserPreference({ data: { proxyUrl: result.data.url } });

			toastManager.add({
				title: 'Settings Saved!',
				description: 'Proxy settings updated successfully',
				type: 'success'
			});
		} catch (error) {
			console.error('Failed to validate proxy settings:', error);
			setErrors({ url: "Can't connect to proxy server!" });
			throw error;
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div>
			<h3 className="text-lg font-medium">External Proxy</h3>
			<p className="mb-3 max-w-xl text-sm text-pretty text-foreground/70">
				If you are using an external proxy, you can configure it here. This is useful for accessing
				resources that geographically restricted, or only accessible from certain countries.
			</p>

			<Form
				className="flex max-w-md flex-col gap-y-2"
				onSubmit={isValidated ? submitProxySettings : validateProxySettings}
				errors={errors}
			>
				<Field name="url">
					<FieldLabel>Proxy URL</FieldLabel>
					<Input
						name="url"
						defaultValue={data?.proxyUrl ?? ''}
						placeholder={'https://proxy.domain.com'}
						type="url"
						inputMode="url"
						disabled={isLoading || status !== 'success'}
					/>
					<FieldError />
				</Field>

				<div className="mt-2">
					<Button disabled={isLoading} type="submit">
						{isLoading ? <Spinner /> : isValidated ? 'Save' : 'Test Connection'}
					</Button>
				</div>
			</Form>
		</div>
	);
}
