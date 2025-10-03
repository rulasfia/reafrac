import { createAuthClient } from 'better-auth/client';
import { usernameClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
	baseURL: import.meta.env.VITE_TRUSTED_ORIGIN as string,
	plugins: [usernameClient()]
});
