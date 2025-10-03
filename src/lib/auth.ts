import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { username } from 'better-auth/plugins';
import { db } from './db-connection';
import * as schema from './db-schema';

export const auth = betterAuth({
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
	plugins: [username()]
});
