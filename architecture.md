# Architecture — AI Nutrition Assistant Prototype

> **Milestone 1 scope.** This document covers the full architecture for Milestone 1.
> Milestone 2 adds a retrieval layer (RAG) without changing the interface, endpoints, or response schema defined here.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Tech Stack](#2-tech-stack)
3. [Repository Structure](#3-repository-structure)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [Response Schema](#6-response-schema)
7. [System Prompt Design](#7-system-prompt-design)
8. [Scope Enforcement (Code Layer)](#8-scope-enforcement-code-layer)
9. [Database / Storage](#9-database--storage)
10. [Data Flow](#10-data-flow)
11. [API Contract](#11-api-contract)
12. [Deployment Architecture](#12-deployment-architecture)
13. [Failure Log Structure](#13-failure-log-structure)
14. [Milestone 2 Readiness Checklist](#14-milestone-2-readiness-checklist)

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          Browser (User)                         │
│                                                                 │
│  ┌──────────────────┐   ┌────────────────┐   ┌──────────────┐  │
│  │   Message List   │   │  Input Box     │   │ Sources Panel│  │
│  │  (conversation)  │   │  + Send button │   │ (empty M1)   │  │
│  └──────────────────┘   └────────────────┘   └──────────────┘  │
│                              │                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │ HTTP POST /api/chat
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js Backend (API Routes)             │
│                                                                 │
│  ┌────────────────┐   ┌──────────────────┐   ┌──────────────┐  │
│  │ Scope Guard    │ → │  Model Caller    │ → │Schema Parser │  │
│  │ (code check)   │   │ (OpenAI/Anthropic│   │(Zod/Pydantic)│  │
│  └────────────────┘   └──────────────────┘   └──────────────┘  │
│           │                   │                      │          │
│           ▼                   ▼                      ▼          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Database (Supabase / SQLite)            │ │
│  │              conversations  │  messages  │  claims         │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   OpenAI / Anthropic  │
                    │   (structured output) │
                    └──────────────────────┘
```

**Key constraints from the problem statement:**
- Model calls happen on the server — never exposed to the browser.
- Every response is validated against a fixed schema; a parse failure is a hard error.
- Source fields are `null` in Milestone 1 by design — the slot exists for Milestone 2.
- Scope limits are enforced in code, not solely in the system prompt.

---

## 2. Tech Stack

| Layer | Choice | Reason |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14 (App Router) | Single repo for frontend + API routes; easy Vercel deploy |
| **Backend** | Next.js API Routes | Keeps model calls server-side without a separate service in M1 |
| **Model** | OpenAI `gpt-4o` or Anthropic `claude-3-5-sonnet` | Both have native structured output modes |
| **Schema validation** | Zod (TypeScript) | Compile-time types + runtime parsing in one library |
| **Database** | Supabase (Postgres) or SQLite (local dev) | Supabase for production; SQLite for zero-config local dev |
| **ORM** | Prisma | Works with both Postgres and SQLite; type-safe queries |
| **Styling** | Tailwind CSS | Rapid UI; good defaults for chat interfaces |
| **Deployment — Frontend** | Vercel | Native Next.js support; zero-config |
| **Deployment — DB** | Supabase (managed) or Railway (Postgres) | Both connect easily to Vercel via env vars |

> **Alternative:** If the team prefers a split architecture, the backend can be FastAPI (Python) deployed on Railway with the Next.js frontend on Vercel calling it via `NEXT_PUBLIC_API_URL`.

---

## 3. Repository Structure

```
ai-nutrition/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (fonts, global styles)
│   ├── page.tsx                  # Entry — redirects to /chat
│   └── chat/
│       ├── page.tsx              # Main chat page
│       └── [conversationId]/
│           └── page.tsx          # Specific conversation view
│
├── components/
│   ├── ChatWindow.tsx            # Wraps MessageList + InputBox
│   ├── MessageList.tsx           # Renders user and assistant turns
│   ├── MessageBubble.tsx         # Single message with claim highlights
│   ├── InputBox.tsx              # Textarea + send button
│   ├── SourcesPanel.tsx          # Right-hand panel (empty in M1)
│   └── ClaimBadge.tsx            # Individual claim chip (null source M1)
│
├── app/api/
│   ├── chat/
│   │   └── route.ts              # POST /api/chat — main endpoint
│   └── conversations/
│       └── route.ts              # GET /api/conversations — list history
│
├── lib/
│   ├── model.ts                  # Model call abstraction (OpenAI / Anthropic)
│   ├── schema.ts                 # Zod schema — single source of truth
│   ├── scopeGuard.ts             # Code-level scope enforcement
│   ├── systemPrompt.ts           # System prompt string + builder
│   └── db.ts                     # Prisma client singleton
│
├── prisma/
│   ├── schema.prisma             # DB schema
│   └── migrations/               # Auto-generated migrations
│
├── failure-log/
│   ├── questions.md              # The fixed 10 questions
│   └── results-m1.md             # Recorded failures for M1
│
├── .env.local                    # OPENAI_API_KEY / ANTHROPIC_API_KEY, DATABASE_URL
├── .env.example                  # Template — committed to repo
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── problemStatement.md
└── architecture.md               # This file
```

---

## 4. Frontend Architecture

### 4.1 Page Layout

```
┌──────────────────────────────────────────────────────┐
│  Header: "AI Nutrition Assistant"           [New Chat]│
├────────────────────────────────┬─────────────────────┤
│                                │                     │
│        MessageList             │    SourcesPanel     │
│  ┌──────────────────────────┐  │  ┌───────────────┐  │
│  │ User: How much iron...   │  │  │ Sources       │  │
│  └──────────────────────────┘  │  │               │  │
│  ┌──────────────────────────┐  │  │ (empty in M1) │  │
│  │ Assistant: Iron is a...  │  │  │               │  │
│  │ Claims: [claim 1] [c2]   │  │  └───────────────┘  │
│  └──────────────────────────┘  │                     │
│                                │                     │
├────────────────────────────────┴─────────────────────┤
│  [ Ask about food, nutrition, or food safety...  ][→] │
└──────────────────────────────────────────────────────┘
```

### 4.2 Component Responsibilities

| Component | Responsibility |
| :--- | :--- |
| `ChatWindow` | Holds conversation state; coordinates MessageList, InputBox, SourcesPanel |
| `MessageList` | Renders ordered list of turns; auto-scrolls to latest |
| `MessageBubble` | Renders one message; extracts and renders `ClaimBadge` per claim |
| `ClaimBadge` | Shows claim text; source is `null` in M1, shows "Source: —" |
| `InputBox` | Controlled textarea; fires `onSend(text)` on Enter / button click |
| `SourcesPanel` | Receives selected claim; renders its source (empty shell in M1) |

### 4.3 State Shape (Client)

```typescript
interface ConversationState {
  conversationId: string;
  messages: MessageTurn[];
  isLoading: boolean;
  selectedClaim: Claim | null;   // drives SourcesPanel
}

interface MessageTurn {
  role: 'user' | 'assistant';
  content: string;               // raw user text OR answer_text from schema
  claims?: Claim[];              // only on assistant turns
  createdAt: string;
}

interface Claim {
  claim_text: string;
  source: null;                  // always null in M1
}
```

---

## 5. Backend Architecture

### 5.1 Request Lifecycle

```
POST /api/chat
│
├─ 1. Parse & validate request body (conversationId, userMessage)
│
├─ 2. Scope Guard check (scopeGuard.ts)
│     └─ Blocked? → Return structured decline response immediately
│
├─ 3. Load conversation history from DB
│     └─ Format as model message array (system + prior turns)
│
├─ 4. Call model (model.ts)
│     └─ structured_output mode → returns raw JSON
│
├─ 5. Parse response against Zod schema (schema.ts)
│     └─ Parse error? → throw 500; do NOT return malformed data
│
├─ 6. Persist: save user message + assistant response to DB
│
└─ 7. Return validated NutritionResponse to client
```

### 5.2 Model Abstraction (`lib/model.ts`)

The model caller is wrapped behind a single interface so Milestone 2 can swap providers or add pre/post processing without touching the API route.

```typescript
interface ModelOptions {
  systemPrompt: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  responseSchema: ZodSchema;      // passed as JSON Schema to the model
}

async function callModel(options: ModelOptions): Promise<NutritionResponse>
```

Internally this calls either:
- `openai.beta.chat.completions.parse()` with `response_format: { type: 'json_schema', ... }`
- `anthropic.messages.create()` with tool-use structured output

---

## 6. Response Schema

This is the **single source of truth** defined in `lib/schema.ts`. Both the model call and the API response are validated against it.

```typescript
import { z } from 'zod';

export const ClaimSchema = z.object({
  claim_text: z.string().describe('A specific factual claim made in the answer'),
  source:     z.null().describe('Citation — always null in Milestone 1'),
});

export const NutritionResponseSchema = z.object({
  answer_text: z.string().describe('The full assistant answer in plain language'),
  claims:      z.array(ClaimSchema).describe('Every distinct factual claim extracted from the answer'),
});

export type Claim             = z.infer<typeof ClaimSchema>;
export type NutritionResponse = z.infer<typeof NutritionResponseSchema>;
```

**Parse rule:** Call `NutritionResponseSchema.parse(rawModelOutput)`. If it throws, return HTTP 500 — do not silently swallow or patch the output.

**JSON wire format example:**

```json
{
  "answer_text": "Adults generally need 8–18 mg of iron per day depending on age and sex.",
  "claims": [
    {
      "claim_text": "Adults need 8–18 mg of iron per day depending on age and sex.",
      "source": null
    }
  ]
}
```

---

## 7. System Prompt Design

File: `lib/systemPrompt.ts`

```
You are a nutrition information assistant. Your role is to answer questions
about food, nutrition, and food safety based on general nutritional knowledge.

HOW YOU ANSWER
- Be clear and direct.
- Keep responses to 2–4 sentences for simple questions; up to 8 sentences for
  complex ones. Never write essays.
- After your answer, list every distinct factual claim you made.
- If you are uncertain, say so explicitly. Do not present uncertain information
  as established fact.

WHAT YOU WILL NOT DO
- You will not give calorie targets, weight-loss advice, or BMI recommendations.
- You will not give specific dietary plans for medical conditions.
- You will not provide medical advice or diagnose any condition.
- For any question in these areas, politely decline and direct the person to a
  registered dietitian or their doctor.

OUTPUT FORMAT
You must always return valid JSON matching this schema. Never return prose.
{
  "answer_text": "...",
  "claims": [
    { "claim_text": "...", "source": null }
  ]
}
```

**Prompt regression testing:** The `failure-log/questions.md` file holds the fixed 10 questions. Run them after every prompt change and compare outputs.

---

## 8. Scope Enforcement (Code Layer)

File: `lib/scopeGuard.ts`

The prompt alone is not sufficient. The scope guard runs **before** the model call and returns a pre-built decline response if the user's message matches a blocked topic.

```typescript
const BLOCKED_PATTERNS: RegExp[] = [
  /\b(calorie[s]?|caloric)\b.*\b(target|goal|limit|deficit|surplus)\b/i,
  /\bhow (many|much) calories? (should|do) I (eat|consume|have)\b/i,
  /\blose weight\b|\bweight loss\b|\bweight[-\s]?loss\b/i,
  /\bBMI\b|\bbody mass index\b/i,
  /\bwhat should I weigh\b|\bmy ideal weight\b/i,
  /\b(diagnose|diagnosis|treat|treatment|medication|prescription)\b/i,
  /\bdo I have\b.*\b(disease|condition|disorder|deficiency)\b/i,
];

export function isOutOfScope(userMessage: string): boolean {
  return BLOCKED_PATTERNS.some(pattern => pattern.test(userMessage));
}

export function buildDeclineResponse(): NutritionResponse {
  return {
    answer_text:
      "That question falls outside what I can help with. For calorie targets, " +
      "weight advice, or any medical concerns, please speak with a registered " +
      "dietitian or your doctor.",
    claims: [],
  };
}
```

**In the API route:**
```typescript
if (isOutOfScope(userMessage)) {
  return Response.json(buildDeclineResponse());
}
// ... proceed to model call
```

---

## 9. Database / Storage

### 9.1 Prisma Schema (`prisma/schema.prisma`)

```prisma
model Conversation {
  id        String    @id @default(cuid())
  createdAt DateTime  @default(now())
  messages  Message[]
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  role           String       // 'user' | 'assistant'
  content        String       // raw user text OR answer_text
  rawResponse    Json?        // full NutritionResponse (claims included)
  createdAt      DateTime     @default(now())
}
```

> `rawResponse` stores the full structured response so Milestone 2 can backfill sources on historical messages without re-running the model.

### 9.2 Local Dev vs Production

| Environment | DATABASE_URL |
| :--- | :--- |
| Local | `file:./dev.db` (SQLite) |
| Production | Supabase connection string (Postgres) |

Prisma handles both with `provider = "sqlite"` or `provider = "postgresql"`.

---

## 10. Data Flow

### Happy path (in-scope question)

```
User types message
       │
       ▼
InputBox.onSend()
       │
       ▼
POST /api/chat  { conversationId, userMessage }
       │
       ├─► scopeGuard.isOutOfScope()  → false → continue
       │
       ├─► db: load prior messages for conversationId
       │
       ├─► callModel({ systemPrompt, messages, responseSchema })
       │       └─► OpenAI / Anthropic API  (structured output)
       │
       ├─► NutritionResponseSchema.parse(rawOutput)
       │       └─► Error → HTTP 500
       │
       ├─► db: INSERT user message + assistant message (with rawResponse)
       │
       └─► Response.json(NutritionResponse)  HTTP 200
                │
                ▼
       Client updates MessageList + ClaimBadges
       SourcesPanel receives null sources (renders "—")
```

### Out-of-scope question

```
POST /api/chat  { conversationId, userMessage }
       │
       ├─► scopeGuard.isOutOfScope()  → true
       │
       └─► Response.json(buildDeclineResponse())  HTTP 200
                └─► claims: [], answer_text: "That question falls outside..."
```

---

## 11. API Contract

### `POST /api/chat`

**Request**
```json
{
  "conversationId": "clxyz123",
  "userMessage": "How much iron does an adult need daily?"
}
```

**Response 200**
```json
{
  "answer_text": "Adults generally need 8–18 mg of iron per day...",
  "claims": [
    { "claim_text": "Adults need 8–18 mg of iron per day.", "source": null }
  ]
}
```

**Response 500** — schema parse failure
```json
{ "error": "Model returned output that did not match the expected schema." }
```

---

### `GET /api/conversations`

Returns a list of conversation stubs for the sidebar (future use).

**Response 200**
```json
[
  { "id": "clxyz123", "createdAt": "2026-09-27T10:00:00Z", "preview": "How much iron..." }
]
```

---

## 12. Deployment Architecture

```
                   ┌──────────────────────┐
                   │         Vercel        │
                   │  (Next.js App + API) │
                   │  NEXT_PUBLIC_... env  │
                   └──────────┬───────────┘
                              │ Postgres connection string
                              ▼
                   ┌──────────────────────┐
                   │       Supabase        │
                   │    (managed Postgres) │
                   └──────────────────────┘
                              │
                    (alternative: Railway)
```

**Environment Variables**

| Variable | Where | Description |
| :--- | :--- | :--- |
| `OPENAI_API_KEY` | Vercel → Settings → Env | OpenAI secret key |
| `ANTHROPIC_API_KEY` | Vercel → Settings → Env | Anthropic secret key |
| `DATABASE_URL` | Vercel → Settings → Env | Supabase / Railway Postgres URL |
| `MODEL_PROVIDER` | Vercel → Settings → Env | `"openai"` or `"anthropic"` |

**Deployment steps:**
1. Push to GitHub (`main` branch).
2. Connect repo to Vercel. Vercel auto-detects Next.js.
3. Add environment variables in Vercel dashboard.
4. Set up Supabase project → copy connection string → add to `DATABASE_URL`.
5. Run `npx prisma migrate deploy` as a build step or via Railway CLI for schema migration.
6. The app is live at `https://<project>.vercel.app`.

---

## 13. Failure Log Structure

Directory: `failure-log/`

### `questions.md` — the fixed 10 questions

```markdown
## Category 1: Nutrient Requirements
1. How much iron does an adult woman need per day?
2. What are the main food sources of Vitamin B12?
3. How much protein does a sedentary vegetarian adult need?

## Category 2: Food Safety & Storage
4. How long can cooked chicken be safely stored in the fridge?
5. Is it safe to refreeze meat that has been thawed?

## Category 3: Cooking Methods
6. Does boiling vegetables destroy all their vitamins?
7. What is the safest internal temperature for cooked pork?

## Category 4: Nobody Has a Clear Answer
8. Is coffee good or bad for your health overall?
9. Are artificial sweeteners harmful in moderate amounts?
10. Is eating red meat a few times a week harmful long-term?
```

### `results-m1.md` — failure recording format

```markdown
# Failure Log — Milestone 1

Run date: YYYY-MM-DD
Model: gpt-4o / claude-3-5-sonnet

| Q# | Failure Type | Description |
|:---|:-------------|:------------|
| 1  | Invented number | Stated "18 mg" on run 1, "19 mg" on run 2 |
| 3  | Hallucinated source | Cited "WHO 2021 guidelines" — cannot locate |
| 8  | Hedged into uselessness | "It depends" with no actionable content |

## Failure Counts
- Claims stated as fact with no backing: X
- Numbers that shifted between runs: X
- Sources cited that cannot be found: X
- Questions that should have been declined: X
- Questions where it hedged into uselessness: X
```

---

## 14. Milestone 2 Readiness Checklist

Everything built in Milestone 1 is a deliberate placeholder for what Milestone 2 fills in. The following must hold at the end of Milestone 1:

- [ ] `SourcesPanel` component exists and renders, but shows no sources
- [ ] `ClaimSchema.source` is typed `z.null()` — not missing from the schema
- [ ] Every assistant message persists its full `rawResponse` JSON to the DB
- [ ] The API route, request shape, and response shape are stable — Milestone 2 must not require frontend changes to display citations
- [ ] `isOutOfScope()` and `buildDeclineResponse()` are in isolated, testable functions
- [ ] `callModel()` is behind an abstraction — Milestone 2 can inject a retrieval step before the model call
- [ ] The 10 fixed questions in `failure-log/questions.md` are committed to the repo
- [ ] `results-m1.md` is filled in and committed

---

*This document should be treated as the single source of architectural truth for Milestone 1. Update it when decisions change; do not let it drift from the implementation.*
