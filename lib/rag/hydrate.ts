import { z } from 'zod';
import { Citation, ClaimV2, Disagreement, ModelOutputSchema, NutritionResponse } from '../schema';
import { prisma } from '../db';
import { RetrievedChunk } from './retrieve';

export async function hydrateResponse(
  verifiedResponse: z.infer<typeof ModelOutputSchema>,
  contextChunks: RetrievedChunk[]
): Promise<NutritionResponse> {
  if (verifiedResponse.status !== 'answered') {
    return {
      status: verifiedResponse.status,
      answer_text: verifiedResponse.answer_text,
      claims: []
    };
  }

  // Fetch full document data for citations
  const docIds = Array.from(new Set(contextChunks.map(c => c.doc_id)));
  const docs = await prisma.document.findMany({
    where: { id: { in: docIds } }
  });
  
  const docMap = new Map(docs.map(d => [d.id, d]));

  const hydratedClaims: ClaimV2[] = verifiedResponse.claims.map(claim => {
    const chunk = contextChunks.find(c => c.chunk_id === claim.chunk_id);
    const doc = chunk ? docMap.get(chunk.doc_id) : undefined;
    
    const isPdf = doc?.format?.toLowerCase() === 'pdf';
    const url = isPdf && chunk?.page_start
      ? `${doc?.sourceUrl}#page=${chunk.page_start}`
      : (doc?.sourceUrl || '');

    const citation: Citation = {
      chunk_id: chunk?.chunk_id || claim.chunk_id,
      doc_id: chunk?.doc_id || '',
      document_title: doc?.title || 'Unknown Document',
      publisher: doc?.publisherShort || doc?.publisher || 'Unknown Publisher',
      year: doc?.year || 2024,
      url,
      section: chunk?.section_heading || '',
      legal_status: doc?.legalStatus || 'guidance',
      quote: claim.quote
    };

    return {
      claim_text: claim.claim_text,
      citation
    };
  });

  const hydratedDisagreements: Disagreement[] = verifiedResponse.disagreements?.map(dis => ({
    topic: dis.topic,
    positions: dis.positions
      .map(pos => {
        const chunk = contextChunks.find(c => c.chunk_id === pos.chunk_id);
        const doc = chunk ? docMap.get(chunk.doc_id) : undefined;
        if (!chunk || !doc) return null;
        
        const isPdf = doc.format?.toLowerCase() === 'pdf';
        const url = isPdf && chunk.page_start
          ? `${doc.sourceUrl}#page=${chunk.page_start}`
          : doc.sourceUrl;

        return {
          doc_id: doc.id,
          publisher: doc.publisherShort || doc.publisher,
          year: doc.year,
          statement: pos.statement,
          citation: {
             chunk_id: chunk.chunk_id,
             doc_id: chunk.doc_id,
             document_title: doc.title,
             publisher: doc.publisherShort || doc.publisher,
             year: doc.year,
             url,
             section: chunk.section_heading || '',
             legal_status: doc.legalStatus,
             quote: "" // We omit quote mapping for disagreements to keep schema simple
          }
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)
  })).filter(dis => dis.positions.length >= 2) || [];

  return {
    status: 'answered',
    answer_text: verifiedResponse.answer_text,
    claims: hydratedClaims,
    disagreements: hydratedDisagreements.length > 0 ? hydratedDisagreements : undefined
  };
}
