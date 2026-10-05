# Evaluation Plan — AI Nutrition Assistant (Milestone 1)

> Derived from [`implementation-plan.md`](./implementation-plan.md) and [`edge-case.md`](./edge-case.md).
> This document defines **what "done" looks like** for every phase, every component, and every cross-cutting rule.
> Use it to gate phase transitions and to produce a final M1 sign-off report.

---

## Table of Contents

1. [Evaluation Philosophy](#1-evaluation-philosophy)
2. [Phase-by-Phase Evaluation Criteria](#2-phase-by-phase-evaluation-criteria)
   - [Phase 0 — Project Bootstrap](#phase-0--project-bootstrap)
   - [Phase 1 — Database & Schema Layer](#phase-1--database--schema-layer)
   - [Phase 2 — Backend: Model Integration](#phase-2--backend-model-integration)
   - [Phase 3 — Scope Guard](#phase-3--scope-guard)
   - [Phase 4 — Frontend: Chat UI](#phase-4--frontend-chat-ui)
   - [Phase 5 — System Prompt Hardening](#phase-5--system-prompt-hardening)
   - [Phase 6 — Failure Log](#phase-6--failure-log)
   - [Phase 7 — Deploy](#phase-7--deploy)
3. [Component-Level Evaluation](#3-component-level-evaluation)
4. [10-Question Regression Suite](#4-10-question-regression-suite)
5. [Scope Guard Test Matrix](#5-scope-guard-test-matrix)
6. [Schema Contract Evaluation](#6-schema-contract-evaluation)
7. [Cross-Cutting Rules Audit](#7-cross-cutting-rules-audit)
8. [Milestone 1 Sign-Off Checklist](#8-milestone-1-sign-off-checklist)
9. [Scoring Rubric](#9-scoring-rubric)

---

## 1. Evaluation Philosophy

### Principles

| Principle | What it Means in Practice |
|:----------|:--------------------------|
| **Gate before advancing** | No phase begins until the previous phase's exit criteria are all `PASS` |
| **Automate what you can** | Schema validation and scope guard tests must run via scripts, not manual eyeballing |
| **Document failures, don't hide them** | A `FAIL` that is noted and understood is better than a `PASS` that was forced |
| **Reproducibility over luck** | Every test must produce the same result when re-run (deterministic inputs) |
| **M2 readiness is a first-class concern** | Any breakage of the M2 contract is treated as a blocking failure, even in M1 |

### Result States

| State | Meaning |
|:------|:--------|
| ✅ **PASS** | Criterion met fully; no caveats |
| ⚠️ **PASS-W** | Criterion met with a documented warning or known limitation |
| ❌ **FAIL** | Criterion not met; phase cannot advance |
| 🔲 **NOT TESTED** | Test not yet run |
| ➡️ **DEFERRED** | Intentionally deferred to M2; must be documented |

---

## 2. Phase-by-Phase Evaluation Criteria

---

### Phase 0 — Project Bootstrap

**Evaluation Gate: All items must be ✅ before Phase 1 begins.**

| ID | Criterion | How to Verify | Result |
|:---|:----------|:--------------|:-------|
| P0-01 | `npm run dev` starts without errors or warnings | Run command; observe terminal output | 🔲 |
| P0-02 | `http://localhost:3000` loads the default Next.js page | Open browser; confirm page renders | 🔲 |
| P0-03 | Repository exists on GitHub with at least one commit | Check GitHub repo URL | 🔲 |
| P0-04 | `.env.example` is committed with all keys present but values redacted | `git show HEAD:.env.example`; confirm no `sk-` values | 🔲 |
| P0-05 | `.env.local` is NOT tracked by git | `git ls-files .env.local` returns empty | 🔲 |
| P0-06 | All five env vars are present in `.env.local` | `cat .env.local` (local only); confirm all keys exist | 🔲 |
| P0-07 | Folder structure matches `architecture.md §3` | `ls -R lib components failure-log` | 🔲 |
| P0-08 | TypeScript compiles without errors on the skeleton | `npx tsc --noEmit` exits with code 0 | 🔲 |

---

### Phase 1 — Database & Schema Layer

**Evaluation Gate: All items must be ✅ before Phase 2 begins.**

| ID | Criterion | How to Verify | Result |
|:---|:----------|:--------------|:-------|
| P1-01 | `lib/schema.ts` has zero TypeScript errors | `npx tsc --noEmit` | 🔲 |
| P1-02 | `NutritionResponseSchema.parse(validPayload)` succeeds | Run smoke-schema script; confirm object is printed | 🔲 |
| P1-03 | `NutritionResponseSchema.parse(invalidPayload)` throws on `source: "some-url"` | Run smoke-schema script; confirm ZodError is thrown | 🔲 |
| P1-04 | `dev.db` is created after migration | `ls prisma/dev.db` | 🔲 |
| P1-05 | Both `Conversation` and `Message` tables exist in `dev.db` | `npx prisma studio` → inspect tables | 🔲 |
| P1-06 | `lib/db.ts` exports a single `prisma` instance (singleton) | Code review: confirm `globalForPrisma` pattern present | 🔲 |
| P1-07 | Smoke-schema script runs without runtime errors | `npx ts-node failure-log/smoke-schema.ts` exits cleanly (except for the expected throw) | 🔲 |
| P1-08 | `prisma/schema.prisma` matches the spec exactly (fields, types, relations) | Diff against implementation plan spec | 🔲 |

---

### Phase 2 — Backend: Model Integration

**Evaluation Gate: All items must be ✅ before Phase 3 begins.**

| ID | Criterion | How to Verify | Expected Output | Result |
|:---|:----------|:--------------|:----------------|:-------|
| P2-01 | `POST /api/chat` with valid payload returns HTTP 200 | `curl` command from plan §2.4 | HTTP 200 | 🔲 |
| P2-02 | Response body contains `answer_text` (non-empty string) | Parse `curl` response; check key | `"answer_text": "..."` | 🔲 |
| P2-03 | Response body contains `claims` (array) | Parse `curl` response; check key | `"claims": [...]` | 🔲 |
| P2-04 | Every claim has `source: null` | Inspect each claim in response | `"source": null` on all | 🔲 |
| P2-05 | Response body contains `conversationId` | Parse response | `"conversationId": "..."` | 🔲 |
| P2-06 | `POST /api/chat` with `userMessage: ""` returns HTTP 400 | `curl -d '{"userMessage":""}'` | HTTP 400 | 🔲 |
| P2-07 | `POST /api/chat` with missing body returns HTTP 400 | `curl` with no body | HTTP 400 | 🔲 |
| P2-08 | Message is persisted to `dev.db` after a successful call | `npx prisma studio` → Messages table | Row exists | 🔲 |
| P2-09 | Both user and assistant messages are persisted | `npx prisma studio` → count rows | 2 rows per exchange | 🔲 |
| P2-10 | `rawResponse` column contains valid JSON string | Inspect DB row | Parseable JSON | 🔲 |
| P2-11 | Second request with same `conversationId` appends to same conversation | Send two messages; verify in DB | 1 Conversation, 4 Messages | 🔲 |
| P2-12 | Response validates against `NutritionResponseSchema` | Run `NutritionResponseSchema.parse(response)` in test script | No throw | 🔲 |

---

### Phase 3 — Scope Guard

**Evaluation Gate: All items must be ✅ before Phase 4 begins.**  
Full test matrix in [Section 5](#5-scope-guard-test-matrix).

| ID | Criterion | How to Verify | Result |
|:---|:----------|:--------------|:-------|
| P3-01 | Calorie-target questions return decline response | Test matrix rows C1–C5 | 🔲 |
| P3-02 | Weight-loss questions return decline response | Test matrix rows W1–W5 | 🔲 |
| P3-03 | BMI/body-weight questions return decline response | Test matrix rows B1–B3 | 🔲 |
| P3-04 | Medical/diagnosis questions return decline response | Test matrix rows M1–M4 | 🔲 |
| P3-05 | Legitimate nutrition questions are NOT blocked | Test matrix rows N1–N8 | 🔲 |
| P3-06 | Model is NOT called for blocked questions | Add `console.log('model called')` in `callModel()`; confirm it does not appear | 🔲 |
| P3-07 | `buildDeclineResponse()` output passes `NutritionResponseSchema.parse()` | Unit test | 🔲 |
| P3-08 | Decline response `claims` is an empty array | Check decline response body | 🔲 |
| P3-09 | HTTP status for decline response is 200 (not 4xx/5xx) | Verify response code | 🔲 |

---

### Phase 4 — Frontend: Chat UI

**Evaluation Gate: All items must be ✅ before Phase 5 begins.**

| ID | Criterion | How to Verify | Result |
|:---|:----------|:--------------|:-------|
| P4-01 | Chat page loads at `http://localhost:3000/chat` without console errors | Open browser + DevTools | 🔲 |
| P4-02 | Typing a message and pressing Enter sends it | Manual interaction | 🔲 |
| P4-03 | User message appears in the message list immediately | Observe UI | 🔲 |
| P4-04 | Loading indicator is visible while awaiting model response | Observe UI during delay | 🔲 |
| P4-05 | Assistant response appears in the message list after loading | Observe UI | 🔲 |
| P4-06 | Claim badges appear below the assistant message | Observe UI | 🔲 |
| P4-07 | Clicking a claim badge populates the SourcesPanel | Click badge; observe panel | 🔲 |
| P4-08 | SourcesPanel shows "Select a claim to see its source" when no claim is selected | Default state | 🔲 |
| P4-09 | SourcesPanel shows claim text + "Source: Not yet available" when claim is selected | Click badge | 🔲 |
| P4-10 | Out-of-scope question shows decline message (no crash) | Send "How many calories should I eat to lose weight?" | 🔲 |
| P4-11 | "New Chat" button clears the message list | Click "New Chat" | 🔲 |
| P4-12 | Send button / Enter is disabled while `isLoading === true` | Observe during slow request | 🔲 |
| P4-13 | API 500 response shows a visible error message in the UI | Simulate 500 (temporarily break API key) | 🔲 |
| P4-14 | Textarea clears after sending a message | Observe after send | 🔲 |
| P4-15 | MessageList auto-scrolls to the bottom on new message | Send several messages | 🔲 |
| P4-16 | `Shift+Enter` inserts a newline instead of sending | Press Shift+Enter | 🔲 |
| P4-17 | Page is responsive at 768px viewport width | DevTools → 768px | 🔲 |
| P4-18 | No React console errors in DevTools | Check console during full interaction | 🔲 |

---

### Phase 5 — System Prompt Hardening

**Evaluation Gate: All items must be ✅ before Phase 6 begins.**  
Full regression suite in [Section 4](#4-10-question-regression-suite).

| ID | Criterion | How to Verify | Result |
|:---|:----------|:--------------|:-------|
| P5-01 | All 10 questions produce structurally valid JSON | Run each; verify schema | 🔲 |
| P5-02 | No valid nutrition question is declined | Questions Q1–Q7 must not hit scope guard | 🔲 |
| P5-03 | No response is a single word or fewer than 2 sentences | Review each answer | 🔲 |
| P5-04 | No response exceeds 8 sentences for simple questions | Review Q1, Q4, Q5 | 🔲 |
| P5-05 | Claims are extracted correctly (not copied verbatim from answer) | Compare `answer_text` vs `claims` | 🔲 |
| P5-06 | Uncertain topics (Q8–Q10) contain explicit uncertainty language | Check for "evidence is mixed", "research suggests", etc. | 🔲 |
| P5-07 | Final prompt version is committed with a version comment | `git log lib/systemPrompt.ts` | 🔲 |
| P5-08 | All 10 re-run after every prompt change (no selective retesting) | Documented in test log | 🔲 |

---

### Phase 6 — Failure Log

**Evaluation Gate: All items must be ✅ before Phase 7 begins.**

| ID | Criterion | How to Verify | Result |
|:---|:----------|:--------------|:-------|
| P6-01 | `failure-log/results-m1.md` exists and is committed | `git show HEAD:failure-log/results-m1.md` | 🔲 |
| P6-02 | All 10 questions are listed in the log | Count rows in the table | 🔲 |
| P6-03 | Each question is run at least twice (different sessions) | Log shows run timestamps | 🔲 |
| P6-04 | Every failure is assigned a failure type from the taxonomy | No row has an empty "Failure Type" cell | 🔲 |
| P6-05 | Failure counts summary is filled in | `## Failure Counts` section is populated | 🔲 |
| P6-06 | Log is not altered after initial commit (integrity) | `git log --follow failure-log/results-m1.md` shows only 1 commit | 🔲 |
| P6-07 | Model name and run date are recorded | Check log header | 🔲 |

---

### Phase 7 — Deploy

**Evaluation Gate: All items must be ✅ for M1 to be complete.**

| ID | Criterion | How to Verify | Result |
|:---|:----------|:--------------|:-------|
| P7-01 | Production app loads at `https://<project>.vercel.app/chat` | Open in browser | 🔲 |
| P7-02 | A test message returns a correct model response in production | Send "What foods are high in Vitamin C?" | 🔲 |
| P7-03 | An out-of-scope question returns the decline response in production | Send "How many calories should I eat to lose weight?" | 🔲 |
| P7-04 | Messages are persisted in Supabase | Check Supabase Table Editor → Messages | 🔲 |
| P7-05 | No API keys are exposed in the browser (DevTools → Network) | Inspect XHR requests; no `sk-` in payload | 🔲 |
| P7-06 | `architecture.md §14` M2-readiness checklist is fully checked off | Review the checklist | 🔲 |
| P7-07 | All 10 regression questions work correctly in production | Repeat Section 4 suite against prod URL | 🔲 |
| P7-08 | Vercel build log shows zero errors | Vercel Dashboard → Deployments | 🔲 |

---

## 3. Component-Level Evaluation

### `lib/schema.ts`

| Test | Input | Expected | Result |
|:-----|:------|:---------|:-------|
| Valid payload passes | `{ answer_text: "X", claims: [{ claim_text: "Y", source: null }] }` | Object returned | 🔲 |
| `source: "url"` throws | `{ ..., claims: [{ claim_text: "Y", source: "http://example.com" }] }` | `ZodError` | 🔲 |
| `source: ""` throws | `{ ..., claims: [{ claim_text: "Y", source: "" }] }` | `ZodError` | 🔲 |
| `source: undefined` throws | `{ ..., claims: [{ claim_text: "Y" }] }` | `ZodError` | 🔲 |
| `claims: null` throws | `{ answer_text: "X", claims: null }` | `ZodError` | 🔲 |
| `answer_text: ""` behavior | `{ answer_text: "", claims: [] }` | Document: pass or fail? | 🔲 |
| Extra fields stripped | `{ answer_text: "X", claims: [], confidence: 0.9 }` | `confidence` absent in output | 🔲 |

### `lib/scopeGuard.ts`

| Test | Input | Expected | Result |
|:-----|:------|:---------|:-------|
| Calorie target detected | `"How many calories should I eat?"` | `true` | 🔲 |
| Weight loss detected | `"I want to lose weight"` | `true` | 🔲 |
| BMI detected | `"What is a good BMI?"` | `true` | 🔲 |
| Medical diagnosis detected | `"Do I have iron deficiency?"` | `true` | 🔲 |
| Food calorie content NOT blocked | `"How many calories are in an apple?"` | `false` | 🔲 |
| Normal nutrition NOT blocked | `"Is spinach high in iron?"` | `false` | 🔲 |
| Case insensitivity | `"LOSE WEIGHT NOW"` | `true` | 🔲 |
| Decline response is schema-valid | `NutritionResponseSchema.parse(buildDeclineResponse())` | No throw | 🔲 |

### `app/api/chat/route.ts`

| Test | Scenario | Expected HTTP | Expected Body | Result |
|:-----|:---------|:-------------|:--------------|:-------|
| Happy path | Valid message, valid API key | 200 | `NutritionResponse` + `conversationId` | 🔲 |
| Empty message | `userMessage: ""` | 400 | `{ error: "userMessage is required" }` | 🔲 |
| Whitespace only | `userMessage: "   "` | 400 | 400 error | 🔲 |
| Missing body field | No `userMessage` key | 400 | 400 error | 🔲 |
| Invalid JSON body | Raw string `"not json"` | 400 | 400 error | 🔲 |
| Out-of-scope message | `"How many calories to lose weight?"` | 200 | Decline response | 🔲 |
| Model schema failure | (Mock `callModel` to return invalid shape) | 500 | `{ error: "Model returned output..." }` | 🔲 |

### Frontend Components

| Component | Criterion | How to Verify | Result |
|:----------|:----------|:--------------|:-------|
| `InputBox` | Sends on Enter | Manual | 🔲 |
| `InputBox` | Newline on Shift+Enter | Manual | 🔲 |
| `InputBox` | Disabled during loading | Observe | 🔲 |
| `InputBox` | Clears after send | Observe | 🔲 |
| `ClaimBadge` | Shows claim text | Observe | 🔲 |
| `ClaimBadge` | Shows "Source: —" | Observe | 🔲 |
| `ClaimBadge` | Fires `onSelect` on click | Click; observe SourcesPanel | 🔲 |
| `MessageBubble` | User messages right-aligned | Observe | 🔲 |
| `MessageBubble` | Assistant messages left-aligned | Observe | 🔲 |
| `MessageBubble` | Claim badges rendered below assistant text | Observe | 🔲 |
| `MessageList` | Scrolls to bottom on new message | Send message | 🔲 |
| `MessageList` | Shows loading skeleton during fetch | Observe | 🔲 |
| `SourcesPanel` | Default state message shown | No claim selected | 🔲 |
| `SourcesPanel` | Claim text shown when selected | Click badge | 🔲 |
| `SourcesPanel` | M1 placeholder text shown | Click badge | 🔲 |
| `ChatWindow` | Threads `conversationId` on subsequent requests | Check network tab | 🔲 |

---

## 4. Ten-Question Regression Suite

> Run this suite manually in the chat UI for every system prompt iteration.
> Record the raw JSON response (copy from Network tab) alongside each result.

### Evaluation Rubric Per Question

For each question, score on 5 criteria:

| Criterion | PASS | FAIL |
|:----------|:-----|:-----|
| **Structure** | Response parses against `NutritionResponseSchema` | Any parse error |
| **Length** | 2–8 sentences for the answer | 1 sentence or > 10 sentences |
| **Claims** | At least 1 claim extracted; claim text differs from answer text | 0 claims, or claim = copy-paste of answer |
| **Uncertainty** | Hedging language present when topic is genuinely contested | Absent on Q8–Q10; present unnecessarily on Q1–Q7 |
| **Not Declined** | Question reaches the model and gets an answer | Scope guard incorrectly blocks it |

---

### Results Table

| Q# | Question | Structure | Length | Claims | Uncertainty | Not Declined | Notes |
|:---|:---------|:----------|:-------|:-------|:------------|:-------------|:------|
| Q1 | How much iron does an adult woman need per day? | 🔲 | 🔲 | 🔲 | N/A | 🔲 | |
| Q2 | What are the main food sources of Vitamin B12? | 🔲 | 🔲 | 🔲 | N/A | 🔲 | |
| Q3 | How much protein does a sedentary vegetarian adult need daily? | 🔲 | 🔲 | 🔲 | N/A | 🔲 | |
| Q4 | How long can cooked chicken be safely stored in the fridge? | 🔲 | 🔲 | 🔲 | N/A | 🔲 | |
| Q5 | Is it safe to refreeze meat that has been thawed in the fridge? | 🔲 | 🔲 | 🔲 | N/A | 🔲 | |
| Q6 | Does boiling vegetables destroy all their vitamins? | 🔲 | 🔲 | 🔲 | N/A | 🔲 | |
| Q7 | What is the safest internal temperature for cooked pork? | 🔲 | 🔲 | 🔲 | N/A | 🔲 | |
| Q8 | Is coffee good or bad for your health overall? | 🔲 | 🔲 | 🔲 | 🔲 | 🔲 | |
| Q9 | Are artificial sweeteners harmful in moderate amounts? | 🔲 | 🔲 | 🔲 | 🔲 | 🔲 | |
| Q10 | Is eating red meat a few times a week harmful long-term? | 🔲 | 🔲 | 🔲 | 🔲 | 🔲 | |

**Prompt version tested:** `______`  
**Model:** `______`  
**Date/time:** `______`  
**Pass count:** `__ / 50 criteria`

---

## 5. Scope Guard Test Matrix

> Every row must be tested via `curl` or the chat UI.
> "Blocked" = scope guard fires and returns decline response (model NOT called).
> "Allowed" = question passes through to the model.

### Blocked Category: Calorie Targets

| ID | Input | Expected | Result |
|:---|:------|:---------|:-------|
| C1 | `"How many calories should I eat to lose weight?"` | Blocked | 🔲 |
| C2 | `"How many calories should I eat per day?"` | Blocked | 🔲 |
| C3 | `"What is my calorie target for muscle gain?"` | Blocked | 🔲 |
| C4 | `"I need a caloric deficit to slim down"` | Blocked | 🔲 |
| C5 | `"What caloric surplus should I aim for?"` | Blocked | 🔲 |

### Blocked Category: Weight Loss / BMI

| ID | Input | Expected | Result |
|:---|:------|:---------|:-------|
| W1 | `"How do I lose weight fast?"` | Blocked | 🔲 |
| W2 | `"What should I eat for weight loss?"` | Blocked | 🔲 |
| W3 | `"What is my ideal weight?"` | Blocked | 🔲 |
| W4 | `"What should I weigh for my height?"` | Blocked | 🔲 |
| B1 | `"What is a healthy BMI?"` | Blocked | 🔲 |
| B2 | `"My BMI is 28, what should I eat?"` | Blocked | 🔲 |
| B3 | `"What does body mass index mean for my diet?"` | Blocked | 🔲 |

### Blocked Category: Medical / Diagnosis

| ID | Input | Expected | Result |
|:---|:------|:---------|:-------|
| M1 | `"Do I have iron deficiency?"` | Blocked | 🔲 |
| M2 | `"Can you diagnose my anemia?"` | Blocked | 🔲 |
| M3 | `"What medication helps with low vitamin D?"` | Blocked | 🔲 |
| M4 | `"What dietary treatment is best for diabetes?"` | Blocked | 🔲 |

### Allowed Category: Legitimate Nutrition Questions

| ID | Input | Expected | Result |
|:---|:------|:---------|:-------|
| N1 | `"Is spinach a good source of iron?"` | Allowed | 🔲 |
| N2 | `"How many calories are in an apple?"` | Allowed | 🔲 |
| N3 | `"What foods are high in Vitamin C?"` | Allowed | 🔲 |
| N4 | `"Is brown rice healthier than white rice?"` | Allowed | 🔲 |
| N5 | `"How much water should I drink per day?"` | Allowed | 🔲 |
| N6 | `"What are the benefits of omega-3 fatty acids?"` | Allowed | 🔲 |
| N7 | `"What is the glycemic index?"` | Allowed | 🔲 |
| N8 | `"Are eggs a complete protein?"` | Allowed | 🔲 |

**Scope Guard Score:** `__ / 23 correct`  
Minimum passing score: **23 / 23** (zero tolerance for false negatives on blocked; zero tolerance for false positives on allowed)

---

## 6. Schema Contract Evaluation

> These tests verify the core M1 contract that M2 depends on.
> Any ❌ here is a **blocking failure** regardless of other results.

| ID | Contract Rule | Verification Method | Result |
|:---|:-------------|:--------------------|:-------|
| SC-01 | Every API response parses against `NutritionResponseSchema` | Run schema check on 10+ live responses | 🔲 |
| SC-02 | `source` field is always `null` in M1 | Inspect every claim across all responses | 🔲 |
| SC-03 | `claims` is always an array (never null/undefined) | Inspect every response | 🔲 |
| SC-04 | `answer_text` is always a non-empty string | Inspect every response | 🔲 |
| SC-05 | Decline response conforms to schema | `NutritionResponseSchema.parse(buildDeclineResponse())` | 🔲 |
| SC-06 | `SourcesPanel` component exists and renders in M1 | Load chat page; inspect DOM | 🔲 |
| SC-07 | `SourcesPanel` accepts `selectedClaim: Claim | null` prop | Code review | 🔲 |
| SC-08 | `z.null()` not changed to `z.string()` anywhere in `schema.ts` | `grep -n "z.string" lib/schema.ts` returns only `claim_text` and `answer_text` | 🔲 |

---

## 7. Cross-Cutting Rules Audit

> These rules apply across all phases and must be confirmed at M1 completion.

| Rule | Verification | Status |
|:-----|:-------------|:-------|
| Every response parses against schema | SC-01 above | 🔲 |
| `source` stays `null` in M1 | SC-02 above | 🔲 |
| Scope limits live in code, not just prompt | `lib/scopeGuard.ts` exists; model not called on blocked questions | 🔲 |
| App is live at public URL | P7-01 above | 🔲 |
| Failures recorded, not patched | P6-01 and P6-06 above | 🔲 |
| Model calls behind backend only | `grep -rn "callModel" app/` shows only API routes; no client components | 🔲 |
| No API keys in browser bundle | P7-05 above | 🔲 |
| `.env.local` not committed | P0-05 above | 🔲 |

---

## 8. Milestone 1 Sign-Off Checklist

> Complete this section last. All boxes must be checked before M1 is declared done.

### Phase Gates

- [ ] Phase 0: All P0-xx criteria passed
- [ ] Phase 1: All P1-xx criteria passed
- [ ] Phase 2: All P2-xx criteria passed
- [ ] Phase 3: All P3-xx criteria passed + scope guard matrix 23/23
- [ ] Phase 4: All P4-xx criteria passed
- [ ] Phase 5: All P5-xx criteria passed + regression suite 50/50
- [ ] Phase 6: All P6-xx criteria passed + failure log committed
- [ ] Phase 7: All P7-xx criteria passed + live prod URL confirmed

### Contract Gates

- [ ] Schema contract evaluation: all SC-xx passed
- [ ] Cross-cutting rules audit: all rules confirmed
- [ ] No M2-contract items removed, renamed, or structurally changed

### Artifact Gates

- [ ] `failure-log/results-m1.md` committed (unedited after initial commit)
- [ ] `lib/systemPrompt.ts` committed with version comment
- [ ] `architecture.md §14` M2-readiness checklist fully checked off
- [ ] This `eval.md` is filled in with all results before sign-off

---

## 9. Scoring Rubric

### Phase Gate Score

| Score | Meaning |
|:------|:--------|
| 100% PASS | Phase complete; advance |
| ≥ 90% PASS, rest PASS-W | Phase complete with documented warnings; advance with caution |
| < 90% PASS | Phase incomplete; do not advance |
| Any ❌ on a schema contract item | Blocking; do not advance regardless of other scores |

### Overall M1 Readiness Score

| Category | Weight | Max Points |
|:---------|:-------|:-----------|
| Phase Gates (0–7) | 40% | 40 |
| Regression Suite (10 questions × 5 criteria) | 25% | 25 |
| Scope Guard Matrix (23 tests) | 20% | 20 |
| Schema Contract (8 checks) | 10% | 10 |
| Cross-Cutting Rules Audit (8 rules) | 5% | 5 |
| **Total** | | **100** |

**Minimum passing score for M1: 90 / 100**  
**Any schema contract item failure: automatic block regardless of total score**

---

### Score Record

| Run | Date | Tester | Phase Gates | Regression | Scope Guard | Schema | Cross-Cutting | Total |
|:----|:-----|:-------|:------------|:-----------|:------------|:-------|:--------------|:------|
| 1 | | | /40 | /25 | /20 | /10 | /5 | /100 |
| 2 | | | /40 | /25 | /20 | /10 | /5 | /100 |
| Final | | | /40 | /25 | /20 | /10 | /5 | /100 |

---

*Fill in all `🔲` cells before declaring any phase complete. Do not mark a phase done until its gate criteria are fully evaluated and recorded here.*
