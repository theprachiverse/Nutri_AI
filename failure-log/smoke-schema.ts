import { NutritionResponseSchema } from '../lib/schema';

const valid = { answer_text: "Test", claims: [{ claim_text: "Iron is essential", source: null }] };
const invalid = { answer_text: "Test", claims: [{ claim_text: "x", source: "some-url" }] };

console.log(NutritionResponseSchema.parse(valid));   // should print object
try {
  console.log(NutritionResponseSchema.parse(invalid)); // should throw
} catch (e) {
  console.log("Threw on invalid as expected");
}
