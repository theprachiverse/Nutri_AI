import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const query = 'tart cherry juice';
  try {
    const res = await prisma.$queryRaw`
    WITH vector_search AS (
      SELECT id AS chunk_id,
             "documentId" AS doc_id,
             text,
             "sectionHeading" AS section_heading,
             "pageStart" AS page_start,
             "pageEnd" AS page_end,
             population,
             "excludedPop" AS population_excluded,
             ROW_NUMBER() OVER (ORDER BY embedding <=> '[0,0,0]'::vector) AS vector_rank
      FROM "Chunk"
      LIMIT 10
    ),
    fts_search AS (
      SELECT id AS chunk_id,
             ROW_NUMBER() OVER (ORDER BY ts_rank(tsv, websearch_to_tsquery('english', ${query})) DESC) AS fts_rank
      FROM "Chunk"
      WHERE tsv @@ websearch_to_tsquery('english', ${query})
      LIMIT 10
    ),
    rrf AS (
      SELECT 
        v.chunk_id,
        v.doc_id,
        v.text,
        v.section_heading,
        v.page_start,
        v.page_end,
        v.population,
        v.population_excluded,
        COALESCE(1.0 / (60 + v.vector_rank), 0.0) + 
        COALESCE(1.0 / (60 + f.fts_rank), 0.0) AS base_rrf_score
      FROM vector_search v
      LEFT JOIN fts_search f ON v.chunk_id = f.chunk_id
    )
    SELECT * FROM rrf LIMIT 10;
    `;
    console.log(res);
  } catch(e) {
    console.error(e);
  }
}
main();
