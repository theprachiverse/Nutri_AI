import React from 'react';
import { Disagreement } from '@/lib/schema';

export default function DisagreementCallout({ disagreements }: { disagreements: Disagreement[] }) {
  if (!disagreements || disagreements.length === 0) return null;

  return (
    <div className="mt-6 p-5 rounded-2xl bg-amber-50/50 border border-amber-200/60 shadow-sm space-y-4">
      <div className="flex items-center gap-2 text-amber-800">
        <span className="material-symbols-outlined text-[18px]">balance</span>
        <span className="font-label-md text-sm font-semibold uppercase tracking-wider">Differing Viewpoints Found</span>
      </div>
      
      {disagreements.map((disagreement, idx) => (
        <div key={idx} className="space-y-3">
          <h4 className="font-headline-sm text-sm font-semibold text-slate-800">Topic: {disagreement.topic}</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {disagreement.positions.map((pos, pIdx) => (
              <div key={pIdx} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold tracking-wide uppercase mb-2">
                  <span className="material-symbols-outlined text-[14px]">account_balance</span>
                  <span>{pos.publisher} {pos.year ? `· ${pos.year}` : ''}</span>
                </div>
                <p className="text-sm text-slate-700 leading-snug">"{pos.statement}"</p>
                <a 
                  href={pos.citation.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-container-dark transition-colors"
                >
                  <span>View Source</span>
                  <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
