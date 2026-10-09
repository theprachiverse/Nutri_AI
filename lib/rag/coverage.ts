import { RetrievedChunk } from './retrieve';
import { RAG_CONFIG } from './config';

export function checkCoverage(rerankedChunks: (RetrievedChunk & { rerank_score: number })[]): boolean {
  if (rerankedChunks.length === 0) return false;
  
  // Evaluate the top candidate's cross-encoder score against MIN_SCORE
  const topScore = rerankedChunks[0].rerank_score;
  
  // MIN_SCORE is e.g. 2.0 (for raw logits depending on model)
  // or 0.5 for probabilities. We use the config if available, otherwise a default of 0.5.
  const threshold = RAG_CONFIG.retrieval.min_cosine_score || 0.5;
  
  return topScore >= threshold;
}
