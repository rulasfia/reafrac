const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
	throw new Error('DATABASE_URL is not defined');
}

export default {
	out: './migrations',
	schema: './src/lib/db-schema.ts',
	dialect: 'postgresql',
	strict: true,
	casing: 'snake_case',
	dbCredentials: { url: DB_URL }
};
