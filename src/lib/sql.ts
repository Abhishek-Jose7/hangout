import postgres from 'postgres';

// Simple PostgreSQL client wrapper using the `postgres` package.
// Usage: import sql from 'src/lib/sql'; then `await sql` queries.

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Environment variable DATABASE_URL is not set. See README.md for setup.');
}

// Configure minimal pooling and sensible defaults. Keep options small to avoid
// surprising behaviour on serverless platforms like Vercel.
const sql = postgres(connectionString, {
  // limit concurrent connections from one build/instance
  max: 5,
  // idle timeout in seconds before closing sockets
  idle_timeout: 5,
});

export default sql;
