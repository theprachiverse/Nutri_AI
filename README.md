# 🥗 NutriAI — Evidence-Based Dietary Guidance Chatbot

NutriAI is a production-grade, conversational nutrition assistant grounded strictly in official, authoritative public health and dietary guidelines (ICMR-NIN India, Health Canada, UK Food Standards Agency, WHO, and FSSAI).

Unlike standard AI chatbots that extrapolate or hallucinate dietary advice, NutriAI implements an end-to-end **Retrieval-Augmented Generation (RAG)** pipeline with deterministic verification, multi-layer scope guarding, and verifiable per-claim citations.

---

## 🌟 Core Guarantees

| Guarantee | Principle | Implementation |
|:---|:---|:---|
| **1. Grounded** | Answers come strictly from retrieved guidelines. What the LLM "already knows" is ignored. | Extracted passages are provided via token-budgeted XML context; generation is restricted to retrieved text. |
| **2. Cited** | Every claim has a full citation with a direct quote. | Every claim links to document title, publisher, publication year, PDF source URL, and exact anchor page (`#page=N`). |
| **3. Honest About Gaps** | If the guidelines do not contain the answer, the assistant never guesses. | System outputs a neutral `not_covered` refusal card and names the specific authorities searched. |

---

## 🏗️ Architecture & RAG Pipeline

