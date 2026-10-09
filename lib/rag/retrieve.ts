import { prisma } from '../db';
import { RAG_CONFIG } from './config';
import { embedder } from './embedder';

export type RetrievedChunk = {
  chunk_id: string;
  doc_id: string;
  text: string;
  section_heading: string;
  page_start: number;
  page_end: number;
  population: string[];
  population_excluded: string[];
  rrf_score: number;
};

export async function hybridSearch(
  query: string, 
  mode: 'all' | 'single_document' | 'per_document', 
  userDemographic: string | null = null,
  documentFilter: string[] | null = null
): Promise<RetrievedChunk[]> {
  const queryEmbedding = await embedder.embed(query, true);
  const vectorStr = `[${queryEmbedding.join(',')}]`;
  
  const kCandidates = RAG_CONFIG.retrieval.k_candidates || 20;
  const rrfK = RAG_CONFIG.retrieval.rrf_k || 60;
  const boost = RAG_CONFIG.retrieval.population_boost || 0.05;
  
  // Convert documentFilter to Postgres array string for raw SQL
  // e.g., '{"D1","D2"}'
  const docFilterStr = documentFilter && documentFilter.length > 0 
    ? `{${documentFilter.map(d => `"${d}"`).join(',')}}` 
    : null;
  
  // Note: pgvector distance <=> is cosine distance
  const results = await prisma.$queryRaw<RetrievedChunk[]>`
    WITH vector_search AS (
      SELECT id AS chunk_id,
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
        COALESCE(v.chunk_id, f.chunk_id) AS chunk_id,
        COALESCE(1.0 / (${rrfK} + v.vector_rank), 0.0) + 
        COALESCE(1.0 / (${rrfK} + f.fts_rank), 0.0) AS base_rrf_score
      FROM vector_search v
      FULL OUTER JOIN fts_search f ON v.chunk_id = f.chunk_id
    )
    SELECT 
      c.id AS chunk_id,
      c."documentId" AS doc_id,
      c.text,
      c."sectionHeading" AS section_heading,
      c."pageStart" AS page_start,
      c."pageEnd" AS page_end,
      c.population,
      c."excludedPop" AS population_excluded,
      CASE 
        WHEN ${userDemographic}::text IS NOT NULL AND ${userDemographic}::text = ANY(c.population) 
        THEN r.base_rrf_score + ${boost}
        ELSE r.base_rrf_score
      END as rrf_score
    FROM rrf r
    JOIN "Chunk" c ON c.id = r.chunk_id
    ORDER BY rrf_score DESC
    LIMIT ${kCandidates};
  `;

  if (mode === 'per_document') {
    const kPerDoc = RAG_CONFIG.retrieval.k_per_doc || 2;
    const grouped = new Map<string, RetrievedChunk[]>();
    for (const row of results) {
      const list = grouped.get(row.doc_id) || [];
      if (list.length < kPerDoc) {
        list.push(row);
        grouped.set(row.doc_id, list);
      }
    }
    return Array.from(grouped.values()).flat().sort((a, b) => b.rrf_score - a.rrf_score);
  }

  return results;
}
