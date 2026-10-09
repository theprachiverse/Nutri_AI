"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkConversationContext = checkConversationContext;
function checkConversationContext(messages, currentNormalizedQuery) {
    // If "me", "I", "my" appears with context referring to personal targets
    var personalWords = /\b(me|my|mine|i)\b/i;
    if (personalWords.test(currentNormalizedQuery)) {
        // Check if the previous assistant message was a refusal or if there is a pattern of personal queries
        if (messages.length > 0) {
            return { blocked: true, reason: 'Hidden context attack detected (personalization in follow-up)' };
        }
    }
    // Drift detection: if user keeps asking same rejected question
    var refusalCount = 0;
    for (var _i = 0, messages_1 = messages; _i < messages_1.length; _i++) {
        var msg = messages_1[_i];
        if (msg.role === 'assistant' && msg.content.includes('out of scope')) { // simple heuristic
            refusalCount++;
        }
    }
    if (refusalCount >= 2 && personalWords.test(currentNormalizedQuery)) {
        return { blocked: true, reason: 'Persistence on out of scope topics' };
    }
    return { blocked: false };
}
