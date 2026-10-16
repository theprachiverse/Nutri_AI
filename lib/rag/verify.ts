import { z } from 'zod';
import { ModelOutputSchema } from '../schema';
import { callModel } from '../model';
import { RetrievedChunk } from './retrieve';

export async function verifyAndCorrect(
  modelResponse: z.infer<typeof ModelOutputSchema>,
  contextChunks: RetrievedChunk[],
  question: string
) {
  let response = { ...modelResponse };
  const droppedClaims: any[] = [];

  if (response.status === 'not_covered') {
    return { response, droppedClaims };
  }

  function validate(resp: z.infer<typeof ModelOutputSchema>) {
    const validClaims: typeof resp.claims = [];
    const errors: string[] = [];

    for (const claim of resp.claims) {
      const chunk = contextChunks.find(c => c.chunk_id === claim.chunk_id);
      
      // V1: chunk_id exists
      if (!chunk) {
        errors.push(`Claim "${claim.claim_text}": chunk_id ${claim.chunk_id} not found in context.`);
        droppedClaims.push(claim);
        continue;
      }
      
      // V2: quote is a substring (fuzzy/normalized)
      const fullChunkText = `${chunk.section_heading ? chunk.section_heading + ' ' : ''}${chunk.text}`;
      const cleanText = fullChunkText.replace(/\s+/g, ' ').toLowerCase();
      const cleanQuote = claim.quote.replace(/\s+/g, ' ').toLowerCase();
      
      if (!cleanText.includes(cleanQuote)) {
        // Fallback: normalize quotes and punctuation to prevent drops from PDF extraction spacing artifacts
        const norm = (s: string) => 
          s.replace(/[\u2018\u2019'`"]/g, '')
           .replace(/[,\.;:\-]/g, ' ')
           .replace(/\s+/g, ' ')
           .trim()
           .toLowerCase();

        if (!norm(fullChunkText).includes(norm(claim.quote))) {
          errors.push(`Claim "${claim.claim_text}": quote "${claim.quote}" not found in chunk.`);
          droppedClaims.push(claim);
          continue;
        }
      }
      
      // V3-V4: numerical consistency
      const extractNumbers = (str: string): string[] => (str.match(/\d+(\.\d+)?/g) || []);
      const claimNums = extractNumbers(claim.claim_text);
      const chunkNums = extractNumbers(fullChunkText);
      const missing = claimNums.filter(n => !chunkNums.includes(n));
      
      if (missing.length > 0) {
        errors.push(`Claim "${claim.claim_text}": hallucinates numbers not in chunk [${missing.join(',')}].`);
        droppedClaims.push(claim);
        continue;
      }
      
      validClaims.push(claim);
    }

    let validDisagreements: typeof resp.disagreements = null;
    if (resp.disagreements && Array.isArray(resp.disagreements)) {
      validDisagreements = resp.disagreements
        .map(dis => {
          const validPositions = dis.positions.filter(pos => {
            const chunk = contextChunks.find(c => c.chunk_id === pos.chunk_id);
            if (!chunk) {
              errors.push(`Disagreement "${dis.topic}": chunk_id ${pos.chunk_id} not found in context.`);
              return false;
            }
            return true;
          });
          return { ...dis, positions: validPositions };
        })
        .filter(dis => dis.positions.length >= 2);

      if (validDisagreements.length === 0) validDisagreements = null;
    }

    return { validClaims, validDisagreements, errors };
  }

  const { validClaims, validDisagreements, errors } = validate(response);
  response.disagreements = validDisagreements;

  if (validClaims.length === 0 && errors.length > 0) {
    console.log('All claims failed verification! Errors:', errors);
    // V8-V9: Trigger self-correction LLM pass since we have no valid claims left
    const xmlContext = contextChunks.map(c => `<chunk id="${c.chunk_id}">\n${c.text}\n</chunk>`).join('\n\n');
    const correctionPrompt = `Question: ${question}\n\nContext XML:\n${xmlContext}\n\nYour previous response failed validation with the following errors:\n${errors.join('\n')}\n\nPlease provide a corrected response that strictly follows the constraints.`;
    
    try {
      const corrected = await callModel([
         { role: 'user', content: correctionPrompt }
      ]);
      const correctedValidation = validate(corrected);
      
      if (correctedValidation.validClaims.length === 0) {
         return { 
           response: { status: 'not_covered' as const, answer_text: "The information cannot be verified based on the provided context.", claims: [], disagreements: null },
           droppedClaims: [...droppedClaims, ...correctedValidation.errors]
         };
      }
      
      return { response: { ...corrected, claims: correctedValidation.validClaims, disagreements: correctedValidation.validDisagreements }, droppedClaims };
      
    } catch (e) {
      console.error('Self correction failed', e);
      return { response: { status: 'not_covered' as const, answer_text: "We found some information, but it could not be strictly verified against our sources.", claims: [], disagreements: null }, droppedClaims };
    }
  }

  // If we have at least one valid claim, we just drop the bad ones and proceed without a costly second LLM pass.
  if (errors.length > 0) {
    console.log('Partial verification failure. Dropping bad claims:', errors);
  }
  
  return { response: { ...response, claims: validClaims, disagreements: validDisagreements }, droppedClaims };
}
