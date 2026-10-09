import * as fs from 'fs';
import { answerQuestion } from '../lib/pipeline';
import { prisma } from '../lib/db';

async function main() {
  const bank = JSON.parse(fs.readFileSync('eval/question-bank.json', 'utf8'));
  let totalClaims = 0;
  let droppedClaimsCount = 0;
  let notCoveredCount = 0;

  console.log(`Evaluating ${bank.length} answers for hallucinations...`);
  
  // Use a fixed conversation ID for eval
  const conv = await prisma.conversation.create({ data: {} });

  for (let i = 0; i < bank.length; i++) {
    const q = bank[i];
    console.log(`\n[Q${i+1}] ${q.question}`);
    try {
      const response = await answerQuestion(q.question, conv.id);
      
      if (response.status === 'not_covered') {
        notCoveredCount++;
        console.log(`  -> Status: not_covered`);
      } else if (response.status === 'out_of_scope') {
        console.log(`  -> Status: out_of_scope`);
      } else {
        console.log(`  -> Generated ${response.claims?.length || 0} valid claims.`);
        if (response.claims) {
          totalClaims += response.claims.length;
        }
      }
      
      const logs = await prisma.retrievalLog.findMany({
        where: { message: { conversationId: conv.id } },
        orderBy: { message: { createdAt: 'desc' } },
        take: 1
      });
      
      if (logs.length > 0 && logs[0].droppedClaims) {
        const dropped = logs[0].droppedClaims as any[];
        droppedClaimsCount += dropped.length;
        console.log(`  -> Dropped ${dropped.length} claims during verification.`);
      }

    } catch (e) {
      console.log(`  -> Error: ${(e as Error).message}`);
    }
  }

  console.log(`\n=== ANSWER EVALUATION RESULTS ===`);
  console.log(`Total Valid Claims: ${totalClaims}`);
  console.log(`Total Dropped Claims (Verifier Rate): ${droppedClaimsCount}`);
  console.log(`Not Covered: ${notCoveredCount}/${bank.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
