# Implementation Plan — AI Nutrition Assistant

> Built from [`architecture.md`](./architecture.md) and [`problemStatement.md`](./problemStatement.md).
> This plan covers Milestone 1 end-to-end, phased so each phase ships something runnable before the next begins.

---

## Overview

| Phase | Name | Outcome | Est. Time |
| :---: | :--- | :--- | :--- |
| **0** | Project Bootstrap | Repo + skeleton running locally | 1–2 hrs |
| **1** | Database & Schema Layer | DB connected; schema validated | 1–2 hrs |
| **2** | Backend — Model Integration | `/api/chat` returns structured JSON | 2–3 hrs |
| **3** | Scope Guard | Out-of-scope questions blocked in code | 1 hr |
| **4** | Frontend — Chat UI | Working chat interface in browser | 3–4 hrs |
| **5** | System Prompt Hardening | Prompt locked; regression suite passing | 1–2 hrs |
| **6** | Failure Log | 10 questions run; failures recorded | 1–2 hrs |
| **7** | Deploy | Live public URL on Vercel + Railway | 1–2 hrs |

**Total estimate:** ~12–18 hours of focused work.

---

## Phase 0 — Project Bootstrap

**Goal:** A Next.js app that runs locally, connects to version control, and has all dependencies installed.

### Tasks

- [x] **0.1 — Create the repo**
  - Create a new GitHub repository named `ai-nutrition`.
  - Clone it locally.

- [x] **0.2 — Scaffold the Next.js app**
  ```bash
  npx create-next-app@latest . \
    --typescript \
    --tailwind \
    --eslint \
    --app \
    --no-src-dir \
    --import-alias "@/*"
  ```

- [x] **0.3 — Install core dependencies**
  ```bash
  npm install openai @anthropic-ai/sdk zod @prisma/client
  npm install -D prisma
  ```

- [x] **0.4 — Create folder structure**
  ```
  mkdir -p lib components failure-log
  ```
  Create empty placeholder files for every file listed in the repo tree in `architecture.md §3`.

- [x] **0.5 — Set up `.env.local`**
  ```
  GROQ_API_KEY=sk-...
  MODEL_PROVIDER=groq
  DATABASE_URL=file:./dev.db
  ```
  Copy `.env.local` to `.env.example`, redact all values, and commit `.env.example`.
  Add `.env.local` to `.gitignore`.

- [x] **0.6 — Verify dev server runs**
  ```bash
  npm run dev
  ```
  Open `http://localhost:3000`. The default Next.js page should load.

### Exit Criteria
- `npm run dev` starts without errors.
- Repo is on GitHub.
- `.env.example` is committed; `.env.local` is not.

---

## Phase 1 — Database & Schema Layer

**Goal:** The Zod response schema and the Prisma DB schema are in place and both validate correctly.

### Tasks

- [ ] **1.1 — Write the Zod schema** (`lib/schema.ts`)

  ```typescript
  import { z } from 'zod';

  export const ClaimSchema = z.object({
    claim_text: z.string(),
    source:     z.null(),
  });

  export const NutritionResponseSchema = z.object({
    answer_text: z.string(),
    claims:      z.array(ClaimSchema),
  });

  export type Claim             = z.infer<typeof ClaimSchema>;
  export type NutritionResponse = z.infer<typeof NutritionResponseSchema>;
  ```

  > This is the **contract**. Every future change to claims or sources happens here first.

- [ ] **1.2 — Initialise Prisma**
  ```bash
  npx prisma init --datasource-provider sqlite
  ```

- [ ] **1.3 — Write the Prisma schema** (`prisma/schema.prisma`)

  ```prisma
  generator client {
    provider = "prisma-client-js"
  }

  datasource db {
    provider = "sqlite"
    url      = env("DATABASE_URL")
  }

  model Conversation {
    id        String    @id @default(cuid())
    createdAt DateTime  @default(now())
    messages  Message[]
  }

  model Message {
    id             String       @id @default(cuid())
    conversationId String
    conversation   Conversation @relation(fields: [conversationId], references: [id])
    role           String
    content        String
    rawResponse    String?      // JSON string — Json type not supported in SQLite
    createdAt      DateTime     @default(now())
  }
  ```

  > Note: Switch `provider` to `"postgresql"` and remove the `String?` workaround when deploying to Supabase/Railway (Postgres supports the native `Json` type).

- [ ] **1.4 — Run the first migration**
  ```bash
  npx prisma migrate dev --name init
  npx prisma generate
  ```

