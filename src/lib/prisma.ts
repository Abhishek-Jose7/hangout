import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function ensurePgBouncerCompatibility(url?: string) {
	if (!url) return url;
	// If user already opted-in, leave as-is
	if (url.includes('pgbouncer=true') || url.includes('statement_cache_size')) return url;
	const sep = url.includes('?') ? '&' : '?';
	// Enable Prisma's pgbouncer compatibility mode which disables prepared statement caching
	// and also set statement_cache_size=0 to be explicit.
	return `${url}${sep}pgbouncer=true&statement_cache_size=0`;
}

const rawUrl = process.env.DATABASE_URL;
const adjustedUrl = ensurePgBouncerCompatibility(rawUrl);

// Instantiate Prisma with an overridden datasource URL when available. This avoids
// prepared statement collisions when using Supabase poolers (PgBouncer/ Supavisor).
export const prisma = globalForPrisma.prisma || new PrismaClient({
	datasources: adjustedUrl ? { db: { url: adjustedUrl } } : undefined,
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;