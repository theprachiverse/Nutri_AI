const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Fetch chunks that might contain strange characters
  const chunks = await prisma.chunk.findMany({
    select: { id: true, text: true }
  });

  let updatedCount = 0;
  
  // The boxes are usually replacement characters (\uFFFD), non-breaking spaces (\u00A0), or control chars like \u0002, \x02, \x09.
  // We'll replace all control characters (except newline and tab) and replacement characters with standard spaces.
  const regex = /[\u0000-\u0008\u000B-\u000C\u000E-\u001F\uFFFD\u2028\u2029]/g;
  
  for (const chunk of chunks) {
    if (regex.test(chunk.text)) {
      const cleanText = chunk.text.replace(regex, ' ').replace(/\s+/g, ' ').trim();
      
      await prisma.chunk.update({
        where: { id: chunk.id },
        data: { text: cleanText }
      });
      updatedCount++;
    }
  }
  
  console.log(`Cleaned ${updatedCount} chunks with bad characters.`);
}

main().finally(() => prisma.$disconnect());
