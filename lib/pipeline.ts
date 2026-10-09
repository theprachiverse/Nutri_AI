import { isOutOfScope, buildDeclineResponse } from './scopeGuard';
import { routeAndExpandQuery } from './rag/router';
import { hybridSearch } from './rag/retrieve';
import { reranker } from './rag/rerank';
import { checkCoverage } from './rag/coverage';
import { buildContext } from './rag/context';
import { callModel } from './model';
import { verifyAndCorrect } from './rag/verify';
import { hydrateResponse } from './rag/hydrate';
import { prisma } from './db';
import { NutritionResponse } from './schema';

export async function answerQuestion(
  question: string, 
  conversationId: string, 
  population?: string,
  documentFilter?: string[],
  onProgress?: (msg: string) => void
): Promise<NutritionResponse> {
  
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
  const retrievalPromises = routed.expandedQueries.map(q => 
    hybridSearch(q, routed.mode, population || null, routed.docIds || null)
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
  
  // 4. Reranking
  if (onProgress) onProgress("Re-ranking and filtering sources...");
  const reranked = await reranker.rerank(routed.expandedQueries[0], candidates);
  
  // 5. Coverage
  if (!checkCoverage(reranked)) {
    return { status: 'not_covered' as const, answer_text: "Not covered by our sources.", claims: [], disagreements: undefined, searched_documents: routed.docIds || ["All"] };
  }

  // 6. Build Context
  const { xmlStr: contextXml, selectedChunks } = buildContext(reranked);

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
