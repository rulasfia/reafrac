import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { tanstackStartCookies } from 'better-auth/tanstack-start';
import { username } from 'better-auth/plugins';
import { db } from './db-connection';
import * as schema from './db-schema';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

const socialProviders: Record<string, Record<string, string>> = {};

if (googleClientId && googleClientSecret) {
	socialProviders.google = {
		clientId: googleClientId,
		clientSecret: googleClientSecret
	};
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
		database: { generateId: 'uuid' }
	},
	emailAndPassword: {
		enabled: true
	},
	socialProviders,
	plugins: [username(), tanstackStartCookies()],
	experimental: {
		joins: true
	}
});
