const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const docs = await prisma.document.findMany();
  console.log("Documents in DB:", docs.map(d => ({id: d.id, title: d.title})));
}
main().catch(console.error).finally(() => prisma.$disconnect());
