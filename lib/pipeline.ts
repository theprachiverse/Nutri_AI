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
  documentFilter?: string[]
): Promise<NutritionResponse> {
  
  // Fetch chat history
  const history = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' }
  });

  // 1. Scope Guard
  if (await isOutOfScope(question, history as any[])) {
    return buildDeclineResponse();
  }

  // 2. Query Routing & Expansion
  const routed = await routeAndExpandQuery(question, history as any[], documentFilter);
  if (routed.bypassToNotCovered) {
    return { status: 'not_covered' as const, answer_text: "Out of corpus.", claims: [], disagreements: undefined, searched_documents: routed.docIds || ["All"] };
  }

  // 3. Retrieval
  const candidates = await hybridSearch(
    routed.expandedQueries[0], 
    routed.mode, 
    population || null, 
    routed.docIds || null
  );
  
  // 4. Reranking
  const reranked = await reranker.rerank(routed.expandedQueries[0], candidates);
  
  // 5. Coverage
  if (!checkCoverage(reranked)) {
    return { status: 'not_covered' as const, answer_text: "Not covered by our sources.", claims: [], disagreements: undefined, searched_documents: routed.docIds || ["All"] };
  }

  // 6. Build Context
  const contextXml = buildContext(reranked);

  // 7. LLM Generation
  const initialResponse = await callModel([
    { role: 'user', content: `Question: ${question}\n\nContext:\n${contextXml}` }
  ]);

  // 8. Verifier
  const { response: verifiedResponse, droppedClaims } = await verifyAndCorrect(initialResponse, reranked, question);
  if (verifiedResponse.status === 'not_covered') {
    (verifiedResponse as any).searched_documents = routed.docIds || ["All"];
  }

  // 9. Hydration
  const finalResponse = await hydrateResponse(verifiedResponse, reranked);

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
