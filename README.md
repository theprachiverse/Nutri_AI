# Nutri AI - AI Nutrition Assistant

Nutri AI is an intelligent nutrition information assistant designed to answer questions about food, nutrition, and food safety using general nutritional knowledge while strictly avoiding medical advice or personalized calorie tracking. 

The project was developed in two major milestones.

---

## 🚀 Milestone 1: Core Chat & Guardrails

Milestone 1 focused on building the foundational chat interface, integrating the LLM with strict response schemas, and implementing robust safety guardrails.

### 🧠 System Prompt & Behavior
The core behavior of the AI is driven by a carefully crafted system prompt.
- **Tone & Style:** Answers must be clear, friendly, and easy-to-understand (2–5 sentences), avoiding overly scientific jargon. No bullet points in the main text.
- **Key Takeaways (Claims):** The model is instructed to distill its answer into 3–5 short, punchy, actionable conclusions (max ~10 words).
- **Hard Boundaries:** The AI is explicitly told *not* to provide calorie targets, weight-loss advice, BMI recommendations, or any form of medical diagnosis/treatment.

### 🛡️ Scope Limit Enforcement
To guarantee safety, prevent medical liability, and save on API costs, we enforce scope limits **before** the model is even called. This is handled by `lib/scopeGuard.ts`, which intercepts the user's message and runs it against a suite of Regex patterns to catch:
- Calorie targets / limits / deficits
- Weight loss / BMI calculations
- Medical conditions, diagnoses, or treatments

If a user message trips the scope guard, the request is short-circuited, and a polite decline message is returned instructing the user to consult a registered dietitian or doctor.

### 📄 Response Schema (M1)
We use **Structured Outputs** (via Zod) to guarantee the model responds in a strict JSON format that the UI can predictably render.
```typescript
export const ClaimSchema = z.object({
  claim_text: z.string(),
  source:     z.null(), // M1 placeholder
});

export const NutritionResponseSchema = z.object({
  answer_text: z.string(),
  claims:      z.array(ClaimSchema),
});
```

---

## 🔍 Milestone 2: Retrieval-Augmented Generation (RAG) & Citations

Milestone 2 introduced a highly optimized RAG pipeline to ground the model's answers in a curated corpus of official nutrition guidelines.

### ⚙️ RAG Architecture
- **Hybrid Search:** Combines pgvector cosine similarity (`BAAI/bge-small-en-v1.5`) with PostgreSQL full-text search (`tsvector`), merged via Reciprocal Rank Fusion (RRF). 
- **Cross-Encoder Re-ranking:** Top candidates are re-ranked precisely using a local cross-encoder (`Xenova/ms-marco-MiniLM-L-6-v2`) via Transformers.js.
- **Context Budgeting:** We maintain a strict `TARGET_TOKENS=1200` token limit for the context window to avoid API rate limits (413 Payload Too Large) while preserving full answer fidelity.

### 📑 Chunking Strategy
We employ a hierarchical, structural chunking strategy:
- The parser injects `[Document | Publisher | Year | Section Path]` context headers into every chunk.
- Chunks are bounded between `MIN_TOKENS=80` and `MAX_TOKENS=450`.
- Markdown tables are aggressively preserved. Large tables are split by row-groups, repeating the header rows.

### 🗄️ Database Schema Evolution
In M2, the database was migrated to fully support the RAG pipeline:
- The `Chunk` schema now includes Postgres vector dimensions (`vector(384)`) and a `tsvector` generated column.
- The `Message` schema relates one-to-many with `MessageCitation`, explicitly storing the `chunkId`, `claimText`, and the exact `quote`.
- `ClaimSchema.source` is dynamically hydrated with exact citations.

### 🚦 System Evaluation & Verification
- **Adversarial Testing:** The multi-turn scope guard intercepts out-of-scope targets with a 100% Adversarial Success Rate.
- **Automated Verifier:** Generated claims are passed through a verification loop that drops any claims containing hallucinations or fabricated quotes before returning them to the user.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 15 (App Router), React, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL (production on Supabase/Railway) & SQLite (local dev) via **Prisma ORM**
- **AI Integration:** OpenAI SDK configured to use **Groq** (running `openai/gpt-oss-120b`).
- **Deployment:** Vercel (Frontend & Serverless Functions) / Railway (Postgres Database)