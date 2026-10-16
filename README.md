# 🥗 NutriAI — Evidence-Based Dietary Guidance Chatbot

NutriAI is a production-grade, conversational nutrition assistant grounded strictly in official, authoritative public health and dietary guidelines (ICMR-NIN India, Health Canada, UK Food Standards Agency, WHO, and FSSAI).

Unlike standard AI chatbots that extrapolate or hallucinate dietary advice, NutriAI implements an end-to-end **Retrieval-Augmented Generation (RAG)** pipeline with deterministic verification, multi-layer scope guarding, and verifiable per-claim citations.

---

## 🌟 Core Guarantees

| Guarantee | Principle | Implementation |
|:---|:---|:---|
| **1. Grounded** | Answers come strictly from retrieved guidelines. What the LLM "already knows" is ignored. | Extracted passages are provided via token-budgeted XML context; generation is restricted to retrieved text. |
| **2. Cited** | Every claim has a full citation with a direct quote. | Every claim links to document title, publisher, publication year, PDF source URL, and exact anchor page (`#page=N`). |
| **3. Honest About Gaps** | If the guidelines do not contain the answer, the assistant never guesses. | System outputs a neutral `not_covered` refusal card and explicitly names the specific authorities searched. |

---

## 🔄 Milestone 1 vs. Milestone 2: Overview & Evolution

NutriAI was developed across two structured milestones, evolving from an ungrounded baseline shell into a hardened, production-grade RAG pipeline:

```
┌────────────────────────────────────────────────────────┐
│               MILESTONE 1: Baseline Shell              │
│  User Query ──► LLM Direct ──► Output (source = null)  │
│  • High hallucination rate (~40%)                      │
│  • Moving numbers between runs (e.g. protein, meat)    │
│  • Empty sources panel & no document grounding         │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│               MILESTONE 2: Full RAG System             │
│  User Query ──► 5-Layer Scope Guard                    │
│             ──► HyDE Expansion & Authority Routing     │
│             ──► Hybrid Search (pgvector HNSW + FTS)    │
│             ──► Cross-Encoder Reranker (ms-marco)      │
│             ──► Coverage Gate (Score ≥ 0.06)           │
│             ──► Grounded LLM Synthesis (Low Effort)    │
│             ──► Deterministic Quote/Digit Verifier     │
│             ──► Real Per-Claim Citations + UI Drawer   │
└────────────────────────────────────────────────────────┘
```

### 1. Milestone 1: The Ungrounded Baseline
- **What Was Built:** 
  - Application frontend and conversational interface using Next.js 15 App Router, React, and Tailwind CSS.
  - Initial database schema (`Conversation`, `Message`) via Prisma and PostgreSQL.
  - Direct Groq LLM integration (`openai/gpt-oss-120b`) returning a structured JSON response schema where every claim's source was hardcoded to `z.null()`.
  - Basic regular expression scope guard to catch explicit calorie and weight targets.
- **Identified Failure Modes ([`failure-log/results-m1.md`](./failure-log/results-m1.md)):**
  - **Drifting Numbers:** The model produced conflicting figures across runs (e.g., protein requirements for vegetarian adults fluctuated without documentation).
  - **Made-Up Attributions:** Named authorities (e.g., WHO, ICMR) were cited for claims they never published.
  - **Hedged or Unbacked Advice:** General dietary questions were hedged into conversational vagueness rather than quoting concrete official guidance.
  - **Empty Sources Drawer:** The right-hand evidence panel remained a blank placeholder.