- [ ] **1.5 — Create the Prisma client singleton** (`lib/db.ts`)

  ```typescript
  import { PrismaClient } from '@prisma/client';

  const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

  export const prisma =
    globalForPrisma.prisma ?? new PrismaClient({ log: ['query'] });

  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
  ```

- [ ] **1.6 — Smoke-test the schema**
  Write a throwaway script `failure-log/smoke-schema.ts`:
  ```typescript
  import { NutritionResponseSchema } from '../lib/schema';

  const valid = { answer_text: "Test", claims: [{ claim_text: "Iron is essential", source: null }] };
  const invalid = { answer_text: "Test", claims: [{ claim_text: "x", source: "some-url" }] };

  console.log(NutritionResponseSchema.parse(valid));   // should print object
  console.log(NutritionResponseSchema.parse(invalid)); // should throw
  ```
  Run with `npx ts-node failure-log/smoke-schema.ts`.

### Exit Criteria
- `prisma/schema.prisma` migrated, `dev.db` created.
- `NutritionResponseSchema.parse()` passes valid data and throws on invalid source field.
- No TypeScript errors on `lib/schema.ts` or `lib/db.ts`.

---

## Phase 2 — Backend: Model Integration

**Goal:** `POST /api/chat` calls the model, gets structured output, validates it, persists it, and returns it.

### Tasks

- [ ] **2.1 — Write the system prompt** (`lib/systemPrompt.ts`)

  ```typescript
  export const SYSTEM_PROMPT = `
  You are a nutrition information assistant. Your role is to answer questions
  about food, nutrition, and food safety based on general nutritional knowledge.

  HOW YOU ANSWER
  - Be clear and direct.
  - Keep responses to 2–4 sentences for simple questions; up to 8 sentences for complex ones.
  - After your answer, list every distinct factual claim you made.
  - If you are uncertain, say so explicitly.

  WHAT YOU WILL NOT DO
  - You will not give calorie targets, weight-loss advice, or BMI recommendations.
  - You will not give specific dietary plans for medical conditions.
  - You will not provide medical advice or diagnose any condition.
  - For any question in these areas, politely decline and direct the person to a
    registered dietitian or their doctor.

  OUTPUT FORMAT
  You must ALWAYS return valid JSON matching this exact schema. Never return prose.
  {
    "answer_text": "string",
    "claims": [
      { "claim_text": "string", "source": null }
    ]
  }
  `.trim();
  ```

- [ ] **2.2 — Write the model caller** (`lib/model.ts`)

  ```typescript
  import OpenAI from 'openai';
  import { zodResponseFormat } from 'openai/helpers/zod';
  import { NutritionResponseSchema, NutritionResponse } from './schema';
  import { SYSTEM_PROMPT } from './systemPrompt';

  const openai = new OpenAI({ 
    apiKey: process.env.GROQ_API_KEY, 
    baseURL: 'https://api.groq.com/openai/v1' 
  });

  interface ModelMessage {
    role: 'user' | 'assistant';
    content: string;
  }

  export async function callModel(messages: ModelMessage[]): Promise<NutritionResponse> {
    const completion = await openai.beta.chat.completions.parse({
      model: 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      response_format: zodResponseFormat(NutritionResponseSchema, 'nutrition_response'),
    });

    const parsed = completion.choices[0].message.parsed;
    if (!parsed) throw new Error('Model returned no parsed output');

    // Hard validation — fail if schema contract is broken
    return NutritionResponseSchema.parse(parsed);
  }
  ```

  > For Anthropic: use tool-use structured output with the same schema. Abstract the provider behind `MODEL_PROVIDER` env var.

- [ ] **2.3 — Write the chat API route** (`app/api/chat/route.ts`)

  ```typescript
  import { NextRequest, NextResponse } from 'next/server';
  import { callModel } from '@/lib/model';
  import { prisma } from '@/lib/db';
  import { isOutOfScope, buildDeclineResponse } from '@/lib/scopeGuard';

  export async function POST(req: NextRequest) {
    const { conversationId, userMessage } = await req.json();

    if (!userMessage?.trim()) {
      return NextResponse.json({ error: 'userMessage is required' }, { status: 400 });
    }

    // Scope check — before any model call
    if (isOutOfScope(userMessage)) {
      return NextResponse.json(buildDeclineResponse());
    }

    // Get or create conversation
    const conversation = await prisma.conversation.upsert({
      where:  { id: conversationId ?? '' },
      update: {},
      create: { id: conversationId ?? undefined },
    });

    // Load message history
    const history = await prisma.message.findMany({
      where:   { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
    });

    const messages = history.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
    messages.push({ role: 'user', content: userMessage });

    // Call model
    let response;
    try {
      response = await callModel(messages);
    } catch (err) {
      console.error('Model call failed:', err);
      return NextResponse.json(
        { error: 'Model returned output that did not match the expected schema.' },
        { status: 500 }
      );
    }

    // Persist
    await prisma.message.create({
      data: { conversationId: conversation.id, role: 'user', content: userMessage },
    });
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: response.answer_text,
        rawResponse: JSON.stringify(response),
      },
    });

    return NextResponse.json({ ...response, conversationId: conversation.id });
  }
  ```

