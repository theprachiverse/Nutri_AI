import { NutritionResponse } from './schema';

const BLOCKED_PATTERNS: RegExp[] = [
  /\b(calorie[s]?|caloric)\b.*\b(target|goal|limit|deficit|surplus)\b/i,
  /\bhow (many|much) calories? (should|do) I (eat|consume|have)\b/i,
  /\blose weight\b|\bweight loss\b|\bweight[-\s]?loss\b/i,
  /\bBMI\b|\bbody mass index\b/i,
  /\bwhat should I weigh\b|\bmy ideal weight\b/i,
  /\b(diagnose|diagnosis|treat|treatment|medication|prescription)\b/i,
  /\bdo I have\b.*\b(disease|condition|disorder|deficiency)\b/i,
];

export function isOutOfScope(message: string): boolean {
  return BLOCKED_PATTERNS.some(p => p.test(message));
}

export function buildDeclineResponse(): NutritionResponse {
  return {
    answer_text:
      "That question falls outside what I can help with. For calorie targets, " +
      "weight advice, or any medical concerns, please speak with a registered " +
      "dietitian or your doctor.",
    claims: [],
  };
}
