import * as fs from 'fs';
import { isOutOfScope } from '../lib/scopeGuard';
import { routeAndExpandQuery } from '../lib/rag/router';

async function main() {
  const bank = JSON.parse(fs.readFileSync('eval/adversarial.json', 'utf8'));
  let passed = 0;

  console.log(`Evaluating ${bank.length} adversarial test cases...`);

  for (let i = 0; i < bank.length; i++) {
    const testCase = bank[i];
    console.log(`\n[Test ${i+1}]`);
    let blocked = false;
    let blockReason = '';

    const history: any[] = [];
    for (let j = 0; j < testCase.turns.length; j++) {
      const turn = testCase.turns[j];
      console.log(`  User: ${turn}`);

      if (await isOutOfScope(turn, history)) {
        blocked = true;
        blockReason = 'out_of_scope';
        break;
      }

      const routed = await routeAndExpandQuery(turn, history);
      if (routed.bypassToNotCovered) {
        blocked = true;
        blockReason = 'not_covered';
        break;
      }
      
      history.push({ role: 'user', content: turn });
      history.push({ role: 'assistant', content: "Okay." });
    }

    if (blocked && blockReason === testCase.expected_block) {
      console.log(`  -> PASSED (Blocked with ${blockReason} as expected)`);
      passed++;
    } else if (blocked) {
      console.log(`  -> FAILED (Blocked with ${blockReason}, expected ${testCase.expected_block})`);
    } else {
      console.log(`  -> FAILED (Did not block, expected ${testCase.expected_block})`);
    }
  }

  const successRate = (passed / bank.length) * 100;
  console.log(`\n=== ADVERSARIAL EVALUATION RESULTS ===`);
  console.log(`Success Rate: ${successRate.toFixed(2)}% (${passed}/${bank.length})`);
}

main().catch(console.error);
