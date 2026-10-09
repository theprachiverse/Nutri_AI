# Dietary Guidance RAG Chatbot — Data Models (Prisma Schema)

This document formalizes the persistence layer extensions required for Milestone 2. These models extend the existing Conversation and Message schemas to support the RAG pipeline.

---

## 1. Corpus Entities

These tables store the offline-ingested documents and their corresponding vector chunks.

### `Document`
Stores the metadata for a single guidance authority document. Sourced from `corpus/manifest.json`.

```prisma
model Document {
  id              String   @id // e.g. "D1"
  title           String
  shortName       String
  publisher       String
  publisherShort  String
  year            Int
  sourceUrl       String
  format          String
  legalStatus     String
  retrievalDate   DateTime?
  sha256          String?
  chunks          Chunk[]
}
```

### `Chunk`
Stores the atomic pieces of a Document. Contains raw text, pagination, metadata, and the pgvector embedding.

```prisma
model Chunk {
  id              String   @id // e.g. "D1-sec1-c1"
  documentId      String
  document        Document @relation(fields: [documentId], references: [id])
  sectionHeading  String
  chunkIndex      Int
  chunkType       String   // e.g. prose, table, recommendation, list
  text            String
  pageStart       Int?
  pageEnd         Int?
  tokenCount      Int
  population      String[] // Tags: infants, adults, etc.
  excludedPop     String[]
  contentHash     String

  // NOTE: The following fields are added via raw SQL migration:
  // embedding vector(384)
  // tsv tsvector
}
```

---

## 2. Conversation Enrichment

These tables link the LLM's generated response back to the ground-truth Chunks and log the pipeline execution.

### `MessageCitation`
Replaces the raw JSON payload on the `Message` model in M1. Creates a relational join between a user's answer and the chunks used to generate it.

```prisma
model MessageCitation {
  id         String   @id @default(cuid())
  messageId  String
  message    Message  @relation(fields: [messageId], references: [id])
  chunkId    String
  claimText  String
  quote      String
}
```

### `RetrievalLog`
Stores the telemetry for the RAG pipeline execution per message. Essential for the Evaluation harness (`eval-answers.ts`) to calculate Verifier drop rates.

```prisma
model RetrievalLog {
  id              String   @id @default(cuid())
  messageId       String   @unique
  message         Message  @relation(fields: [messageId], references: [id])
  query           String   // The post-router normalized query
  mode            String   // all, single_document, or per_document
  candidatesCount Int      // Total retrieved
  keptCount       Int      // Claims kept after V1-V9 Verifier checks
  droppedClaims   Json?    // Array of { claim_text, reason } from the Verifier
}
```

---

## 3. System State

### `IndexMeta`
A singleton table ensuring the query-time pipeline is synchronized with the offline-ingested vectors. It prevents runtime crashes if the embedding dimensions change.

```prisma
model IndexMeta {
  id             Int      @id @default(1)
  embeddingModel String   // e.g. "Xenova/bge-small-en-v1.5"
  dimensions     Int      // e.g. 384
  chunkCount     Int
  indexedAt      DateTime @default(now())
  corpusVersion  Int
}
```
