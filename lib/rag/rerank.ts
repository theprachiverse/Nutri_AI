import { RetrievedChunk } from './retrieve';

class Reranker {
  private static instance: Reranker;
  private modelPromise: Promise<any> | null = null;

  private constructor() {}

  public static getInstance(): Reranker {
    if (!Reranker.instance) {
      Reranker.instance = new Reranker();
    }
    return Reranker.instance;
  }

  private getModel() {
    if (!this.modelPromise) {
      this.modelPromise = import('@huggingface/transformers').then(async ({ AutoTokenizer, AutoModelForSequenceClassification, env }) => {
        env.cacheDir = '/tmp/.cache';
        const tokenizer = await AutoTokenizer.from_pretrained('Xenova/ms-marco-MiniLM-L-6-v2');
        const model = await AutoModelForSequenceClassification.from_pretrained('Xenova/ms-marco-MiniLM-L-6-v2', { dtype: 'q8' });
        return { tokenizer, model };
      });
    }
    return this.modelPromise;
  }

  public async rerank(query: string, chunks: RetrievedChunk[]): Promise<(RetrievedChunk & { rerank_score: number })[]> {
    if (chunks.length === 0) return [];
    
    const { tokenizer, model } = await this.getModel();
    const reranked = [];

    for (const chunk of chunks) {
      const inputs = tokenizer(query, { text_pair: chunk.text, truncation: true, max_length: 512 });
      const output = await model(inputs);
      const logit = output.logits.data[0];
      const score = 1 / (1 + Math.exp(-logit)); // Sigmoid to get probability
      
      reranked.push({
        ...chunk,
        rerank_score: score
      });
    }

    // Sort descending by rerank score
    reranked.sort((a, b) => b.rerank_score - a.rerank_score);
    return reranked;
  }
}

export const reranker = Reranker.getInstance();
