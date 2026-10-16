// Offline (no DB) token test. Run: node --env-file=.env --import tsx scripts/test-token-offline.ts
// Retrieval is approximated by keyword overlap over corpus/chunks/chunks.jsonl; the budget builder,
// HyDE call (20B), generation call (120B) and verifier are the REAL production code.
import fs from 'fs';
import { buildContext } from '../lib/rag/context';
import { RAG_CONFIG } from '../lib/rag/config';
import { callModel, expandQueryFast } from '../lib/model';
import { verifyAndCorrect } from '../lib/rag/verify';

const QUERIES = [
  'Tell me about milk consumption',
  'How much sugar should I limit per day?',
  'What is the safe limit for reusing cooking oil?',
  'Are non-sugar sweeteners recommended for weight control?',
];

const all = fs.readFileSync('corpus/chunks/chunks.jsonl', 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
const stop = new Set(['the', 'for', 'and', 'how', 'much', 'should', 'what', 'are', 'about', 'tell', 'per', 'day', 'safe']);

function topChunks(q: string, n = 6) {
  const words = q.toLowerCase().split(/\W+/).filter(w => w.length > 2 && !stop.has(w));
  return all.map(c => {
    const t = c.text.toLowerCase();
    return { c, s: words.reduce((a, w) => a + (t.split(w).length - 1), 0) / Math.sqrt(t.length) };
  }).sort((a, b) => b.s - a.s).slice(0, n).map(x => ({
    chunk_id: x.c.chunk_id, doc_id: x.c.doc_id, text: x.c.text, section_heading: x.c.section || '',
    page_start: x.c.page_start ?? 1, page_end: x.c.page_end ?? 1, population: x.c.population_tags || [],
    population_excluded: [], rrf_score: x.s, rerank_score: x.s,
  }));
}

const realLog = console.log;
let usage: any = {};
console.log = (...a: any[]) => {
  const s = a.join(' ');
  let m = s.match(/^HyDE Token usage - Prompt: (\d+), Completion: (\d+)/);
  if (m) { usage.hydeP = +m[1]; usage.hydeC = +m[2]; return; }
  m = s.match(/^Token usage - Prompt: (\d+), Completion: (\d+)/);
  if (m) { usage.genP = (usage.genP || 0) + +m[1]; usage.genC = (usage.genC || 0) + +m[2]; usage.calls = (usage.calls || 0) + 1; }
};

async function main() {
  const rows: any[] = [];
  for (const q of QUERIES) {
    usage = {};
    const t0 = Date.now();
    let status = 'error', claims = 0, err = '', ctxTok = 0;
    try {
      await expandQueryFast(q.toLowerCase());
      const { xmlStr, selectedChunks } = buildContext(topChunks(q) as any);
      ctxTok = xmlStr.length;
      const resp = await callModel([{ role: 'user', content: `Question: ${q.toLowerCase()}\n\nContext:\n${xmlStr}` }]);
      const v = await verifyAndCorrect(resp, selectedChunks as any, q);
      status = v.response.status; claims = v.response.claims?.length ?? 0;
    } catch (e: any) { err = e.message?.slice(0, 80); }
    rows.push({
      query: q.slice(0, 38), status, claims, ctxChars: ctxTok, genCalls: usage.calls || 0,
      hyde: (usage.hydeP || 0) + (usage.hydeC || 0), genIn: usage.genP || 0, genOut: usage.genC || 0,
      total: (usage.hydeP || 0) + (usage.hydeC || 0) + (usage.genP || 0) + (usage.genC || 0),
      sec: ((Date.now() - t0) / 1000).toFixed(1), err,
    });
  }
  console.log = realLog;
  console.table(rows);
  const ok = rows.filter(r => r.genCalls > 0);
  const avg = (k: string) => ok.length ? Math.round(ok.reduce((a, r) => a + r[k], 0) / ok.length) : 0;
  console.log(`Context budget cfg: ${RAG_CONFIG.context.max_budget_tokens} | avg out tokens: ${avg('genOut')} (README ~550) | avg total: ${avg('total')} (README ~1700) | max claims: ${Math.max(0, ...rows.map(r => r.claims))} (<=5)`);
  console.log(`Rate-limit errors: ${rows.filter(r => /RATE_LIMIT|429/.test(r.err)).length} | self-correction runs: ${rows.filter(r => r.genCalls > 1).length}`);
}
main();
