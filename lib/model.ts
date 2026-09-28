import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { NutritionResponseSchema, NutritionResponse } from './schema';
import { SYSTEM_PROMPT } from './systemPrompt';



interface ModelMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function callModel(messages: ModelMessage[]): Promise<NutritionResponse> {
  const openai = new OpenAI({ 
    apiKey: process.env.GROQ_API_KEY, 
    baseURL: 'https://api.groq.com/openai/v1',
    maxRetries: 3
  });

  console.log('model called');
  try {
    const completion = await openai.beta.chat.completions.parse({
      model: 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      max_tokens: 2000,
      response_format: zodResponseFormat(NutritionResponseSchema, 'nutrition_response'),
    });

    const parsed = completion.choices[0].message.parsed;
    if (!parsed) throw new Error('Model returned no parsed output');

    // Hard validation — fail if schema contract is broken
    return NutritionResponseSchema.parse(parsed);
  } catch (error: any) {
    if (error.status === 429) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }
    throw error;
  }
}
