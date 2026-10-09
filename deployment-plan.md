# Deployment Plan: Nutri AI

This document outlines the step-by-step strategy for deploying the entire Nutri AI project. Following the standard separation of concerns for modern Next.js apps, we will utilize **Railway** for our PostgreSQL vector database and **Vercel** for our Next.js frontend and serverless backend API.

## Architecture Overview
- **Database:** PostgreSQL with the `pgvector` extension hosted on Railway.
- **Frontend & Serverless API:** Next.js application hosted on Vercel.
- **AI Integration:** Groq API for LLM generation.

---

## Phase 1: Database Provisioning (Railway)

We start by setting up the database so that Vercel has a valid connection string to build against.

1. **Create a Railway Project:**
   - Log in to [Railway](https://railway.app/).
   - Click **New Project** and select **Provision PostgreSQL**.
2. **Enable Vector Extensions:**
   - Once provisioned, open the PostgreSQL service and navigate to the **Query** tab.
   - Run the following SQL command to ensure `pgvector` is active (crucial for Prisma's `vector(384)` type):
     ```sql
     CREATE EXTENSION IF NOT EXISTS vector;
     ```
3. **Obtain Connection String:**
   - Go to the **Variables** tab of the PostgreSQL service.
   - Copy the `DATABASE_URL` value (it should look like `postgresql://postgres:...`).

---

## Phase 2: Schema Migration & Initialization

Before the Vercel application can run correctly, the Prisma schema must be pushed to the production Railway database.

1. On your local development machine, temporarily update your `.env` or `.env.local` file to point `DATABASE_URL` to your new Railway connection string.
2. Push the Prisma schema to Railway to create all tables (e.g., `Chunk`, `Document`, `Message`):
   ```bash
   npx prisma db push --accept-data-loss
   ```
   *(Note: This matches the script in `package.json`, ensuring indexes like `chunk_embedding_hnsw` and `chunk_tsv_gin` are created successfully).*

---

## Phase 3: Application Deployment (Vercel)

1. **Prepare Vercel Project:**
   - Log in to [Vercel](https://vercel.com/) and click **Add New Project**.
   - Import your GitHub repository containing the Nutri AI code.
2. **Configure Environment Variables:**
   Before clicking Deploy, add the required production environment variables:
   - `DATABASE_URL`: The PostgreSQL connection string from Railway.
   - `GROQ_API_KEY`: Your Groq production API key.
   - `MODEL_PROVIDER`: `groq`.
3. **Build & Deploy:**
   - Vercel automatically detects Next.js.
   - Ensure the build command is `npm run build` (which automatically executes `prisma generate && next build`).
   - Click **Deploy**. Vercel will generate the Prisma client for the serverless edge and bundle the frontend.

---

## Phase 4: Data Ingestion (Vector Search)

The app is live, but the RAG database is empty. We need to ingest the nutritional corpus.

1. Ensure your local `.env` is still pointing to the Railway `DATABASE_URL`.
2. Run the local Python ingestion pipeline. This will process the corpus, calculate embeddings, and insert them directly into the production Railway database.
   ```bash
   cd ingest
   pip install -r requirements.txt
   python parse.py
   python chunk.py
   ```
   *(Verify with your local ingest scripts which specific files need to be run).*

---

## Phase 5: Verification & Testing

1. **Visit Production URL:** Open the Vercel domain.
2. **Test RAG Retrieval:** Ask a valid nutritional question (e.g., "Is coffee healthy?"). Verify that the UI displays the `answer_text` and actionable `claims` cleanly, confirming the cross-encoder and Groq API are functioning.
3. **Test Scope Guard:** Ask an out-of-scope question (e.g., "Calculate my macros for weight loss"). Verify that the request is instantly rejected by the regex scope guard without hitting the database or LLM.

---

### Alternative: All-in-One Deployment (Railway Only)
If you prefer to keep everything on one platform instead of splitting across Vercel and Railway:
1. Provision the PostgreSQL database in Railway as described in Phase 1.
2. In the same Railway project, click **New** -> **GitHub Repo** and select the Nutri AI repository.
3. Add the environment variables to the Next.js service.
4. Railway's Nixpacks will automatically build and serve the application using the `start` script defined in `package.json`.
