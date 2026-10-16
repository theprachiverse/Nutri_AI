import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { ModelOutputSchema } from './schema';
import { SYSTEM_PROMPT } from './systemPrompt';
import { z } from 'zod';

if (typeof (process as any).loadEnvFile === 'function' && !process.env.GROQ_API_KEY) {
  try { (process as any).loadEnvFile('.env'); } catch {}
}

export async function expandQueryFast(query: string): Promise<string> {
  const openai = new OpenAI({ 
    apiKey: process.env.GROQ_API_KEY, 
    baseURL: 'https://api.groq.com/openai/v1',
    maxRetries: 1
  });

  try {
    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: 'You are a search query expander. Rewrite the user query into concise medical/nutritional search synonyms. Output ONLY the rewritten keywords, nothing else.' },
        { role: 'user', content: query },
      ],
      max_completion_tokens: 60,
      reasoning_effort: 'low',
      temperature: 0,
    });

    if (completion.usage) {
      console.log(`HyDE Token usage - Prompt: ${completion.usage.prompt_tokens}, Completion: ${completion.usage.completion_tokens}, Total: ${completion.usage.total_tokens}`);
    }

    return completion.choices[0].message.content?.trim() || query;
  } catch (error) {
    console.error('HyDE failed, falling back to original query');
    return query;
  }
}



interface ModelMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function callModel(messages: ModelMessage[], retries = 2): Promise<z.infer<typeof ModelOutputSchema>> {
  const openai = new OpenAI({ 
    apiKey: process.env.GROQ_API_KEY, 
    baseURL: 'https://api.groq.com/openai/v1',
    maxRetries: 2
  });

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const completion = await openai.beta.chat.completions.parse({
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
        max_completion_tokens: 1500,
        reasoning_effort: 'low',
        temperature: 0,
        response_format: zodResponseFormat(ModelOutputSchema, 'nutrition_response'),
      });

      const parsed = completion.choices[0].message.parsed;
      if (!parsed) throw new Error('Model returned no parsed output');

      if (completion.usage) {
        console.log(`Token usage - Prompt: ${completion.usage.prompt_tokens}, Completion: ${completion.usage.completion_tokens}, Total: ${completion.usage.total_tokens}`);
      }

      // Hard validation — fail if schema contract is broken
      return ModelOutputSchema.parse(parsed);
    } catch (error: any) {
      if (error.status === 429) {
        if (attempt < retries) {
          const waitMs = (attempt + 1) * 2500;
          console.warn(`Groq rate limit encountered (429). Waiting ${waitMs}ms before retry ${attempt + 1}/${retries}...`);
          await new Promise(resolve => setTimeout(resolve, waitMs));
          continue;
        }
        throw new Error('RATE_LIMIT_EXCEEDED');
      }
      throw error;
    }
  }
  throw new Error('RATE_LIMIT_EXCEEDED');
}