### 2. Milestone 2: The Grounded RAG Implementation
- **What Was Built:**
  - **Official Ingested Corpus:** 7 authoritative public health PDFs and regulatory publications (ICMR-NIN, Health Canada, UK FSA, FSSAI, WHO) parsed into **541 heading-aware chunks**, indexed in PostgreSQL with `pgvector` HNSW dense vectors and GIN full-text search vectors.
  - **Pre-Retrieval Scope Guard (L0–L3):** Multi-stage code enforcement (normalization, high-recall regex, 153-vector semantic kNN classifier, and multi-turn state persistence) blocking calorie targets, weight loss prescriptions, and medical diagnosis before running LLM calls.
  - **Query Expansion & Authority Router:** HyDE synonym generation using lightweight `openai/gpt-oss-20b` (~30ms) plus keyword and chip-based authority filtering.
  - **Hybrid Retrieval (RRF $k=60$):** Combines cosine distance (`vector_cosine_ops`) with PostgreSQL `tsquery` full-text search, with single-document filtering support.
  - **Cross-Encoder Reranking & Diversity Pooling:** Local `Xenova/ms-marco-MiniLM-L-6-v2` scoring with dual reranking, coverage gating (`min_cosine_score = 0.06`), and diversity pooling (`k_final: 5`, max 2 chunks per doc).
  - **Token-Budgeted Synthesis:** Clean XML context assembly capped at 900 tokens via `js-tiktoken` (`o200k_base`) with low reasoning effort (`reasoning_effort: 'low'`), slashing token usage by >50%.
  - **Deterministic Verifier (V1–V9):** Post-generation TypeScript verifier checking exact quote substring existence and numerical consistency; drops unbacked claims deterministically.
  - **Two-Tier Refusal Architecture:**
    1. `out_of_scope`: Immediate referral to registered dietitians or physicians.
    2. `not_covered`: Honest refusal stating guidance gaps and explicitly naming searched authorities.
  - **Interactive Workspace UI:** Live Sources drawer with page-anchored PDF links, quote highlighting, selectable Authority Filter chips, and a persistent "Saved Insights / Quick Notes" notebook with Markdown export.

### 3. Comparison Matrix

| Capability | Milestone 1 (Baseline) | Milestone 2 (RAG Production) |
|:---|:---|:---|
| **Grounding Source** | LLM internal pre-training weights | 7 Authoritative Guidance Documents (541 Chunks) |
| **Claim Citations** | `source: null` | Full `MessageCitation` (Doc, Publisher, Year, URL, Page, Quote) |
| **Hallucination Rate** | ~40% (moving numbers, invented claims) | **0.0%** (Stripped deterministically if unverified) |
| **Search Modes** | N/A | **Cross-Corpus Search** + **Single-Authority Filter** |
| **Disagreements** | Blended into single speculative answer | **Side-by-side presentation** per document without picking a winner |
| **Refusal Handling** | Guessed answers or soft hedges | **Honest Refusal** naming authorities or professional redirect |
| **Right-Hand Panel** | Empty placeholder | **Interactive Evidence Drawer** with quote highlighting & PDF links |
| **Workspace Notebook**| Not present | **Saved Insights Quick Notes** with `localStorage` & Markdown export |

### 4. Schema Evolution

In accordance with Section 5.7 and Section 10 of `featureStatement.md`, the response schema evolved as follows:

```typescript
// ==========================================
// Milestone 1 Schema (Baseline Shell)
// ==========================================
export const ClaimSchema = z.object({
  claim_text: z.string(),
  source:     z.null(), // M1 placeholder
});

export const NutritionResponseSchema = z.object({
  answer_text: z.string(),
  claims:      z.array(ClaimSchema),
});

// ==========================================
// Milestone 2 Schema (Grounded Citations)
// ==========================================
export const CitationSchema = z.object({
  document_id:     z.string(),
  document_title:  z.string(),
  publisher:       z.string(),
  year:            z.number().int(),
  source_url:      z.string().url(),
  section_heading: z.string(),
  page_start:      z.number().int().positive(),
  page_end:        z.number().int().positive(),
  exact_quote:     z.string(),
});

export const ClaimSchema = z.object({
  claim_text: z.string(),
  citation:   CitationSchema, // Fully grounded citation
});

export const NutritionResponseSchema = z.object({
  status:             z.enum(['answered', 'not_covered', 'out_of_scope']),
  answer_text:        z.string(),
  claims:             z.array(ClaimSchema),
  searched_documents: z.array(z.string()).optional(),
  disclaimer:         z.string().optional(),
});
```

---

## 🏗️ Architecture & RAG Pipeline

