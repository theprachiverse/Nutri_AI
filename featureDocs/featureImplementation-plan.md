# Dietary Guidance RAG Chatbot — Detailed Implementation Plan (Milestone 2)

This document provides a highly detailed, phase-by-phase execution plan for Milestone 2. It adheres to the constraints defined in `featureStatement.md` and `featureArchitecture.md` and explicitly outlines the architectural components, acceptance criteria, and scripts needed for delivery.

---

## Phase 0: Project Foundation & Environment Setup

**Objective:** Establish the directory structure, install all runtime and ingestion dependencies, establish configuration files, and prepare the database schema for vector processing.

### Tasks
- [x] **0.1 Directory Scaffolding:** Create `corpus/` (with `raw/`, `parsed/`, `chunks/`, `annotations/`), `ingest/`, `scripts/`, and `eval/` directories.
- [x] **0.2 Ingestion Environment (Python):** 
  - Create `ingest/requirements.txt`.
  - Install dependencies: `docling`, `pymupdf4llm`, `beautifulsoup4`, `markdownify`, `transformers`, `requests`.
- [x] **0.3 TypeScript Environment (Node):**
  - Install `@huggingface/transformers` (v3), `js-tiktoken`, and `tsx` (dev dependency).
- [x] **0.4 Prisma Schema Overhaul:** 
  - Update `prisma/schema.prisma` with `Document`, `Chunk`, `MessageCitation`, `RetrievalLog`, and `IndexMeta` models.
  - Establish the relation between `Message` and `MessageCitation` (replacing the raw JSON payload in `Message`).
- [x] **0.5 Vector DB Migration:** 
  - Run `npx prisma migrate dev --create-only` to generate a migration.
  - Modify the SQL migration file to execute `CREATE EXTENSION IF NOT EXISTS vector;`.
  - Add `vector(384)` for the `embedding` column and a `tsvector` generated column (`tsv`) for the `Chunk` table.
  - Create the HNSW index (`chunk_embedding_hnsw`) and GIN index (`chunk_tsv_gin`).
  - Deploy migration with `npx prisma migrate deploy`.
- [x] **0.6 Type Definitions & Configuration:** 
  - Implement `ModelOutputSchema`, `Citation`, `ClaimV2`, `Disagreement`, and `NutritionResponse` v2 in `lib/schema.ts`.
  - Create `lib/rag/config.ts` to centralize all threshold variables, token limits, and `k` values.

---

## Phase 1: Offline Ingestion — Corpus Acquisition & Parsing

**Objective:** Build a robust, idempotent offline pipeline to fetch, validate, and parse the raw guidance documents into Markdown.

### Tasks
- [x] **1.1 Manifest & Annotations Definition:** 
  - Write `corpus/manifest.json` containing metadata (publisher, legal status, year, source URL) for D1 through D7.
  - Create `corpus/annotations/Dn.yaml` files defining regex heading promoters and population tags for specific documents.
- [x] **1.2 Acquisition Pipeline (`ingest/download.py`):** 
  - Implement a `requests.Session()` based downloader to handle cookie interstitials (specifically for D2 Health Canada).
  - Add `%PDF` validation before saving. For HTML (D3), generate a dated snapshot via `beautifulsoup4`.
  - Automatically calculate `sha256` hashes and update the manifest with the hash and `retrieval_date`.
- [x] **1.3 Markdown Parsing Pipeline (`ingest/parse.py`):** 
  - Hook up `docling` (for tables/structure) and `pymupdf4llm` (fallback).
  - Map ATX headings (`#`, `##`) accurately against the PDF structure.
  - Inject `<!-- page: N -->` markers at page breaks.
  - Filter out TOC, indexes, and manifest-defined `exclude_pages`.
  - Save parsed files to `corpus/parsed/Dn.md`.

---

## Phase 2: Offline Ingestion — Chunking & Population Tagging

**Objective:** Split the parsed Markdown into highly semantic, table-atomic, size-capped chunks enriched with demographic metadata.

