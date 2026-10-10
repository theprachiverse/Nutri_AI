export type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export function checkConversationContext(messages: Message[], currentNormalizedQuery: string): { blocked: boolean; reason?: string } {
  // If "me", "I", "my" appears with context referring to personal targets
  const personalWords = /\b(me|my|mine|i)\b/i;
  
  if (personalWords.test(currentNormalizedQuery)) {
    // Check if the previous assistant message was a refusal
    const previousAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
    if (previousAssistantMessage && previousAssistantMessage.content.includes('outside what I can help with')) {
      return { blocked: true, reason: 'Hidden context attack detected (personalization in follow-up to refusal)' };
    }
  }
  
  // Drift detection: if user keeps asking same rejected question
  let refusalCount = 0;
  for (const msg of messages) {
    if (msg.role === 'assistant' && msg.content.includes('out of scope')) { // simple heuristic
      refusalCount++;
    }
  }
  
  if (refusalCount >= 2 && personalWords.test(currentNormalizedQuery)) {
     return { blocked: true, reason: 'Persistence on out of scope topics' };
  }
  
  return { blocked: false };
}
