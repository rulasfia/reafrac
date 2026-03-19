import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/health')({
	server: {
		handlers: {
			GET: () => {
				return new Response(
					JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }),
					{
						status: 200,
						headers: {
							'Content-Type': 'application/json'
						}
					}
				);
			}
		}
	}
});
