# Dietary Guidance RAG Chatbot — Corner Scenarios & Edge Cases

This document details the corner cases and edge scenarios for each phase outlined in the `featureImplementation-plan.md`. Anticipating these edge cases is critical to ensuring the robustness, accuracy, and safety of the RAG system.

---

## Phase 1: Offline Ingestion — Corpus Acquisition & Parsing

### 1. Acquisition Edge Cases
*   **Target Inaccessibility:** The target URL is temporarily down, throws a 5xx error, or implements rate limiting/CAPTCHAs preventing download.
*   **Format Mismatch or Corruption:** The downloaded file is zero bytes, corrupted, or not actually a PDF/HTML (e.g., an intermediate redirect page).
*   **Authentication/Cookie Walls:** Interstitials (like Health Canada) change their cookie schema, causing the session downloader to fail.

### 2. Parsing Edge Cases
*   **Image-Only PDFs:** The source document is a scanned image without a text layer, causing `pymupdf4llm` or `docling` to output empty content.
*   **Malformed Tables:** Highly complex, merged-cell, or nested tables that parse into unreadable or misaligned Markdown.
*   **Pagination Artifacts:** Headers, footers, or page numbers bisecting a single sentence or table row across a page boundary.
*   **Memory Exhaustion:** Parsing extremely large or high-resolution documents causing Out-Of-Memory (OOM) exceptions.

---

## Phase 2: Offline Ingestion — Chunking & Population Tagging

### 1. Chunking Edge Cases
*   **Oversized Atomic Units:** A single table row, unbreakable list item, or recommendation exceeds the `MAX_TOKENS` (450) limit.
*   **Deep Heading Nesting:** Documents with headings nested beyond H6, causing context headers to become excessively long and eat into the token budget.
*   **Orphaned Content:** Text blocks with no clear parent heading, or floating text between tables that gets incorrectly grouped.
*   **Malformed Markdown:** Parsing errors in Phase 1 that cause the hierarchical chunker to fail (e.g., missing closing tags for tables).

### 2. Tagging Edge Cases
*   **Conflicting Tags:** A chunk contains language that triggers mutually exclusive tags (e.g., "This applies to infants but NOT older adults").
*   **False Positives in Tagging:** Keywords used in a different context (e.g., "The lifecycle of a plant from infant stage..." triggering the human `infants` tag).

---

## Phase 3: Vectorization & Database Integration

### 1. Vectorization Edge Cases
*   **Out of Vocabulary (OOV) Tokens:** Highly specific medical or regional terms that the local Hugging Face tokenizer splits into useless sub-words.
*   **GPU/Memory Limits:** Batch sizes exceeding the available local memory during the embedding process.

### 2. Database Edge Cases
*   **Content Hash Collisions:** Two distinct chunks generating the same hash due to minor, non-semantic differences being stripped.
*   **Concurrency/Locking:** If multiple ingestion scripts are run simultaneously, causing database locks during UPSERT operations.
*   **Index Bloat:** Frequent re-indexing causing the HNSW index to grow excessively large before a vacuum occurs.

---

## Phase 4: Query Routing & Advanced Scope Guard

### 1. Scope Guard Edge Cases
*   **Mixed Intent Queries:** A query that contains both factual and out-of-scope elements (e.g., "I want to lose weight [Target], what is the iron content of an apple? [Factual]").
*   **Adversarial Context Attacks:** Users splitting a medical query over 5+ turns to bypass the turn-by-turn or L3 conversation context guard.
*   **Sarcasm and Implication:** Queries like, "Sure, tell me I'm fat and need to eat less carbs," which bypass regex but are essentially asking for a target/diagnosis. Caught by L2 Semantic Classifier, but threshold tuning (`SCOPE_SIM_THRESHOLD`) is sensitive.
*   **Novel Abbreviations:** Domain-specific or localized slang not caught by L0 normalization (e.g., "LF diet" for Low Fat).

