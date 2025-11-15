const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');
const schema = require('./schema.js');

const globalForDrizzle = globalThis.__drizzleDb ?? {};

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set.');
}

if (!globalForDrizzle.sql) {
  globalForDrizzle.sql = neon(process.env.DATABASE_URL);
}

if (!globalForDrizzle.db) {
  globalForDrizzle.db = drizzle(globalForDrizzle.sql, { schema });
}

globalForDrizzle.schema = schema;

globalThis.__drizzleDb = globalForDrizzle;

module.exports = {
  db: globalForDrizzle.db,
  sql: globalForDrizzle.sql,
  schema: globalForDrizzle.schema,
};
