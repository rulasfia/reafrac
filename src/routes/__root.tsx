import {
	HeadContent,
	NotFoundRouteProps,
	Scripts,
	createRootRouteWithContext
} from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';

import appCss from '../styles.css?url';
import { requestLoggerMiddleware } from '@/lib/middleware/logger-middleware';
import { Toast } from '@/components/ui/toast';
import { ThemeProvider } from '@/components/theme-provider';
import { QueryProvider } from '@/components/query-provider';
import { RouteProviders } from '@/components/route-provider';
import { DevTools } from '@/components/devtools';

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
							<DevTools />
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
