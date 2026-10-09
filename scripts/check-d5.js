const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const chunks = await prisma.chunk.findMany({ where: { documentId: 'D5' }, take: 10 });
  console.log("Found chunks for D5:", chunks.length);
  if (chunks.length > 0) {
    console.log(chunks[0].text);
  }
}
main().finally(() => prisma.$disconnect());
