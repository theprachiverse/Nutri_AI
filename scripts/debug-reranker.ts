import { hybridSearch } from '../lib/rag/retrieve';
import { reranker } from '../lib/rag/rerank';
import { getEncoding } from 'js-tiktoken';

async function test() {
  const query = 'Is coffee good for health?';
  const chunks = await hybridSearch(query, 'all', null);
  
  const reranked = await reranker.rerank(query, chunks);
  
  console.log('--- Reranker Results ---');
  let cumulativeTokens = 0;
  const enc = getEncoding('o200k_base');
  
  for (let i = 0; i < reranked.length; i++) {
    const chunk = reranked[i];
    const xml = `<chunk id="${chunk.chunk_id}" doc="${chunk.doc_id}">\n${chunk.section_heading ? `<heading>${chunk.section_heading}</heading>\n` : ''}${chunk.text}\n</chunk>`;
    const tokens = enc.encode(xml).length;
    cumulativeTokens += tokens;
    
    console.log(`Rank ${i+1} [Score: ${chunk.rerank_score.toFixed(4)}] | Tokens: ${tokens} | Cumulative: ${cumulativeTokens}`);
    console.log(`Text snippet: ${chunk.text.substring(0, 100)}...`);
    if (chunk.text.toLowerCase().includes('coffee')) {
       console.log(`>>> HAS COFFEE <<<`);
    }
    console.log('------------------------');
  }
}

test().catch(console.error);
