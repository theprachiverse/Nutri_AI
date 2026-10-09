import { PrismaClient } from '@prisma/client';
import { routeAndExpandQuery } from './lib/rag/router';
import { hybridSearch } from './lib/rag/retrieve';
import { reranker } from './lib/rag/rerank';
import { buildContext } from './lib/rag/context';

async function main() {
  const query = "What are the WHO guidelines on non-sugar sweeteners?";
  const routed = await routeAndExpandQuery(query, []);
  console.log("Routed:", routed);

  const retrievalPromises = routed.expandedQueries.map(q => 
    hybridSearch(q, routed.mode, null, routed.docIds || null)
  );
  const retrievalResults = await Promise.all(retrievalPromises);
  const candidatesMap = new Map();
  for (const res of retrievalResults) {
    for (const c of res) {
      if (!candidatesMap.has(c.chunk_id) || candidatesMap.get(c.chunk_id).rrf_score < c.rrf_score) {
        candidatesMap.set(c.chunk_id, c);
      }
    }
  }
  const candidates = Array.from(candidatesMap.values());
  candidates.sort((a, b) => b.rrf_score - a.rrf_score);

  const reranked = await reranker.rerank(routed.expandedQueries[0], candidates);
  console.log("Top 3 reranked chunks:", reranked.slice(0,3).map(c => ({ id: c.chunk_id, score: c.rerank_score, doc: c.doc_id, text: c.text })));

  const { xmlStr } = buildContext(reranked);
  console.log("Context XML length:", xmlStr.length);
  // console.log("Context XML:", xmlStr);
}
main().catch(console.error);