### 2. Router Edge Cases
*   **Ambiguous Authorities:** Asking for "The Guidelines" when multiple aliases or authorities exist.
*   **False Out-of-Corpus Trigger:** The router incorrectly flags a valid query as out-of-corpus because of a minor typo in the entity name.

---

## Phase 5: RAG Core — Hybrid Retrieval & Context Budgeting

### 1. Retrieval Edge Cases
*   **Zero Results Post-Filtering:** The hybrid search yields results, but the aggressive `population_excluded` filter removes all of them, resulting in an empty context.
*   **Unindexed Documents:** A document (e.g., D5 WHO Guidelines) is defined in the manifest but its chunks have not yet been ingested into the database, resulting in an automatic zero-result drop for related questions.
*   **Identical Scores:** Multiple chunks returning the exact same cosine score (e.g., boilerplate text repeated across documents).
*   **Vocabulary Mismatch (Lexical):** The user's query uses a synonym that doesn't exist in the document, failing the `websearch_to_tsquery` while dense search returns low confidence.
*   **Cross-Encoder Latency & Truncation:** Passing 20 candidates through `Xenova/ms-marco-MiniLM-L-6-v2` locally takes too long, or the chunk exceeds the tokenizer's max length, leading to arbitrary truncation and skewed re-rank scores.

### 2. Budgeting Edge Cases
*   **Context Starvation:** The top 1 or 2 chunks (plus expanded tables/remarks) are so large they consume the entire 2,800 token budget, leaving no room for other documents or diverse viewpoints.
*   **Expansion Loop:** Expanding adjacent row-group chunks continually pulls in the entire table, blowing past the token limit.

---

## Phase 6: Generation, Verification & Orchestration

### 1. Generation Edge Cases
*   **Numeric Hallucinations (Word vs. Number):** The LLM outputs "five percent" instead of "5%", which might fail the V3-V4 numeric token strict assertion.
*   **Format Non-Compliance:** The LLM ignores the XML tag constraints or the JSON Schema, outputting plain text instead.
*   **Token Truncation:** Structured JSON outputs are truncated midway due to `max_tokens` limits. This is mitigated by explicitly setting `max_completion_tokens: 4000` to give the LLM headroom.
*   **Refusal to Synthesize:** The model correctly retrieves the data but outputs "I cannot answer this" because it triggers its own internal safety filters (despite passing the system's scope guard).

### 2. Verification Edge Cases
*   **Near-Miss Quotes:** The LLM hallucinates a quote that gets a 0.89 fuzzy match ratio—just below the 0.9 threshold, causing a valid answer to be dropped.
*   **Disagreement Handling Failure:** The model detects a disagreement but fails to properly cite both chunks, causing the Verifier to strip one side of the argument.
*   **Empty Output Drop:** The Verifier aggressively strips every single generated claim due to minor infractions, or the LLM cannot verify the data. This previously resulted in a completely blank response, but is now mitigated by generating a polite explanation in the `answer_text` field instead.

---

## Phase 7: API Routing & Frontend Integration

### 1. UI & State Edge Cases
*   **Network Interruptions:** WebSockets or chunked streams dropping midway through a large response.
*   **Rapid Fire Requests:** A user mashing the "Send" button triggering multiple concurrent pipeline executions for the same session.
*   **Markdown Rendering Conflicts:** The exact `quote` highlighted in the UI fails to match because of differences in how the frontend and backend parse whitespace or Markdown tokens.
*   **PDF Pagination Offset:** The UI attempts to link to `#page=N`, but the PDF's internal logical page numbering (e.g., Roman numerals for TOC) is offset from the absolute page index, linking the user to the wrong page.
*   **Theme Token Overriding:** Relying on default Tailwind colors (e.g., `bg-amber-50`) which were overridden in `tailwind.config.ts`, causing elements like `RefusalCard` to appear transparent. Fixed by strictly adhering to the semantic design system tokens (e.g., `tertiary-fixed`, `error-container`).
