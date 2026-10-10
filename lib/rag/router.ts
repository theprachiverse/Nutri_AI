import { normalizeQuery } from '../scope/normalize';
import { Message } from '../scope/conversation';
import { expandQueryFast } from '../model';

export type RouteContext = {
  query: string;
  expandedQueries: string[];
  mode: 'all' | 'single_document' | 'per_document';
  docIds?: string[];
  bypassToNotCovered: boolean;
};

const AUTHORITIES: Record<string, string> = {
  'world health organization': 'D5',
  'w.h.o.': 'D5',
  'fssai': 'D4',
  'dgi': 'D1',
  'nin': 'D1',
  'icmr': 'D1',
  'fsa': 'D3',
  'health canada': 'D2'
};

export async function routeAndExpandQuery(
  query: string, 
  chatHistory: Message[],
  documentFilter?: string[]
): Promise<RouteContext> {
  const normalized = normalizeQuery(query);
  let mode: 'all' | 'single_document' | 'per_document' = 'all';
  const docIds: string[] = [];
  let bypassToNotCovered = false;

  if (documentFilter && documentFilter.length > 0) {
    mode = 'single_document';
    docIds.push(...documentFilter);
  } else {
    // Detect comparison intent
    if (/\b(versus|vs|compare|difference)\b/i.test(normalized)) {
      mode = 'per_document';
    }

    // Parse authorities
    for (const [alias, docId] of Object.entries(AUTHORITIES)) {
      if (new RegExp(`\\b${alias}\\b`, 'i').test(normalized)) {
        if (!docIds.includes(docId)) docIds.push(docId);
      }
    }
    
    if (docIds.length > 0 && mode !== 'per_document') {
      mode = 'single_document';
    } else if (docIds.length > 1) {
      mode = 'per_document';
    }
  }

  // Detect out-of-corpus targets
  if (/\b(protein in|calories in|how much .* in)\s+(100g|1 cup|one cup|grams of)\b/i.test(normalized) || /\b(invest|money|finance)\b/i.test(normalized)) {
    bypassToNotCovered = true;
  }
  
  const expandedQueries = [query];
  
  const hydeQuery = await expandQueryFast(query);
  if (hydeQuery !== query) {
    expandedQueries.unshift(hydeQuery); // Put it first so it's the primary query for things that only check [0]
  }
  
  if (chatHistory.length > 0) {
     const lastUserMsg = chatHistory.filter(m => m.role === 'user').pop();
     if (lastUserMsg) {
       expandedQueries.push(`${lastUserMsg.content} ${query}`);
     }
  } else {
    expandedQueries.push(`${query} guidelines`);
    expandedQueries.push(`${query} recommendations`);
  }

  return {
    query,
    expandedQueries,
    mode,
    docIds: docIds.length > 0 ? docIds : undefined,
    bypassToNotCovered
  };
}
