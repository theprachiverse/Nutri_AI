# Dietary Guidance RAG Chatbot — Evaluation & Testing Strategy

This document outlines the comprehensive evaluation methodology for Milestone 2. It details the automated evaluation harnesses, regression testing protocols, and manual QA processes required to ensure the RAG system meets strict accuracy, safety, and performance constraints.

---

## 1. Automated Retrieval Evaluation (The Search Quality)

**Objective:** Measure how effectively the hybrid search pipeline (semantic + lexical) fetches the ground-truth document chunks necessary to answer user queries.

**Test Harness:** `scripts/eval-retrieval.ts`
**Dataset:** `eval/question-bank.json` (A robust dataset of expected questions mapped to their ground-truth chunk IDs).

### Key Metrics
*   **Hit@3 (Target: >85%):** The percentage of queries where the ground-truth chunk is within the top 3 retrieved results after cross-encoder re-ranking.
*   **Hit@5 (Target: >92%):** The percentage of queries where the ground-truth chunk is within the top 5 retrieved results.
*   **MRR (Mean Reciprocal Rank):** Measures how high up the list the correct chunk appears. Higher is better (Target: >0.75).
*   **RRF & Cross-Encoder Efficacy:** Verify that `Reciprocal Rank Fusion (k=60)` combining pgvector cosine distance and `websearch_to_tsquery` improves base recall, and that the `Xenova/ms-marco-MiniLM-L-6-v2` cross-encoder correctly bubbles up ground-truth chunks.
*   **Population Boost Efficacy:** Verify that applying the demographic scalar (e.g., `infants`) successfully pushes relevant chunks up the ranking.

---

## 2. Answer Generation & Verifier Evaluation (The Output Quality)

**Objective:** Ensure the LLM generates accurate responses strictly grounded in the retrieved context and that the Deterministic Verifier successfully catches and drops any hallucinations.

**Test Harness:** `scripts/eval-answers.ts`
**Dataset:** End-to-end execution of `eval/question-bank.json`.

### Key Metrics
*   **Hallucination Rate (Target: 0%):** The percentage of claims presented to the user that are NOT backed by a retrieved chunk. (The Verifier should prevent this from ever reaching >0%).
*   **Verifier Drop Rate:** The percentage of LLM-generated claims that are stripped by the Verifier (V1-V9 checks). A high drop rate indicates the LLM is struggling to follow formatting rules or is attempting to hallucinate.
*   **Disagreement Handling Accuracy:** Verify that queries with known conflicting guidelines (e.g., ICMR vs WHO on specific macro targets) successfully trigger the disagreement UI without blending the data.

---

## 3. Adversarial & Scope Guard Evaluation (The Safety Net)

**Objective:** Prove that the multi-layered Scope Guard (L0-L4) successfully rejects out-of-scope medical advice, personal target calculations, and malicious jailbreaks.

**Test Harness:** `scripts/eval-adversarial.ts`
**Dataset:** `eval/adversarial.json` (Contains jailbreaks, multi-turn context attacks, direct medical questions, and disguised target requests).

### Key Metrics
*   **Rejection Rate for Out-of-Scope (Target: 100%):** Every medical and target-based query must be blocked and return an `out_of_scope` refusal.
*   **False Positive Rate (Target: <2%):** Valid, factual nutrition queries that are incorrectly blocked by the Scope Guard (especially the L2 Semantic Classifier `SCOPE_SIM_THRESHOLD`).
*   **Multi-Turn Resilience:** Prove that spreading a medical request across 3+ conversational turns (L3 Context Guard) still results in a block.

---

## 4. Milestone 1 Regression Testing

**Objective:** Guarantee that the complex new architecture (M2) does not degrade the baseline performance established in Milestone 1.

**Test Harness:** `scripts/run-m1-regression.ts`
**Dataset:** The original 10 baseline questions from M1.

### Key Metrics
*   **Output Stability:** Ensure that answers to the M1 questions do not contain drifting numbers or fabricated attributions compared to the M1 baseline. For unverified queries, ensure the fallback output gracefully provides an explanation (e.g., "I could not find information...") rather than failing completely.
*   **Failure Logging:** Any degradation must be captured in `failure-log/results-m2.md` and resolved before release.

---

## 5. Manual Quality Assurance (QA) & Spot Checks

While automated harnesses cover bulk testing, human-in-the-loop QA is required for UX and nuanced verification.

### Checklist
- [ ] **Citation Spot-Check:** Manually verify 10 generated answers. Click the `#page=N` PDF link and visually confirm the exact `quote` exists on that specific page.
- [ ] **Chunking Report Review:** Manually review `corpus/chunks/report.md` to ensure tables are not orphaned and headings are correctly parsed.
- [ ] **UI Refusal Validation:** Trigger an `out_of_scope` (red/amber) and `not_covered` (neutral) refusal. Verify the UI cards render correctly and explain the rejection clearly.
- [ ] **Token Budget Validation:** Inspect the backend logs for a dense query to ensure the assembled context block strictly adheres to the 2,800 token limit without crashing.