### Tasks
- [x] **2.1 Population Tagger (`ingest/population.py`):** 
  - Build a keyword-based tagger mapping words (e.g., "infant", "elderly", "FBO") to standard tags (e.g., `infants`, `older_adults`, `food_business_operators`).
  - Override keyword detection using the `annotations/Dn.yaml` files.
- [x] **2.2 Advanced Chunker (`ingest/chunk.py`):** 
  - Parse the Markdown into a hierarchical tree based on headings.
  - Implement atomic unit splitting: Never split a Markdown table, numbered recommendation, or list item.
  - Split large tables by row groups, repeating the caption and header row for every split piece.
  - Enforce bounds: `MIN_TOKENS` (80) and `MAX_TOKENS` (450) using the `BAAI/bge-small-en-v1.5` tokenizer. 
  - Merge adjacent small sections under the same parent to avoid noise.
  - Inject a context header at the top of `embed_text` (e.g., `[DGI 2024 | ICMR-NIN | 2024 | Guideline 4 > Iron-rich foods]`).
  - Generate a stable `chunk_id` and compute `content_hash` for deduplication.
  - Output to `corpus/chunks/chunks.jsonl`.
- [x] **2.3 Reporting & Validation (`ingest/report.py`):** 
  - Generate `corpus/chunks/report.md` detailing chunk size histograms, table orphan checks, and detected headings for a manual QA review.

---

## Phase 3: Vectorization & Database Integration

**Objective:** Embed the chunked data using a local Hugging Face model and upsert it into the Postgres database, mapping the structured metadata from `chunks.jsonl`.

### Tasks
- [x] **3.1 Local Embedder Interface (`lib/rag/embedder.ts`):** 
  - Implement a singleton pipeline using `@huggingface/transformers` (`feature-extraction`, `Xenova/bge-small-en-v1.5`, `q8` precision).
  - Add CLS pooling and normalization.
  - Prefix queries with `"Represent this sentence for searching relevant passages: "`.
- [x] **3.2 Database Upsert Script (`scripts/index-corpus.ts`):** 
  - Read `manifest.json` and upsert `Document` records.
  - Stream `chunks.jsonl` and compare the `content_hash` against existing DB chunks to skip unmodified data.
  - Batch embed the `embed_text` property (32 chunks at a time) to generate 384-dimensional vectors.
  - Run `prisma.$executeRaw` to upsert into Postgres, mapping the `chunks.jsonl` schema directly to the `Chunk` table:
    - Map `chunk_id`, `doc_id`, `chunk_index`, `chunk_type`
    - Map `section_path` (JSONB) and `section_heading`
    - Map `text`, `embed_text`, `page_start`, `page_end`, `token_count`
    - Map `population` and `population_excluded` (arrays)
    - Store the `content_hash` for future delta updates
    - Store the vector output into the `embedding` column
  - Delete stale `Chunk` records whose `chunk_id`s are not present in the latest JSONL for that document.
  - Write indexing metadata to `IndexMeta` (model, dimensions, counts, timestamp) as a safety lock.

---

## Phase 4: Query Routing & Advanced Scope Guard

**Objective:** Pre-process user queries, reject out-of-scope interactions (medical advice, targets), and correctly route acceptable queries.

### Tasks
- [x] **4.1 Deep Scope Guard (`lib/scope/*`):** 
  - **L0 Normalization (`normalize.ts`):** Strip leetspeak, emojis, and normalize abbreviations (e.g., `cals` -> `calories`).
  - **L1 Regex Patterns (`patterns.ts`):** Catch obvious `CALORIE_TARGET`, `WEIGHT_TARGET`, and `MEDICAL` queries.
  - **L2 Semantic Classifier (`classifier.ts`):** Run a fast kNN (k=5) against embeddings of `eval/scope-exemplars.json`. Block if >= 3 neighbors are out-of-scope and exceed `SCOPE_SIM_THRESHOLD`.
  - **L3 Conversation Context (`conversation.ts`):** Check previous turns to detect persistence/drift. Block hidden context attacks (e.g., "what about for me?").
  - **L4 Output Guard (`outputGuard.ts`):** Post-generation check looking for second-person prescriptions ("you should eat X").
