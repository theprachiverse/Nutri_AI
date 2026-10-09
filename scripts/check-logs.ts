import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const logs = await prisma.retrievalLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log("Recent logs:", logs);
}
main().catch(console.error).finally(() => prisma.$disconnect());