- [ ] **2.4 — Manual API test**
  With `npm run dev` running:
  ```bash
  curl -X POST http://localhost:3000/api/chat \
    -H "Content-Type: application/json" \
    -d '{"userMessage": "What foods are high in Vitamin C?"}'
  ```
  Expected: a JSON body with `answer_text` and `claims` array with `null` sources.

### Exit Criteria
- `POST /api/chat` returns a valid `NutritionResponse` JSON.
- Response contains at least one claim with `source: null`.
- Message is persisted to `dev.db` (verify with `npx prisma studio`).
- A bad model output returns HTTP 500.

---

## Phase 3 — Scope Guard

**Goal:** Out-of-scope questions are blocked in code before the model is ever called.

### Tasks

- [ ] **3.1 — Implement `scopeGuard.ts`** (`lib/scopeGuard.ts`)

  ```typescript
  import { NutritionResponse } from './schema';

  const BLOCKED_PATTERNS: RegExp[] = [
    /\b(calorie[s]?|caloric)\b.*\b(target|goal|limit|deficit|surplus)\b/i,
    /\bhow (many|much) calories? (should|do) I (eat|consume|have)\b/i,
    /\blose weight\b|\bweight loss\b|\bweight[-\s]?loss\b/i,
    /\bBMI\b|\bbody mass index\b/i,
    /\bwhat should I weigh\b|\bmy ideal weight\b/i,
    /\b(diagnose|diagnosis|treat|treatment|medication|prescription)\b/i,
    /\bdo I have\b.*\b(disease|condition|disorder|deficiency)\b/i,
  ];

  export function isOutOfScope(message: string): boolean {
    return BLOCKED_PATTERNS.some(p => p.test(message));
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

- [ ] **3.2 — Test scope guard manually**
  ```bash
  # Should return decline response
  curl -X POST http://localhost:3000/api/chat \
    -H "Content-Type: application/json" \
    -d '{"userMessage": "How many calories should I eat to lose weight?"}'

  # Should return normal answer
  curl -X POST http://localhost:3000/api/chat \
    -H "Content-Type: application/json" \
    -d '{"userMessage": "Is spinach a good source of iron?"}'
  ```

- [ ] **3.3 — Verify model is NOT called on blocked questions**
  Add a `console.log('model called')` at the top of `callModel()`. It must not appear in the terminal for out-of-scope questions.

### Exit Criteria
- All 3 blocked categories (calorie targets, weight advice, medical) return a decline response.
- Model is not called for blocked questions.
- Normal nutrition questions still return full answers.

---

## Phase 4 — Frontend: Chat UI

**Goal:** A functional chat interface in the browser — message list, input box, sources panel (empty), and claim badges.

### Tasks

- [ ] **4.1 — Design tokens & global styles** (`app/globals.css`)
  Set up CSS variables for:
  - Color palette (dark background, accent green for nutrition theme)
  - Typography (import `Inter` from Google Fonts in `app/layout.tsx`)
  - Spacing scale

- [ ] **4.2 — Build `InputBox` component** (`components/InputBox.tsx`)
  - Controlled `<textarea>` that auto-resizes.
  - Send on `Enter` (without Shift); newline on `Shift+Enter`.
  - Disables during loading state.
  - Emits `onSend(text: string)`.

- [ ] **4.3 — Build `ClaimBadge` component** (`components/ClaimBadge.tsx`)
  - Small chip showing `claim_text`.
  - Source indicator: shows "Source: —" when `source === null`.
  - Clickable — emits `onSelect(claim)` to drive SourcesPanel.

- [ ] **4.4 — Build `MessageBubble` component** (`components/MessageBubble.tsx`)
  - Renders user and assistant messages with different alignment/style.
  - For assistant messages, renders a row of `ClaimBadge` components below the text.

- [ ] **4.5 — Build `MessageList` component** (`components/MessageList.tsx`)
  - Renders an ordered list of `MessageBubble` components.
  - Auto-scrolls to bottom on new message using `useEffect` + `ref`.
  - Shows a loading skeleton when `isLoading === true`.

- [ ] **4.6 — Build `SourcesPanel` component** (`components/SourcesPanel.tsx`)
  - Fixed right-hand panel.
  - Accepts `selectedClaim: Claim | null`.
  - When `null` or no claim selected: shows "Select a claim to see its source."
  - When a claim is selected: shows claim text + "Source: Not yet available (Milestone 1)."
  - This panel is the M2 fill-in target — do not remove it.

- [ ] **4.7 — Build `ChatWindow` component** (`components/ChatWindow.tsx`)
  - Owns all conversation state (`useState`).
  - Calls `POST /api/chat` via `fetch` on send.
  - Threads `conversationId` from first response into all subsequent requests.
  - Passes state down to `MessageList`, `InputBox`, `SourcesPanel`.

- [ ] **4.8 — Assemble the chat page** (`app/chat/page.tsx`)
  ```
  ┌─────────────────────────────────────────────────────┐
  │  Header: "AI Nutrition Assistant"         [New Chat] │
  ├───────────────────────────────────┬─────────────────┤
  │  MessageList (flex-1, scrollable) │  SourcesPanel   │
  ├───────────────────────────────────┴─────────────────┤
  │  InputBox (full width)                              │
  └─────────────────────────────────────────────────────┘
  ```

- [ ] **4.9 — Handle error states**
  - If API returns 500: show an error message bubble ("Something went wrong. Please try again.").
  - If API is slow: show a typing indicator in the MessageList.

- [ ] **4.10 — Conversations API route** (`app/api/conversations/route.ts`)
  ```typescript
  export async function GET() {
    const conversations = await prisma.conversation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { messages: { take: 1, orderBy: { createdAt: 'asc' } } },
    });
    return NextResponse.json(conversations.map(c => ({
      id: c.id,
      createdAt: c.createdAt,
      preview: c.messages[0]?.content?.slice(0, 60) ?? '',
    })));
  }
  ```

### Exit Criteria
- Chat page loads at `http://localhost:3000/chat`.
- User can type a message and receive a formatted response.
- Claims appear as badges below each assistant message.
- SourcesPanel renders on the right and responds to claim selection.
- Out-of-scope questions show the decline message (no crash).
- Loading state is visible while awaiting the model.

