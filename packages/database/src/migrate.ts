import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
	throw new Error('DATABASE_URL is not defined');
}

export async function runMigrations() {
	const migrationClient = postgres(DB_URL!, { max: 1 });
	const db = drizzle(migrationClient, { schema });

	// Migrations folder is relative to this file's location
	const currentDir = path.dirname(fileURLToPath(import.meta.url));
	const migrationsFolder = path.join(currentDir, '../migrations');

	await migrate(db, { migrationsFolder });

	await migrationClient.end();
}
