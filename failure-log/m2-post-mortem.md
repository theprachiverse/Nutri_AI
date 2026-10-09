# Milestone 2 Post-Mortem & Failure Log

During the implementation and rollout of Milestone 2 (RAG & Citations), several critical bugs caused severe regressions, low retrieval rates, and production crashes. This log documents the root causes of those failures and their resolutions.

## 1. Production Crash: `column "chunk_id" does not exist`
**Symptom:**
The chat interface deployed on Vercel threw a hard Prisma error: `Raw query failed. Code: 42703. Message: column "chunk_id" does not exist`.

**Root Cause:**
During local development, `tsc` was run, which generated compiled `.js` versions of the TypeScript files (e.g., `lib/rag/retrieve.js`). These stale files were accidentally committed to Git. The outdated `retrieve.js` contained an older SQL query (`SELECT chunk_id FROM "Chunk"`) before the schema was updated to use `id`. Vercel's build process executed the outdated `.js` file instead of the correct `.ts` file.

**Resolution:**
Deleted all compiled `.js` files from the `lib/` and `scripts/` directories and committed the deletion so Vercel exclusively uses the updated TypeScript source code.

## 2. API Rate Limiting: `413 Payload Too Large`
**Symptom:**
During evaluation runs, the LLM generation step failed consistently with `Limit 8000, Requested 9467` token errors, resulting in empty or dropped answers.

**Root Cause:**
While `lib/rag/context.ts` correctly maintained a strict `TARGET_TOKENS=1200` budget by slicing the candidate chunks, `lib/pipeline.ts` accidentally passed the *entire* raw array of 20 reranked candidates back into the `verifyAndCorrect()` pipeline. This flooded the Verifier with unbudgeted chunks, massively blowing past the Groq API token limits.

**Resolution:**
Updated `buildContext()` to return the exact `selectedChunks` it used, and wired `pipeline.ts` to exclusively pass those budgeted chunks into the Verifier and Hydrator.

## 3. Retrieval Regression: 0 Chunks Found & "Not Covered"
**Symptom:**
The Milestone 1 regression test (`results-m2.md`) dropped from a 100% answer rate down to almost 90% "Not covered" failures. Questions like *"Who should take Vitamin D supplements?"* retrieved 0 chunks.

**Root Cause:**
A hardcoded entity recognition bug in `lib/rag/router.ts`. The `AUTHORITIES` dictionary mapped the literal string `'who'` to Document D5 (The World Health Organization). Whenever a user's question started with the English word "Who", the router falsely triggered a strict document filter, artificially constraining the search to only D5. If D5 lacked relevant chunks, the system returned zero results.

**Resolution:**
Updated the `AUTHORITIES` dictionary to explicitly match `'world health organization'` and `'w.h.o.'` instead of `'who'`, preventing natural language collisions.

## 4. Vector Dimension Mismatch
**Symptom:**
Test scripts like `test-query.ts` threw `PrismaClientKnownRequestError: ERROR: different vector dimensions 384 and 3`.

**Root Cause:**
Testing scripts attempted to mock vector embeddings with dummy arrays like `[0,0,0]`. The `Chunk` schema explicitly defines the `embedding` column as `vector(384)`. PostgreSQL `pgvector` enforces strict dimensional integrity and crashes when queried with vectors of incorrect length.

**Resolution:**
Ensured all test queries either use the actual `embedder` utility to generate 384-dimensional embeddings or bypass the `vector_search` CTE when testing pure full-text search.
