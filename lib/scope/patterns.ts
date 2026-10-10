export const PATTERNS = {
  CALORIE_TARGET: /\b(how many|how much)\s+(calories?|kcals?)\b.*\b(should i|do i|for me)\b|\b(calorie[s]?|caloric|kcals?)\b.*\b(target|goal|limit|deficit|surplus)\b/i,
  WEIGHT_TARGET: /\b(lose|gain|drop|shed)\b.*\b(weight|fat|kilos|kg|lbs|pounds)\b/i,
  MEDICAL: /\b(cure|treat|diagnose|heal|medication|prescription)\b.*\b(disease|cancer|diabetes|hypertension|pcos|thyroid)\b|\b(disease|cancer|diabetes|hypertension|pcos|thyroid)\b.*\b(cure|treat|diagnose|heal|medication|prescription)\b/i,
  SYMPTOMS: /\b(i have|i am experiencing|my symptoms are)\b/i,
  BODY_IMAGE: /\b(i'm fat|i am fat|too fat|eat less carbs|diet to drop)\b/i,
};

export function matchScopePatterns(normalizedQuery: string): { blocked: boolean; reason?: string } {
  for (const [key, pattern] of Object.entries(PATTERNS)) {
    if (pattern.test(normalizedQuery)) {
      return { blocked: true, reason: `Pattern matched: ${key}` };
    }
  }
  return { blocked: false };
}
