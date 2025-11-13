import { useEffect } from 'react';
import {
	HeadContent,
	NotFoundRouteProps,
	Scripts,
	createRootRouteWithContext
} from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';
import { wrapCreateRootRouteWithSentry } from '@sentry/tanstackstart-react';
import * as Sentry from '@sentry/tanstackstart-react';
import { requestLoggerMiddleware } from '@/lib/middleware/logger-middleware';
import { ToastProvider } from '@/components/ui/toast';
import { ThemeProvider } from '@/components/theme-provider';
import { QueryProvider } from '@/components/query-provider';
import { DevTools } from '@/components/devtools';
import appCss from '../styles.css?url';
import { getAppConfigServerFn } from '@/lib/server/app-sfn';

export const Route = wrapCreateRootRouteWithSentry(createRootRouteWithContext)<{
	queryClient: QueryClient;
}>()({
	server: {
		middleware: [requestLoggerMiddleware]
	},
	head: () => ({
		meta: [
			{ charSet: 'utf-8' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
			{
				title: process.env.NODE_ENV?.toLowerCase() === 'production' ? 'Reafrac' : 'Reafrac - Dev'
			},
			{
				name: 'description',
				content: 'A modern RSS reader client, designed to work seamlessly with Miniflux servers.'
			}
		],
		links: [{ rel: 'stylesheet', href: appCss }]
	}),
	scripts: () =>
		import.meta.env.PROD
			? [
					{
						defer: true,
						src: 'https://static.cloudflareinsights.com/beacon.min.js',
						'data-cf-beacon': '{"token": "318f2e2b66644f7489d82f25531ac742"}'
					}
				]
			: [],
	loader: async () => {
		const config = await getAppConfigServerFn();
		return config;
	},
	shellComponent: RootDocument,
	notFoundComponent: NotFoundComponent,
	errorComponent: function ErrorComponent({ error }) {
		useEffect(() => {
			Sentry.captureException(error);
		}, [error]);

		return 'Something went wrong!';
	}
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider defaultTheme="system">
			<html lang="en" className="bg-background lg:bg-sidebar">
				<head>
					<HeadContent />
				</head>
				<body>
					<QueryProvider>
						<ToastProvider>{children}</ToastProvider>
						<DevTools />
						<Scripts />
					</QueryProvider>
				</body>
			</html>
		</ThemeProvider>
	);
}

function NotFoundComponent(props: NotFoundRouteProps) {
	console.log({ NotFoundComponentProps: props.data });
	return <p>This setting page doesn't exist!</p>;
}
