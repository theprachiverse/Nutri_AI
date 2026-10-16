import { PrismaClient } from '@prisma/client';

if (typeof (process as any).loadEnvFile === 'function' && !process.env.DATABASE_URL) {
  try { (process as any).loadEnvFile('.env'); } catch {}
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ['query'] });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
