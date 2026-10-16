import * as fs from 'fs';
import { hybridSearch } from '../lib/rag/retrieve';
import { prisma } from '../lib/db';
import { routeAndExpandQuery } from '../lib/rag/router';
import { reranker } from '../lib/rag/rerank';

async function main() {
  const bank = JSON.parse(fs.readFileSync('eval/question-bank.json', 'utf8'));
  let hit3Count = 0;
  let hit5Count = 0;
  let mrrSum = 0;

  console.log(`Evaluating ${bank.length} questions...`);

  for (let i = 0; i < bank.length; i++) {
    const q = bank[i];
    console.log(`\n[Q${i+1}] ${q.question}`);
    const route = await routeAndExpandQuery(q.question, []);
    // Detect demographic if present
    const isInfant = /\b(infant|baby|child|children)\b/i.test(q.question);
    const pop = isInfant ? 'infants' : null;

    const retrievalPromises = route.expandedQueries.map(queryStr => 
      hybridSearch(queryStr, 'all', pop, route.docIds)
    );
    const retrievalResults = await Promise.all(retrievalPromises);
    
    const candidatesMap = new Map<string, any>();
    for (const res of retrievalResults) {
      for (const c of res) {
        if (!candidatesMap.has(c.chunk_id) || candidatesMap.get(c.chunk_id).rrf_score < c.rrf_score) {
          candidatesMap.set(c.chunk_id, c);
        }
      }
    }
    const candidates = Array.from(candidatesMap.values());
    candidates.sort((a, b) => b.rrf_score - a.rrf_score);

    // Dual reranking
    const rerankQueries = Array.from(new Set([q.question, route.expandedQueries[0]]));
    const rerankRuns = await Promise.all(rerankQueries.map(queryStr => reranker.rerank(queryStr, candidates)));
    const bestScores = new Map<string, any>();
    for (const run of rerankRuns) {
      for (const c of run) {
        const prev = bestScores.get(c.chunk_id);
        if (!prev || prev.rerank_score < c.rerank_score) bestScores.set(c.chunk_id, c);
      }
    }
    const chunks = Array.from(bestScores.values()).sort((a, b) => b.rerank_score - a.rerank_score);

    let rank = -1;
    for (let j = 0; j < chunks.length; j++) {
      if (chunks[j].doc_id === q.expected_doc_id && (q.expected_section === 'General' || chunks[j].section_heading.includes(q.expected_section))) {
        rank = j + 1;
        break;
      }
    }

    if (rank !== -1) {
      console.log(`  -> Match found at rank ${rank} (${chunks[rank-1].doc_id}, ${chunks[rank-1].section_heading})`);
      if (rank <= 3) hit3Count++;
      if (rank <= 5) hit5Count++;
      mrrSum += 1.0 / rank;
    } else {
      console.log(`  -> No match found in top ${chunks.length}`);
    }
  }

  const hit3 = (hit3Count / bank.length) * 100;
  const hit5 = (hit5Count / bank.length) * 100;
  const mrr = mrrSum / bank.length;

  console.log(`\n=== RETRIEVAL EVALUATION RESULTS ===`);
  console.log(`Hit@3: ${hit3.toFixed(2)}%`);
  console.log(`Hit@5: ${hit5.toFixed(2)}%`);
  console.log(`MRR: ${mrr.toFixed(4)}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
