import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './db-schema';

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
	throw new Error('DATABASE_URL is not defined');
}

let queryClient: pg.Pool;
console.info('DB_URL', DB_URL);

if (process.env.DATABASE_MODE === 'native') {
	const { native } = pg;
	const { Pool } = native;

	queryClient = new Pool({
		connectionString: DB_URL
	});
} else {
	queryClient = new pg.Pool({
		connectionString: DB_URL
	});
}

export const db = drizzle<typeof schema>({
	client: queryClient,
	casing: 'snake_case'
});
