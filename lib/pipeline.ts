import { isOutOfScope, buildDeclineResponse } from './scopeGuard';
import { routeAndExpandQuery } from './rag/router';
import { hybridSearch } from './rag/retrieve';
import { reranker } from './rag/rerank';
import { checkCoverage } from './rag/coverage';
import { buildContext } from './rag/context';
import { callModel } from './model';
import { verifyAndCorrect } from './rag/verify';
import { hydrateResponse } from './rag/hydrate';
import { checkOutputGuard } from './scope/outputGuard';
import { RAG_CONFIG } from './rag/config';
import { prisma } from './db';
import { NutritionResponse } from './schema';

export async function answerQuestion(
  question: string, 
  conversationId: string, 
  population?: string,
  documentFilter?: string[],
  onProgress?: (msg: string) => void
): Promise<NutritionResponse> {
  // Canonicalize so casing/spacing/trailing punctuation never changes retrieval
  question = question.trim().replace(/\s+/g, ' ').replace(/[?!.\s]+$/g, '').toLowerCase();
  
  // Fetch chat history
  const history = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' }
  });

  // 1. Scope Guard
  if (onProgress) onProgress("Checking clinical safety rules...");
  if (await isOutOfScope(question, history as any[])) {
    return buildDeclineResponse();
  }

  // 2. Query Routing & Expansion
  if (onProgress) onProgress("Analyzing question & expanding queries...");
  const routed = await routeAndExpandQuery(question, history as any[], documentFilter);
  if (routed.bypassToNotCovered) {
    return { status: 'not_covered' as const, answer_text: "Out of corpus.", claims: [], disagreements: undefined, searched_documents: routed.docIds || ["All"] };
  }

  // 3. Retrieval
  if (onProgress) onProgress("Searching dietary guidelines...");
  const candidatesMap = new Map<string, any>();
  for (const q of routed.expandedQueries) {
    try {
      const res = await hybridSearch(q, routed.mode, population || null, routed.docIds || null);
      for (const c of res) {
        if (!candidatesMap.has(c.chunk_id) || candidatesMap.get(c.chunk_id).rrf_score < c.rrf_score) {
          candidatesMap.set(c.chunk_id, c);
        }
      }
    } catch (e) {
      console.warn(`Query retrieval warning for "${q}":`, e);
    }
  }
  const candidates = Array.from(candidatesMap.values());
  candidates.sort((a, b) => b.rrf_score - a.rrf_score);
  
  // 4. Reranking
  if (onProgress) onProgress("Re-ranking and filtering sources...");
  // Score against the original question AND the expanded query; keep the best score per chunk
  const rerankQueries = Array.from(new Set([question, routed.expandedQueries[0]]));
  const bestScores = new Map<string, any>();
  for (const q of rerankQueries) {
    const run = await reranker.rerank(q, candidates);
    for (const c of run) {
      const prev = bestScores.get(c.chunk_id);
      if (!prev || prev.rerank_score < c.rerank_score) bestScores.set(c.chunk_id, c);
    }
  }
  const reranked = Array.from(bestScores.values()).sort((a, b) => b.rerank_score - a.rerank_score);
  
  // 5. Coverage
  if (!checkCoverage(reranked)) {
    return { status: 'not_covered' as const, answer_text: "Not covered by our sources.", claims: [], disagreements: undefined, searched_documents: routed.docIds || ["All"] };
  }

  // Enforce k_final (5) and max 2 per doc to maintain diversity
  const kFinal = RAG_CONFIG.retrieval.k_final || 5;
  const kPerDoc = RAG_CONFIG.retrieval.k_per_doc || 2;
  const docCounts = new Map<string, number>();
  const finalCandidates: typeof reranked = [];
  for (const c of reranked) {
    const count = docCounts.get(c.doc_id) || 0;
    if (count < kPerDoc && finalCandidates.length < kFinal) {
      finalCandidates.push(c);
      docCounts.set(c.doc_id, count + 1);
    }
  }
  if (finalCandidates.length < kFinal) {
    for (const c of reranked) {
      if (finalCandidates.length >= kFinal) break;
      if (!finalCandidates.some(item => item.chunk_id === c.chunk_id)) {
        finalCandidates.push(c);
      }
    }
  }

  // 6. Build Context
  const { xmlStr: contextXml, selectedChunks } = buildContext(finalCandidates);

  // 7. LLM Generation
  if (onProgress) onProgress("Synthesizing clinical insights...");
  const initialResponse = await callModel([
    { role: 'user', content: `Question: ${question}\n\nContext:\n${contextXml}` }
  ]);

  // 8. Verifier
  if (onProgress) onProgress("Strictly verifying facts and quotes...");
  const { response: verifiedResponse, droppedClaims } = await verifyAndCorrect(initialResponse, selectedChunks, question);
  if (verifiedResponse.status === 'not_covered') {
    (verifiedResponse as any).searched_documents = routed.docIds || ["All"];
  }

  // 9. Hydration
  const finalResponse = await hydrateResponse(verifiedResponse, selectedChunks);

  // L4: Output Prescription Guard (Ensure population-level guidance)
  if (finalResponse.status === 'answered' && finalResponse.answer_text) {
    const guard = checkOutputGuard(finalResponse.answer_text);
    if (guard.blocked) {
      finalResponse.answer_text = finalResponse.answer_text
        .replace(/\bi recommend that you\b/gi, 'guidelines advise to')
        .replace(/\byou should\b/gi, 'it is recommended to')
        .replace(/\byou must\b/gi, 'individuals are advised to')
        .replace(/\byou need to\b/gi, 'it is necessary to');
    }
  }

  // 10. Database Orchestration
  const message = await prisma.message.create({
    data: {
      conversationId,
      role: 'assistant',
      content: finalResponse.answer_text
    }
  });

  if (finalResponse.claims && finalResponse.claims.length > 0) {
    await prisma.messageCitation.createMany({
      data: finalResponse.claims.map(claim => ({
        messageId: message.id,
        chunkId: claim.citation.chunk_id,
        claimText: claim.claim_text,
        quote: claim.citation.quote
      }))
    });
  }

  await prisma.retrievalLog.create({
    data: {
      messageId: message.id,
      query: question,
      mode: routed.mode,
      candidatesCount: candidates.length,
      keptCount: reranked.length,
      droppedClaims: droppedClaims
    }
  });

  return finalResponse;
}
