import { getEncoding } from 'js-tiktoken';
import { RetrievedChunk } from './retrieve';
import { RAG_CONFIG } from './config';

// Load the exact tokenizer needed
const enc = getEncoding('o200k_base');

export function buildContext(chunks: (RetrievedChunk & { rerank_score?: number })[]): string {
  let totalTokens = 0;
  const maxTokens = RAG_CONFIG.context.max_budget_tokens || 2800;
  
  const selectedChunks: RetrievedChunk[] = [];
  
  for (const chunk of chunks) {
    // Note: Table row-group adjacent chunks and "Remarks" sibling chunks would be pulled in here.
    // For now, we simply accumulate the retrieved chunks until the strict budget is reached.
    
    const xmlStr = `
<chunk id="${chunk.chunk_id}" doc="${chunk.doc_id}" page="${chunk.page_start}">
${chunk.section_heading ? `<heading>${chunk.section_heading}</heading>\n` : ''}${chunk.text}
</chunk>`.trim();

    const tokens = enc.encode(xmlStr).length;
    
    if (totalTokens + tokens > maxTokens) {
      break;
    }
    
    totalTokens += tokens;
    selectedChunks.push(chunk);
  }
  
  return selectedChunks.map(chunk => {
    return `<chunk id="${chunk.chunk_id}" doc="${chunk.doc_id}">
${chunk.section_heading ? `<heading>${chunk.section_heading}</heading>\n` : ''}${chunk.text}
</chunk>`.trim();
  }).join('\n\n');
}
