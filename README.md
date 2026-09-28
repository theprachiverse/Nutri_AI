# Nutri AI - AI Nutrition Assistant

Nutri AI is an intelligent nutrition information assistant designed to answer questions about food, nutrition, and food safety using general nutritional knowledge while strictly avoiding medical advice or personalized calorie tracking.

## 🧠 System Prompt

The core behavior of the AI is driven by a carefully crafted system prompt. The AI acts as a knowledgeable, accessible assistant.

**Core Rules Enforced by the Prompt:**
- **Tone & Style:** Answers must be clear, friendly, and easy-to-understand (2–5 sentences), avoiding overly scientific jargon. No bullet points in the main text.
- **Key Takeaways (Claims):** The model is instructed to distill its answer into 3–5 short, punchy, actionable conclusions (max ~10 words).
- **Hard Boundaries:** The AI is explicitly told *not* to provide calorie targets, weight-loss advice, BMI recommendations, or any form of medical diagnosis/treatment.

## 📄 Response Schema

We use **Structured Outputs** (via Zod) to guarantee the model responds in a strict JSON format that the UI can predictably render.

```typescript
export const ClaimSchema = z.object({
  claim_text: z.string(),
  source:     z.null(), // M2 fill-in target
});

export const NutritionResponseSchema = z.object({
  answer_text: z.string(),
  claims:      z.array(ClaimSchema),
});
```

This ensures we always get an `answer_text` paragraph and an array of `claims` to populate our interactive key takeaways UI.

## 🔄 Prompt Version History & Evolution

**v1.0 to v1.1 Changes:**
- **Anti-Formatting Rules:** Added explicit instructions to "Do NOT use bullet points in answer_text" to prevent the model from sneaking lists into the conversational paragraph.
- **Claim Refinement:** The instructions for "claims" were significantly hardened. The prompt now mandates "short, punchy conclusions (max ~10 words)" and explicitly forbids copy-pasting sentences from the main text to ensure they act as a distilled summary rather than repetition.
- **False Refusal Prevention:** Added explicit phrasing to prevent the model from being over-cautious and refusing valid, general questions (e.g., "Is coffee healthy?").

## 🛡️ Scope Limit Enforcement

To guarantee safety, prevent medical liability, and save on API costs, we enforce scope limits **before** the model is even called.

This is handled by `lib/scopeGuard.ts`, which intercepts the user's message and runs it against a suite of regular expressions (Regex) designed to catch:
- Calorie targets / limits / deficits
- Weight loss / BMI calculations
- Medical conditions, diagnoses, or treatments

If a user message trips the scope guard, the request is immediately short-circuited, and a hardcoded, polite decline message is returned instructing the user to consult a registered dietitian or doctor.

## 🛠️ Tech Stack

- **Frontend:** Next.js 15 (App Router), React, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL (production on Supabase/Railway) & SQLite (local dev) via **Prisma ORM**
- **AI Integration:** OpenAI SDK configured to use **Groq** (running `openai/gpt-oss-120b`), utilizing `zodResponseFormat` for guaranteed JSON structure.
- **Deployment:** Vercel (Frontend & Serverless Functions) / Railway (Postgres Database)