- [x] **4.2 Query Router & Expansion (`lib/rag/router.ts`):** 
  - Detect follow-up questions and automatically rewrite them including the previous context.
  - **Query Expansion:** Generate 2-3 semantically similar sub-queries or related keyword sets using a fast LLM pass to increase recall during downstream retrieval.
  - Parse for specific authorities using document aliases (e.g., "WHO", "FSSAI").
  - Detect comparison intent (e.g., "versus", "compare") to set retrieval `mode = per_document`.
  - Detect out-of-corpus targets (e.g., "protein in 100g chicken") and bypass directly to `not_covered`.

---

## Phase 5: RAG Core — Hybrid Retrieval & Context Budgeting

**Objective:** Fetch the most relevant chunks using PostgreSQL pgvector for semantic search and standard lexical search, strictly bounded by the LLM context limits.

### Tasks
- [x] **5.1 Hybrid Search Execution (`lib/rag/retrieve.ts`):** 
  - Execute a hybrid query using `prisma.$queryRaw`: PostgreSQL `pgvector` cosine distance (`<=>` operator on the `embedding` column) + Postgres `websearch_to_tsquery` (on the `tsv` column).
  - Combine results via Reciprocal Rank Fusion (RRF, k=60).
  - Implement `single_document` filtering and `per_document` equitable retrieval.
  - Apply the `POPULATION_BOOST` scalar for chunks matching the user's demographic, and aggressively filter out `population_excluded` chunks.
- [x] **5.2 Cross-Encoder Re-ranking (`lib/rag/rerank.ts`):** 
  - Take the top `N` (e.g., 20) candidates from the RRF hybrid search.
  - Pass the query and each chunk through a local Cross-Encoder (e.g., `Xenova/ms-marco-MiniLM-L-6-v2`) via Transformers.js to calculate a highly accurate relevance score.
  - Sort chunks by this new Cross-Encoder score to drastically improve precision before context budgeting.
- [x] **5.3 Coverage Gate (`lib/rag/coverage.ts`):** 
  - Evaluate the top candidate's cross-encoder score against `MIN_SCORE` (e.g., 2.0 depending on the model).
  - If no chunks pass, instantly short-circuit to a `not_covered` response.
- [x] **5.4 Context Builder (`lib/rag/context.ts`):** 
  - Handle expansion logic: Pull in adjacent row-group chunks for tables and "Remarks" sibling chunks for recommendations.
  - Employ `js-tiktoken` (`o200k_base`) to accumulate chunks until the strict 2,800 token budget is reached.
  - Format the final context block into `<chunk>` XML tags containing metadata attributes.

---

## Phase 6: Generation, Verification & Orchestration

**Objective:** Generate the final response using Groq, deterministically verify all claims against the retrieved chunks, and hydrate UI components.

### Tasks
- [x] **6.1 LLM Generation (`lib/model.ts`, `lib/systemPrompt.ts`):** 
  - Write System Prompt v2 enforcing strict grounding, marker constraints, and anti-blending rules.
  - Configure the Groq call (`openai/gpt-oss-120b`) with `temperature: 0`, `max_completion_tokens: 4000` (to prevent JSON truncation), and `zodResponseFormat` mapped to `ModelOutputSchema`.
- [x] **6.2 Deterministic Verifier & Self-Correction (`lib/rag/verify.ts`):** 
  - **V1-V2:** Assert `chunk_id` exists in context and `quote` is a near-perfect substring (fuzzy ratio >= 0.9).
  - **V3-V4:** Normalize and assert that all numeric tokens in the claim/answer appear in the cited chunk. 
  - **V5-V7:** Enforce marker integrity (strip orphans), prevent blending (no sentences citing multiple docs), and validate disagreement integrity.
  - **Self-Correction Loop:** If verification fails (e.g., dropped claims due to hallucination), trigger a self-correction LLM pass providing the errors and asking for a rewritten, compliant response before falling back to `not_covered`.
  - **V8-V9:** Handle LLM output scope violations and drop to `not_covered` if zero valid claims remain after correction. In a `not_covered` state, the LLM provides a polite explanation in `answer_text` instead of leaving it completely empty.
