import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Note: This project uses PostgreSQL with pgvector, not ChromaDB.');
  console.log('Fetching a few chunks with their embeddings from PostgreSQL...\n');
  
  // We use raw query because embedding is an unsupported type vector(384) in Prisma schema
  const results = await prisma.$queryRaw<any[]>`
    SELECT id, "documentId", "chunkIndex", text, embedding::text as embedding
    FROM "Chunk"
    WHERE embedding IS NOT NULL
    LIMIT 3;
  `;

  if (results.length === 0) {
    console.log('No chunks with embeddings found in the database.');
    return;
  }

  results.forEach((chunk, index) => {
    console.log(`--- Chunk ${index + 1} ---`);
    console.log(`ID: ${chunk.id}`);
    console.log(`Document ID: ${chunk.documentId}`);
    console.log(`Chunk Index: ${chunk.chunkIndex}`);
    console.log(`Text Preview: ${chunk.text.substring(0, 100).replace(/\n/g, ' ')}...`);
    
    if (chunk.embedding) {
      const vectorStr = chunk.embedding.replace('[', '').replace(']', '');
      const vals = vectorStr.split(',').map(Number);
      
      console.log(`Embedding dimension: ${vals.length}`);
      console.log(`Embedding Preview (first 5 vals): [${vals.slice(0, 5).join(', ')}, ...]`);
    } else {
      console.log('No embedding vector found for this chunk.');
    }
    console.log();
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
