// Run: node --env-file=.env --import tsx scripts/test-token-usage.ts
import { answerQuestion } from '../lib/pipeline';
import { buildContext } from '../lib/rag/context';
import { RAG_CONFIG } from '../lib/rag/config';
import { prisma } from '../lib/db';

// Measures the README "Token Optimization & Rate-Limit Protection" claims against live runs.
const QUERIES = [
  'Tell me about milk consumption',
  'tell me about milk consumption',
  'How much sugar should I limit per day?',
  'What is the safe limit for reusing cooking oil?',
  'What temperature should chicken be cooked to?',
  'Are non-sugar sweeteners recommended for weight control?',
];

const realLog = console.log;
let hyde = 0, gen = 0, genPrompt = 0, genCompletion = 0, calls = 0;
console.log = (...args: any[]) => {
  const s = args.join(' ');
  let m = s.match(/^HyDE Token usage - Prompt: (\d+), Completion: (\d+), Total: (\d+)/);
  if (m) { hyde += +m[3]; return; }
  m = s.match(/^Token usage - Prompt: (\d+), Completion: (\d+), Total: (\d+)/);
  if (m) { genPrompt += +m[1]; genCompletion += +m[2]; gen += +m[3]; calls++; return; }
};

async function main() {
  const rows: any[] = [];
  const convo = await prisma.conversation.create({ data: {} });
  for (const q of QUERIES) {
    hyde = gen = genPrompt = genCompletion = calls = 0;
    const t0 = Date.now();
    let status = 'error', claims = 0, err = '';
    try {
      const r: any = await answerQuestion(q, convo.id);
      status = r.status; claims = r.claims?.length ?? 0;
    } catch (e: any) { err = e.message; }
    rows.push({
      query: q, status, claims, genCalls: calls, hydeTok: hyde,
      genPrompt, genCompletion, totalTok: hyde + gen, sec: ((Date.now() - t0) / 1000).toFixed(1), err,
    });
  }
  console.log = realLog;
  console.table(rows);

  const answered = rows.filter(r => r.genCalls > 0);
  const avg = (k: string) => answered.length ? Math.round(answered.reduce((a, r) => a + r[k], 0) / answered.length) : 0;
  console.log('\n=== Claim checks ===');
  console.log(`Context budget config: ${RAG_CONFIG.context.max_budget_tokens} (README: 900)`);
  console.log(`Avg output tokens/query: ${avg('genCompletion')} (README: ~550)`);
  console.log(`Avg total tokens/query:  ${avg('totalTok')} (README: ~1,700)`);
  console.log(`Max claims returned:     ${Math.max(0, ...rows.map(r => r.claims))} (README: <=5)`);
  console.log(`Queries needing >1 generation call (self-correction): ${rows.filter(r => r.genCalls > 1).length}`);
  console.log(`Rate-limit errors: ${rows.filter(r => /RATE_LIMIT/.test(r.err)).length}`);
  console.log(`Other errors: ${rows.filter(r => r.err && !/RATE_LIMIT/.test(r.err)).length}`);
  await prisma.$disconnect();
}
main();
