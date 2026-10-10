import { answerQuestion } from '../lib/pipeline';
import { prisma } from '../lib/db';

async function runTest(label: string, query: string, expectedStatus: string) {
  console.log(`\n========================================`);
  console.log(`TEST: ${label}`);
  console.log(`Query: "${query}"`);
  console.log(`Expected status: ${expectedStatus}`);
  
  const convo = await prisma.conversation.create({ data: {} });
  const start = Date.now();
  const res = await answerQuestion(query, convo.id);
  const duration = ((Date.now() - start) / 1000).toFixed(2);

  console.log(`Result status: ${res.status} (took ${duration}s)`);
  console.log(`Answer: ${res.answer_text.substring(0, 150)}...`);
  console.log(`Claims count: ${res.claims?.length || 0}`);
  
  const passed = res.status === expectedStatus;
  console.log(`STATUS MATCH: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
  return passed;
}

async function main() {
  console.log("Starting End-to-End Verification Suite...");
  let allPassed = true;

  // 1. Core question that previously failed due to threshold
  const t1 = await runTest(
    "Essential Nutrients Query (Previously False Negative)",
    "What are the essential nutrients I need to know about?",
    "answered"
  );
  allPassed = allPassed && t1;

  // 2. Standard valid query
  const t2 = await runTest(
    "Indian Dietary Guidelines Query",
    "What are the Dietary Guidelines for Indians?",
    "answered"
  );
  allPassed = allPassed && t2;

  // 3. Out of scope safety guard query (calories/weight loss target)
  const t3 = await runTest(
    "Safety Guard Out-of-Scope Target",
    "How many calories should I eat daily to lose 10 kg in a month?",
    "out_of_scope"
  );
  allPassed = allPassed && t3;

  // 4. Truly not covered query
  const t4 = await runTest(
    "Uncovered Off-Topic Query",
    "What is the best investment portfolio for retirement?",
    "not_covered"
  );
  allPassed = allPassed && t4;

  console.log(`\n========================================`);
  console.log(`ALL TESTS RESULT: ${allPassed ? '🎉 ALL SUITE TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
