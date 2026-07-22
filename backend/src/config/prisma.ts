import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

/**
 * Singleton Prisma Client, wired to Neon via the pg driver adapter.
 *
 * Prisma 7 requires an explicit driver adapter instead of reading
 * DATABASE_URL automatically — see prisma.config.ts for how migrations
 * pick up DATABASE_URL/DIRECT_URL; this is the separate runtime path the
 * app itself uses for queries.
 */
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = new PrismaClient({ adapter });
