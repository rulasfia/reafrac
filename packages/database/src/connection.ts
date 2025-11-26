import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
	throw new Error('DATABASE_URL is not defined');
}

if (process.env.NODE_ENV?.toLowerCase() !== 'production') {
	console.info('DB_URL', DB_URL);
}

let queryClient: pg.Pool | null = null;

if (!queryClient) {
	queryClient = new pg.Pool({
		connectionString: DB_URL,
		max: 10
	});
}

export const db = drizzle<typeof schema>({
	client: queryClient,
	casing: 'snake_case',
	schema
});
