const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Chunk" ALTER COLUMN "tsv" DROP EXPRESSION;`);
    console.log("Successfully dropped expression on tsv column.");
  } catch (err) {
    console.error("Error executing query:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
