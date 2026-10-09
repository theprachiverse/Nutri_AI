import { prisma } from '../lib/db';
import { normalizeQuery } from '../lib/scope/normalize';

const questions = [
  "How much iron does an adult woman need per day?",
  "What are the main food sources of Vitamin B12?",
  "How much protein does a sedentary vegetarian adult need daily?",
  "How long can cooked chicken be safely stored in the fridge?",
  "Is it safe to refreeze meat that has been thawed in the fridge?",
  "Does boiling vegetables destroy all their vitamins?",
  "What is the safest internal temperature for cooked pork?",
  "Is coffee good or bad for your health overall?",
  "Are artificial sweeteners harmful in moderate amounts?",
  "Is eating red meat a few times a week harmful long-term?"
];

async function runTest() {
  console.log('--- STARTING RETRIEVAL TEST (MOCKING VECTOR, USING FTS) ---');
  
  // Array of 384 zeros
  const mockVector = new Array(384).fill(0);
  const vectorStr = `[${mockVector.join(',')}]`;

  for (let i = 0; i < questions.length; i++) {
    const rawQ = questions[i];
    const q = normalizeQuery(rawQ);
    console.log(`\n\n[Q${i + 1}] ${rawQ}`);
    
    try {
      const results = await prisma.$queryRaw<any[]>`
        WITH vector_search AS (
          SELECT id, "documentId", text, "sectionHeading", ROW_NUMBER() OVER (ORDER BY embedding <=> ${vectorStr}::vector) AS vector_rank
          FROM "Chunk" LIMIT 100
        ),
        fts_search AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY ts_rank(tsv, websearch_to_tsquery('english', ${q})) DESC) AS fts_rank
          FROM "Chunk" WHERE tsv @@ websearch_to_tsquery('english', ${q}) LIMIT 100
        ),
        rrf AS (
          SELECT v.id, v."documentId", v.text, v."sectionHeading", 
                 COALESCE(1.0 / (60 + v.vector_rank), 0.0) + COALESCE(1.0 / (60 + f.fts_rank), 0.0) AS rrf_score
          FROM vector_search v LEFT JOIN fts_search f ON v.id = f.id
        )
        SELECT * FROM rrf ORDER BY rrf_score DESC LIMIT 3;
      `;
      
      if (results.length === 0) {
        console.log(`  -> No chunks retrieved.`);
        continue;
      }
      
      console.log(`Top Chunks Retrieved:`);
      for (const chunk of results) {
        console.log(`  - [${chunk.documentId}] ${chunk.sectionHeading} (Score: ${Number(chunk.rrf_score).toFixed(3)})`);
        console.log(`    Excerpt: ${chunk.text.substring(0, 150).replace(/\n/g, ' ')}...`);
      }
    } catch (e) {
      console.log(`  -> Error retrieving: ${(e as Error).message}`);
    }
  }
}

runTest().catch(console.error).finally(() => process.exit(0));
