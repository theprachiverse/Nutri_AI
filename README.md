# 🥗 Nutri AI - Your Evidence-Based Nutrition Assistant

Welcome to **Nutri AI**! 👋 

Nutri AI is an intelligent, conversational assistant designed to answer your questions about food, nutrition, and food safety. Unlike a standard AI that might guess or hallucinate answers, Nutri AI is strictly grounded in a curated database of official dietary guidelines (like the ICMR Dietary Guidelines for Indians, Health Canada Guidelines, etc.). 

**Its primary goal is to be helpful, factual, and extremely safe.** It will confidently answer questions about vitamins, food storage, and macronutrients, but it will **politely refuse** to give personalized medical advice, calculate calorie deficits, or diagnose health conditions.

---

## 🌟 What makes Nutri AI special?

1. **Strictly Evidence-Based:** Every single claim Nutri AI makes is verified against its internal database. You can click on any "Takeaway" to see the exact quote and source document it pulled the information from!
2. **Safety First (Scope Guarding):** Before the AI even generates an answer, it checks if your question is asking for medical advice or weight loss targets. If it is, it stops immediately to keep you safe.
3. **No Hallucinations:** A specialized "Verifier" double-checks the AI's math and quotes before showing you the answer. If the AI made something up, the system drops the fake claim.
4. **Interactive Knowledge Map & Follow-ups:** The app dynamically builds a visual map of topics you've explored in your session and suggests contextual follow-up questions to keep your research flowing.

---

## 🛠️ Tech Stack at a Glance

- **Frontend:** Next.js 15 (App Router), React, Tailwind CSS
- **Backend:** Next.js API Routes, PostgreSQL (pgvector)
- **AI Integration:** OpenAI SDK configured to use **Groq** (super-fast inference)
- **Deployment:** Vercel (Web App) / Railway (Postgres Database)

---

## 📖 How It Was Built (The Engineering Details)

The project was developed in two major milestones to ensure safety and accuracy.

### 🚀 Milestone 1: Core Chat & Guardrails
- **System Prompt & Behavior:** The model is strictly instructed to be clear, friendly, and avoid scientific jargon. It distills its answers into 3–5 short, punchy claims.
- **Scope Limit Enforcement:** `lib/scopeGuard.ts` intercepts user messages and blocks anything related to calorie targets, weight loss, or medical conditions using Regex and semantic similarity.
- **Structured Outputs:** We use Zod to guarantee the model responds in a strict JSON format.

### 🔍 Milestone 2: Retrieval-Augmented Generation (RAG) & Citations
- **Hybrid Search:** Combines pgvector cosine similarity with PostgreSQL full-text search (`tsvector`), merged via Reciprocal Rank Fusion (RRF). 
- **Cross-Encoder Re-ranking:** Top candidates are re-ranked precisely using a local cross-encoder (`Xenova/ms-marco-MiniLM-L-6-v2`) via Transformers.js.
- **Strict Verification:** Generated claims are passed through a deterministic verification loop that ensures every number and quote exactly matches the retrieved documents. Any claim that fails verification is dropped or forces the LLM to self-correct.

*Note: The older engineering specifications are preserved in the `featureDocs/` and `Docs (M1)/` directories.*