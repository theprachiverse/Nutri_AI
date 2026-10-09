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
      
      // V2: quote is a substring (fuzzy)
      const cleanText = chunk.text.replace(/\s+/g, ' ').toLowerCase();
      const cleanQuote = claim.quote.replace(/\s+/g, ' ').toLowerCase();
      
      if (!cleanText.includes(cleanQuote)) {
        errors.push(`Claim "${claim.claim_text}": quote "${claim.quote}" not found in chunk.`);
        droppedClaims.push(claim);
        continue;
      }
      
      // V3-V4: numerical consistency
      const extractNumbers = (str: string): string[] => (str.match(/\d+(\.\d+)?/g) || []);
      const claimNums = extractNumbers(claim.claim_text);
      const chunkNums = extractNumbers(chunk.text);
      const missing = claimNums.filter(n => !chunkNums.includes(n));
      
      if (missing.length > 0) {
        errors.push(`Claim "${claim.claim_text}": hallucinates numbers not in chunk [${missing.join(',')}].`);
        droppedClaims.push(claim);
        continue;
      }
      
      validClaims.push(claim);
    }
    
    return { validClaims, errors };
  }

  const { validClaims, errors } = validate(response);

  if (errors.length > 0) {
    console.log('Verification failed! Errors:', errors);
    // V8-V9: Trigger self-correction LLM pass
    const correctionPrompt = `
      Question: ${question}
      Context XML:
      ${JSON.stringify(contextChunks.map(c => `<chunk id="${c.chunk_id}">${c.text}</chunk>`))}
      
      Your previous response failed validation with the following errors:
      ${errors.join('\n')}
      
      Please provide a corrected response that strictly follows the constraints.
    `;
    
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
      
      return { response: { ...corrected, claims: correctedValidation.validClaims }, droppedClaims };
      
    } catch (e) {
      console.error('Self correction failed', e);
      return { response: { status: 'not_covered' as const, answer_text: "Verification failed.", claims: [], disagreements: null }, droppedClaims };
    }
  }

  return { response: { ...response, claims: validClaims }, droppedClaims };
}
