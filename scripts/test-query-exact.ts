import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const query = 'tart cherry juice';
  const userDemographic = null;
  const docFilterStr = null;
  const vectorStr = '[0,0,0]';
  const rrfK = 60;
  const boost = 0.05;
  const kCandidates = 20;

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
             ROW_NUMBER() OVER (ORDER BY embedding <=> ${vectorStr}::vector) AS vector_rank
      FROM "Chunk"
      WHERE (${userDemographic}::text IS NULL OR NOT (${userDemographic}::text = ANY("excludedPop")))
        AND (${docFilterStr}::text[] IS NULL OR "documentId" = ANY(${docFilterStr}::text[]))
      ORDER BY vector_rank
      LIMIT 100
    ),
    fts_search AS (
      SELECT id AS chunk_id,
             ROW_NUMBER() OVER (ORDER BY ts_rank(tsv, websearch_to_tsquery('english', ${query})) DESC) AS fts_rank
      FROM "Chunk"
      WHERE (${userDemographic}::text IS NULL OR NOT (${userDemographic}::text = ANY("excludedPop")))
        AND (${docFilterStr}::text[] IS NULL OR "documentId" = ANY(${docFilterStr}::text[]))
        AND tsv @@ websearch_to_tsquery('english', ${query})
      ORDER BY fts_rank
      LIMIT 100
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
        COALESCE(1.0 / (${rrfK} + v.vector_rank), 0.0) + 
        COALESCE(1.0 / (${rrfK} + f.fts_rank), 0.0) AS base_rrf_score
      FROM vector_search v
      LEFT JOIN fts_search f ON v.chunk_id = f.chunk_id
    )
    SELECT 
      chunk_id,
      doc_id,
      text,
      section_heading,
      page_start,
      page_end,
      population,
      population_excluded,
      CASE 
        WHEN ${userDemographic}::text IS NOT NULL AND ${userDemographic}::text = ANY(population) 
        THEN base_rrf_score + ${boost}
        ELSE base_rrf_score
      END as rrf_score
    FROM rrf
    ORDER BY rrf_score DESC
    LIMIT ${kCandidates};
    `;
    console.log(res);
  } catch(e) {
    console.error(e);
  }
}
main();
