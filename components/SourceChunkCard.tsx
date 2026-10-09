import React, { useEffect, useState } from 'react';
import { ClaimV2 as Claim } from '@/lib/schema';

export default function SourceChunkCard({ claim }: { claim: Claim }) {
  const { citation } = claim;
  const [chunkText, setChunkText] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  useEffect(() => {
    // Fetch raw chunk text
    fetch(`/api/chunks/${citation.chunk_id}`)
      .then(res => res.json())
      .then(data => {
        if (data.text) {
          setChunkText(data.text);
        }
      })
      .catch(console.error);
  }, [citation.chunk_id]);

  // Function to highlight the quote in the raw text
  const renderHighlightedText = () => {
    if (!chunkText) return <div className="h-20 animate-pulse bg-slate-100 rounded-md"></div>;
    if (!citation.quote) return chunkText;

    const idx = chunkText.toLowerCase().indexOf(citation.quote.toLowerCase());
    if (idx === -1) return chunkText;

    const before = chunkText.substring(0, idx);
    const match = chunkText.substring(idx, idx + citation.quote.length);
    const after = chunkText.substring(idx + citation.quote.length);

    return (
      <>
        {before}
        <mark className="bg-amber-200/60 text-amber-900 rounded-sm px-1 py-0.5">{match}</mark>
        {after}
      </>
    );
  };

  return (
    <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-sm space-y-4 border border-slate-100">
      <div className="space-y-1">
        <h3 className="font-headline-sm text-sm text-on-surface font-semibold truncate" title={citation.document_title}>
          {citation.document_title}
        </h3>
        <div className="flex flex-wrap items-center gap-2 font-caption text-caption text-slate-500">
          <span className="inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">account_balance</span>
            {citation.publisher}
          </span>
          <span>•</span>
          <span>{citation.year}</span>
          <span className="uppercase text-[10px] tracking-wider px-1.5 py-0.5 bg-slate-100 rounded-md ml-1">{citation.legal_status}</span>
        </div>
      </div>
      
      <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
        <div className="flex items-center gap-1.5 mb-2 text-slate-400 font-label-sm text-xs">
          <span className="material-symbols-outlined text-[14px]">format_align_left</span>
          <span>{citation.section || 'General Text'}</span>
        </div>
        <div className={`text-sm leading-relaxed text-slate-700 whitespace-pre-wrap font-body-sm ${!isExpanded ? 'line-clamp-5' : ''}`}>
          {renderHighlightedText()}
        </div>
        {chunkText && chunkText.length > 250 && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="text-primary font-semibold text-xs mt-2 hover:underline focus:outline-none"
          >
            {isExpanded ? 'Show less' : 'Read more...'}
          </button>
        )}
      </div>
      
      <div className="flex items-center justify-end">
        <a 
          href={citation.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-container-dark transition-colors"
        >
          <span>View Source Document</span>
          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
        </a>
      </div>
    </div>
  );
}
