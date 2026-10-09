export function checkOutputGuard(generatedText: string): { blocked: boolean; reason?: string } {
  const prescriptionPattern = /\b(you should|you must|i recommend that you|you need to)\b/i;
  
  if (prescriptionPattern.test(generatedText)) {
    return { blocked: true, reason: 'Generated text contains second-person prescriptions.' };
  }
  
  return { blocked: false };
}