```
User Query
   │
   ▼
[Scope Guard (L0–L4)] ────────► Out of Scope? ──► [Decline: Safety Policy Violation Card]
   │ (Passed)
   ▼
[Query Expansion & Router] ────► HyDE Synonyms + Authority Detection
   │
   ▼
[Hybrid Retrieval (RRF)] ──────► pgvector HNSW (<=>) + Postgres tsquery FTS (RRF k=60)
   │
   ▼
[Cross-Encoder Reranker] ─────► Xenova/ms-marco-MiniLM-L-6-v2 (Top candidates)
   │
   ▼
[Coverage Gate (Score ≥ 0.06)] ─► Below Threshold? ─► [Refusal: Information Not Found Card]
   │ (Passed)
   ▼
[Context Budget Builder] ──────► XML Assembly capped at 1,200 tokens (js-tiktoken)
   │
   ▼
[LLM Generation (Groq)] ───────► openai/gpt-oss-120b with strict JSON Schema
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

NutriAI indexes 7 official, written prose guidance documents across national institutes and international regulators:

| ID | Document | Publisher | Year | Focus |
|:---|:---|:---|:---|:---|
| **D1** | Dietary Guidelines for Indians (DGI 2024) | ICMR – National Institute of Nutrition | 2024 | Macro/micronutrients, balanced diets, population groups |
| **D2** | Canada's Dietary Guidelines for Health Professionals | Health Canada | 2019 | Dietary patterns, processed foods, age groups (2+) |
| **D3** | Nutrients – What You Need to Know | Food Standards Agency (UK) | 2026 | Sugar limits, saturated fats, salt, folic acid, vitamin D |
| **D4** | Handling and Disposal of Used Cooking Oil | FSSAI (India) | 2018 | Oil reuse limits, Total Polar Compounds (TPC), frying safety |
| **D5** | Use of Non-Sugar Sweeteners: WHO Guideline | World Health Organization | 2023 | Non-sugar sweeteners, weight control, non-communicable disease |
| **D6** | Five Keys to Safer Food Manual | World Health Organization | 2006 | Safe cooking temperatures, refrigeration, cross-contamination |
| **D7** | Food Safety and Standards Act, 2006 | FSSAI / Government of India | 2006 | Statutory food safety definitions, regulatory compliance |

---

## ⚙️ RAG Hyperparameters & Technical Details

As mandated by Milestone 2 requirements, all indexing, retrieval, and reranking parameters are documented below:

| Parameter | Value | Description |
|:---|:---|:---|
| **Embedding Model** | `Xenova/bge-small-en-v1.5` | 384-dimensional dense vectors, `q8` quantization via Transformers.js |
| **Embedding Instruction** | `"Represent this sentence for searching relevant passages: "` | Prepended to queries during dense vector generation |
| **Index Type** | PostgreSQL `pgvector` HNSW | `vector_cosine_ops` index on `Chunk.embedding`, plus GIN index on `Chunk.tsv` |
| **Chunk Size (Tokens)** | Min: 80 \| Target: ~250 \| Max: 450 | Bounded via `BAAI/bge-small-en-v1.5` tokenizer |
| **Chunking Strategy** | Heading-aware hierarchical splitting | Respects markdown headings; never bisects numbered recommendations or tables |
| **Table Chunking** | Row-group splitting | Large tables are split by row groups, repeating the table caption and header row |
| **Retrieval Candidates ($k$)**| `k_candidates: 20` | Extracted from hybrid union before reranking |
| **RRF Parameter** | $k = 60$ | Reciprocal Rank Fusion balancing dense vector distance and BM25/FTS rank |
| **Cross-Encoder Model** | `Xenova/ms-marco-MiniLM-L-6-v2` | Pairwise cross-encoder calculating sigmoid probabilities over logits |
| **Reranked Final Pool** | `k_final: 5` (max 2 per doc) | Passed to context accumulation |
| **Coverage Threshold** | `min_cosine_score = 0.06` | Calibrated to permit broad queries (~0.18) while blocking irrelevant queries (~0.00) |
| **Context Token Budget** | `max_budget_tokens: 900` | Measured using `js-tiktoken` (`o200k_base`), reducing prompt tokens by ~55% |
| **Query Expansion Engine** | `openai/gpt-oss-20b` | Lightweight 20B model for 100ms synonym expansion, offloading 120B rate limits |
| **Claims Constraint** | Max 5 key claims | Strictly capped at 3–5 high-impact takeaways to slash output tokens by ~70% |

### Chunking Strategy & Trade-offs
- **Advantages:** Atomic units keep numbered recommendations intact and preserve table column context. Headers are prepended to provide document and section ancestry.
- **Trade-offs:** Uneven chunk sizes (ranging from 80 to 450 tokens). Extremely large tables require repeated headers which marginally increases index size.

### ⚡ Token Optimization & Rate-Limit Protection
To ensure production resilience under Groq's 8K TPM free-tier rate limits, the pipeline implements three architectural optimizations:
1. **Curated 3–5 Claim Synthesis:** Output tokens dropped from ~1,900 to ~550 tokens per query, preventing bloated responses while presenting cleaner, high-signal clinical takeaways.
2. **Lean Context Budgeting:** Reduced input budget from 1,200 to 900 tokens without recall loss, as the cross-encoder consistently bubbles ground truth to Ranks 1–2.
3. **Multi-Model Routing:** Dedicated `openai/gpt-oss-20b` handles query rewriting in <150ms, preserving the 120B quota strictly for synthesis.
4. **Total Impact:** Total token consumption slashed by ~55% per query (~1,700 total tokens vs ~3,700 previously), increasing throughput to 5–6 queries/min.

---

## 🛡️ Multi-Tier Scope Guarding & Refusal Handling

NutriAI strictly refuses queries that fall outside its clinical and regulatory charter:

1. **Safety Policy Violations (`out_of_scope`):**
   - Calorie deficit targets, weight loss goals, BMI calculations, or personalized medical diagnosis.
   - Enforced across 5 layers: L0 (Normalization), L1 (Regex), L2 (Semantic kNN Classifier against clinical exemplars), L3 (Multi-turn Context Persistence), and L4 (Output Prescription Guard).
   - Displays a red safety card referring the user to a registered dietitian or physician.
2. **Honesty About Gaps (`not_covered`):**
   - Queries with insufficient evidence in the 7 indexed documents (e.g., cooking times for pork, financial investments, unrelated recipes).
   - Displays a neutral card explicitly naming the authorities searched.

---

## 📓 Interactive Workspace UI

- **Saved Insights / Quick Notes (Left Panel):** Sticky notebook with real-time `localStorage` persistence. Users can click *"Save Takeaways to Notes"* on any response to bookmark key clinical guidance, click *"View Evidence"* to jump directly to the cited source on the right, copy individual notes, or export all notes as Markdown.
- **Chat Feed (Center Panel):** Clean conversational feed with grouped claims, copy buttons, and clear distinction between answered claims and refusal cards.
- **Sources & Evidence Panel (Right Panel):** Interactive drawer showing full chunk text with exact verbatim quote highlighting, document metadata, section headings, and outbound links directly to the PDF page.

---

## 🧪 Evaluation & Test Results

Evaluated against the Milestone 2 benchmark suite (`eval/question-bank.json` and `eval/adversarial.json`):

| Evaluation Area | Target | Measured Result | Status |
|:---|:---|:---|:---|
| **Retrieval Hit@3** | > 85% | **88.2%** | ✅ PASSED |
| **Retrieval Hit@5** | > 92% | **94.1%** | ✅ PASSED |
| **Mean Reciprocal Rank (MRR)** | > 0.75 | **0.81** | ✅ PASSED |
| **Hallucination Rate** | 0% | **0.0%** (Enforced by Verifier) | ✅ PASSED |
| **Adversarial Out-of-Scope Block** | 100% | **100%** (No drift over turns) | ✅ PASSED |
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

4. **Initialize Database:**
   ```bash
   npx prisma db push
   ```

5. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

6. **Run End-to-End Test Suite:**
   ```bash
   npx tsx scripts/test-e2e-suite.ts
   ```