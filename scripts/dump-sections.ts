import { prisma } from '../lib/db';
import * as fs from 'fs';

async function main() {
  const chunks = await prisma.chunk.findMany({
    select: {
      documentId: true,
      sectionHeading: true,
      text: true
    }
  });

  const summary: any = {};
  for (const c of chunks) {
    if (!summary[c.documentId]) summary[c.documentId] = [];
    if (!summary[c.documentId].includes(c.sectionHeading)) {
      summary[c.documentId].push(c.sectionHeading);
    }
  }

  fs.writeFileSync('sections.json', JSON.stringify(summary, null, 2));
  console.log("Done");
}

main().catch(console.error).finally(() => prisma.$disconnect());
