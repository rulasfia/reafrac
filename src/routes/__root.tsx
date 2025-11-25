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
import { PWARegister } from '@/components/pwa-register';
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
				content: 'A modern open-source, self-hostable RSS reader.'
			},
			{ name: 'theme-color', content: '#000000' },
			{ name: 'apple-mobile-web-app-capable', content: 'yes' },
			{ name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
			{ name: 'apple-mobile-web-app-title', content: 'Reafrac' },
			{ name: 'application-name', content: 'Reafrac' },
			{ name: 'msapplication-TileColor', content: '#000000' },
			{ name: 'msapplication-config', content: '/browserconfig.xml' }
		],
		links: [
			{ rel: 'stylesheet', href: appCss },
			{ rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
			{ rel: 'icon', href: '/favicon.ico' },
			{ rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
			{ rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
			{ rel: 'manifest', href: '/manifest.json' },
			{ rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: '#000000' }
		]
	}),
	scripts: () =>
		import.meta.env.PROD
			? [
					{
						defer: true,
						src: 'https://data.reafrac.com/fetch.js',
						'data-website-id': '4e5bbb85-7851-4565-8705-76e296b8b7b7'
					},
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
						<PWARegister />
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
