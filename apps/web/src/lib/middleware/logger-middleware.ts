import { createMiddleware } from '@tanstack/react-start';

export const requestLoggerMiddleware = createMiddleware().server(async ({ next, request }) => {
	if (process.env.NODE_ENV?.toLowerCase() !== 'production') {
		console.log({ [request.method]: request.url });
	}
	return await next();
});