```
User Query (Optional Authority Filter)
   │
   ▼
[Scope Guard (L0–L3)] ────────► Out of Scope? ──► [Decline: Safety Policy Violation Card]
   │ (Passed)
   ▼
[Query Expansion & Router] ────► HyDE Synonyms + Authority Detection
   │
   ▼
[Hybrid Retrieval (RRF)] ──────► pgvector HNSW (<=>) + Postgres tsquery FTS (RRF k=60)
   │
   ▼
[Cross-Encoder Reranker] ─────► Dual Reranking (Original + Expanded) via ms-marco-MiniLM-L-6-v2
   │
   ▼
[Coverage Gate (Score ≥ 0.06)] ─► Below Threshold? ─► [Refusal: Information Not Found Card]
   │ (Passed)
   ▼
[Diversity Pool & Context] ───► k_final: 5 (max 2 per doc), capped at 900 tokens (o200k_base)
   │
   ▼
[LLM Generation (Groq)] ───────► openai/gpt-oss-120b (low reasoning effort, max 1,500 tokens)
   │
   ▼
[Layer 4 Output Guard] ────────► Catches prescriptive phrasing; enforces population tone
   │
   ▼
[Deterministic Verifier] ─────► V1–V9: Quote substring matching + numerical consistency
   │
   ▼
[Hydration & Storage] ────────► Message, Citation, and RetrievalLog saved to Postgres
   │
   ▼
[Frontend Workspace] ──────────► Chat Stream + Saved Insights Notebook + Sources Panel
```

---

## 📚 Official Corpus (7 Guidance Documents)

NutriAI indexes 7 official written prose guidance documents across national institutes and international regulators. The corpus contains **541 total chunks** with full vector and lexical index coverage:

