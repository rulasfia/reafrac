import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';

export function DevTools() {
	if (import.meta.env.PROD) return null;
	return (
		<TanStackDevtools
			config={{ position: 'bottom-right' }}
			plugins={[
				{ name: 'TanStack Query', render: <ReactQueryDevtoolsPanel /> },
				{ name: 'Tanstack Router', render: <TanStackRouterDevtoolsPanel /> }
			]}
		/>
	);
}
