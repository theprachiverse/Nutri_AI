import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { embedder } from '../lib/rag/embedder';

const prisma = new PrismaClient();

async function main() {
  const manifestPath = path.join(process.cwd(), 'corpus', 'manifest.json');
  const chunksPath = path.join(process.cwd(), 'corpus', 'chunks', 'chunks.jsonl');

  if (!fs.existsSync(manifestPath)) {
    console.error(`Manifest not found at ${manifestPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(chunksPath)) {
    console.error(`Chunks not found at ${chunksPath}`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  console.log('Upserting Documents...');
  for (const [docId, docMeta] of Object.entries(manifest)) {
    const meta = docMeta as any;
    await prisma.document.upsert({
      where: { id: docId },
      update: {
        title: meta.name,
        shortName: meta.name,
        publisher: meta.publisher,
        publisherShort: meta.publisher,
        year: meta.year,
        sourceUrl: meta.source_url,
        format: meta.format,
        legalStatus: meta.legal_status,
        retrievalDate: meta.retrieval_date ? new Date(meta.retrieval_date) : null,
        sha256: meta.sha256,
      },
      create: {
        id: docId,
        title: meta.name,
        shortName: meta.name,
        publisher: meta.publisher,
        publisherShort: meta.publisher,
        year: meta.year,
        sourceUrl: meta.source_url,
        format: meta.format,
        legalStatus: meta.legal_status,
        retrievalDate: meta.retrieval_date ? new Date(meta.retrieval_date) : null,
        sha256: meta.sha256,
      },
    });
  }

  console.log('Reading existing chunks...');
  const existingChunks = await prisma.chunk.findMany({
    select: { id: true, contentHash: true, documentId: true }
  });

  const existingHash = new Map(existingChunks.map(c => [c.id, c.contentHash]));
  const dbChunkIds = new Set(existingChunks.map(c => c.id));
  const fileChunkIds = new Set<string>();

  const stream = fs.createReadStream(chunksPath);
  const rl = readline.createInterface({
    input: stream,
    crlfDelay: Infinity,
  });

  let batch: any[] = [];
  const BATCH_SIZE = 32;
  let chunkIndexGlobal = 0;

  const processBatch = async (items: any[]) => {
    if (items.length === 0) return;

    const itemsToUpsert = items.filter(item => {
      fileChunkIds.add(item.chunk_id);
      const eHash = existingHash.get(item.chunk_id);
      return eHash !== item.content_hash;
    });

    if (itemsToUpsert.length === 0) return;

    console.log(`Embedding ${itemsToUpsert.length} chunks...`);
    const texts = itemsToUpsert.map(i => i.embed_text || i.text);
    const embeddings = await embedder.embedBatch(texts, false);

    console.log(`Upserting ${itemsToUpsert.length} chunks to DB...`);
    for (let i = 0; i < itemsToUpsert.length; i++) {
      const item = itemsToUpsert[i];
      const emb = embeddings[i];
      
      const chunkId = item.chunk_id;
      const docId = item.doc_id;
      const chunkIndex = item.chunk_index ?? chunkIndexGlobal++;
      const chunkType = item.chunk_type ?? 'text';
      const sectionHeading = item.section_heading ?? item.section ?? '';
      const text = item.text;
      const pageStart = item.page_start ?? item.page_start ?? null;
      const pageEnd = item.page_end ?? item.page_end ?? null;
      const tokenCount = item.token_count ?? 0;
      const population = item.population ?? item.population_tags ?? [];
      const excludedPop = item.population_excluded ?? item.excludedPop ?? [];
      const contentHash = item.content_hash;

      const embStr = `[${emb.join(',')}]`;

      await prisma.$executeRaw`
        INSERT INTO "Chunk" (
          "id", "documentId", "sectionHeading", "chunkIndex", "chunkType",
          "text", "pageStart", "pageEnd", "tokenCount", "population",
          "excludedPop", "contentHash", "embedding"
        ) VALUES (
          ${chunkId}, ${docId}, ${sectionHeading}, ${chunkIndex}, ${chunkType},
          ${text}, ${pageStart}, ${pageEnd}, ${tokenCount}, ${population},
          ${excludedPop}, ${contentHash}, ${embStr}::vector
        )
        ON CONFLICT ("id") DO UPDATE SET
          "documentId" = EXCLUDED."documentId",
          "sectionHeading" = EXCLUDED."sectionHeading",
          "chunkIndex" = EXCLUDED."chunkIndex",
          "chunkType" = EXCLUDED."chunkType",
          "text" = EXCLUDED."text",
          "pageStart" = EXCLUDED."pageStart",
          "pageEnd" = EXCLUDED."pageEnd",
          "tokenCount" = EXCLUDED."tokenCount",
          "population" = EXCLUDED."population",
          "excludedPop" = EXCLUDED."excludedPop",
          "contentHash" = EXCLUDED."contentHash",
          "embedding" = EXCLUDED."embedding"
      `;
    }
  };

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const chunk = JSON.parse(line);
      batch.push(chunk);
      if (batch.length >= BATCH_SIZE) {
        await processBatch(batch);
        batch = [];
      }
    } catch (e) {
      console.error('Error parsing JSON line', e);
    }
  }

  if (batch.length > 0) {
    await processBatch(batch);
  }

  console.log('Deleting stale chunks...');
  const staleIds = Array.from(dbChunkIds).filter(id => !fileChunkIds.has(id));
  if (staleIds.length > 0) {
    await prisma.chunk.deleteMany({
      where: {
        id: { in: staleIds }
      }
    });
    console.log(`Deleted ${staleIds.length} stale chunks.`);
  }

  console.log('Updating IndexMeta...');
  const finalChunkCount = await prisma.chunk.count();
  await prisma.indexMeta.upsert({
    where: { id: 1 },
    update: {
      embeddingModel: 'Xenova/bge-small-en-v1.5',
      dimensions: 384,
      chunkCount: finalChunkCount,
      indexedAt: new Date(),
      corpusVersion: 1
    },
    create: {
      id: 1,
      embeddingModel: 'Xenova/bge-small-en-v1.5',
      dimensions: 384,
      chunkCount: finalChunkCount,
      indexedAt: new Date(),
      corpusVersion: 1
    }
  });

  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
