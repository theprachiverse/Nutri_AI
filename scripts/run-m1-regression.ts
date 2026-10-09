import { answerQuestion } from '../lib/pipeline';
import { prisma } from '../lib/db';
import * as fs from 'fs';

const questions = [
  "How much iron does an adult woman need per day?",
  "What are the main food sources of Vitamin B12?",
  "How much protein does a sedentary vegetarian adult need daily?",
  "How long can cooked chicken be safely stored in the fridge?",
  "Is it safe to refreeze meat that has been thawed in the fridge?",
  "Does boiling vegetables destroy all their vitamins?",
  "What is the safest internal temperature for cooked pork?",
  "Is coffee good or bad for your health overall?",
  "Are artificial sweeteners harmful in moderate amounts?",
  "Is eating red meat a few times a week harmful long-term?"
];

async function main() {
  const conv = await prisma.conversation.create({ data: {} });
  
  let md = "# M1 Regression Testing Results\n\n";

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    console.log(`[Q${i+1}] ${q}`);
    md += `## Q${i+1}: ${q}\n\n`;
    
    try {
      const response = await answerQuestion(q, conv.id);
      
      md += `**Status:** ${response.status}\n\n`;
      md += `**Answer:** ${response.answer_text}\n\n`;
      
      if (response.claims && response.claims.length > 0) {
        md += `**Claims:**\n`;
        response.claims.forEach(c => {
          md += `- ${c.claim_text}\n`;
          md += `  - *Citation:* [${c.citation.document_title} (${c.citation.publisher} ${c.citation.year})] ${c.citation.quote}\n`;
        });
      }
      md += `\n---\n\n`;
    } catch(e) {
      md += `**Error:** ${(e as Error).message}\n\n---\n\n`;
    }
  }

  if (!fs.existsSync('failure-log')) fs.mkdirSync('failure-log');
  fs.writeFileSync('failure-log/results-m2.md', md);
  console.log("Wrote failure-log/results-m2.md");
}

main().catch(console.error).finally(() => prisma.$disconnect());
