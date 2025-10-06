import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './db-schema';

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
	throw new Error('DATABASE_URL is not defined');
}

const queryClient = postgres(DB_URL);
export const db = drizzle<typeof schema>({
	client: queryClient,
	casing: 'snake_case',
	logger: process.env.NODE_ENV?.toLowerCase() !== 'production'
});
