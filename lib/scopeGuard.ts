import { NutritionResponse } from './schema';
import { normalizeQuery } from './scope/normalize';
import { matchScopePatterns } from './scope/patterns';
import { checkSemanticScope } from './scope/classifier';
import { checkConversationContext, Message } from './scope/conversation';
import { embedder } from './rag/embedder';

export async function isOutOfScope(message: string, history: Message[] = []): Promise<boolean> {
  const normalized = normalizeQuery(message);
  
  // L1: Regex patterns
  const l1 = matchScopePatterns(normalized);
  if (l1.blocked) return true;
  
  // L3: Conversation Context
  const l3 = checkConversationContext(history, normalized);
  if (l3.blocked) return true;

  // L2: Semantic Classifier
  const embedding = await embedder.embed(message, false);
  const l2 = await checkSemanticScope(embedding);
  if (l2.blocked) return true;

  return false;
}

export function buildDeclineResponse(): NutritionResponse {
  return {
    status: 'out_of_scope',
    answer_text: "That question falls outside what I can help with. For calorie targets, weight advice, or any medical concerns, please speak with a registered dietitian or your doctor.",
    claims: [],
  };
}
