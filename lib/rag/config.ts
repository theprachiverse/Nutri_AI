export const RAG_CONFIG = {
  retrieval: {
    k_candidates: 20,
    k_final: 5,
    k_per_doc: 2,
    max_docs_per_answer: 3,
    rrf_k: 60,
    min_cosine_score: 0.06,
    population_boost: 0.01,
  },
  context: {
    max_budget_tokens: 1200,
    table_sibling_expansion: true,
  },
  scope: {
    classifier_threshold: 0.75,
    sticky_delta: 0.05,
  }
};
