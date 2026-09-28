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
