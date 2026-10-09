import React from 'react';
import { ClaimV2 as Claim } from '@/lib/schema';

export default function ClaimBadge({ claim, onSelect, isSelected, index }: { claim: Claim, onSelect: (claim: Claim) => void, isSelected?: boolean, index: number }) {
  const publisher = claim.citation?.publisher || 'Source';
  const year = claim.citation?.year || '';

  return (
    <button 
      onClick={() => onSelect(claim)}
      className={`takeaway-pill group px-4 py-2.5 rounded-full font-label-md text-label-md flex flex-col items-start gap-1 transition-all duration-200 border ${isSelected ? 'bg-teal-100 text-teal-900 border-teal-300 shadow-md ring-2 ring-teal-500/20' : 'bg-white text-slate-800 hover:bg-teal-50/50 shadow-sm border-slate-200/80'}`}
      type="button"
    >
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">{index}</span>
        <span className="text-left leading-snug">{claim.claim_text.length > 50 ? claim.claim_text.substring(0, 50) + '...' : claim.claim_text}</span>
      </div>
      <div className="flex items-center gap-1.5 pl-7 text-[10px] text-slate-500 font-semibold tracking-wide uppercase mt-0.5">
        <span className="material-symbols-outlined text-[12px]">account_balance</span>
        <span>{publisher} {year ? `· ${year}` : ''}</span>
      </div>
    </button>
  );
}
