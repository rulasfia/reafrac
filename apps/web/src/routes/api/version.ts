import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/version')({
	server: {
		handlers: {
			GET: () => {
				const version = import.meta.env.VITE_APP_VERSION || 'dev';
				const buildDate = import.meta.env.VITE_BUILD_DATE || new Date().toISOString();

				return new Response(JSON.stringify({ version, buildDate, env: import.meta.env.MODE }), {
					headers: {
						'Content-Type': 'application/json'
					}
				});
			}
		}
	}
});
