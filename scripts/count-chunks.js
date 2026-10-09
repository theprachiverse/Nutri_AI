const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const chunks = await prisma.chunk.groupBy({
    by: ['documentId'],
    _count: { id: true }
  });
  console.log("Chunks per document:", chunks);
}
main().finally(() => prisma.$disconnect());
