import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { reactStartCookies } from 'better-auth/react-start';
import { username } from 'better-auth/plugins';
import { db } from './db-connection';
import * as schema from './db-schema';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!googleClientId || !googleClientSecret) {
	throw new Error(
		'Missing required Google OAuth environment variables: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET'
	);
}

export const auth = betterAuth({
	session: {
		cookieCache: { enabled: true }
	},
	database: drizzleAdapter(db, {
		provider: 'pg',
		usePlural: true,
		schema
	}),
	advanced: {
		database: { generateId: false }
	},
	emailAndPassword: {
		enabled: true
	},
	socialProviders: {
		google: {
			clientId: googleClientId,
			clientSecret: googleClientSecret
		}
	},
	plugins: [username(), reactStartCookies()]
});
