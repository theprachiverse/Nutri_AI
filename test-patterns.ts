import { normalizeQuery } from './lib/scope/normalize.ts';
import { matchScopePatterns, PATTERNS } from './lib/scope/patterns.ts';

const queries = [
  "My doctor said I have diabetes, what exact diet plan should I follow to cure it?",
  "What is a balanced diet?",
  "Ok, and how many cals should I eat to drop 5 lbs?",
  "What is the best way to invest my money?",
  "What should I do if I am experiencing severe chest pain?"
];

for (const q of queries) {
  const norm = normalizeQuery(q);
  console.log('Query:', q);
  console.log('Norm:', norm);
  console.log('Match:', matchScopePatterns(norm));
  console.log('---');
}
