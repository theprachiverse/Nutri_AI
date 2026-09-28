import React from 'react';
import { Claim } from '@/lib/schema';

export default function ClaimBadge({ claim, onSelect }: { claim: Claim, onSelect: (claim: Claim) => void }) {
  return (
    <button 
      onClick={() => onSelect(claim)}
      className="inline-flex items-center text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 mr-2 mt-2 hover:bg-emerald-100 transition-colors cursor-pointer"
    >
      <span className="material-symbols-outlined text-[14px] mr-1">science</span>
      {claim.claim_text.length > 40 ? claim.claim_text.substring(0, 40) + '...' : claim.claim_text}
    </button>
  );
}
