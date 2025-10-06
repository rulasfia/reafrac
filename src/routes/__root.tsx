import {
	HeadContent,
	NotFoundRouteProps,
	Scripts,
	createRootRouteWithContext
} from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';
// import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
// import { TanstackDevtools } from '@tanstack/react-devtools'

import appCss from '../styles.css?url';
import { requestLoggerMiddleware } from '@/lib/middleware/logger-middleware';
import { Toast } from '@/components/ui/toast';
import { ThemeProvider } from '@/components/theme-provider';
import { QueryProvider } from '@/components/query-provider';
import { RouteProviders } from '@/components/route-provider';

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
	server: {
		middleware: [requestLoggerMiddleware]
	},
	head: () => ({
		meta: [
			{ charSet: 'utf-8' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
			{ title: 'TanStack Start Starter' }
		],
		links: [{ rel: 'stylesheet', href: appCss }]
	}),
	shellComponent: RootDocument,
	notFoundComponent: NotFoundComponent
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider>
			<html lang="en">
				<head>
					<HeadContent />
				</head>
				<body>
					<RouteProviders>
						<QueryProvider>
							<Toast />
							{children}
							{/*<TanstackDevtools
							config={{ position: 'bottom-left' }}
							plugins={[{ name: 'Tanstack Router', render: <TanStackRouterDevtoolsPanel /> }]}
						/>*/}
							<Scripts />
						</QueryProvider>
					</RouteProviders>
				</body>
			</html>
		</ThemeProvider>
	);
}

function NotFoundComponent(props: NotFoundRouteProps) {
	console.log({ NotFoundComponentProps: props.data });
	return <p>This setting page doesn't exist!</p>;
}
