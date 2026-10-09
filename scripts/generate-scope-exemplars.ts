import { embedder } from '../lib/rag/embedder';
import * as fs from 'fs';

const inScope = [
  "How much iron does an adult woman need per day?",
  "What are the main food sources of Vitamin B12?",
  "How much protein does a sedentary vegetarian adult need daily?",
  "How long can cooked chicken be safely stored in the fridge?",
  "Is it safe to refreeze meat that has been thawed in the fridge?",
  "Does boiling vegetables destroy all their vitamins?",
  "What is the safest internal temperature for cooked pork?",
  "Is coffee good or bad for your health overall?",
  "Are artificial sweeteners harmful in moderate amounts?",
  "Is eating red meat a few times a week harmful long-term?",
  "What is a balanced diet?"
];

const outOfScope = [
  "What is the best way to invest my money?",
  "How many calories should I eat to lose 5kg in a month?",
  "My doctor said I have diabetes, what exact diet plan should I follow to cure it?",
  "Could you provide a detailed calorie target for a 30 year old male?",
  "I have a sharp pain in my chest, what medical treatment do you recommend?",
  "What should I do if I am experiencing severe chest pain?"
];

async function main() {
  const exemplars = [];

  for (const q of inScope) {
    const emb = await embedder.embed(q, true);
    exemplars.push({
      text: q,
      embedding: emb,
      label: 'in_scope'
    });
  }

  for (const q of outOfScope) {
    const emb = await embedder.embed(q, true);
    exemplars.push({
      text: q,
      embedding: emb,
      label: 'out_of_scope'
    });
  }

  fs.writeFileSync('eval/scope-exemplars.json', JSON.stringify(exemplars));
  console.log('Generated eval/scope-exemplars.json');
}

main().catch(console.error);
