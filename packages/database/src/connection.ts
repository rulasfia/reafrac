import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
	throw new Error('DATABASE_URL is not defined');
}

if (process.env.NODE_ENV?.toLowerCase() !== 'production') {
	console.info('DB_URL', DB_URL);
}

let client: postgres.Sql | null = null;

if (!client) {
	client = postgres(DB_URL);
}

export const db = drizzle<typeof schema>({
	casing: 'snake_case',
	client,
	schema
});