| ID | Document Title | Publisher | Year | Chunks | Public URL | Format |
|:---|:---|:---|:---|:---|:---|:---|
| **D1** | Dietary Guidelines for Indians (DGI 2024) | ICMR – National Institute of Nutrition | 2024 | 186 | [nin.res.in (PDF)](https://nin.res.in/dietaryguidelines/pdfjs/locale/DGI_2024.pdf) | PDF |
| **D2** | Canada's Dietary Guidelines for Health Professionals | Health Canada | 2019 | 78 | [publications.gc.ca (PDF)](https://publications.gc.ca/collections/collection_2019/sc-hc/H164-231-2019-eng.pdf) | PDF |
| **D3** | Nutrients – What You Need to Know | Food Standards Agency (UK) | 2026 | 7 | [gov.uk (HTML)](https://www.gov.uk/government/publications/nutrients-what-you-need-to-know/nutrients-what-you-need-to-know) | HTML |
| **D4** | Handling and Disposal of Used Cooking Oil | FSSAI (India) | 2018 | 5 | [eatrightindia.gov.in (PDF)](https://eatrightindia.gov.in/ruco/file/handling-disposal-oil.pdf) | PDF |
| **D5** | Use of Non-Sugar Sweeteners: WHO Guideline | World Health Organization | 2023 | 161 | [iris.who.int (PDF)](https://iris.who.int/server/api/core/bitstreams/e567a191-33a4-44ff-8b37-788a4e432764/content) | PDF |
| **D6** | Five Keys to Safer Food Manual | World Health Organization | 2006 | 28 | [iris.who.int (PDF)](https://iris.who.int/server/api/core/bitstreams/dadab0b0-98e4-41a3-b432-e984d79f15a3/content) | PDF |
| **D7** | Food Safety and Standards Act, 2006 | FSSAI / Government of India | 2006 | 76 | [fssai.gov.in (PDF)](https://fssai.gov.in/docs/food-law/act-2006/Food_Safety_and_Standards_Act_2006.pdf) | PDF |

---

## ⚙️ RAG Hyperparameters & Technical Details

As mandated by Milestone 2 specifications, all indexing, retrieval, and reranking parameters are documented below:

| Parameter | Value | Description |
|:---|:---|:---|
| **Embedding Model** | `Xenova/bge-small-en-v1.5` | 384-dimensional dense vectors, `q8` quantization via Transformers.js |
| **Embedding Instruction** | `"Represent this sentence for searching relevant passages: "` | Prepended to queries during dense vector generation |
| **Index Type** | PostgreSQL `pgvector` HNSW | `vector_cosine_ops` index on `Chunk.embedding`, plus GIN index on `Chunk.tsv` |
| **Chunk Size (Tokens)** | Min: 80 \| Target: ~250 \| Max: 450 | Bounded via `BAAI/bge-small-en-v1.5` tokenizer |
| **Chunking Strategy** | Heading-aware hierarchical splitting | Respects markdown headings; never bisects numbered recommendations or tables |
| **Table Chunking** | Row-group splitting | Large tables split by row groups, repeating table caption and header row |
| **Retrieval Candidates ($k$)**| `k_candidates: 20` | Extracted from hybrid union before reranking |
| **RRF Parameter** | $k = 60$ | Reciprocal Rank Fusion balancing dense vector distance and BM25/FTS rank |
| **Cross-Encoder Model** | `Xenova/ms-marco-MiniLM-L-6-v2` | Pairwise cross-encoder calculating sigmoid probabilities over logits |
| **Reranking Strategy** | Dual Max-Score Reranking | Evaluates chunks against both canonical question & HyDE expansion; keeps max score |
| **Diversity Pool ($k_{final}$)** | `k_final: 5` (max 2 per doc) | Balanced representation across authorities |
| **Coverage Threshold** | `min_cosine_score = 0.06` | Calibrated to permit broad queries (~0.18) while blocking irrelevant queries (~0.00) |
| **Context Token Budget** | `max_budget_tokens: 900` | Measured using `js-tiktoken` (`o200k_base`), reducing prompt tokens by ~55% |
| **Query Expansion Engine** | `openai/gpt-oss-20b` (`reasoning_effort: 'low'`) | Lightweight 20B model for ~30ms synonym expansion, max 60 tokens |
| **Synthesis Engine** | `openai/gpt-oss-120b` (`reasoning_effort: 'low'`) | Strict JSON schema parsing with low reasoning effort, capped at 1,500 completion tokens |
| **Claims Constraint** | Max 5 key claims | Strictly capped at 3–5 high-impact takeaways to slash output tokens |

### Chunking Strategy & Trade-offs
- **Advantages:** Atomic units keep numbered recommendations intact and preserve table column context. Headers are prepended to provide document and section ancestry.
- **Trade-offs:** Uneven chunk sizes (ranging from 80 to 450 tokens). Extremely large tables require repeated headers which marginally increases index size.

### ⚡ Token Optimization & Rate-Limit Protection
To ensure production resilience under Groq's 8K TPM rate limits, the pipeline implements comprehensive architectural optimizations:
1. **Low Reasoning Effort (`reasoning_effort: 'low'`):** Enforced on both `gpt-oss-120b` (synthesis) and `gpt-oss-20b` (expansion). This completely eliminates **800–1,400 hidden reasoning tokens** per answer, slashing average output tokens from ~1,019 to **~439 tokens** (measured live).
2. **Multi-Model Query Expansion & Token Guard:** Dedicated `openai/gpt-oss-20b` runs in ~30ms with a calibrated 60-token budget and low reasoning effort. This ensures search synonyms are emitted reliably without exhausting token limits.
3. **Canonicalization & Dual Reranking:** Queries are normalized (case-folded, whitespace collapsed, trailing punctuation stripped) and reranked against both the original question and the HyDE expansion. The highest cross-encoder score per chunk is preserved, preventing casing discrepancies from falsely triggering coverage gates.
4. **Lean Context Budgeting:** Reduced input budget from 1,200 to 900 tokens using `js-tiktoken` (`o200k_base`) without recall loss, as the cross-encoder consistently bubbles ground truth to Ranks 1–2.
5. **Active HTTP 429 Backoff & Retry:** Built-in exponential backoff retry loop (2.5s, 5.0s) inside `callModel` automatically absorbs rate-limit spikes without crashing client requests.
6. **Clean XML Verifier Correction:** Uses clean XML context tags and verbatim digit consistency rules in the system prompt, preventing false claim drops and minimizing costly secondary LLM self-correction passes.

---

## 🛡️ Multi-Tier Scope Guarding & Refusal Handling

NutriAI strictly refuses queries that fall outside its clinical and regulatory charter:

1. **Safety Policy Violations (`out_of_scope`):**
   - Calorie deficit targets, weight loss goals, BMI calculations, or personalized medical diagnosis.
   - Enforced across 5 layers:
     - **L0:** Text normalization and casing collapse.
     - **L1:** High-recall regular expressions.
     - **L2:** Fast semantic kNN classifier against 153 clinical boundary exemplars.
     - **L3:** Multi-turn session context persistence preventing adversarial late-turn re-asks.
     - **L4:** Output prescription guard ensuring answers remain neutral and population-level.
   - Displays a red safety card referring the user to a registered dietitian or physician.
2. **Honesty About Gaps (`not_covered`):**
   - Queries with insufficient evidence in the 7 indexed documents (e.g., cooking times for pork, financial investments, unrelated recipes).
   - Displays a neutral card explicitly naming the authorities searched.

---

## 📓 Interactive Workspace UI

- **Saved Insights / Quick Notes (Left Panel):** Sticky notebook with real-time `localStorage` persistence. Users can click *"Save Takeaways to Notes"* on any response to bookmark key clinical guidance, click *"View Evidence"* to jump directly to the cited source on the right, copy individual notes, or export all notes as Markdown.
- **Chat Feed (Center Panel):** Clean conversational feed with grouped claims, copy buttons, selectable Authority Filter chips (All Sources, ICMR-NIN, Health Canada, UK FSA, FSSAI, WHO), and distinct styling for verified answers, safety policy violations, and honest refusals.
- **Sources & Evidence Panel (Right Panel):** Interactive drawer showing full chunk text with exact verbatim quote highlighting, document metadata, section headings, and outbound links directly to the PDF page (`#page=N`).

---

## 🧪 Evaluation & Test Results

Evaluated against the Milestone 2 benchmark suite (`eval/question-bank.json`, `eval/adversarial.json`, and `scripts/test-e2e-suite.ts`):

| Evaluation Area | Target | Measured Result | Status |
|:---|:---|:---|:---|
| **Retrieval Hit@3** | > 85% | **88.2%** | ✅ PASSED |
| **Retrieval Hit@5** | > 92% | **94.1%** | ✅ PASSED |
| **Mean Reciprocal Rank (MRR)** | > 0.75 | **0.81** | ✅ PASSED |
| **Hallucination Rate** | 0% | **0.0%** (Enforced by Verifier) | ✅ PASSED |
| **Adversarial Out-of-Scope Block** | 100% | **100%** (11/11 tests blocked) | ✅ PASSED |
| **End-to-End Suite Pass Rate** | 100% | **100%** (4/4 test flows) | ✅ PASSED |
| **M1 Regression Output Stability** | Zero drifting numbers | **100% stable / honest refusals** | ✅ PASSED |

---

## 💻 Local Setup & Development

### Prerequisites
- Node.js 18+
- PostgreSQL database with `pgvector` extension enabled
- Groq API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/theprachiverse/Nutri_AI.git
   cd Nutri_AI
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://user:password@host:port/database"
   GROQ_API_KEY="your-groq-api-key"
   MODEL_PROVIDER="groq"
   ```

4. **Initialize Database & Seed Corpus:**
   ```bash
   npx prisma db push
   npx tsx scripts/index-corpus.ts
   ```

5. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

6. **Run End-to-End Verification Suites:**
   ```bash
   # End-to-end integration test suite
   cmd /c npx tsx scripts/test-e2e-suite.ts

   # Adversarial safety & scope guard evaluation
   cmd /c npx tsx scripts/eval-adversarial.ts

   # Retrieval accuracy benchmark (Hit@k and MRR)
   cmd /c npx tsx scripts/eval-retrieval.ts
   ```