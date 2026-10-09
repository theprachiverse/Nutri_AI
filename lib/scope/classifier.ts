import fs from 'fs';
import path from 'path';
import { RAG_CONFIG } from '../rag/config';

// Define Cosine Similarity
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

let exemplars: { text: string; embedding: number[]; label: 'in_scope' | 'out_of_scope' }[] | null = null;

export async function checkSemanticScope(queryEmbedding: number[]): Promise<{ blocked: boolean; reason?: string }> {
  if (!exemplars) {
    const filePath = path.join(process.cwd(), 'eval', 'scope-exemplars.json');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      exemplars = JSON.parse(data);
    } else {
      // If exemplars not present, skip semantic scope check
      return { blocked: false };
    }
  }
  
  if (!exemplars || exemplars.length === 0) return { blocked: false };

  const scores = exemplars.map(ex => ({
    label: ex.label,
    score: cosineSimilarity(queryEmbedding, ex.embedding)
  }));

  scores.sort((a, b) => b.score - a.score);
  const topK = scores.slice(0, 5);
  
  const threshold = RAG_CONFIG.scope.classifier_threshold || 0.75;
  
  let outOfScopeCount = 0;
  for (const item of topK) {
    if (item.label === 'out_of_scope' && item.score >= threshold) {
      outOfScopeCount++;
    }
  }

  if (outOfScopeCount >= 3) {
    return { blocked: true, reason: 'Semantic classifier determined query is out of scope' };
  }

  return { blocked: false };
}
