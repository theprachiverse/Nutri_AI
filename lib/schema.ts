import { z } from 'zod';

export const ModelOutputSchema = z.object({
  status: z.enum(["answered", "not_covered"]),
  answer_text: z.string().describe("The conversational reply"),
  claims: z.array(z.object({
    claim_text: z.string().describe("Standalone, faithful statement ≤ 30 words"),
    chunk_id: z.string().describe("The ID of the single chunk this claim is based on"),
    quote: z.string().describe("Verbatim substring from the chunk text (5-40 words)")
  })),
  disagreements: z.array(z.object({
    topic: z.string(),
    positions: z.array(z.object({
      chunk_id: z.string(),
      statement: z.string()
    }))
  })).nullable()
});

export type Citation = {
  chunk_id: string;
  doc_id: string;
  document_title: string;
  publisher: string;
  year: number;
  url: string; // includes #page=N
  section: string;
  legal_status: string;
  quote: string;
};

export type ClaimV2 = {
  claim_text: string;
  citation: Citation;
};

export type Disagreement = {
  topic: string;
  positions: {
    doc_id: string;
    publisher: string;
    year: number;
    statement: string;
    citation: Citation;
  }[];
};

export type NutritionResponse = {
  status: "answered" | "not_covered" | "out_of_scope";
  answer_text: string;
  claims: ClaimV2[];
  disagreements?: Disagreement[];
  searched_documents?: string[];
};
