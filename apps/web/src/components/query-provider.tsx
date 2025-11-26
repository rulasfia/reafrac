import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { useRouteContext } from '@tanstack/react-router';

interface QueryProviderProps {
	children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
	const { queryClient } = useRouteContext({ from: '__root__' });

	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
