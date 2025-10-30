import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './db-schema';

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
	throw new Error('DATABASE_URL is not defined');
}

console.info('DB_URL', DB_URL);
const queryClient = new Pool({
	connectionString: DB_URL!
});
export const db = drizzle<typeof schema>({
	client: queryClient,
	casing: 'snake_case'
});
