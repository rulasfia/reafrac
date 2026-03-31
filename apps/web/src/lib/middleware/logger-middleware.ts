import { createMiddleware } from '@tanstack/react-start';
import { createLogger } from '@reafrac/logger';

const log = createLogger({ name: 'http' });

export const requestLoggerMiddleware = createMiddleware().server(async ({ next, request }) => {
	log.info({ method: request.method, url: request.url }, 'Incoming request');
	return await next();
});
