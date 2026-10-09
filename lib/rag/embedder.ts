class Embedder {
  private static instance: Embedder;
  private pipelinePromise: Promise<any>;

  private constructor() {
    this.pipelinePromise = import('@huggingface/transformers').then(
      ({ pipeline, env }) => {
        env.cacheDir = '/tmp/.cache';
        return pipeline('feature-extraction', 'Xenova/bge-small-en-v1.5', { dtype: 'q8' });
      }
    );
  }

  public static getInstance(): Embedder {
    if (!Embedder.instance) {
      Embedder.instance = new Embedder();
    }
    return Embedder.instance;
  }

  public async embed(text: string, isQuery: boolean = false): Promise<number[]> {
    const pipe = await this.pipelinePromise;
    const prefix = isQuery ? "Represent this sentence for searching relevant passages: " : "";
    const input = prefix + text;
    
    const output = await pipe(input, {
      pooling: 'cls',
      normalize: true,
    });
    
    return Array.from(output.data);
  }

  public async embedBatch(texts: string[], isQuery: boolean = false): Promise<number[][]> {
    if (texts.length === 0) return [];
    
    const pipe = await this.pipelinePromise;
    const prefix = isQuery ? "Represent this sentence for searching relevant passages: " : "";
    const inputs = texts.map(text => prefix + text);
    
    const output = await pipe(inputs, {
      pooling: 'cls',
      normalize: true,
    });
    
    return output.tolist();
  }
}

export const embedder = Embedder.getInstance();
