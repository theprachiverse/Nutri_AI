# AI Nutrition App Deployment Plan

This document outlines the step-by-step process for deploying the AI Nutrition web application. The deployment architecture leverages **Vercel** for hosting the Next.js frontend and API routes, and **Railway** for hosting the PostgreSQL database.

## 1. Prerequisites
- A GitHub repository containing your latest Next.js codebase.
- A [Railway](https://railway.app/) account for the database.
- A [Vercel](https://vercel.com/) account for the application hosting.

## 2. Local Preparation (Switching to PostgreSQL)
Currently, the project is configured to use SQLite. For a production deployment on Vercel, it is highly recommended to use PostgreSQL.

1. **Update Prisma Schema**:
   Open `prisma/schema.prisma` and update the `datasource` block to use `postgresql`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. **Reset Migrations** (Important):
   Since you are switching database providers, existing SQLite migrations won't work. Delete your existing `prisma/migrations` folder and the local `dev.db` file.
3. **Commit Changes**: Push these changes to your GitHub repository.

## 3. Database Deployment (Railway)
1. Go to the Railway dashboard and click **New Project**.
2. Select **Provision PostgreSQL**.
3. Wait for the database to be provisioned.
4. Click on the PostgreSQL service, go to the **Connect** tab, and copy the **Postgres Connection URL** (this will be your `DATABASE_URL`).

## 4. Application Deployment (Vercel)
Vercel will seamlessly host both your Next.js React frontend and your backend API routes.

1. Go to the Vercel dashboard and click **Add New** -> **Project**.
2. Import the GitHub repository for the AI Nutrition app.
3. Configure **Environment Variables**. Add the following keys:
   - `DATABASE_URL`: *Paste the connection URL you copied from Railway.*
   - `GROQ_API_KEY`: *Your production Groq API key.*
   - `MODEL_PROVIDER`: `groq` *(or your respective model provider).*
4. Configure **Build Settings**:
   To ensure your database schema is applied automatically when you deploy, override the default build command:
   - **Build Command**: `npx prisma generate && npx prisma migrate deploy && next build`
5. Click **Deploy**.

## 5. Post-Deployment Verification
1. **Check Logs**: Monitor the Vercel build logs to verify that the `prisma migrate deploy` step executed successfully without errors.
2. **Test the Interface**: Open the production URL provided by Vercel and ensure the UI loads correctly.
3. **Test the Backend**: Send a test message in the chat to verify that the Vercel API routes are successfully communicating with the Groq API and writing data to the Railway PostgreSQL database.
