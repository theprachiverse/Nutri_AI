CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "rawResponse";

-- CreateTable
CREATE TABLE "MessageCitation" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "chunkId" TEXT NOT NULL,
    "claimText" TEXT NOT NULL,
    "quote" TEXT NOT NULL,

    CONSTRAINT "MessageCitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "publisher" TEXT NOT NULL,
    "publisherShort" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "legalStatus" TEXT NOT NULL,
    "retrievalDate" TIMESTAMP(3),
    "sha256" TEXT,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chunk" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "sectionHeading" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "chunkType" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "pageStart" INTEGER,
    "pageEnd" INTEGER,
    "tokenCount" INTEGER NOT NULL,
    "population" TEXT[],
    "excludedPop" TEXT[],
    "contentHash" TEXT NOT NULL,
    "embedding" vector(384),
    "tsv" tsvector GENERATED ALWAYS AS (setweight(to_tsvector('english', coalesce("sectionHeading", '')), 'A') || setweight(to_tsvector('english', coalesce("text", '')), 'B')) STORED,

    CONSTRAINT "Chunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetrievalLog" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "candidatesCount" INTEGER NOT NULL,
    "keptCount" INTEGER NOT NULL,
    "droppedClaims" JSONB,

    CONSTRAINT "RetrievalLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndexMeta" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "embeddingModel" TEXT NOT NULL,
    "dimensions" INTEGER NOT NULL,
    "chunkCount" INTEGER NOT NULL,
    "indexedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "corpusVersion" INTEGER NOT NULL,

    CONSTRAINT "IndexMeta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RetrievalLog_messageId_key" ON "RetrievalLog"("messageId");

-- AddForeignKey
ALTER TABLE "MessageCitation" ADD CONSTRAINT "MessageCitation_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageCitation" ADD CONSTRAINT "MessageCitation_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "Chunk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chunk" ADD CONSTRAINT "Chunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetrievalLog" ADD CONSTRAINT "RetrievalLog_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS chunk_embedding_hnsw
  ON "Chunk" USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS chunk_tsv_gin ON "Chunk" USING gin (tsv);
CREATE INDEX IF NOT EXISTS chunk_document_idx ON "Chunk" ("documentId");
CREATE INDEX IF NOT EXISTS chunk_population_gin ON "Chunk" USING gin (population);
CREATE INDEX IF NOT EXISTS chunk_excluded_pop_gin ON "Chunk" USING gin ("excludedPop");