---

## Phase 5 — System Prompt Hardening

**Goal:** The system prompt produces consistent, well-formed responses and passes a regression suite.

### Tasks

- [x] **5.1 — Create the fixed question set** (`failure-log/questions.md`)

  ```markdown
  ## Category 1: Nutrient Requirements
  1. How much iron does an adult woman need per day?
  2. What are the main food sources of Vitamin B12?
  3. How much protein does a sedentary vegetarian adult need daily?

  ## Category 2: Food Safety & Storage
  4. How long can cooked chicken be safely stored in the fridge?
  5. Is it safe to refreeze meat that has been thawed in the fridge?

  ## Category 3: Cooking Methods
  6. Does boiling vegetables destroy all their vitamins?
  7. What is the safest internal temperature for cooked pork?

  ## Category 4: Nobody Has a Clear Answer
  8. Is coffee good or bad for your health overall?
  9. Are artificial sweeteners harmful in moderate amounts?
  10. Is eating red meat a few times a week harmful long-term?
  ```

- [x] **5.2 — Run all 10 questions through the app**
  Test each manually in the chat UI. Record the raw model response for each.

- [x] **5.3 — Evaluate prompt against criteria**
  For each response, check:
  - Is the answer length appropriate (not an essay)?
  - Are claims correctly extracted and listed?
  - Does the model flag uncertainty when it should?
  - Did any question trigger incorrect refusal?
  - Did any question NOT trigger refusal when it should have?

- [x] **5.4 — Iterate on the system prompt**
  Adjust phrasing in `lib/systemPrompt.ts` until all 10 questions behave correctly.
  Re-run all 10 after every change — not just the one you were fixing.

- [x] **5.5 — Lock the prompt**
  Commit the final prompt to the repo. Record prompt version in a comment.

### Exit Criteria
- All 10 questions produce structurally valid responses.
- No valid question is incorrectly declined.
- Answer lengths are appropriate (not one-word or essay-length).

---

## Phase 6 — Failure Log

**Goal:** Document exactly what the model gets wrong in Milestone 1, so Milestone 2 can measure improvement.

### Tasks

- [x] **6.1 — Run all 10 questions twice each**
  Different sessions, a few minutes apart. Record both responses.

