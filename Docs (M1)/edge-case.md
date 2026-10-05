# Edge Cases & Corner Scenarios — AI Nutrition Assistant

> Derived from [`implementation-plan.md`](./implementation-plan.md).
> This document catalogs every known edge case, boundary condition, and failure mode for each phase.
> Use this as a pre-flight checklist before shipping each phase.

---

## Table of Contents

1. [Phase 0 — Project Bootstrap](#phase-0--project-bootstrap)
2. [Phase 1 — Database & Schema Layer](#phase-1--database--schema-layer)
3. [Phase 2 — Backend: Model Integration](#phase-2--backend-model-integration)
4. [Phase 3 — Scope Guard](#phase-3--scope-guard)
5. [Phase 4 — Frontend: Chat UI](#phase-4--frontend-chat-ui)
6. [Phase 5 — System Prompt Hardening](#phase-5--system-prompt-hardening)
7. [Phase 6 — Failure Log](#phase-6--failure-log)
8. [Phase 7 — Deploy](#phase-7--deploy)
9. [Cross-Cutting / Global Edge Cases](#cross-cutting--global-edge-cases)

---

## Phase 0 — Project Bootstrap

### ENV & Secrets

| # | Scenario | Risk | Mitigation |
|:--|:---------|:-----|:-----------|
| 0-EC-01 | `.env.local` is accidentally committed to git | API key exposure | Confirm `.gitignore` entry exists before first `git add` |
| 0-EC-02 | `.env.example` contains real keys instead of placeholders | Key leak in public repo | Script/CI check: values must not start with `sk-` |
| 0-EC-03 | `MODEL_PROVIDER` env var is missing or misspelled | Silent fallback to wrong provider | Validate at app startup; throw if not `openai` or `anthropic` |
| 0-EC-04 | `DATABASE_URL` points to a path with spaces or special characters on Windows | Prisma connection failure | Use relative path `file:./dev.db` as specified; avoid absolute paths |
| 0-EC-05 | Both `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` are set but `MODEL_PROVIDER` selects neither | No model called | Add explicit validation in `model.ts` startup |

### Dependency & Tooling

| # | Scenario | Risk | Mitigation |
|:--|:---------|:-----|:-----------|
| 0-EC-06 | `npx create-next-app` version drifts and generates an incompatible folder structure | Build errors | Pin version: `create-next-app@15.x.x` |
| 0-EC-07 | `npm install` fails due to network restrictions or corporate proxy | Blocked setup | Document proxy config; use `npm install --prefer-offline` if packages cached |
| 0-EC-08 | Node.js version is incompatible (< 18) | Next.js 14+ requires Node 18+ | Add `engines` field to `package.json` |
| 0-EC-09 | Port 3000 is already in use when running `npm run dev` | Dev server refuses to start | Use `npm run dev -- --port 3001`; document in README |

---

## Phase 1 — Database & Schema Layer

### Zod Schema (`lib/schema.ts`)

| # | Scenario | Risk | Mitigation |
|:--|:---------|:-----|:-----------|
| 1-EC-01 | Model returns `source: ""` (empty string) instead of `null` | `z.null()` throws — 500 error to user | Add `.or(z.null())` + normalize in `callModel()`, or make system prompt stricter |
| 1-EC-02 | Model returns `source: undefined` (key omitted entirely) | `z.null()` throws on missing key | Add `.optional()` guard or use `z.null().optional()` with explicit null coercion |
| 1-EC-03 | `answer_text` is an empty string `""` | Displays blank assistant bubble | Add `z.string().min(1)` to `answer_text` |
| 1-EC-04 | `claims` array is `null` instead of `[]` | Downstream `.map()` crashes | Use `z.array(ClaimSchema).nullable().transform(v => v ?? [])` |
| 1-EC-05 | `claims` array has 0 items (empty array) | Badge row renders nothing — looks broken | Handle gracefully in `MessageBubble`; show "No claims extracted" placeholder |
| 1-EC-06 | `claims` array has 100+ items | UI overflow; performance issues | Consider `z.array(ClaimSchema).max(20)` as a sanity cap |
| 1-EC-07 | `claim_text` contains HTML or script tags | XSS if rendered with `dangerouslySetInnerHTML` | Always use text nodes / React's default escaping; never use raw HTML for claim text |
| 1-EC-08 | Model returns extra fields not in schema (e.g., `confidence`, `references`) | `z.object()` by default strips extras — but silently | Document this stripping behavior; if extra fields are needed in M2, extend schema |

### Prisma / SQLite

| # | Scenario | Risk | Mitigation |
|:--|:---------|:-----|:-----------|
| 1-EC-09 | `dev.db` file is deleted or corrupted between restarts | All conversation history lost | Expected in dev; document as a known limitation |
| 1-EC-10 | Migration runs while dev server is already holding a lock on `dev.db` | `SQLITE_BUSY` error | Stop `npm run dev` before running `prisma migrate dev` |
| 1-EC-11 | `rawResponse` JSON string exceeds SQLite text limits (~1 GB) | Practically safe, but worth noting | For production Postgres, use native `Json` type as noted in plan |
| 1-EC-12 | `prisma generate` is not run after schema change | Type mismatches; stale client | Add `prisma generate` as a `postinstall` script |
| 1-EC-13 | Multiple `PrismaClient` instances created in Next.js hot-reload loop | `Too many connections` warning | The singleton pattern in `lib/db.ts` handles this — verify it is not bypassed |
| 1-EC-14 | `conversationId` CUID collision (astronomically rare) | Upsert creates duplicate or throws unique constraint | CUID has enough entropy; log and surface as a 500 if it ever occurs |

---

## Phase 2 — Backend: Model Integration

### Request Parsing (`app/api/chat/route.ts`)

| # | Scenario | Risk | Mitigation |
|:--|:---------|:-----|:-----------|
| 2-EC-01 | Request body is not valid JSON | `req.json()` throws unhandled exception | Wrap `req.json()` in try/catch; return 400 |
| 2-EC-02 | `userMessage` is missing from body | Returns 400 (already handled) — ✅ | Verify the error message is user-friendly |
| 2-EC-03 | `userMessage` is only whitespace (e.g., `"   "`) | `.trim()` check already handles — ✅ | Ensure the 400 response is returned, not a model call |
| 2-EC-04 | `userMessage` is an extremely long string (10,000+ chars) | Hits model context limit or token cost spike | Add `z.string().max(2000)` validation on the route |
| 2-EC-05 | `conversationId` is provided but does not exist in DB | `upsert` creates a new conversation — may or may not be intended | Decide: should an unknown ID start fresh or return 404? Document the chosen behavior |
| 2-EC-06 | `conversationId` is an empty string `""` | `upsert` where clause `{ id: "" }` will never match — creates new row | The `?? ''` fallback makes this a no-match; `create` path fires — acceptable |
| 2-EC-07 | `conversationId` is a valid UUID but for a different user (no auth in M1) | Anyone can append to any conversation | Known M1 limitation; document in README; fix in M2 with auth |

### Model Call (`lib/model.ts`)

| # | Scenario | Risk | Mitigation |
|:--|:---------|:-----|:-----------|
| 2-EC-08 | OpenAI API key is revoked or rate-limited | `openai.beta.chat.completions.parse` throws | Caught by try/catch in route — returns 500 |
| 2-EC-09 | OpenAI API is down (network timeout) | Request hangs indefinitely | Set `timeout` option on OpenAI client; add `AbortSignal` with 30s limit |
| 2-EC-10 | `completion.choices` is empty array | `choices[0]` is `undefined`; accessing `.message` throws | Guard: `if (!completion.choices.length) throw new Error('No choices')` |
| 2-EC-11 | `completion.choices[0].message.parsed` is `null` (already handled) — ✅ | Throws `'Model returned no parsed output'` | Verify this error message appears as a 500 to the client |
| 2-EC-12 | Model returns valid JSON but it does not match `NutritionResponseSchema` | `NutritionResponseSchema.parse(parsed)` throws | Caught by try/catch — returns 500; log the raw output for debugging |
| 2-EC-13 | `response.answer_text` contains newlines or markdown | May render oddly in plain-text bubbles | Decide rendering strategy upfront (plain text vs. markdown parser) |
| 2-EC-14 | Message history grows indefinitely (1000+ messages) | Prompt token limit exceeded; slow DB queries | Add a rolling window: `history.slice(-20)` before passing to `callModel()` |
| 2-EC-15 | Persisting user message succeeds but persisting assistant message fails | Orphaned user message with no reply; next request replays the message | Wrap both `prisma.message.create` calls in a transaction |

### Race Conditions

| # | Scenario | Risk | Mitigation |
|:--|:---------|:-----|:-----------|
| 2-EC-16 | User sends two messages simultaneously from the same conversation | Out-of-order DB inserts; scrambled history | Disable the send button while `isLoading === true` (covered in Phase 4) |

---

## Phase 3 — Scope Guard

### Regex Pattern Gaps

| # | Scenario | Risk | Mitigation |
|:--|:---------|:-----|:-----------|
| 3-EC-01 | "How many calories should I eat?" — **no "to lose weight"** suffix | May NOT match current patterns | Test explicitly; add `/how (many\|much) calories? (should\|do) I/i` |
| 3-EC-02 | "calorie deficit" without the word "target" or "goal" | Not caught by current `BLOCKED_PATTERNS[0]` | Add `/calorie[s]? deficit/i` as a standalone pattern |
| 3-EC-03 | Typo or abbreviation bypass: "cals", "kcal target", "cal goal" | Regex misses abbreviations | Extend patterns or normalize input before testing |
| 3-EC-04 | Unicode lookalikes: "саlоrie" (Cyrillic chars) | Regex won't match non-ASCII lookalikes | Normalize Unicode to ASCII before scope check |
| 3-EC-05 | Mixed-case bypass: "LOSE WEIGHT" vs "lose weight" | Already handled — `/i` flag used — ✅ | Verify all patterns use `/i` |
| 3-EC-06 | Legitimate question about calorie *content* of food: "How many calories are in an apple?" | Incorrectly blocked by an over-broad pattern | Ensure "calories in [food]" is NOT blocked; only "how many calories should I eat" is blocked |
| 3-EC-07 | "My doctor prescribed a diet — what should I eat?" | "prescription" pattern matches — blocks | Decide: is this a valid nutrition question? If yes, refine the regex to be more specific |
| 3-EC-08 | Scope guard is called but `isOutOfScope` throws (e.g., regex stack overflow on massive input) | Unhandled 500 | Wrap `isOutOfScope()` in try/catch; fall through to model call on error |
| 3-EC-09 | `buildDeclineResponse()` returns an object that fails `NutritionResponseSchema.parse()` | Schema contract broken silently | Add a unit test: `NutritionResponseSchema.parse(buildDeclineResponse())` must not throw |
| 3-EC-10 | Out-of-scope question also contains a valid nutrition sub-question | Both blocked — possibly overly aggressive | Document this as a known trade-off for M1; M2 can use LLM-based classification |

---

## Phase 4 — Frontend: Chat UI

### Input Box (`components/InputBox.tsx`)

| # | Scenario | Risk | Mitigation |
|:--|:---------|:-----|:-----------|
| 4-EC-01 | User pastes 50,000 characters into the textarea | No UX limit; huge API payload | Enforce `maxLength` attribute; show character counter |
| 4-EC-02 | User hits Enter on a completely empty textarea | Sends empty message (caught by backend 400) | Disable the send action if `value.trim() === ''` |
| 4-EC-03 | User holds down Enter | Fires multiple requests rapidly | Debounce or disable send until previous response is received |
| 4-EC-04 | Textarea auto-resize does not reset after message is sent | Textarea stays tall for next message | Reset `height` to `auto` on clear |
| 4-EC-05 | Mobile: Shift+Enter behavior on virtual keyboards | Virtual keyboards often do not distinguish Shift+Enter | Handle mobile gracefully; use a send button as primary action |

### Message List & Bubbles

| # | Scenario | Risk | Mitigation |
|:--|:---------|:-----|:-----------|
| 4-EC-06 | Auto-scroll fires while user is scrolled up reading old messages | User loses reading position | Only auto-scroll if user is already near the bottom |
| 4-EC-07 | Assistant message has 0 claims — no badges rendered | Empty badge row looks broken | Conditionally render the badge row; show "No claims" hint instead |
| 4-EC-08 | `claim_text` is extremely long (200+ chars) | Badge overflows or wraps unreadably | Truncate with `text-overflow: ellipsis`; show full text in tooltip |
| 4-EC-09 | Rapid succession of messages creates a long DOM | Scrolling performance degrades | Implement windowed rendering if list exceeds 200 messages |
| 4-EC-10 | Loading skeleton remains visible if API call never resolves | UI stuck in loading state permanently | Add a 30-second timeout; display a timeout error message and reset `isLoading` |
| 4-EC-11 | Error bubble appears but is indistinguishable from a normal assistant message | User confused about what went wrong | Style error bubbles distinctly (red border, warning icon) |

### Sources Panel (`components/SourcesPanel.tsx`)

| # | Scenario | Risk | Mitigation |
|:--|:---------|:-----|:-----------|
| 4-EC-12 | User selects a claim from message N, then message M arrives — does selected claim persist? | Stale selection | Clear `selectedClaim` when a new message arrives, or keep it — document the decision |
| 4-EC-13 | SourcesPanel is removed or refactored in M1 "to clean things up" | Structural refactor required in M2 | The plan explicitly says "do not remove it" — enforce via code comment |

### State Management (`components/ChatWindow.tsx`)

| # | Scenario | Risk | Mitigation |
|:--|:---------|:-----|:-----------|
| 4-EC-14 | First API response does not return `conversationId` (e.g., 500 error) | All subsequent messages start new conversations | Guard: only set `conversationId` if response is successful |
| 4-EC-15 | User clicks "New Chat" mid-request | In-flight request still resolves; its response is attached to the old conversation | Cancel the in-flight request using `AbortController` on "New Chat" click |
| 4-EC-16 | Browser tab is refreshed mid-conversation | All conversation state lost (no persistence in frontend) | Known M1 limitation; document it |
| 4-EC-17 | `conversationId` in state diverges from DB (e.g., after a DB reset) | Subsequent requests get a 500 or create orphaned messages | Show a "Session expired — start a new chat" error if upsert fails |

### Conversations API (`app/api/conversations/route.ts`)

| # | Scenario | Risk | Mitigation |
|:--|:---------|:-----|:-----------|
| 4-EC-18 | A conversation has 0 messages (created but never received a reply) | `messages[0]?.content` is `undefined`; `preview` is `''` | Already handled by `?.` and `?? ''` — ✅ |
| 4-EC-19 | `preview` slices at 60 chars mid-emoji or mid-multibyte character | Corrupted preview text | Use `[...content].slice(0, 60).join('')` for Unicode-safe slicing |

---

## Phase 5 — System Prompt Hardening

### Prompt Behavior

| # | Scenario | Risk | Mitigation |
|:--|:---------|:-----|:-----------|
| 5-EC-01 | Model ignores the JSON output instruction and returns prose | `zodResponseFormat` enforces JSON mode — ✅ for OpenAI | For Anthropic, use tool-use; verify JSON mode is active |
| 5-EC-02 | Model refuses to answer a legitimate question due to overly strict prompt | False refusal degrades UX | Test questions 1–7 explicitly; prompt must NOT block them |
| 5-EC-03 | Model hallucinates a specific number (e.g., wrong RDA) | User may act on incorrect health info | Log in failure-log; add disclaimer to UI ("Verify with a professional") |
| 5-EC-04 | Model hedges every answer with "consult a doctor" even for factual queries | "Hedged into uselessness" failure type | Tune prompt: reserve hedging language for genuinely uncertain claims only |
| 5-EC-05 | Prompt injection via user message: "Ignore all previous instructions and..." | Model is manipulated into out-of-scope behavior | Scope guard (Phase 3) is the primary defense; prompt hardening is secondary |
| 5-EC-06 | Multi-turn context causes model to "forget" the JSON format in later turns | Later messages return prose | Include a reminder in the final system prompt line; monitor in regression suite |
| 5-EC-07 | Model returns duplicate claims (same `claim_text` twice) | Duplicate badges in UI | Deduplicate claims client-side before rendering |
| 5-EC-08 | Questions 8–10 (ambiguous health topics) cause wildly different answers per run | Non-determinism; user confusion | Set `temperature: 0` or `0.2` in `callModel()` for reproducibility |

---

## Phase 6 — Failure Log

### Logging Process

| # | Scenario | Risk | Mitigation |
|:--|:---------|:-----|:-----------|
| 6-EC-01 | Same question asked but model version changes between runs | Non-comparable results | Record exact model version and timestamp in `results-m1.md` |
| 6-EC-02 | Tester forgets to record the raw response before moving on | Can't classify failure accurately | Copy raw JSON into a `results-raw/` folder alongside `results-m1.md` |
| 6-EC-03 | A question triggers no failure but subtly wrong information | Classified as "pass" incorrectly | Double-check all numerical claims (RDA values, temperatures) against known references |
| 6-EC-04 | Failure log is edited post-hoc to remove embarrassing failures | Corrupts Milestone 2 baseline | Treat log as append-only; use git history to prove integrity |
| 6-EC-05 | Questions 8–10 classified inconsistently (subjective "hedged into uselessness") | Metrics unreliable | Define a strict rubric: if the response contains no actionable information, it fails |

---

## Phase 7 — Deploy

### Database Migration

| # | Scenario | Risk | Mitigation |
|:--|:---------|:-----|:-----------|
| 7-EC-01 | `prisma migrate deploy` runs during a cold start with high latency | First request times out | Run migration as a separate pre-build step, not inside the Next.js cold start |
| 7-EC-02 | Supabase connection string contains special characters in password | URL parsing breaks `DATABASE_URL` | URL-encode the password; use Prisma's `?schema=public` parameter if needed |
| 7-EC-03 | `rawResponse` field type changed from `String?` to `Json?` but old SQLite migration still referenced | Build fails on Postgres | Ensure `prisma migrate deploy` runs the correct migration history from scratch |
| 7-EC-04 | Supabase free tier connection pool is exhausted | `P1001` connection errors | Add `?connection_limit=1` to DATABASE_URL for serverless environments |
| 7-EC-05 | Migration runs twice concurrently on two Vercel instances | Duplicate migration or table-already-exists error | Prisma locks migrations — generally safe; verify with Supabase logs |

### Vercel Deployment

| # | Scenario | Risk | Mitigation |
|:--|:---------|:-----|:-----------|
| 7-EC-06 | Vercel function timeout (default 10s) exceeded by slow model call | User sees a gateway error | Set `maxDuration = 30` in route config: `export const maxDuration = 30;` |
| 7-EC-07 | `OPENAI_API_KEY` env var not set in Vercel dashboard | All production requests fail | Verify in Vercel settings before first deploy; add a startup health-check |
| 7-EC-08 | Vercel deployment builds with cached `node_modules` missing new packages | Runtime `MODULE_NOT_FOUND` errors | Clear build cache in Vercel settings if packages were recently added |
| 7-EC-09 | `next build` passes locally but fails in Vercel (e.g., Prisma binary missing) | Production build broken | Add `prisma generate` before `next build` in the `build` script (already in plan — ✅) |
| 7-EC-10 | Production app served from Vercel but API calls use `http://localhost:3000` hardcoded | All API calls fail in prod | Use relative paths (`/api/chat`) — never hardcode the base URL |

### Public URL & Rate Limiting

| # | Scenario | Risk | Mitigation |
|:--|:---------|:-----|:-----------|
| 7-EC-11 | CORS blocks requests if frontend and API are on different origins | API calls fail in browser | Same-origin deployment on Vercel means no CORS issue — ✅ for default setup |
| 7-EC-12 | Public URL is shared and abused (no auth, no rate limiting) | API key burned; large OpenAI bill | Add rate limiting (e.g., `@upstash/ratelimit`) before sharing the URL publicly |

---

## Cross-Cutting / Global Edge Cases

### Security

| # | Scenario | Risk | Mitigation |
|:--|:---------|:-----|:-----------|
| X-EC-01 | `callModel()` is imported into a client component (accidental) | API key exposed in browser bundle | Enforce "model calls must run behind the backend"; use `server-only` package |
| X-EC-02 | User sends malicious JSON as `userMessage` | No SQL injection via Prisma (parameterized queries) — ✅ | Confirm no raw SQL queries are used anywhere |
| X-EC-03 | Prompt injection: user embeds `SYSTEM:` or role-switching text | Model may partially obey | Scope guard is the first line of defense; sanitize input by stripping role-like prefixes |

### Concurrency & Consistency

| # | Scenario | Risk | Mitigation |
|:--|:---------|:-----|:-----------|
| X-EC-04 | Two browser tabs share the same `conversationId` | Interleaved messages confuse the model | No session isolation in M1; document this as a known limitation |
| X-EC-05 | Model response is valid JSON but truncated mid-parse (streaming not used) | Parse fails; 500 returned | Non-streaming responses are atomic — safe; if streaming is added later, revisit |

### Schema Contract

| # | Scenario | Risk | Mitigation |
|:--|:---------|:-----|:-----------|
| X-EC-06 | `ClaimSchema` is changed without updating system prompt | Model still returns old format; schema rejects it | Schema changes must be accompanied by a system prompt update and regression test run |
| X-EC-07 | Zod `safeParse` is used instead of `parse` in a future refactor | Failures silently swallowed instead of surfaced | Enforce `parse` (throwing) at the API boundary; only use `safeParse` for non-critical paths |

### Accessibility & UX

| # | Scenario | Risk | Mitigation |
|:--|:---------|:-----|:-----------|
| X-EC-08 | Chat page is not keyboard-navigable | Fails WCAG 2.1 AA | Ensure focus management: `Tab` reaches InputBox, `Enter` submits, `Escape` clears selection |
| X-EC-09 | Decline response looks the same as a normal answer | User thinks app is broken | Style decline responses distinctly (amber banner, warning icon) |
| X-EC-10 | Long `answer_text` with no line breaks renders as a wall of text | Hard to read | Preserve `\n` line breaks in rendering; consider markdown support |

### Milestone 2 Readiness

| # | Scenario | Risk | Mitigation |
|:--|:---------|:-----|:-----------|
| X-EC-11 | `SourcesPanel` is removed or simplified in M1 "to clean things up" | Structural refactor required in M2 | Treat `SourcesPanel` as a contract component — leave the stub in place |
| X-EC-12 | `source: z.null()` is accidentally changed to `z.string().url()` before M2 | M1 responses fail schema validation | Schema changes must only happen at deliberate milestone boundaries |
| X-EC-13 | Failure log is not committed before M2 begins | No baseline to measure improvement against | Treat `failure-log/results-m1.md` as a release artifact — block M2 start until it is merged |

---

## Quick Reference: Severity Summary

| Severity | Count | Key Edge Cases |
|:---------|:------|:---------------|
| 🔴 **Critical** (data loss / security / broken prod) | ~12 | 0-EC-01, 2-EC-09, 2-EC-15, 3-EC-09, 4-EC-15, 7-EC-04, 7-EC-06, 7-EC-07, 7-EC-10, 7-EC-12, X-EC-01, X-EC-06 |
| 🟡 **High** (wrong behavior / UX breakage) | ~20 | 1-EC-01–06, 2-EC-04, 3-EC-01–04, 3-EC-06, 4-EC-02, 4-EC-10, 5-EC-01–05 |
| 🟢 **Medium** (degraded UX / tech debt) | ~20 | 4-EC-06–09, 5-EC-07–08, 6-EC-01–05, 7-EC-01–03, X-EC-08–10 |
| ⚪ **Low** (known limitations / future work) | ~10 | 2-EC-07, 4-EC-16, X-EC-04, X-EC-11–13 |

---

*Keep this file in sync with the implementation. When a new edge case is discovered during development, add it here before fixing it. Do not silently patch — document first.*
