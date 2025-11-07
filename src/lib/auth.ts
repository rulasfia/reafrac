import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { reactStartCookies } from 'better-auth/react-start';
import { username } from 'better-auth/plugins';
import { db } from './db-connection';
import * as schema from './db-schema';

export const auth = betterAuth({
	session: {
		cookieCache: {
			enabled: true
		}
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
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string
		}
	},
	plugins: [username(), reactStartCookies()]
});