- [x] **6.2 — Classify each failure**

  | Failure Type | How to Identify |
  | :--- | :--- |
  | Invented fact | A specific number or claim you cannot verify in any published source |
  | Drifting number | The same question returns different numbers on different runs |
  | Hallucinated source | A citation or authority name that does not appear to exist |
  | Should-have-declined | An out-of-scope question that slipped through the scope guard |
  | Hedged into uselessness | "It depends" with no useful follow-up content |

- [x] **6.3 — Fill in `failure-log/results-m1.md`**

  ```markdown
  # Failure Log — Milestone 1

  Run date: YYYY-MM-DD
  Model: gpt-4o (or claude-3-5-sonnet)

  | Q# | Question | Failure Type | Description |
  |:---|:---------|:-------------|:------------|
  | ...| ...      | ...          | ...         |

  ## Failure Counts
  - Claims stated as fact with no backing: X
  - Numbers that shifted between runs: X
  - Sources cited that cannot be found: X
  - Questions that should have been declined: X
  - Questions where it hedged into uselessness: X
  ```

- [x] **6.4 — Commit the log**
  Do not patch or hardcode fixes. The log is evidence for Milestone 2.

### Exit Criteria
- `failure-log/results-m1.md` committed to the repo.
- Every failure is classified, not just noted.
- Failure counts are summarised.

---

## Phase 7 — Deploy

**Goal:** The app is live at a public URL with a production database.

### Tasks

- [x] **7.1 — Set up Supabase (production DB)**
  1. Create a new project at [supabase.com](https://supabase.com).
  2. Copy the **Connection String** (URI format) from Settings → Database.
  3. Store it — you'll add it to Vercel.

- [x] **7.2 — Prepare for Postgres**
  In `prisma/schema.prisma`, update:
  ```prisma
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }
  ```
  Update `rawResponse` field type from `String?` to `Json?`.
  Commit the change.

- [x] **7.3 — Add `prisma migrate deploy` to build**
  In `package.json`:
  ```json
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build"
  }
  ```

- [x] **7.4 — Deploy to Vercel**
  1. Push all changes to `main` on GitHub.
  2. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub.
  3. Select `ai-nutrition` repo.
  4. Add environment variables:
     - `OPENAI_API_KEY`
     - `ANTHROPIC_API_KEY` (if used)
     - `MODEL_PROVIDER`
     - `DATABASE_URL` (Supabase URI)
  5. Click Deploy.

- [x] **7.5 — Verify production deployment**
  - Chat page loads at `https://<project>.vercel.app/chat`.
  - Send a test message — model responds correctly.
  - Send an out-of-scope question — decline response appears.
  - Check Supabase Table Editor — messages are being persisted.

- [x] **7.6 — Check the M2 readiness checklist** (`architecture.md §14`)
  Go through every checkbox and confirm it is satisfied before calling Milestone 1 complete.

### Exit Criteria
- App is live at a public Vercel URL.
- All 10 test questions work correctly in production.
- DB is populated in Supabase.
- `architecture.md §14` checklist is fully checked off.

---

## Cross-Cutting Rules (apply throughout all phases)

> These come directly from the problem statement's **Rules** section and must be enforced at every step.

| Rule | Where Enforced |
| :--- | :--- |
| Every response must parse against the schema | `NutritionResponseSchema.parse()` in `model.ts` — throws on failure |
| Schema must include `claims` list and `source` per claim | `schema.ts` — `ClaimSchema` has `source: z.null()` |
| Source fields must stay `null` | Schema enforces `z.null()` — any non-null value is a parse error |
| Scope limits must live in code, not just the prompt | `scopeGuard.ts` — runs before model call |
| The app must be live at a public URL | Phase 7 |
| Failures must be recorded, not patched | `failure-log/results-m1.md` — committed as-is |
| Model calls must run behind the backend | `callModel()` is only ever called from API routes, never imported in client components |

---

## Milestone 2 Preview

When Milestone 2 begins, the only additions required are:

1. A retrieval layer inserted between `callModel()` and the model API call.
2. Source URLs populated in the `ClaimSchema.source` field (change `z.null()` → `z.string().url()`).
3. `SourcesPanel` renders actual sources — no structural changes to the component.
4. Re-run the same 10 questions and compare failure counts.

Because Milestone 1 fixed the contract, none of the frontend components or API routes need to change.

---

*Keep this plan in sync with the implementation. Check off tasks as they complete. Do not move to the next phase until the previous phase's exit criteria are met.*