- [x] **6.3 Hydration & Orchestration (`lib/rag/hydrate.ts`, `lib/pipeline.ts`):** 
  - Map validated `chunk_id`s to full `Citation` objects, dynamically appending `#page=N` to the PDF URLs.
  - Tie the entire flow together in `answerQuestion()`, ensuring `RetrievalLog`, `Message`, and `MessageCitation` rows are transacted into Postgres.

---

## Phase 7: API Routing & Frontend Integration

**Objective:** Connect the orchestrator to Next.js API endpoints and enrich the UI for a robust, interactive RAG experience.

### Tasks
- [x] **7.1 Backend Endpoints (`app/api/*`):** 
  - Reroute `POST /api/chat` to consume `pipeline.answerQuestion()`.
  - Create `GET /api/documents` to serve the corpus manifest list for the UI filter.
  - Create `GET /api/chunks/[chunkId]` to fetch raw chunk text for the Sources panel.
- [x] **7.2 UI Refusals & Status Handling (`components/RefusalCard.tsx`):** 
  - Implement a red `error-container` card for `out_of_scope` safety rejections.
  - Implement a neutral `tertiary-fixed` card for `not_covered` honesty rejections, explicitly listing the `searched_documents`.
- [x] **7.3 Rich Citation UI (`components/*`):** 
  - **`ClaimBadge.tsx`**: Render publisher and year (e.g., `WHO · 2023`).
  - **`SourcesPanel.tsx`** & **`SourceChunkCard.tsx`**: Render the full chunk context, highlighting the exact `quote`. Include hierarchy, population tags, and PDF outbound links.
  - **`DisagreementCallout.tsx`**: Render conflicting viewpoints side-by-side.
  - **`MessageBubble.tsx`**: Group and format claims cleanly by document. Update layout states.

---

## Phase 8: Testing, Evaluation & Documentation

**Objective:** Formally prove system integrity against the Milestone 1 baseline and adversarial jailbreaks, then finalize the README.

### Tasks
- [x] **8.1 Evaluation Harness Execution (`scripts/eval-*.ts`):** 
  - Run `eval-retrieval.ts` against `eval/question-bank.json` to prove Hit@3, Hit@5, and MRR.
  - Run `eval-answers.ts` to assert zero hallucinations and track Verifier drop rates.
  - Run `eval-adversarial.ts` (`eval/adversarial.json`) to prove the multi-turn Scope Guard successfully rejects all bypass attempts.
- [x] **8.2 M1 Regression Testing:** 
  - Execute `scripts/run-m1-regression.ts` on the original 10 questions. 
  - Manually review outputs in `failure-log/results-m2.md` to ensure drifting numbers and made-up attributions are eliminated.
  - Perform a manual Citation Spot-Check on 10 answers.
- [x] **8.3 Final Documentation:** 
  - Update `README.md` containing the final RAG hyperparameters (`TARGET_TOKENS`, `MAX_TOKENS`, `OVERLAP`, embedding model, Index type, `K_FINAL`).
  - Detail chunking strategy trade-offs and explicit schema evolution metrics.
  - Record the Evaluation Hit Rates and adversarial block success metrics.

---

## Technical Notes: Token & Relevancy Optimizations (Phase 5/6)

During testing, the system underwent a major optimization to reduce token bloat without degrading quality:
1. **Cross-Encoder Fix:** The initial fallback of the pipeline used `pipeline('text-classification')`, which failed to correctly pass query-chunk pairs, scoring all chunks as `1.0`. By migrating to `AutoTokenizer` and `AutoModelForSequenceClassification` and applying a sigmoid probability over the logits, the `Xenova/ms-marco-MiniLM-L-6-v2` cross-encoder accurately pushed the most relevant chunks to Rank 1 and 2.
2. **Context Window Reduction:** Because the cross-encoder precisely ranks relevant chunks at the very top, the `max_budget_tokens` was drastically lowered from `2800` to `1200`. 
3. **XML Minification:** Extraneous attributes like `page="..."` were removed from the prompt `<chunk>` wrappers.
4. **Result:** Prompt token consumption was reduced by ~50% (from ~3,200 to ~1,650), significantly reducing latency and cost while preserving extraction quality.
