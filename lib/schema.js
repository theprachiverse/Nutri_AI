"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelOutputSchema = void 0;
var zod_1 = require("zod");
exports.ModelOutputSchema = zod_1.z.object({
    status: zod_1.z.enum(["answered", "not_covered"]),
    answer_text: zod_1.z.string().describe("The conversational reply"),
    claims: zod_1.z.array(zod_1.z.object({
        claim_text: zod_1.z.string().describe("Standalone, faithful statement ≤ 30 words"),
        chunk_id: zod_1.z.string().describe("The ID of the single chunk this claim is based on"),
        quote: zod_1.z.string().describe("Verbatim substring from the chunk text (5-40 words)")
    })),
    disagreements: zod_1.z.array(zod_1.z.object({
        topic: zod_1.z.string(),
        positions: zod_1.z.array(zod_1.z.object({
            doc_id: zod_1.z.string(),
            chunk_id: zod_1.z.string(),
            statement: zod_1.z.string()
        }))
    })).optional()
});
