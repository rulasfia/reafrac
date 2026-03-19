import { defineConfig } from 'drizzle-kit';

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
	throw new Error('DATABASE_URL is not defined');
}

console.log({ DB_URL });
export default defineConfig({
	out: './migrations',
	schema: './src/schema.ts',
	dialect: 'postgresql',
	strict: true,
	casing: 'snake_case',
	dbCredentials: { url: DB_URL }
});
