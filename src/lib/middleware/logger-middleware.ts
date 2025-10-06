import { createMiddleware } from '@tanstack/react-start';

export const requestLoggerMiddleware = createMiddleware().server(async ({ next, request }) => {
	console.log({ [request.method]: request.url });
	return await next();
});
